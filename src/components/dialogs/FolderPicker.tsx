import { useState } from 'react';
import { Dialog } from './Dialog';
import { fileService } from '../../services';
import { useDatasetStore, useAnnotationStore, useUIStore } from '../../store';
import './FolderPicker.css';

interface FolderPickerProps {
  isOpen: boolean;
}

export function FolderPicker({ isOpen }: FolderPickerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setItems, setFolderName } = useDatasetStore();
  const { loadAnnotations } = useAnnotationStore();
  const { closeDialog, setLoading } = useUIStore();

  const handleSelectFolder = async () => {
    setError(null);
    setIsLoading(true);
    setLoading(true);

    try {
      const handle = await fileService.openDirectory();
      const validation = await fileService.validateDirectory();

      if (!validation.valid) {
        setError(validation.error || 'Gecersiz klasor');
        setIsLoading(false);
        setLoading(false);
        return;
      }

      const dataset = await fileService.readDataset();
      setItems(dataset);
      setFolderName(handle.name);

      const savedAnnotations = await fileService.loadAnnotations();
      if (savedAnnotations) {
        loadAnnotations(savedAnnotations);
      }

      closeDialog();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {

      } else {
        setError('Klasor yuklenirken hata olustu');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {}}
      title=""
      hideClose
    >
      <div className="folder-picker">
        {error && (
          <div className="folder-error">
            {error}
          </div>
        )}

        <button
          className="btn btn-primary folder-select-btn"
          onClick={handleSelectFolder}
          disabled={isLoading}
        >
          {isLoading ? 'Yukleniyor...' : 'Klasor Sec'}
        </button>
      </div>
    </Dialog>
  );
}
