import { MainLayout } from './components/layout';
import { ImageCanvas } from './components/canvas';
import { RegionList } from './components/sidebar';
import { FolderPicker, ExportDialog } from './components/dialogs';
import { useKeyboardShortcuts, useAutoSave, useImageLoader } from './hooks';
import { useUIStore, useDatasetStore } from './store';
import './styles/global.css';

function App() {
  const { activeDialog } = useUIStore();
  const { isLoaded } = useDatasetStore();
  const { imageSrc } = useImageLoader();

  useKeyboardShortcuts();
  useAutoSave();

  return (
    <>
      {isLoaded ? (
        <MainLayout
          canvas={<ImageCanvas imageSrc={imageSrc} />}
          sidebar={<RegionList />}
        />
      ) : (
        <div className="app-empty">
          <p>Lutfen bir dataset klasoru secin</p>
        </div>
      )}

      <FolderPicker isOpen={activeDialog === 'folderPicker'} />
      <ExportDialog isOpen={activeDialog === 'export'} />
    </>
  );
}

export default App;
