import { useEffect } from 'react';
import { useUIStore, useDatasetStore, useAnnotationStore } from '../store';
import { getRegionsForItem } from '../services';

export function useKeyboardShortcuts() {
  const {
    setDrawingMode,
    selectRegion,
    selectBox,
    selectedBoxId,
    activeDialog,
    refreshImage,
    pendingRegionId,
    setPendingRegion
  } = useUIStore();
  const { goToNext, goToPrevious, getCurrentItem } = useDatasetStore();
  const { undo, redo, canUndo, canRedo, deleteBox, getBoxForRegion, clearBoxes } = useAnnotationStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (activeDialog && activeDialog !== 'folderPicker') {
          return;
        }
        setDrawingMode('select');
        selectRegion(null);
        selectBox(null);
        return;
      }

      if (activeDialog) {
        return;
      }

      const currentItem = getCurrentItem();

      const drawingModeState = useUIStore.getState().drawingMode;

      switch (e.key) {
        case '1':
          e.preventDefault();

          if (drawingModeState === 'draw') {
            setDrawingMode('select');
            selectRegion(null);
            break;
          }

          if (currentItem) {
            const regions = getRegionsForItem(currentItem);

            let targetRegion = pendingRegionId;

            if (!targetRegion) {
              for (const region of regions) {
                const box = getBoxForRegion(currentItem.id, region.id);
                if (!box) {
                  targetRegion = region.id;
                  break;
                }
              }
            }

            if (targetRegion) {
              selectRegion(targetRegion);
              setDrawingMode('draw');
              setPendingRegion(null);
            }
          }
          break;

        case 'ArrowRight':
        case 'n':
        case 'N':
          e.preventDefault();
          goToNext();
          selectRegion(null);
          selectBox(null);
          setPendingRegion(null);
          break;

        case 'ArrowLeft':
        case 'p':
        case 'P':
          e.preventDefault();
          goToPrevious();
          selectRegion(null);
          selectBox(null);
          setPendingRegion(null);
          break;

        case 'Delete':
        case 'Backspace':
          if (selectedBoxId && currentItem) {
            e.preventDefault();

            const annotation = useAnnotationStore.getState().getAnnotation(currentItem.id);
            const deletedBox = annotation?.boxes.find(b => b.id === selectedBoxId);
            if (deletedBox) {
              setPendingRegion(deletedBox.regionId);
            }
            deleteBox(currentItem.id, selectedBoxId);
            selectBox(null);
          }
          break;

        case 'z':
        case 'Z':
          if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            if (canUndo()) {
              undo();
            }
          } else if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            if (canRedo()) {
              redo();
            }
          }
          break;

        case 'y':
        case 'Y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (canRedo()) {
              redo();
            }
          }
          break;

        case 'r':
        case 'R':
          e.preventDefault();
          if (currentItem) {
            clearBoxes(currentItem.id);
          }
          refreshImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setDrawingMode,
    selectRegion,
    selectBox,
    selectedBoxId,
    goToNext,
    goToPrevious,
    getCurrentItem,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteBox,
    activeDialog,
    refreshImage,
    getBoxForRegion,
    clearBoxes,
    pendingRegionId,
    setPendingRegion,
  ]);
}
