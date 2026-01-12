import type { DatasetItem, BoundingBox, ImageAnnotation, ParsedRegion } from '../types';
import { parseRegions } from './regionParser';

export function formatCoordinates(box: BoundingBox, imageWidth: number, imageHeight: number): string {
  const x1 = Math.round(box.x * imageWidth);
  const y1 = Math.round(box.y * imageHeight);
  const x2 = Math.round((box.x + box.width) * imageWidth);
  const y2 = Math.round((box.y + box.height) * imageHeight);
  return `${x1}.${y1}.${x2}.${y2}`;
}

export interface ExportOptions {
  includeUnannotated: boolean;
  imageWidth: number;
  imageHeight: number;
}

export function exportDataset(
  items: DatasetItem[],
  annotations: Map<string, ImageAnnotation>,
  imageDimensions: Map<string, { width: number; height: number }>,
  options: Partial<ExportOptions> = {}
): DatasetItem[] {
  const { includeUnannotated = false } = options;

  return items
    .map(item => {
      const annotation = annotations.get(item.id);
      const dimensions = imageDimensions.get(item.id);

      if (!annotation && !includeUnannotated) {
        return null;
      }

      if (annotation?.skipped) {
        return null;
      }

      const exportedItem = JSON.parse(JSON.stringify(item)) as DatasetItem;

      const gptIndex = exportedItem.conversations.findIndex(c => c.from === 'gpt');
      if (gptIndex === -1) return exportedItem;

      let gptValue = exportedItem.conversations[gptIndex].value;
      const regions = parseRegions(gptValue);

      const boxMap = new Map<string, BoundingBox>();
      annotation?.boxes.forEach(box => {
        boxMap.set(box.regionId, box);
      });

      const sortedRegions = [...regions].sort((a, b) => b.startOffset - a.startOffset);

      for (const region of sortedRegions) {
        const box = boxMap.get(region.id);
        if (box && dimensions) {
          const coords = formatCoordinates(box, dimensions.width, dimensions.height);
          const replacement = `<region>${coords}</region>`;
          gptValue =
            gptValue.slice(0, region.startOffset) +
            replacement +
            gptValue.slice(region.endOffset);
        }
      }

      exportedItem.conversations[gptIndex].value = gptValue;
      return exportedItem;
    })
    .filter(Boolean) as DatasetItem[];
}

export interface ExportStats {
  totalImages: number;
  annotatedImages: number;
  skippedImages: number;
  totalRegions: number;
  annotatedRegions: number;
  completionPercentage: number;
}

export function getExportStats(
  items: DatasetItem[],
  annotations: Map<string, ImageAnnotation>,
  getRegionsForItem: (item: DatasetItem) => ParsedRegion[]
): ExportStats {
  let totalImages = items.length;
  let annotatedImages = 0;
  let skippedImages = 0;
  let totalRegions = 0;
  let annotatedRegions = 0;

  items.forEach(item => {
    const annotation = annotations.get(item.id);
    const regions = getRegionsForItem(item);
    totalRegions += regions.length;

    if (annotation) {
      if (annotation.skipped) {
        skippedImages++;
      } else {
        annotatedRegions += annotation.boxes.length;
        if (annotation.boxes.length === regions.length && regions.length > 0) {
          annotatedImages++;
        }
      }
    }
  });

  return {
    totalImages,
    annotatedImages,
    skippedImages,
    totalRegions,
    annotatedRegions,
    completionPercentage: totalImages > 0 ? Math.round((annotatedImages / totalImages) * 100) : 0,
  };
}
