import { useDatasetStore, useUIStore, useAnnotationStore } from '../../store';
import { getRegionsForItem } from '../../services';
import './Header.css';

export function Header() {
  const { items, currentIndex, folderName, goToNext, goToPrevious, getCurrentItem } = useDatasetStore();
  const { openDialog } = useUIStore();
  const { annotations } = useAnnotationStore();

  const currentItem = getCurrentItem();
  const totalCount = items.length;

  const getProgress = () => {
    let completed = 0;
    items.forEach(item => {
      const annotation = annotations.get(item.id);
      const regions = getRegionsForItem(item);
      if (annotation && !annotation.skipped && annotation.boxes.length === regions.length && regions.length > 0) {
        completed++;
      }
    });
    return completed;
  };

  const completedCount = getProgress();
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="header">
      <div className="header-left">
        <span className="folder-name">{folderName || 'Klasor secilmedi'}</span>
        {currentItem && (
          <span className="current-id">#{currentItem.id}</span>
        )}
      </div>

      <div className="header-center">
        <div className="progress-info">
          <span className="progress-text">
            {completedCount} / {totalCount} tamamlandi
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="navigation">
          <button
            className="btn btn-secondary btn-sm"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            Onceki
          </button>
          <span className="nav-index">
            {currentIndex + 1} / {totalCount}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={goToNext}
            disabled={currentIndex >= totalCount - 1}
          >
            Sonraki
          </button>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => openDialog('export')}
          disabled={totalCount === 0}
        >
          Export
        </button>
      </div>
    </header>
  );
}
