import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PlayCircle, X } from "lucide-react";
import type { ProductImage } from "../../domain/product/product.types";
import { getCloudinaryImageProps } from "../../lib/cloudinary-image";
import { cn } from "../../lib/cn";

type Props = {
  images: ProductImage[];
  videoUrl?: string;
  productName: string;
};

type GalleryMedia =
  | (ProductImage & { type: "image" })
  | {
      type: "video";
      url?: string;
      alt: string;
      poster?: ProductImage;
    };

const initialThumbCount = 8;
const thumbStepCount = 8;

export function ProductGallery({ images, videoUrl, productName }: Props) {
  const media = useMemo<GalleryMedia[]>(() => {
    const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
    const imageMedia = sortedImages.map((image) => ({ ...image, type: "image" as const }));

    if (!videoUrl) return imageMedia;

    return [
      ...imageMedia,
      {
        type: "video" as const,
        url: videoUrl,
        alt: `Video sản phẩm ${productName}`,
        poster: sortedImages[0],
      },
    ];
  }, [images, productName, videoUrl]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [visibleThumbCount, setVisibleThumbCount] = useState(initialThumbCount);
  const activeMedia = media[activeIndex] ?? media[0];
  const visibleMedia = media.slice(0, visibleThumbCount);

  useEffect(() => {
    setVisibleThumbCount(initialThumbCount);
    setActiveIndex(0);
  }, [media.length]);

  useEffect(() => {
    if (activeIndex < visibleThumbCount) return;
    setVisibleThumbCount(Math.ceil((activeIndex + 1) / thumbStepCount) * thumbStepCount);
  }, [activeIndex, visibleThumbCount]);

  function goToNext() {
    setActiveIndex((current) => (current + 1) % media.length);
  }

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + media.length) % media.length);
  }

  function renderMedia(item: GalleryMedia, mode: "main" | "lightbox") {
    if (item.type === "video") {
      if (item.url) {
        return (
          <iframe
            className={cn(
              "w-full bg-text-primary",
              mode === "lightbox" ? "aspect-[9/16] max-h-[82vh]" : "aspect-[4/5] max-h-[540px]",
            )}
            src={item.url}
            title={item.alt}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        );
      }

      return (
        <div className={cn("grid place-items-center bg-background-section p-8 text-center", mode === "lightbox" ? "min-h-[62vh]" : "aspect-[4/5] min-h-80")}>
          <div className="max-w-xs">
            <PlayCircle className="mx-auto mb-4 text-primary-dark" size={42} aria-hidden="true" />
            <p className="font-heading text-3xl text-primary-dark">Video đang cập nhật</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              SUGONG sẽ bổ sung video cận chất liệu và chi tiết sản phẩm tại đây.
            </p>
          </div>
        </div>
      );
    }

    const imageProps = getCloudinaryImageProps(item, "product-gallery-main");

    return (
      <img
        className={cn("h-full w-full object-cover", mode === "lightbox" ? "max-h-[82vh] object-contain" : "aspect-[4/5] max-h-[540px]")}
        src={imageProps.src}
        srcSet={imageProps.srcset}
        sizes={imageProps.sizes}
        alt={item.alt}
        width={imageProps.width}
        height={imageProps.height}
        loading="eager"
        decoding="async"
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[76px_minmax(0,1fr)] lg:gap-5">
        <div className="order-2 space-y-3 lg:order-1">
          <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:content-start lg:overflow-visible lg:pb-0">
            {visibleMedia.map((item, index) => (
              <button
                data-gallery-thumb
                className={cn(
                  "aspect-square w-16 shrink-0 overflow-hidden rounded-[16px] border bg-background-card transition lg:w-full",
                  index === activeIndex ? "border-primary-soft shadow-soft ring-2 ring-primary-soft/45" : "border-border hover:border-primary-soft",
                )}
                type="button"
                aria-label={`Xem ${item.type === "video" ? "video" : "ảnh"} ${index + 1} của ${productName}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                key={`${item.type}-${item.type === "image" ? item.url : item.url ?? "video"}-${index}`}
              >
                {item.type === "image" ? (
                  (() => {
                    const imageProps = getCloudinaryImageProps(item, "product-gallery-thumb");

                    return (
                      <img
                        className="h-full w-full object-cover"
                        src={imageProps.src}
                        srcSet={imageProps.srcset}
                        sizes={imageProps.sizes}
                        alt={item.alt}
                        width={imageProps.width}
                        height={imageProps.height}
                        loading="lazy"
                        decoding="async"
                      />
                    );
                  })()
                ) : (
                  <span className="relative grid h-full place-items-center bg-text-primary text-background-card">
                    {item.poster && (
                      (() => {
                        const posterProps = getCloudinaryImageProps(item.poster, "product-gallery-thumb");

                        return (
                          <img
                            className="absolute inset-0 h-full w-full object-cover opacity-45"
                            src={posterProps.src}
                            srcSet={posterProps.srcset}
                            sizes={posterProps.sizes}
                            alt=""
                            width={posterProps.width}
                            height={posterProps.height}
                            loading="lazy"
                            decoding="async"
                          />
                        );
                      })()
                    )}
                    <span className="absolute inset-0 bg-primary-dark/55" />
                    <span className="relative z-10 grid place-items-center">
                      <PlayCircle size={20} aria-hidden="true" />
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {visibleThumbCount < media.length && (
            <button
              className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-primary-soft bg-background-card px-3 text-xs font-medium text-primary-dark shadow-soft transition hover:bg-background-section"
              type="button"
              onClick={() => setVisibleThumbCount((current) => current + thumbStepCount)}
            >
              Xem thêm {Math.min(thumbStepCount, media.length - visibleThumbCount)} ảnh
            </button>
          )}
        </div>

        <div className="order-1 mx-auto w-full max-w-[480px] overflow-hidden rounded-[20px] border border-primary-soft/45 bg-background-card shadow-feather lg:order-2 lg:max-w-[520px]">
          <div className="relative">
            <button
              data-gallery-main
              className="block w-full cursor-zoom-in"
              type="button"
              aria-label={`Mở ảnh lớn của ${productName}`}
              onClick={() => setLightboxOpen(true)}
            >
              {renderMedia(activeMedia, "main")}
            </button>
            {media.length > 1 && (
              <>
                <button
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background-card/90 text-primary-dark shadow-soft"
                  type="button"
                  aria-label="Ảnh trước"
                  onClick={goToPrevious}
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
                <button
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background-card/90 text-primary-dark shadow-soft"
                  type="button"
                  aria-label="Ảnh tiếp theo"
                  onClick={goToNext}
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
                <span data-gallery-index className="absolute bottom-3 right-3 rounded-full bg-background-card/90 px-3 py-1 text-xs font-medium text-primary-dark shadow-soft">
                  {activeIndex + 1} / {media.length}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <div data-gallery-lightbox className="fixed inset-0 z-[90] grid place-items-center bg-text-primary/55 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-card border border-primary-soft bg-background-card shadow-feather">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-primary-dark">
                {activeIndex + 1} / {media.length}
              </p>
              <button
                className="grid h-10 w-10 place-items-center rounded-full border border-border text-primary-dark"
                type="button"
                aria-label="Đóng ảnh lớn"
                onClick={() => setLightboxOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="relative bg-background-section">
              {renderMedia(activeMedia, "lightbox")}
              {media.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-background-card/90 text-primary-dark shadow-soft"
                    type="button"
                    aria-label="Ảnh trước"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-background-card/90 text-primary-dark shadow-soft"
                    type="button"
                    aria-label="Ảnh tiếp theo"
                    onClick={goToNext}
                  >
                    <ChevronRight size={22} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
