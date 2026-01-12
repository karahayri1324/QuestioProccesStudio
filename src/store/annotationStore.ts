import { create } from 'zustand';
import type { BoundingBox, ImageAnnotation } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AnnotationAction {
  type: 'add' | 'update' | 'delete';
  imageId: string;
  box: BoundingBox;
  previousBox?: BoundingBox;
}

interface AnnotationState {
  annotations: Map<string, ImageAnnotation>;
  undoStack: AnnotationAction[];
  redoStack: AnnotationAction[];
  isDirty: boolean;

  addBox: (imageId: string, regionId: string, coords: { x: number; y: number; width: number; height: number }) => void;
  updateBox: (imageId: string, boxId: string, updates: Partial<BoundingBox>) => void;
  deleteBox: (imageId: string, boxId: string) => void;
  deleteBoxByRegion: (imageId: string, regionId: string) => void;
  clearBoxes: (imageId: string) => void;
  markSkipped: (imageId: string) => void;
  unmarkSkipped: (imageId: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  loadAnnotations: (data: Record<string, ImageAnnotation>) => void;
  getAnnotation: (imageId: string) => ImageAnnotation | undefined;
  getBoxForRegion: (imageId: string, regionId: string) => BoundingBox | undefined;
  markClean: () => void;
  getAnnotationsObject: () => Record<string, ImageAnnotation>;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: new Map(),
  undoStack: [],
  redoStack: [],
  isDirty: false,

  addBox: (imageId, regionId, coords) => {
    const box: BoundingBox = {
      id: uuidv4(),
      regionId,
      ...coords,
    };

    set((state) => {
      const newAnnotations = new Map(state.annotations);
      const existing = newAnnotations.get(imageId) || {
        imageId,
        boxes: [],
        skipped: false,
        lastModified: Date.now(),
      };

      const existingBoxIndex = existing.boxes.findIndex(b => b.regionId === regionId);
      let previousBox: BoundingBox | undefined;

      if (existingBoxIndex >= 0) {
        previousBox = existing.boxes[existingBoxIndex];
        existing.boxes[existingBoxIndex] = box;
      } else {
        existing.boxes.push(box);
      }

      existing.lastModified = Date.now();
      newAnnotations.set(imageId, { ...existing });

      const action: AnnotationAction = {
        type: existingBoxIndex >= 0 ? 'update' : 'add',
        imageId,
        box,
        previousBox,
      };

      return {
        annotations: newAnnotations,
        undoStack: [...state.undoStack, action],
        redoStack: [],
        isDirty: true,
      };
    });
  },

  updateBox: (imageId, boxId, updates) => {
    set((state) => {
      const newAnnotations = new Map(state.annotations);
      const annotation = newAnnotations.get(imageId);
      if (!annotation) return state;

      const boxIndex = annotation.boxes.findIndex(b => b.id === boxId);
      if (boxIndex < 0) return state;

      const previousBox = { ...annotation.boxes[boxIndex] };
      const updatedBox = { ...previousBox, ...updates };
      annotation.boxes[boxIndex] = updatedBox;
      annotation.lastModified = Date.now();

      newAnnotations.set(imageId, { ...annotation });

      const action: AnnotationAction = {
        type: 'update',
        imageId,
        box: updatedBox,
        previousBox,
      };

      return {
        annotations: newAnnotations,
        undoStack: [...state.undoStack, action],
        redoStack: [],
        isDirty: true,
      };
    });
  },

  deleteBox: (imageId, boxId) => {
    set((state) => {
      const newAnnotations = new Map(state.annotations);
      const annotation = newAnnotations.get(imageId);
      if (!annotation) return state;

      const boxIndex = annotation.boxes.findIndex(b => b.id === boxId);
      if (boxIndex < 0) return state;

      const deletedBox = annotation.boxes[boxIndex];
      annotation.boxes.splice(boxIndex, 1);
      annotation.lastModified = Date.now();

      newAnnotations.set(imageId, { ...annotation });

      const action: AnnotationAction = {
        type: 'delete',
        imageId,
        box: deletedBox,
      };

      return {
        annotations: newAnnotations,
        undoStack: [...state.undoStack, action],
        redoStack: [],
        isDirty: true,
      };
    });
  },

  deleteBoxByRegion: (imageId, regionId) => {
    const annotation = get().annotations.get(imageId);
    if (!annotation) return;

    const box = annotation.boxes.find(b => b.regionId === regionId);
    if (box) {
      get().deleteBox(imageId, box.id);
    }
  },

  clearBoxes: (imageId) => {
    set((state) => {
      const newAnnotations = new Map(state.annotations);
      const annotation = newAnnotations.get(imageId);
      if (!annotation || annotation.boxes.length === 0) return state;

      annotation.boxes = [];
      annotation.lastModified = Date.now();
      newAnnotations.set(imageId, { ...annotation });

      return {
        annotations: newAnnotations,
        undoStack: [],
        redoStack: [],
        isDirty: true,
      };
    });
  },

  markSkipped: (imageId) => {
    set((state) => {
      const newAnnotations = new Map(state.annotations);
      const existing = newAnnotations.get(imageId) || {
        imageId,
        boxes: [],
        skipped: false,
        lastModified: Date.now(),
      };

      existing.skipped = true;
      existing.lastModified = Date.now();
      newAnnotations.set(imageId, { ...existing });

      return {
        annotations: newAnnotations,
        isDirty: true,
      };
    });
  },

  unmarkSkipped: (imageId) => {
    set((state) => {
      const newAnnotations = new Map(state.annotations);
      const existing = newAnnotations.get(imageId);
      if (!existing) return state;

      existing.skipped = false;
      existing.lastModified = Date.now();
      newAnnotations.set(imageId, { ...existing });

      return {
        annotations: newAnnotations,
        isDirty: true,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;

      const action = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);
      const newAnnotations = new Map(state.annotations);
      const annotation = newAnnotations.get(action.imageId);

      if (!annotation) return state;

      if (action.type === 'add') {
        const boxIndex = annotation.boxes.findIndex(b => b.id === action.box.id);
        if (boxIndex >= 0) {
          annotation.boxes.splice(boxIndex, 1);
        }
      } else if (action.type === 'update' && action.previousBox) {
        const boxIndex = annotation.boxes.findIndex(b => b.id === action.box.id);
        if (boxIndex >= 0) {
          annotation.boxes[boxIndex] = action.previousBox;
        }
      } else if (action.type === 'delete') {
        annotation.boxes.push(action.box);
      }

      annotation.lastModified = Date.now();
      newAnnotations.set(action.imageId, { ...annotation });

      return {
        annotations: newAnnotations,
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, action],
        isDirty: true,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.redoStack.length === 0) return state;

      const action = state.redoStack[state.redoStack.length - 1];
      const newRedoStack = state.redoStack.slice(0, -1);
      const newAnnotations = new Map(state.annotations);
      const annotation = newAnnotations.get(action.imageId) || {
        imageId: action.imageId,
        boxes: [],
        skipped: false,
        lastModified: Date.now(),
      };

      if (action.type === 'add') {
        annotation.boxes.push(action.box);
      } else if (action.type === 'update') {
        const boxIndex = annotation.boxes.findIndex(b => b.id === action.box.id);
        if (boxIndex >= 0) {
          annotation.boxes[boxIndex] = action.box;
        }
      } else if (action.type === 'delete') {
        const boxIndex = annotation.boxes.findIndex(b => b.id === action.box.id);
        if (boxIndex >= 0) {
          annotation.boxes.splice(boxIndex, 1);
        }
      }

      annotation.lastModified = Date.now();
      newAnnotations.set(action.imageId, { ...annotation });

      return {
        annotations: newAnnotations,
        undoStack: [...state.undoStack, action],
        redoStack: newRedoStack,
        isDirty: true,
      };
    });
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  loadAnnotations: (data) => {
    const map = new Map(Object.entries(data));
    set({ annotations: map, isDirty: false, undoStack: [], redoStack: [] });
  },

  getAnnotation: (imageId) => get().annotations.get(imageId),

  getBoxForRegion: (imageId, regionId) => {
    const annotation = get().annotations.get(imageId);
    return annotation?.boxes.find(b => b.regionId === regionId);
  },

  markClean: () => set({ isDirty: false }),

  getAnnotationsObject: () => Object.fromEntries(get().annotations),
}));
