import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageModalProps {
  images: string[];
  currentImage: string | null;
  onClose: () => void;
  onSelectImage?: (img: string) => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  images,
  currentImage,
  onClose,
  onSelectImage,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentImage || !onSelectImage || images.length <= 1) return;

      const currentIndex = images.indexOf(currentImage);
      if (e.key === "ArrowRight") {
        const nextIndex = (currentIndex + 1) % images.length;
        onSelectImage(images[nextIndex]);
      } else if (e.key === "ArrowLeft") {
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        onSelectImage(images[prevIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentImage, images, onSelectImage, onClose]);

  if (!currentImage) return null;

  const showNav = images.length > 1 && onSelectImage;
  const currentIndex = images.indexOf(currentImage);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showNav) {
      const nextIndex = (currentIndex + 1) % images.length;
      onSelectImage(images[nextIndex]);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showNav) {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      onSelectImage(images[prevIndex]);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors z-[101]"
        >
          <X size={24} />
        </button>

        {showNav && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors z-[101]"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {showNav && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors z-[101]"
          >
            <ChevronRight size={32} />
          </button>
        )}

        <motion.img
          key={currentImage} // forces re-render/animation on image change
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          src={currentImage}
          alt="Expanded view"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          referrerPolicy="no-referrer"
        />

        {showNav && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 bg-black/50 px-3 py-1 rounded-full text-sm font-medium z-[101]">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
