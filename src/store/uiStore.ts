import { create } from 'zustand';

export type DrawingMode = 'select' | 'draw';
export type DialogType = 'export' | 'folderPicker' | null;

interface UIState {
  drawingMode: DrawingMode;
  selectedRegionId: string | null;
  selectedBoxId: string | null;
  activeDialog: DialogType;
  isLoading: boolean;
  isSaving: boolean;
  statusMessage: string | null;
  imageRefreshKey: number;
  pendingRegionId: string | null; 

  setDrawingMode: (mode: DrawingMode) => void;
  toggleDrawingMode: () => void;
  selectRegion: (regionId: string | null) => void;
  selectBox: (boxId: string | null) => void;
  openDialog: (dialog: DialogType) => void;
  closeDialog: () => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setStatusMessage: (message: string | null) => void;
  refreshImage: () => void;
  setPendingRegion: (regionId: string | null) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  drawingMode: 'select',
  selectedRegionId: null,
  selectedBoxId: null,
  activeDialog: 'folderPicker',
  isLoading: false,
  isSaving: false,
  statusMessage: null,
  imageRefreshKey: 0,
  pendingRegionId: null,

  setDrawingMode: (mode) => set({ drawingMode: mode }),

  toggleDrawingMode: () => {
    const current = get().drawingMode;
    set({ drawingMode: current === 'draw' ? 'select' : 'draw' });
  },

  selectRegion: (regionId) => set({ selectedRegionId: regionId, selectedBoxId: null }),

  selectBox: (boxId) => set({ selectedBoxId: boxId }),

  openDialog: (dialog) => set({ activeDialog: dialog }),

  closeDialog: () => set({ activeDialog: null }),

  setLoading: (loading) => set({ isLoading: loading }),

  setSaving: (saving) => set({ isSaving: saving }),

  setStatusMessage: (message) => set({ statusMessage: message }),

  refreshImage: () => set((state) => ({ imageRefreshKey: state.imageRefreshKey + 1 })),

  setPendingRegion: (regionId) => set({ pendingRegionId: regionId }),

  reset: () => set({
    drawingMode: 'select',
    selectedRegionId: null,
    selectedBoxId: null,
    activeDialog: 'folderPicker',
    isLoading: false,
    isSaving: false,
    statusMessage: null,
    imageRefreshKey: 0,
    pendingRegionId: null,
  }),
}));
