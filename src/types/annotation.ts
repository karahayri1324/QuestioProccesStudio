export interface BoundingBox {
  id: string;
  regionId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageAnnotation {
  imageId: string;
  boxes: BoundingBox[];
  skipped: boolean;
  lastModified: number;
}

export interface AnnotationFile {
  version: string;
  createdAt: string;
  updatedAt: string;
  annotations: Record<string, ImageAnnotation>;
}
