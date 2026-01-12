import { useState, useMemo } from 'react';
import { Dialog } from './Dialog';
import { useDatasetStore, useAnnotationStore, useUIStore } from '../../store';
import { fileService, exportDataset, getExportStats, getRegionsForItem } from '../../services';
import './ExportDialog.css';

interface ExportDialogProps {
  isOpen: boolean;
}

export function ExportDialog({ isOpen }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [includeUnannotated, setIncludeUnannotated] = useState(false);

  const { items, folderName } = useDatasetStore();
  const { annotations } = useAnnotationStore();
  const { closeDialog } = useUIStore();

  const stats = useMemo(() => {
    return getExportStats(items, annotations, getRegionsForItem);
  }, [items, annotations]);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const imageDimensions = new Map<string, { width: number; height: number }>();

      for (const item of items) {
        try {
          const imgSrc = await fileService.readImage(item.image);
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              imageDimensions.set(item.id, { width: img.width, height: img.height });
              URL.revokeObjectURL(imgSrc);
              resolve();
            };
            img.onerror = reject;
            img.src = imgSrc;
          });
        } catch (e) {
          console.error(`Failed to load image for ${item.id}`, e);
        }
      }

      const exportedData = exportDataset(items, annotations, imageDimensions, {
        includeUnannotated,
      });

      const jsonString = JSON.stringify(exportedData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName || 'dataset'}_annotated.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportComplete(true);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export sirasinda hata olustu');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setExportComplete(false);
    closeDialog();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Export"
      footer={
        exportComplete ? (
          <button className="btn btn-primary" onClick={handleClose}>
            Kapat
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={handleClose}>
              Iptal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={isExporting || stats.annotatedImages === 0}
            >
              {isExporting ? 'Export ediliyor...' : 'Indir'}
            </button>
          </>
        )
      }
    >
      {exportComplete ? (
        <div className="export-complete">
          <div className="export-success">Export tamamlandi</div>
          <p>Dosya indirildi.</p>
        </div>
      ) : (
        <div className="export-stats">
          <h4>Istatistikler</h4>

          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Toplam Gorsel</span>
              <span className="stat-value">{stats.totalImages}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tamamlanan</span>
              <span className="stat-value success">{stats.annotatedImages}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Atlanan</span>
              <span className="stat-value warning">{stats.skippedImages}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tamamlanma</span>
              <span className="stat-value">{stats.completionPercentage}%</span>
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Toplam Region</span>
              <span className="stat-value">{stats.totalRegions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Annotated Region</span>
              <span className="stat-value success">{stats.annotatedRegions}</span>
            </div>
          </div>

          <div className="export-option">
            <label>
              <input
                type="checkbox"
                checked={includeUnannotated}
                onChange={(e) => setIncludeUnannotated(e.target.checked)}
              />
              <span>Tamamlanmamis gorselleri de dahil et</span>
            </label>
          </div>
        </div>
      )}
    </Dialog>
  );
}
