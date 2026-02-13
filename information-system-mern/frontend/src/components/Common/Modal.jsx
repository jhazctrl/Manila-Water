/**
 * Modal.jsx — Reusable modal wrapper
 * Props: isOpen, onClose, title, children, maxWidth
 */
import { useEffect, useCallback } from 'react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-3xl' }) => {
    const handleEsc = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEsc]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn font-poppins"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={`relative glass-modal rounded-3xl shadow-2xl w-full ${maxWidth} p-10 animate-slideUp max-h-[90vh] overflow-y-auto`}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-red-500 text-3xl font-light transition-all duration-200 hover:rotate-90 cursor-pointer"
                    aria-label="Close"
                >
                    ×
                </button>

                {/* Title */}
                {title && (
                    <h2 className="text-3xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-200">
                        {title}
                    </h2>
                )}

                {/* Body */}
                {children}
            </div>
        </div>
    );
};

export default Modal;
