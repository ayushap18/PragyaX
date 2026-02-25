type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
type WSChannel = 'flights:live' | 'earthquakes:live' | 'satellites:pass' | 'cctv:detection' | 'alerts:geofence' | 'intel:classified' | 'vessels:live' | 'heartbeat';

interface WSMessage {
  channel: string;
  timestamp: number;
  payload: unknown;
}

type MessageHandler = (msg: WSMessage) => void;

const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;
const HEARTBEAT_TIMEOUT = 15000;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private _status: ConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private lastHeartbeat = 0;

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(status: ConnectionStatus) {
    this._status = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  onStatusChange(fn: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  connect(url?: string) {
    if (url) this.url = url;
    if (!this.url) {
      // Default: derive WS URL from current page
      const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      this.url = `${proto}//${host}/api/ws`;
    }

    this.setStatus('connecting');
    this.cleanup();

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.lastHeartbeat = Date.now();
        this.startHeartbeatMonitor();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          if (msg.channel === 'heartbeat') {
            this.lastHeartbeat = Date.now();
            return;
          }
          this.dispatch(msg);
        } catch {
          // ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        this.setStatus('reconnecting');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // onclose will fire after onerror, triggering reconnect
      };
    } catch {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  subscribe(channel: WSChannel | string, handler: MessageHandler): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler);

    // Send subscription message if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', channel }));
    }

    return () => {
      this.handlers.get(channel)?.delete(handler);
      if (this.handlers.get(channel)?.size === 0) {
        this.handlers.delete(channel);
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ action: 'unsubscribe', channel }));
        }
      }
    };
  }

  private dispatch(msg: WSMessage) {
    const channelHandlers = this.handlers.get(msg.channel);
    if (channelHandlers) {
      channelHandlers.forEach((fn) => fn(msg));
    }
    // Also dispatch to wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((fn) => fn(msg));
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeatMonitor() {
    this.stopHeartbeatMonitor();
    this.heartbeatTimer = setInterval(() => {
      if (Date.now() - this.lastHeartbeat > HEARTBEAT_TIMEOUT) {
        // Heartbeat timeout — force reconnect
        this.ws?.close();
      }
    }, HEARTBEAT_TIMEOUT);
  }

  private stopHeartbeatMonitor() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanup() {
    this.stopHeartbeatMonitor();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export const wsService = new WebSocketService();
export type { ConnectionStatus, WSChannel, WSMessage };
