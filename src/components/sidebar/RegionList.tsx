import { useDatasetStore, useUIStore, useAnnotationStore } from '../../store';
import { getRegionsForItem } from '../../services';
import { RegionItem } from './RegionItem';
import './RegionList.css';

export function RegionList() {
  const { getCurrentItem } = useDatasetStore();
  const { selectedRegionId, selectRegion, drawingMode, setDrawingMode } = useUIStore();
  const { getBoxForRegion, deleteBoxByRegion, markSkipped, unmarkSkipped, getAnnotation } = useAnnotationStore();

  const currentItem = getCurrentItem();
  const regions = currentItem ? getRegionsForItem(currentItem) : [];
  const annotation = currentItem ? getAnnotation(currentItem.id) : undefined;
  const isSkipped = annotation?.skipped || false;

  const handleRegionSelect = (regionId: string) => {
    selectRegion(regionId);
    if (drawingMode !== 'draw') {
      setDrawingMode('draw');
    }
  };

  const handleDeleteBox = (regionId: string) => {
    if (currentItem) {
      deleteBoxByRegion(currentItem.id, regionId);
    }
  };

  const handleSkipToggle = () => {
    if (!currentItem) return;
    if (isSkipped) {
      unmarkSkipped(currentItem.id);
    } else {
      markSkipped(currentItem.id);
    }
  };

  if (!currentItem) {
    return (
      <div className="region-list-empty">
        <p>Gorsel secilmedi</p>
      </div>
    );
  }

  const annotatedCount = regions.filter(r =>
    currentItem && getBoxForRegion(currentItem.id, r.id)
  ).length;

  return (
    <div className="region-list">
      <div className="region-list-header">
        <h3>Region Listesi</h3>
        <span className="region-count">
          {annotatedCount} / {regions.length}
        </span>
      </div>

      {isSkipped && (
        <div className="skipped-banner">
          Bu gorsel atlandi
        </div>
      )}

      <div className="region-list-content">
        {regions.length === 0 ? (
          <div className="no-regions">
            <p>Bu gorselde region bulunamadi</p>
          </div>
        ) : (
          regions.map((region) => (
            <RegionItem
              key={region.id}
              region={region}
              isSelected={selectedRegionId === region.id}
              isAnnotated={!!getBoxForRegion(currentItem.id, region.id)}
              onSelect={() => handleRegionSelect(region.id)}
              onDelete={() => handleDeleteBox(region.id)}
            />
          ))
        )}
      </div>

      <div className="region-list-footer">
        <button
          className={`btn ${isSkipped ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleSkipToggle}
        >
          {isSkipped ? 'Atlamayi Kaldir' : 'Gorseli Atla'}
        </button>
      </div>
    </div>
  );
}
