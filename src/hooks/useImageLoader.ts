import { useState, useEffect } from 'react';
import { fileService } from '../services';
import { useDatasetStore } from '../store';

export function useImageLoader() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getCurrentItem, isLoaded } = useDatasetStore();
  const currentItem = getCurrentItem();

  useEffect(() => {
    let mounted = true;
    let currentBlobUrl: string | null = null;

    const loadImage = async () => {
      if (!currentItem || !isLoaded) {
        setImageSrc(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const blobUrl = await fileService.readImage(currentItem.image);
        if (mounted) {

          if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
          }
          currentBlobUrl = blobUrl;
          setImageSrc(blobUrl);
        } else {
          URL.revokeObjectURL(blobUrl);
        }
      } catch (err) {
        if (mounted) {
          setError('Gorsel yuklenemedi');
          console.error(err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [currentItem?.id, isLoaded]);

  return { imageSrc, isLoading, error };
}
