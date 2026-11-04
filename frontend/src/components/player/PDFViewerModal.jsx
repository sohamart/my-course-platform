import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2, FileText, Shield, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PDFViewerModal = ({ note, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      onWheel={(e) => e.stopPropagation()}
      onContextMenu={handleContextMenu}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md transition-all"
    >
      <motion.div
        data-lenis-prevent
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full ${
          isFullscreen ? 'h-full max-w-none' : 'max-w-5xl h-[85vh]'
        } rounded-3xl glass-card flex flex-col overflow-hidden shadow-2xl border border-white/80 bg-brand-offwhite`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/80 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl glass-lavender flex items-center justify-center text-indigo-900">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-brand-black line-clamp-1">
                {note.name}
              </h3>
              <span className="text-[10px] text-brand-muted flex items-center gap-1 font-semibold">
                <Shield className="w-3 h-3 text-emerald-600" /> Protected In-App PDF Reader
              </span>
            </div>
          </div>

          {/* Controls: Zoom, Fullscreen, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center rounded-xl bg-white/60 border border-white/80 p-1">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded-lg hover:bg-white text-brand-muted hover:text-brand-black transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-semibold text-brand-black px-2">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded-lg hover:bg-white text-brand-muted hover:text-brand-black transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {note.viewUrl && (
              <a
                href={note.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/60 border border-white/80 hover:bg-white text-brand-muted hover:text-brand-black transition"
                title="Open in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/60 border border-white/80 hover:bg-white text-brand-muted hover:text-brand-black transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-brand-black text-white hover:bg-neutral-800 transition cursor-pointer"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 bg-neutral-900 relative overflow-auto flex items-center justify-center p-2">
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
      </motion.div>
    </div>
  );
};

export default PDFViewerModal;

