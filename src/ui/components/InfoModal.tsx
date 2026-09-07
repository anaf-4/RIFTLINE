import type { ReactNode } from 'react';
import './InfoModal.css';

interface InfoModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function InfoModal({ title, onClose, children }: InfoModalProps) {
  return (
    <div className="rl-info-overlay" onClick={onClose}>
      <div className="rl-info-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rl-info-header">
          <div className="rl-info-title">{title}</div>
          <button className="rl-info-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="rl-info-body">{children}</div>
      </div>
    </div>
  );
}
