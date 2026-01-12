import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Label, Tag, Text } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { useUIStore, useAnnotationStore, useDatasetStore } from '../../store';
import { getRegionsForItem } from '../../services';
import type { BoundingBox as BoundingBoxType } from '../../types';
import './ImageCanvas.css';

interface ImageCanvasProps {
  imageSrc: string | null;
}

export function ImageCanvas({ imageSrc }: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [image] = useImage(imageSrc || '');
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 });
  const [tooltipBox, setTooltipBox] = useState<BoundingBoxType | null>(null);

  const { drawingMode, selectedRegionId, selectedBoxId, selectBox, selectRegion, setDrawingMode } = useUIStore();
  const { addBox, updateBox, getAnnotation, getBoxForRegion } = useAnnotationStore();
  const { getCurrentItem } = useDatasetStore();

  const currentItem = getCurrentItem();
  const annotation = currentItem ? getAnnotation(currentItem.id) : undefined;
  const boxes = annotation?.boxes || [];
  const regions = currentItem ? getRegionsForItem(currentItem) : [];

  const getRegionText = (box: BoundingBoxType) => {
    const region = regions.find(r => r.id === box.regionId);
    return region?.text || '';
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (image && stageSize.width && stageSize.height) {
      const padding = 40;
      const availableWidth = stageSize.width - padding * 2;
      const availableHeight = stageSize.height - padding * 2;

      const scaleX = availableWidth / image.width;
      const scaleY = availableHeight / image.height;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale);

      const scaledWidth = image.width * newScale;
      const scaledHeight = image.height * newScale;
      setImageOffset({
        x: (stageSize.width - scaledWidth) / 2,
        y: (stageSize.height - scaledHeight) / 2,
      });
    }
  }, [image, stageSize]);

  useEffect(() => {
    if (transformerRef.current && selectedBoxId) {
      const stage = stageRef.current;
      if (stage) {
        const selectedNode = stage.findOne(`#box-${selectedBoxId}`);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer()?.batchDraw();
        }
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedBoxId]);

  useEffect(() => {
    setTooltipBox(null);
  }, [currentItem?.id]);

  useEffect(() => {
    if (tooltipBox && !boxes.find(b => b.id === tooltipBox.id)) {
      setTooltipBox(null);
    }
  }, [boxes, tooltipBox]);

  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !image) return null;

    const pos = stage.getPointerPosition();
    if (!pos) return null;

    const x = (pos.x - imageOffset.x) / scale;
    const y = (pos.y - imageOffset.y) / scale;

    if (x < 0 || y < 0 || x > image.width || y > image.height) {
      return null;
    }

    return { x, y };
  }, [imageOffset, scale, image]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingMode !== 'draw' || !selectedRegionId || !currentItem || !image) return;

    const clickedOnEmpty = e.target === e.target.getStage() ||
      e.target.getClassName() === 'Image';

    if (!clickedOnEmpty) return;

    const pos = getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
  }, [drawingMode, selectedRegionId, currentItem, image, getPointerPosition]);

  const handleMouseMove = useCallback(() => {
    if (!isDrawing) return;

    const pos = getPointerPosition();
    if (pos) {
      setDrawCurrent(pos);
    }
  }, [isDrawing, getPointerPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentItem || !selectedRegionId || !image) {
      setIsDrawing(false);
      return;
    }

    const minX = Math.min(drawStart.x, drawCurrent.x);
    const minY = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    if (width > 5 && height > 5) {
      addBox(currentItem.id, selectedRegionId, {
        x: minX / image.width,
        y: minY / image.height,
        width: width / image.width,
        height: height / image.height,
      });

      const currentRegionIndex = regions.findIndex(r => r.id === selectedRegionId);
      let nextRegion = null;

      for (let i = currentRegionIndex + 1; i < regions.length; i++) {
        const box = getBoxForRegion(currentItem.id, regions[i].id);
        if (!box) {
          nextRegion = regions[i].id;
          break;
        }
      }

      if (!nextRegion) {
        for (let i = 0; i < currentRegionIndex; i++) {
          const box = getBoxForRegion(currentItem.id, regions[i].id);
          if (!box) {
            nextRegion = regions[i].id;
            break;
          }
        }
      }

      if (nextRegion) {
        selectRegion(nextRegion);
      } else {

        setDrawingMode('select');
        selectRegion(null);
      }
    }

    setIsDrawing(false);
  }, [isDrawing, currentItem, selectedRegionId, image, drawStart, drawCurrent, addBox, regions, getBoxForRegion, selectRegion, setDrawingMode]);

  const handleBoxClick = useCallback((box: BoundingBoxType) => {
    if (drawingMode === 'select') {
      selectBox(box.id);
      setTooltipBox(tooltipBox?.id === box.id ? null : box);
    }
  }, [drawingMode, selectBox, tooltipBox]);

  const handleBoxDragEnd = useCallback((box: BoundingBoxType, e: Konva.KonvaEventObject<DragEvent>) => {
    if (!currentItem || !image) return;

    const node = e.target;
    const newX = (node.x() - imageOffset.x) / scale / image.width;
    const newY = (node.y() - imageOffset.y) / scale / image.height;

    updateBox(currentItem.id, box.id, {
      x: Math.max(0, Math.min(1 - box.width, newX)),
      y: Math.max(0, Math.min(1 - box.height, newY)),
    });
  }, [currentItem, image, imageOffset, scale, updateBox]);

  const handleTransformEnd = useCallback((box: BoundingBoxType, e: Konva.KonvaEventObject<Event>) => {
    if (!currentItem || !image) return;

    const node = e.target as Konva.Rect;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newWidth = (node.width() * scaleX) / scale / image.width;
    const newHeight = (node.height() * scaleY) / scale / image.height;
    const newX = (node.x() - imageOffset.x) / scale / image.width;
    const newY = (node.y() - imageOffset.y) / scale / image.height;

    updateBox(currentItem.id, box.id, {
      x: Math.max(0, Math.min(1 - newWidth, newX)),
      y: Math.max(0, Math.min(1 - newHeight, newY)),
      width: Math.min(1 - newX, newWidth),
      height: Math.min(1 - newY, newHeight),
    });
  }, [currentItem, image, imageOffset, scale, updateBox]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {

    const clickedOnEmpty = e.target === e.target.getStage() ||
      e.target.getClassName() === 'Image';

    if (clickedOnEmpty) {
      selectBox(null);
      setTooltipBox(null);
    }
  }, [selectBox]);

  const getBoxColor = (box: BoundingBoxType) => {
    if (box.id === selectedBoxId) return '#2563eb';
    if (box.regionId === selectedRegionId) return '#16a34a';
    return '#6b7280';
  };

  const previewRect = isDrawing && image ? {
    x: imageOffset.x + Math.min(drawStart.x, drawCurrent.x) * scale,
    y: imageOffset.y + Math.min(drawStart.y, drawCurrent.y) * scale,
    width: Math.abs(drawCurrent.x - drawStart.x) * scale,
    height: Math.abs(drawCurrent.y - drawStart.y) * scale,
  } : null;

  if (!imageSrc) {
    return (
      <div className="canvas-empty" ref={containerRef}>
        <p>Gorsel yok</p>
      </div>
    );
  }

  return (
    <div
      className={`canvas-container ${drawingMode === 'draw' ? 'drawing' : ''}`}
      ref={containerRef}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={imageOffset.x}
              y={imageOffset.y}
              width={image.width * scale}
              height={image.height * scale}
            />
          )}

          {image && boxes.map((box) => (
            <Rect
              key={box.id}
              id={`box-${box.id}`}
              x={imageOffset.x + box.x * image.width * scale}
              y={imageOffset.y + box.y * image.height * scale}
              width={box.width * image.width * scale}
              height={box.height * image.height * scale}
              stroke={getBoxColor(box)}
              strokeWidth={2}
              fill={box.id === selectedBoxId ? 'rgba(37, 99, 235, 0.1)' : 'transparent'}
              draggable={drawingMode === 'select' && box.id === selectedBoxId}
              onClick={() => handleBoxClick(box)}
              onTap={() => handleBoxClick(box)}
              onDragEnd={(e) => handleBoxDragEnd(box, e)}
              onTransformEnd={(e) => handleTransformEnd(box, e)}
            />
          ))}

          {}
          {tooltipBox && image && (
            <Label
              x={imageOffset.x + tooltipBox.x * image.width * scale}
              y={imageOffset.y + tooltipBox.y * image.height * scale - 30}
            >
              <Tag
                fill="#1f2937"
                cornerRadius={4}
                pointerDirection="down"
                pointerWidth={10}
                pointerHeight={6}
              />
              <Text
                text={getRegionText(tooltipBox)}
                fontFamily="sans-serif"
                fontSize={12}
                padding={6}
                fill="white"
              />
            </Label>
          )}

          {previewRect && (
            <Rect
              x={previewRect.x}
              y={previewRect.y}
              width={previewRect.width}
              height={previewRect.height}
              stroke="#2563eb"
              strokeWidth={2}
              dash={[5, 5]}
              fill="rgba(37, 99, 235, 0.1)"
            />
          )}

          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}
