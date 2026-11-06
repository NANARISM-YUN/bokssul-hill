import React, { useState, useRef } from 'react';

export const VirtualJoystick = ({
  onMove,
  onDragChange,
}: {
  onMove: (vec: { x: number; y: number }) => void;
  onDragChange?: (dragging: boolean) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const maxRadius = 30;

  const updateStick = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    onMove({
      x: Number((dx / maxRadius).toFixed(2)),
      y: Number((dy / maxRadius).toFixed(2)),
    });
  };

  const handleReset = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(false);
    onDragChange?.(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  return (
    <div
      className="p-2 -m-2 select-none touch-none"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          setIsDragging(true);
          onDragChange?.(true);
          updateStick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (!isDragging) return;
          updateStick(e.clientX, e.clientY);
        }}
        onPointerUp={handleReset}
        onPointerCancel={handleReset}
        className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/80 backdrop-blur-md border-2 border-lime-900/30 shadow-xl cursor-grab active:cursor-grabbing"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-dashed border-lime-800/35 pointer-events-none" />

        <div
          style={{
            transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
          }}
          className={`absolute top-1/2 left-1/2 w-9 h-9 rounded-full shadow-lg flex items-center justify-center pointer-events-none transition-transform ${
            isDragging
              ? 'bg-lime-800 scale-105 duration-0'
              : 'bg-lime-600 duration-150'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-amber-100" />
        </div>
      </div>
    </div>
  );
};