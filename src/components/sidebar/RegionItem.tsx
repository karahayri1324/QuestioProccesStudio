import type { ParsedRegion } from '../../types';
import './RegionItem.css';

interface RegionItemProps {
  region: ParsedRegion;
  isSelected: boolean;
  isAnnotated: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function RegionItem({
  region,
  isSelected,
  isAnnotated,
  onSelect,
  onDelete,
}: RegionItemProps) {
  return (
    <div
      className={`region-item ${isSelected ? 'selected' : ''} ${isAnnotated ? 'annotated' : ''}`}
      onClick={onSelect}
    >
      <div className="region-index">{region.index}</div>
      <div className="region-content">
        <span className="region-text">
          {region.text}
        </span>
      </div>
      <div className="region-actions">
        {isAnnotated ? (
          <>
            <span className="annotated-badge">OK</span>
            <button
              className="btn btn-sm btn-icon delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Sil"
            >
              X
            </button>
          </>
        ) : (
          <span className="pending-badge">-</span>
        )}
      </div>
    </div>
  );
}
