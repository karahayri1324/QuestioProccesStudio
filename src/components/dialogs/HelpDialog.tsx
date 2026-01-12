import { Dialog } from './Dialog';
import { useUIStore } from '../../store';
import './HelpDialog.css';

interface HelpDialogProps {
  isOpen: boolean;
}

const SHORTCUTS = [
  { key: '1', description: 'Cizim modunu ac/kapat' },
  { key: 'Escape', description: 'Cizim modundan cik / Secimi kaldir' },
  { key: 'Sag Ok / N', description: 'Sonraki gorsel' },
  { key: 'Sol Ok / P', description: 'Onceki gorsel' },
  { key: 'Delete / Backspace', description: 'Secili bbox sil' },
  { key: 'Ctrl + Z', description: 'Geri al' },
  { key: 'Ctrl + Shift + Z', description: 'Yinele' },
  { key: 'Ctrl + Y', description: 'Yinele' },
  { key: 'H', description: 'Yardim dialogunu ac' },
];

export function HelpDialog({ isOpen }: HelpDialogProps) {
  const { closeDialog } = useUIStore();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={closeDialog}
      title="Klavye Kisayollari"
      footer={
        <button className="btn btn-primary" onClick={closeDialog}>
          Kapat
        </button>
      }
    >
      <div className="help-content">
        <table className="shortcuts-table">
          <thead>
            <tr>
              <th>Kisayol</th>
              <th>Islem</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((shortcut) => (
              <tr key={shortcut.key}>
                <td>
                  <kbd>{shortcut.key}</kbd>
                </td>
                <td>{shortcut.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="help-section">
          <h4>Kullanim</h4>
          <ol>
            <li>Sag panelden bir region secin</li>
            <li>Cizim modu otomatik acilir (veya <kbd>1</kbd> tusu)</li>
            <li>Gorsel uzerinde kutu cizin</li>
            <li>Sonraki region icin ayni islemi tekrarlayin</li>
            <li>Tum regionlar tamamlaninca sonraki gorsele gecin</li>
          </ol>
        </div>

        <div className="help-section">
          <h4>Otomatik Kayit</h4>
          <p>
            Degisiklikler otomatik olarak <code>annotations.json</code> dosyasina
            kaydedilir. Uygulama kapatilsa bile ilerlemeniz korunur.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
