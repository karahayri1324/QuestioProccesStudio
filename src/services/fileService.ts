import type { DatasetItem } from '../types';
import type { AnnotationFile, ImageAnnotation } from '../types';

class FileService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  async openDirectory(): Promise<FileSystemDirectoryHandle> {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite'
    });
    this.directoryHandle = handle;
    return handle;
  }

  getDirectoryHandle() {
    return this.directoryHandle;
  }

  setDirectoryHandle(handle: FileSystemDirectoryHandle) {
    this.directoryHandle = handle;
  }

  async validateDirectory(): Promise<{ valid: boolean; error?: string }> {
    if (!this.directoryHandle) {
      return { valid: false, error: 'Klasor secilmedi' };
    }

    try {
      await this.directoryHandle.getFileHandle('dataset.json');
    } catch {
      return { valid: false, error: 'dataset.json bulunamadi' };
    }

    try {
      await this.directoryHandle.getDirectoryHandle('images');
    } catch {
      return { valid: false, error: 'images klasoru bulunamadi' };
    }

    return { valid: true };
  }

  async readDataset(): Promise<DatasetItem[]> {
    if (!this.directoryHandle) throw new Error('Klasor secilmedi');

    const fileHandle = await this.directoryHandle.getFileHandle('dataset.json');
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  }

  async readImage(imagePath: string): Promise<string> {
    if (!this.directoryHandle) throw new Error('Klasor secilmedi');

    const pathParts = imagePath.split('/');
    let currentHandle: FileSystemDirectoryHandle = this.directoryHandle;

    for (let i = 0; i < pathParts.length - 1; i++) {
      currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
    }

    const fileName = pathParts[pathParts.length - 1];
    const fileHandle = await currentHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();

    return URL.createObjectURL(file);
  }

  async saveAnnotations(annotations: Record<string, ImageAnnotation>): Promise<void> {
    if (!this.directoryHandle) throw new Error('Klasor secilmedi');

    const annotationFile: AnnotationFile = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      annotations
    };

    const fileHandle = await this.directoryHandle.getFileHandle(
      'annotations.json',
      { create: true }
    );

    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(annotationFile, null, 2));
    await writable.close();
  }

  async loadAnnotations(): Promise<Record<string, ImageAnnotation> | null> {
    if (!this.directoryHandle) throw new Error('Klasor secilmedi');

    try {
      const fileHandle = await this.directoryHandle.getFileHandle('annotations.json');
      const file = await fileHandle.getFile();
      const text = await file.text();
      const data: AnnotationFile = JSON.parse(text);
      return data.annotations;
    } catch {
      return null;
    }
  }

  async exportDataset(data: DatasetItem[], filename: string = 'dataset_annotated.json'): Promise<void> {
    if (!this.directoryHandle) throw new Error('Klasor secilmedi');

    const fileHandle = await this.directoryHandle.getFileHandle(
      filename,
      { create: true }
    );

    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }
}

export const fileService = new FileService();
