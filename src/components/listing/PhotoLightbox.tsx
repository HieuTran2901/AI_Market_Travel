import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
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
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.classList.add('listing-photo-lightbox-open');
    window.dispatchEvent(new CustomEvent('listing-photo-lightbox:toggle', { detail: { open: true } }));
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
      document.body.style.overscrollBehavior = previousOverscroll;
      document.body.classList.remove('listing-photo-lightbox-open');
      window.dispatchEvent(new CustomEvent('listing-photo-lightbox:toggle', { detail: { open: false } }));
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, images.length, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setControlsVisible(true);
  }, [isOpen, selectedIndex]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selectedIndex, isOpen]);

  const handleStagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    touchStartRef.current = { x: event.clientX, y: event.clientY, time: Date.now() };
  };

  const handleStagePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || event.pointerType === 'mouse') return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const elapsed = Date.now() - start.time;
    const isHorizontalSwipe = Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35 && elapsed < 700;

    if (!isHorizontalSwipe) {
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        setControlsVisible((visible) => !visible);
      }
      return;
    }

    if (deltaX < 0) goToNext();
    else goToPrevious();
  };

  if (!isOpen || !selectedImage) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[1200] flex h-dvh w-full items-center justify-center overflow-hidden bg-black p-0 text-white backdrop-blur-md motion-fade-in md:bg-slate-950/95 md:px-2 md:py-3"
      role="dialog"
      aria-label="Listing photo gallery"
      onMouseDown={onClose}
    >
      <div
        className="relative flex h-dvh w-full max-w-none flex-col overflow-hidden rounded-none border-0 border-white/10 bg-black shadow-none motion-fade-up md:h-[90vh] md:w-[96vw] md:max-w-[1600px] md:rounded-3xl md:border md:bg-slate-950 md:shadow-2xl md:shadow-black/60"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className={cn(
          'absolute inset-x-0 top-0 z-30 flex min-h-[60px] shrink-0 items-center justify-between gap-4 bg-gradient-to-b from-black/80 to-transparent px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] transition-opacity duration-200 md:static md:h-20 md:border-b md:border-white/10 md:bg-none md:px-5 md:pt-0 md:opacity-100',
          controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}>
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

        <div className="grid min-h-0 flex-1 bg-black md:bg-[#020617] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-0 flex-col p-0 md:p-5">
            <div
              className="relative min-h-0 flex-1 touch-pan-y select-none overflow-hidden"
              onPointerDown={handleStagePointerDown}
              onPointerUp={handleStagePointerUp}
              onPointerCancel={() => { touchStartRef.current = null; }}
            >
              {hasMultipleImages && (
                <Button
                  variant="outline"
                  className={cn(
                    'absolute left-3 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full border-white/20 bg-black/45 p-0 text-white shadow-lg backdrop-blur transition-all duration-300 hover:-translate-x-0.5 hover:bg-white/20 focus:ring-cyan-300 sm:left-5',
                    !controlsVisible && 'opacity-0 md:opacity-100',
                  )}
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
                className="image-reveal h-full w-full object-contain shadow-2xl shadow-black/40 md:h-[62vh] md:max-h-[720px] md:rounded-2xl md:object-cover xl:h-[68vh]"
              />

              {hasMultipleImages && (
                <Button
                  variant="outline"
                  className={cn(
                    'absolute right-3 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full border-white/20 bg-black/45 p-0 text-white shadow-lg backdrop-blur transition-all duration-300 hover:translate-x-0.5 hover:bg-white/20 focus:ring-cyan-300 sm:right-5',
                    !controlsVisible && 'opacity-0 md:opacity-100',
                  )}
                  onClick={goToNext}
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-7 w-7" />
                </Button>
              )}
            </div>

            <div className={cn(
              'shrink-0 border-t border-white/10 bg-black/80 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 transition-opacity duration-200 md:mt-4 md:border-t-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0 md:opacity-100',
              controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:gap-3 [&::-webkit-scrollbar]:hidden">
                {images.map((image, index) => {
                  const isActive = index === selectedIndex;

                  return (
                    <button
                      key={`${image.src}-${index}`}
                      ref={isActive ? activeThumbRef : undefined}
                      type="button"
                      className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 md:h-24 md:w-40 ${
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
