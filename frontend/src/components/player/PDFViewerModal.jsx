import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2, FileText, Shield, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const PDFViewerModal = ({ note, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!note) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  // Prevent right-click context menu on PDF viewer
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  return (
    <div
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
      onContextMenu={handleContextMenu}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-xs transition-all"
    >
      <motion.div
        data-lenis-prevent
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full ${
          isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-5xl h-[92vh] sm:h-[85vh] rounded-3xl'
        } glass-card flex flex-col overflow-hidden shadow-2xl border border-white/80 bg-brand-offwhite`}
      >
        {/* Top Control Bar - Fully Responsive for Mobile & Desktop */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md shrink-0 gap-2">
          {/* Note Info */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl glass-lavender flex items-center justify-center text-indigo-900 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                {note.name}
              </h3>
              <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold truncate">
                <Shield className="w-3 h-3 text-emerald-600 shrink-0" /> Protected In-App PDF Reader
              </span>
            </div>
          </div>

          {/* Controls: Zoom, Open External, Fullscreen, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Zoom Controls (Hidden on mobile / tablet to prevent crowding) */}
            <div className="hidden md:flex items-center rounded-xl bg-neutral-100 border border-neutral-200 p-1">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded-lg hover:bg-white text-neutral-600 hover:text-neutral-900 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-semibold text-neutral-900 px-2">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded-lg hover:bg-white text-neutral-600 hover:text-neutral-900 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Open in new tab (Useful for mobile & external reader) */}
            {note.viewUrl && (
              <a
                href={note.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:px-2.5 rounded-xl bg-neutral-100 border border-neutral-200 hover:bg-white text-neutral-700 hover:text-neutral-900 transition shrink-0 flex items-center gap-1 text-xs font-semibold"
                title="Open PDF in New Tab / App"
                aria-label="Open PDF in New Tab"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Open</span>
              </a>
            )}

            {/* Desktop Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="hidden md:flex p-2 rounded-xl bg-neutral-100 border border-neutral-200 hover:bg-white text-neutral-700 hover:text-neutral-900 transition shrink-0"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Prominent High-Contrast Close Button - ALWAYS visible on all screen sizes */}
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 transition cursor-pointer shrink-0 shadow-md active:scale-95 flex items-center gap-1.5 text-xs font-bold"
              title="Close Viewer"
              aria-label="Close Viewer"
            >
              <X className="w-4 h-4 text-white shrink-0" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Mobile Quick Banner for Android In-App Readers */}
        <div className="sm:hidden px-3.5 py-1.5 bg-brand-lavender/60 border-b border-brand-lavender/80 flex items-center justify-between text-[11px] font-semibold text-neutral-900 shrink-0">
          <span className="truncate mr-2">Reading on mobile browser?</span>
          {note.viewUrl && (
            <a
              href={note.viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-950 underline flex items-center gap-1 font-bold shrink-0"
            >
              Open Full Screen <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 bg-neutral-900 relative overflow-auto flex items-center justify-center p-1 sm:p-2">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none bg-neutral-950/80 backdrop-blur-xs">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-brand-mint animate-spin mb-3" />
              <p className="text-xs font-semibold text-white tracking-wide">
                Loading Secure Encrypted Document...
              </p>
            </div>
          )}

          {note.viewUrl ? (
            <iframe
              src={`${note.viewUrl}#toolbar=0&navpanes=0`}
              title={note.name}
              onLoad={() => setLoading(false)}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="w-full h-full rounded-2xl border-0 shadow-lg bg-white"
            />
          ) : (
            <div className="text-white text-center p-6">
              <FileText className="w-12 h-12 text-white/50 mx-auto mb-2" />
              <p className="text-sm font-semibold">Generating protected document preview...</p>
            </div>
          )}
        </div>

        {/* Mobile Bottom Close Bar (Provides guaranteed one-tap thumb access) */}
        <div className="sm:hidden px-3.5 py-2.5 bg-white border-t border-neutral-200 flex items-center justify-between gap-2 shrink-0 shadow-md">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-neutral-900 truncate">{note.name}</p>
            <p className="text-[9.5px] text-neutral-500 font-semibold">Tap outside or button to exit</p>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-neutral-950 text-white text-xs font-bold shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PDFViewerModal;
