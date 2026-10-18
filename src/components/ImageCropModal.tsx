import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crop as CropIcon,
  RotateCcw,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onSaveCrop: (croppedDataUrl: string) => void;
}

type AspectRatio = '16:9' | '4:3' | '1:1' | 'free';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onSaveCrop,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset controls when opened with a new image
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  // Handle Drag / Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom inside modal
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(1, +(prev + delta).toFixed(2))));
  };

  // Perform Crop on HTML Canvas
  const handleApplyCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    const cropBox = containerRef.current?.getBoundingClientRect();
    if (!cropBox) return;

    // Output canvas size
    let outWidth = 1200;
    let outHeight = 675; // default 16:9

    if (aspectRatio === '4:3') {
      outWidth = 1000;
      outHeight = 750;
    } else if (aspectRatio === '1:1') {
      outWidth = 900;
      outHeight = 900;
    } else if (aspectRatio === 'free') {
      outWidth = cropBox.width * 2;
      outHeight = cropBox.height * 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, outWidth, outHeight);

    ctx.save();
    // Center of canvas
    ctx.translate(outWidth / 2, outHeight / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Compute scaling relative to crop box view
    const scaleFactor = (outWidth / cropBox.width) * zoom;
    const offsetX = pan.x * (outWidth / cropBox.width);
    const offsetY = pan.y * (outHeight / cropBox.height);

    ctx.translate(offsetX, offsetY);

    // Natural image dimensions scaled to fill crop box initially
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const boxAspect = cropBox.width / cropBox.height;

    let drawW: number;
    let drawH: number;

    if (imgAspect > boxAspect) {
      drawH = outHeight * zoom;
      drawW = drawH * imgAspect;
    } else {
      drawW = outWidth * zoom;
      drawH = drawW / imgAspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const croppedData = canvas.toDataURL('image/png', 0.95);
    onSaveCrop(croppedData);
    onClose();
  };

  // Aspect ratio class for the crop preview box
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-[16/9] w-full max-w-2xl';
      case '4:3':
        return 'aspect-[4/3] w-full max-w-lg';
      case '1:1':
        return 'aspect-square w-full max-w-md';
      case 'free':
      default:
        return 'w-full max-w-2xl h-80';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <CropIcon className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-semibold text-white">
              Ritaglia e Regola Immagine
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="relative flex-1 bg-black/90 p-8 flex items-center justify-center min-h-[380px] overflow-hidden">
          {/* Crop Frame Box */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`relative overflow-hidden rounded-xl border-2 border-sky-500 shadow-2xl cursor-grab active:cursor-grabbing ${getAspectRatioClasses()} transition-all`}
          >
            {/* Rule of Thirds Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20 opacity-30">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {/* Render Image with Transformations */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            />
          </div>

          <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-neutral-500 pointer-events-none">
            Trascina per centrare • Scorri con la rotella per zoomare
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="px-6 py-4 bg-neutral-950/70 border-t border-neutral-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Aspect Ratio Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400 mr-1">Formato:</span>
              {(['16:9', '4:3', '1:1', 'free'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    aspectRatio === ratio
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  {ratio === 'free' ? 'Libero' : ratio}
                </button>
              ))}
            </div>

            {/* Zoom Slider & Rotate */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
                <button
                  onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                  className="text-neutral-400 hover:text-white transition-colors"
                  title="Riduci Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-24 accent-sky-500 cursor-pointer"
                />
                <button
                  onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                  className="text-neutral-400 hover:text-white transition-colors"
                  title="Aumenta Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono text-neutral-400 w-9 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Rotate Button */}
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs font-medium transition-colors"
                title="Ruota di 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Ruota</span>
              </button>

              {/* Reset */}
              <button
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Ripristina inquadratura"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800/80">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleApplyCrop}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Applica Ritaglio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
