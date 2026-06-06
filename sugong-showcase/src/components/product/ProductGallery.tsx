import { useMemo, useState } from "react";
import { PlayCircle } from "lucide-react";
import type { ProductImage } from "../../domain/product/product.types";
import { cn } from "../../lib/cn";
import { withBase } from "../../lib/url";

type Props = {
  images: ProductImage[];
  videoUrl?: string;
  productName: string;
};

export function ProductGallery({ images, videoUrl, productName }: Props) {
  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.sortOrder - b.sortOrder),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const activeImage = sortedImages[activeIndex] ?? sortedImages[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[92px_1fr]">
      <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:grid lg:content-start lg:overflow-visible lg:pb-0">
        {sortedImages.map((image, index) => (
          <button
            className={cn(
              "aspect-square w-20 shrink-0 overflow-hidden rounded-card border bg-background-card transition lg:w-full",
              index === activeIndex ? "border-primary-soft shadow-soft ring-2 ring-primary-soft/45" : "border-border hover:border-primary-soft",
            )}
            type="button"
            aria-label={`Xem ảnh ${index + 1} của ${productName}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              setActiveIndex(index);
              setShowVideo(false);
            }}
            key={`${image.url}-${index}`}
          >
            <img
              className="h-full w-full object-cover"
              src={withBase(image.url)}
              alt={image.alt}
              width={image.width}
              height={image.height}
              loading={index === 0 ? "eager" : "lazy"}
            />
          </button>
        ))}
        <button
          className={cn(
            "relative aspect-square w-20 shrink-0 overflow-hidden rounded-card border bg-text-primary px-2 text-xs font-medium text-background-card transition lg:w-full",
            showVideo ? "border-primary-soft shadow-soft ring-2 ring-primary-soft/45" : "border-border hover:border-primary-soft",
          )}
          type="button"
          aria-label={`Xem video của ${productName}`}
          aria-pressed={showVideo}
          onClick={() => setShowVideo(true)}
        >
          <span className="absolute inset-0 bg-primary-dark/70" />
          <span className="relative z-10 grid h-full place-items-center">
            <PlayCircle size={24} aria-hidden="true" />
            <span className="mt-1 rounded-full bg-background-card/90 px-2 py-0.5 text-[10px] text-primary-dark">
              Video
            </span>
          </span>
        </button>
      </div>

      <div className="order-1 overflow-hidden rounded-card border border-primary-soft/45 bg-background-card shadow-feather lg:order-2">
        {showVideo ? (
          videoUrl ? (
            <iframe
              className="aspect-[9/16] max-h-[680px] w-full bg-text-primary"
              src={videoUrl}
              title={`Video ${productName}`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="grid aspect-[4/3] min-h-80 place-items-center bg-background-section p-8 text-center">
              <div className="max-w-xs">
                <PlayCircle className="mx-auto mb-4 text-primary-dark" size={38} aria-hidden="true" />
                <p className="font-heading text-3xl text-primary-dark">Video đang cập nhật</p>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  SUGONG sẽ bổ sung video cận chất liệu và chi tiết sản phẩm tại đây.
                </p>
              </div>
            </div>
          )
        ) : (
          <img
            className="aspect-[4/3] h-full w-full object-cover"
            src={withBase(activeImage.url)}
            alt={activeImage.alt}
            width={activeImage.width}
            height={activeImage.height}
            loading="eager"
          />
        )}
      </div>
    </div>
  );
}
