import { type ReactNode, useEffect } from 'react';
import './Dialog.css';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  hideClose?: boolean;
}

export function Dialog({ isOpen, onClose, title, children, footer, hideClose }: DialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !hideClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, hideClose]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={hideClose ? undefined : onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        {(title || !hideClose) && (
          <div className="dialog-header">
            <h2>{title}</h2>
            {!hideClose && (
              <button className="dialog-close" onClick={onClose}>
                X
              </button>
            )}
          </div>
        )}
        <div className="dialog-content">
          {children}
        </div>
        {footer && (
          <div className="dialog-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
