import { useMapStore } from '@/stores/mapStore';
import { useModeStore } from '@/stores/modeStore';
import { useLayerStore } from '@/stores/layerStore';
import { useHUDStore } from '@/stores/hudStore';
import { CITIES } from '@/constants/cities';
import type { CommandResponse, VisualMode, LayerName } from '@/types';

interface ExecutionResult {
  success: boolean;
  narration: string;
}

const VALID_MODES: VisualMode[] = ['NORMAL', 'CRT', 'NVG', 'FLIR', 'DRONE'];
const VALID_LAYERS: LayerName[] = ['flights', 'earthquakes', 'satellites', 'traffic', 'weather', 'cctv'];

function addIntelEvent(text: string, type: 'info' | 'warn' | 'alert' | 'success') {
  const store = useHUDStore.getState();
  const event = {
    id: Date.now(),
    time: new Date().toISOString().slice(11, 19) + 'Z',
    text,
    type,
  };
  useHUDStore.setState({
    intelFeed: [event, ...store.intelFeed].slice(0, 12),
  });
}

function executeFlyTo(params: Record<string, unknown>): ExecutionResult {
  const lat = params.lat as number | undefined;
  const lon = params.lon as number | undefined;
  const city = params.city as string | undefined;
  const altitude = params.altitude as number | undefined;

  if (city) {
    const match = CITIES.find(
      (c) => c.name.toLowerCase() === city.toLowerCase()
    );
    if (match) {
      useMapStore.getState().setCity(match.name);
      useMapStore.getState().flyTo(match.lat, match.lon, altitude || 5);
      addIntelEvent(`NAV — REPOSITIONING TO ${match.name.toUpperCase()}`, 'info');
      return { success: true, narration: `Flying to ${match.name}` };
    }
  }

  if (typeof lat === 'number' && typeof lon === 'number') {
    useMapStore.getState().flyTo(lat, lon, altitude || 5);
    addIntelEvent(`NAV — REPOSITIONING TO ${lat.toFixed(2)}°N ${lon.toFixed(2)}°E`, 'info');
    return { success: true, narration: `Flying to ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E` };
  }

  return { success: false, narration: 'Invalid fly_to parameters — need lat/lon or city' };
}

function executeSetMode(params: Record<string, unknown>): ExecutionResult {
  const mode = (params.mode as string || '').toUpperCase() as VisualMode;
  if (VALID_MODES.includes(mode)) {
    useModeStore.getState().setMode(mode);
    addIntelEvent(`MODE — SWITCHING TO ${mode}`, 'success');
    return { success: true, narration: `Mode set to ${mode}` };
  }
  return { success: false, narration: `Unknown mode: ${params.mode}` };
}

function executeToggleLayer(params: Record<string, unknown>): ExecutionResult {
  const layer = (params.layer as string || '').toLowerCase() as LayerName;
  if (VALID_LAYERS.includes(layer)) {
    useLayerStore.getState().toggleLayer(layer);
    const nowEnabled = useLayerStore.getState().layers[layer].enabled;
    addIntelEvent(`LAYER — ${layer.toUpperCase()} ${nowEnabled ? 'ENABLED' : 'DISABLED'}`, 'info');
    return { success: true, narration: `${layer} layer ${nowEnabled ? 'enabled' : 'disabled'}` };
  }
  return { success: false, narration: `Unknown layer: ${params.layer}` };
}

function executeAlert(params: Record<string, unknown>): ExecutionResult {
  const message = (params.message as string) || 'Unknown alert';
  const severity = (params.severity as string) || 'INFO';
  const type = severity === 'CRITICAL' ? 'alert' : severity === 'WARNING' ? 'warn' : 'info';
  addIntelEvent(`CMD — ${message}`, type);
  return { success: true, narration: message };
}

export function executeCommand(response: CommandResponse): ExecutionResult {
  if (!response.parsed) {
    return { success: false, narration: response.narration || 'Command not understood' };
  }

  const params = response.params || {};

  switch (response.action) {
    case 'fly_to':
      return executeFlyTo(params);
    case 'set_mode':
      return executeSetMode(params);
    case 'toggle_layer':
      return executeToggleLayer(params);
    case 'alert':
      return executeAlert(params);
    case 'multi': {
      const commands = params.commands as CommandResponse[] | undefined;
      if (commands && Array.isArray(commands)) {
        const results = commands.map((cmd) => executeCommand(cmd));
        const allSuccess = results.every((r) => r.success);
        return {
          success: allSuccess,
          narration: results.map((r) => r.narration).join(' | '),
        };
      }
      return { success: false, narration: 'Invalid multi-command' };
    }
    case 'filter_flights':
      addIntelEvent(`FILTER — ${JSON.stringify(params)}`, 'info');
      return { success: true, narration: `Flight filter applied` };
    default:
      return { success: false, narration: `Unknown action: ${response.action}` };
  }
}
