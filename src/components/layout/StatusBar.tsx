import { useUIStore, useAnnotationStore } from '../../store';
import './StatusBar.css';

export function StatusBar() {
  const { drawingMode, isSaving, statusMessage } = useUIStore();
  const { canUndo, canRedo } = useAnnotationStore();

  return (
    <footer className="status-bar">
      <div className="status-left">
        <span className={`mode-indicator ${drawingMode === 'draw' ? 'active' : ''}`}>
          Mod: {drawingMode === 'draw' ? 'Cizim' : 'Secim'}
          {drawingMode === 'draw' && <kbd>1</kbd>}
        </span>
        {isSaving && <span className="saving-indicator">Kaydediliyor...</span>}
        {statusMessage && <span className="status-message">{statusMessage}</span>}
      </div>

      <div className="status-right">
        <span className="shortcut-hint">
          <kbd>1</kbd> Cizim modu
          <kbd>R</kbd> Yenile
          {canUndo() && <><kbd>Ctrl+Z</kbd> Geri</>}
          {canRedo() && <><kbd>Ctrl+Y</kbd> Ileri</>}
        </span>
      </div>
    </footer>
  );
}
