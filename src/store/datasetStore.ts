import { create } from 'zustand';
import type { DatasetItem } from '../types';

interface DatasetState {
  items: DatasetItem[];
  currentIndex: number;
  folderName: string | null;
  isLoaded: boolean;

  setItems: (items: DatasetItem[]) => void;
  setFolderName: (name: string) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  goToIndex: (index: number) => void;
  reset: () => void;

  getCurrentItem: () => DatasetItem | null;
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
  items: [],
  currentIndex: 0,
  folderName: null,
  isLoaded: false,

  setItems: (items) => set({ items, isLoaded: true, currentIndex: 0 }),

  setFolderName: (name) => set({ folderName: name }),

  goToNext: () => {
    const { currentIndex, items } = get();
    if (currentIndex < items.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  goToPrevious: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  goToIndex: (index) => {
    const { items } = get();
    if (index >= 0 && index < items.length) {
      set({ currentIndex: index });
    }
  },

  reset: () => set({
    items: [],
    currentIndex: 0,
    folderName: null,
    isLoaded: false,
  }),

  getCurrentItem: () => {
    const { items, currentIndex } = get();
    return items[currentIndex] ?? null;
  },
}));
