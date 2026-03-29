import { useEffect, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const ImageViewerModal = ({ image, onClose }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const pinchDistanceRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const nextScale = clamp(scale + (event.deltaY < 0 ? 0.2 : -0.2), 1, 4);
    setScale(nextScale);
    if (nextScale === 1) {
      setOffset({ x: 0, y: 0 });
    }
  };

  const handlePointerDown = (event) => {
    if (scale <= 1) {
      return;
    }

    setDragging(true);
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y
    };
  };

  const handlePointerMove = (event) => {
    if (!dragging) {
      return;
    }

    setOffset({
      x: dragStartRef.current.offsetX + event.clientX - dragStartRef.current.x,
      y: dragStartRef.current.offsetY + event.clientY - dragStartRef.current.y
    });
  };

  const stopDragging = () => setDragging(false);

  const handleTouchStart = (event) => {
    if (event.touches.length === 2) {
      const [firstTouch, secondTouch] = event.touches;
      pinchDistanceRef.current = Math.hypot(
        secondTouch.clientX - firstTouch.clientX,
        secondTouch.clientY - firstTouch.clientY
      );
      return;
    }

    if (event.touches.length === 1) {
      handlePointerDown(event.touches[0]);
    }
  };

  const handleTouchMove = (event) => {
    if (event.touches.length === 2) {
      const [firstTouch, secondTouch] = event.touches;
      const nextDistance = Math.hypot(
        secondTouch.clientX - firstTouch.clientX,
        secondTouch.clientY - firstTouch.clientY
      );
      if (pinchDistanceRef.current) {
        const nextScale = clamp(scale * (nextDistance / pinchDistanceRef.current), 1, 4);
        setScale(nextScale);
      }
      pinchDistanceRef.current = nextDistance;
      return;
    }

    if (event.touches.length === 1) {
      handlePointerMove(event.touches[0]);
    }
  };

  const handleDownload = async () => {
    const imageUrl = (image.src || image.originalSrc)
      .replace('/upload/', '/upload/fl_attachment/');

    const anchor = document.createElement('a');
    anchor.href = imageUrl;
    anchor.download = 'zappy-image.png';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  if (!image) {
    return null;
  }

  return (
    <div className="image-viewer-overlay" onClick={onClose} role="presentation">
      <div className="image-viewer-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Image viewer">
        <div className="image-viewer-toolbar">
          <button type="button" className="ghost" onClick={handleDownload}>Download</button>
          <div className="image-viewer-toolbar__actions">
            <button type="button" className="ghost" onClick={resetView}>Reset</button>
            <button type="button" className="ghost image-viewer-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div
          className="image-viewer-stage"
          onWheel={handleWheel}
          onMouseMove={handlePointerMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDragging}
        >
          <img
            src={image.src}
            alt="Attachment"
            className={`image-viewer-media ${dragging ? 'dragging' : ''}`}
            onMouseDown={handlePointerDown}
            draggable={false}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;
