import { create } from 'zustand';
import type { CameraPosition } from '@/types';

interface CommandEntry {
  id: number;
  input: string;
  response: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'success' | 'error';
}

interface SelectedEntity {
  type: 'flight' | 'earthquake' | 'satellite' | 'cctv';
  data: Record<string, unknown>;
}

interface AIState {
  // Intel Brief
  intelBrief: string;
  missionId: string;
  isGeneratingBrief: boolean;
  briefError: string | null;

  // Command Parser
  commandHistory: CommandEntry[];
  isProcessingCommand: boolean;
  commandModalOpen: boolean;

  // CCTV Analysis
  lastAnalysis: Record<string, unknown> | null;
  isAnalyzing: boolean;
  selectedCamera: CameraPosition | null;

  // Entity Detail
  selectedEntity: SelectedEntity | null;

  // Breadcrumbs
  breadcrumbs: string[];

  // Status Ticker
  tickerMessages: string[];
  currentTickerIndex: number;

  // Actions
  setIntelBrief: (brief: string, missionId: string) => void;
  setGeneratingBrief: (v: boolean) => void;
  setBriefError: (error: string | null) => void;
  addCommand: (entry: CommandEntry) => void;
  setProcessingCommand: (v: boolean) => void;
  setCommandModalOpen: (open: boolean) => void;
  setAnalysis: (analysis: Record<string, unknown> | null) => void;
  setAnalyzing: (v: boolean) => void;
  setSelectedCamera: (camera: CameraPosition | null) => void;
  setSelectedEntity: (entity: SelectedEntity | null) => void;
  clearSelectedEntity: () => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  setTickerMessages: (messages: string[]) => void;
  advanceTicker: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  intelBrief: '',
  missionId: '',
  isGeneratingBrief: false,
  briefError: null,

  commandHistory: [],
  isProcessingCommand: false,
  commandModalOpen: false,

  lastAnalysis: null,
  isAnalyzing: false,
  selectedCamera: null,

  selectedEntity: null,

  breadcrumbs: [],

  tickerMessages: [],
  currentTickerIndex: 0,

  setIntelBrief: (brief, missionId) =>
    set({ intelBrief: brief, missionId, isGeneratingBrief: false, briefError: null }),
  setGeneratingBrief: (v) => set({ isGeneratingBrief: v }),
  setBriefError: (error) => set({ briefError: error, isGeneratingBrief: false }),
  addCommand: (entry) =>
    set((s) => ({ commandHistory: [entry, ...s.commandHistory].slice(0, 20) })),
  setProcessingCommand: (v) => set({ isProcessingCommand: v }),
  setCommandModalOpen: (open) => set({ commandModalOpen: open }),
  setAnalysis: (analysis) => set({ lastAnalysis: analysis, isAnalyzing: false }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setSelectedCamera: (camera) => set({ selectedCamera: camera }),
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  clearSelectedEntity: () => set({ selectedEntity: null }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setTickerMessages: (messages) => set({ tickerMessages: messages, currentTickerIndex: 0 }),
  advanceTicker: () =>
    set((s) => ({
      currentTickerIndex:
        s.tickerMessages.length > 0
          ? (s.currentTickerIndex + 1) % s.tickerMessages.length
          : 0,
    })),
}));
