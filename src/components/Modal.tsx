import React from 'react';
import { motion } from 'motion/react';
import { useFocusable } from '../lib/focus/FocusContext';
import '../css/common.css';

interface ModalProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  title, 
  description, 
  onConfirm, 
  onCancel, 
  confirmLabel = "OK", 
  cancelLabel = "Cancel" 
}) => {
  const { ref: confirmRef, isFocused: confirmFocused } = useFocusable('modal-confirm');
  const { ref: cancelRef, isFocused: cancelFocused } = useFocusable('modal-cancel');

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="modal-box"
      >
        <h2 className="modal-title">{title}</h2>
        <p className="modal-desc">
          {description}
        </p>
        
        <div className="modal-actions">
          <button
            ref={confirmRef as any}
            onClick={onConfirm}
            className={`modal-btn confirm ${confirmFocused ? 'focused tv-focus-outline' : ''}`}
          >
            {confirmLabel}
          </button>
          <button
            ref={cancelRef as any}
            onClick={onCancel}
            className={`modal-btn cancel ${cancelFocused ? 'focused tv-focus-outline' : ''}`}
          >
            {cancelLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Modal;
