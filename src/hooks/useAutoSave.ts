import { useEffect, useRef } from 'react';
import { useAnnotationStore, useUIStore, useDatasetStore } from '../store';
import { fileService } from '../services';

export function useAutoSave(debounceMs: number = 2000) {
  const { annotations, isDirty, markClean, getAnnotationsObject } = useAnnotationStore();
  const { setSaving, setStatusMessage } = useUIStore();
  const { isLoaded } = useDatasetStore();

  const timeoutRef = useRef<number | null>(null);
  const annotationsRef = useRef(annotations);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    if (!isDirty || !isLoaded) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(async () => {
      setSaving(true);
      setStatusMessage('Kaydediliyor...');

      try {
        const data = getAnnotationsObject();
        await fileService.saveAnnotations(data);
        markClean();
        setStatusMessage('Kaydedildi');

        setTimeout(() => {
          setStatusMessage(null);
        }, 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setStatusMessage('Kayit hatasi!');
      } finally {
        setSaving(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, isLoaded, debounceMs, setSaving, setStatusMessage, markClean, getAnnotationsObject]);
}
