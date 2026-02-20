import { create } from 'zustand';
import type { LayerName } from '@/types';
import { LAYERS } from '@/constants/layers';

interface LayerData {
  enabled: boolean;
  count: number;
}

interface LayerState {
  layers: Record<LayerName, LayerData>;
  toggleLayer: (layer: LayerName) => void;
  setCount: (layer: LayerName, count: number) => void;
}

const initialLayers: Record<LayerName, LayerData> = {} as Record<LayerName, LayerData>;
for (const layer of LAYERS) {
  initialLayers[layer.id] = {
    enabled: layer.defaultEnabled,
    count: layer.mockCount ?? 0,
  };
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: initialLayers,
  toggleLayer: (layer) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: {
          ...state.layers[layer],
          enabled: !state.layers[layer].enabled,
        },
      },
    })),
  setCount: (layer, count) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: {
          ...state.layers[layer],
          count,
        },
      },
    })),
}));
