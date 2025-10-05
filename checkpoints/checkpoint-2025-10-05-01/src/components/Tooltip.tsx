import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  label: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
};

export default function Tooltip({ label, children, position = 'top' }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (el === null) return;
    const rect = el.getBoundingClientRect();
    switch (position) {
      case 'bottom':
        {
          const HALF = 2; // eslint-disable-line no-magic-numbers
          setCoords({ x: rect.left + rect.width / HALF, y: rect.bottom });
        }
        break;
      case 'left':
        {
          const HALF = 2; // eslint-disable-line no-magic-numbers
          setCoords({ x: rect.left, y: rect.top + rect.height / HALF });
        }
        break;
      case 'right':
        {
          const HALF = 2; // eslint-disable-line no-magic-numbers
          setCoords({ x: rect.right, y: rect.top + rect.height / HALF });
        }
        break;
      case 'top':
      default:
        {
          const HALF = 2; // eslint-disable-line no-magic-numbers
          setCoords({ x: rect.left + rect.width / HALF, y: rect.top });
        }
        break;
    }
  }, [position]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updatePosition]);

  const GAP = 6; // px gap between trigger edge and bubble
  const innerStyle: React.CSSProperties = {};
  switch (position) {
    case 'bottom':
      innerStyle.transform = `translate(-50%, ${GAP}px)`;
      break;
    case 'left':
      innerStyle.transform = `translate(calc(-100% - ${GAP}px), -50%)`;
      break;
    case 'right':
      innerStyle.transform = `translate(${GAP}px, -50%)`;
      break;
    case 'top':
    default:
      innerStyle.transform = `translate(-50%, calc(-100% - ${GAP}px))`;
      break;
  }

  const ARROW = 10; // px square size
  const ARROW_OFFSET = 5; // how much the arrow protrudes towards trigger
  const arrowStyle: React.CSSProperties = { width: ARROW, height: ARROW };
  if (position === 'top') {
    Object.assign(arrowStyle, { bottom: -ARROW_OFFSET, left: '50%', transform: 'translateX(-50%) rotate(45deg)' });
  } else if (position === 'bottom') {
    Object.assign(arrowStyle, { top: -ARROW_OFFSET, left: '50%', transform: 'translateX(-50%) rotate(45deg)' });
  } else if (position === 'left') {
    Object.assign(arrowStyle, { right: -ARROW_OFFSET, top: '50%', transform: 'translateY(-50%) rotate(45deg)' });
  } else if (position === 'right') {
    Object.assign(arrowStyle, { left: -ARROW_OFFSET, top: '50%', transform: 'translateY(-50%) rotate(45deg)' });
  }

  const tooltipNode = open
    ? createPortal(
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{ left: coords.x, top: coords.y }}
          role="tooltip"
        >
          <div className="relative" style={innerStyle}>
            <div className="bg-primary-600 text-white text-sm font-medium py-1.5 px-3 rounded-full shadow-lg whitespace-nowrap">
              {label}
            </div>
            <div className="absolute bg-primary-600" style={arrowStyle} />
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <span
      className="relative inline-flex items-center"
      ref={triggerRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {tooltipNode}
    </span>
  );
}
