import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type PhotoLightboxImage = {
  src: string;
  alt: string;
};

type PhotoLightboxProps = {
  images: PhotoLightboxImage[];
  selectedIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
  listingTitle?: string;
  listingLocation?: string;
  listingDescription?: string;
};

export const PhotoLightbox = ({
  images,
  selectedIndex,
  isOpen,
  onClose,
  onSelect,
  listingTitle,
  listingLocation,
  listingDescription,
}: PhotoLightboxProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedImage = images[selectedIndex];
  const hasMultipleImages = images.length > 1;

  const goToPrevious = () => {
    if (!hasMultipleImages) return;
    onSelect((selectedIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    if (!hasMultipleImages) return;
    onSelect((selectedIndex + 1) % images.length);
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, images.length, onClose]);

  if (!isOpen || !selectedImage) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 px-2 py-3 text-white backdrop-blur-md motion-fade-in sm:px-4"
      role="dialog"
      aria-label="Listing photo gallery"
      onMouseDown={onClose}
    >
      <div
        className="relative flex h-[90vh] w-[96vw] max-w-[1600px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/60 motion-fade-up"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 sm:px-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Images className="h-4 w-4 text-cyan-300" />
              Listing photos
            </p>
            <p className="mt-0.5 text-xs text-slate-300">
              {selectedIndex + 1} / {images.length}
            </p>
          </div>
          <Button
            ref={closeButtonRef}
            variant="outline"
            size="sm"
            className="h-12 w-12 rounded-full border-white/20 bg-white/10 p-0 text-white hover:bg-white/20 focus:ring-cyan-300"
            onClick={onClose}
            aria-label="Close photo gallery"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 bg-[#020617] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-0 flex-col p-3 sm:p-5">
            <div className="relative min-h-0 flex-1">
              {hasMultipleImages && (
                <Button
                  variant="outline"
                  className="absolute left-3 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full border-white/20 bg-white/10 p-0 text-white shadow-lg backdrop-blur transition-all duration-300 hover:-translate-x-0.5 hover:bg-white/20 focus:ring-cyan-300 sm:left-5"
                  onClick={goToPrevious}
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-7 w-7" />
                </Button>
              )}

              <img
                key={selectedImage.src}
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="image-reveal h-[56vh] max-h-[720px] w-full rounded-2xl object-cover shadow-2xl shadow-black/40 md:h-[62vh] xl:h-[68vh]"
              />

              {hasMultipleImages && (
                <Button
                  variant="outline"
                  className="absolute right-3 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full border-white/20 bg-white/10 p-0 text-white shadow-lg backdrop-blur transition-all duration-300 hover:translate-x-0.5 hover:bg-white/20 focus:ring-cyan-300 sm:right-5"
                  onClick={goToNext}
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-7 w-7" />
                </Button>
              )}
            </div>

            <div className="mt-3 shrink-0 sm:mt-4">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((image, index) => {
                  const isActive = index === selectedIndex;

                  return (
                    <button
                      key={`${image.src}-${index}`}
                      type="button"
                      className={`h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 md:h-24 md:w-40 ${
                        isActive
                          ? 'border-cyan-300 shadow-lg shadow-cyan-500/25'
                          : 'border-white/10 opacity-70 hover:-translate-y-0.5 hover:border-white/40 hover:opacity-100'
                      }`}
                      onClick={() => onSelect(index)}
                      aria-label={`View photo ${index + 1} of ${images.length}`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="hidden border-l border-white/10 bg-slate-950/70 p-6 xl:block">
            <div className="flex h-full flex-col">
              <div>
                <h3 className="text-lg font-bold leading-7 text-white">
                  {listingTitle || 'Listing photos'}
                </h3>
                {listingLocation && (
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
                    {listingLocation}
                  </p>
                )}
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Description
                </p>
                <p className="mt-3 line-clamp-6 text-sm leading-6 text-slate-300">
                  {listingDescription || 'Browse all available photos for this listing.'}
                </p>
              </div>

              <div className="mt-auto text-sm font-semibold text-slate-300">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
