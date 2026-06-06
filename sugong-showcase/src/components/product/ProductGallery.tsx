import { useMemo, useState } from "react";
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
    <div className="grid gap-4 lg:grid-cols-[96px_1fr]">
      <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:grid lg:content-start lg:overflow-visible">
        {sortedImages.map((image, index) => (
          <button
            className={cn(
              "aspect-square w-20 shrink-0 overflow-hidden rounded-button border bg-background-card transition lg:w-full",
              index === activeIndex ? "border-primary shadow-soft" : "border-border",
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
            "aspect-square w-20 shrink-0 rounded-button border bg-text-primary px-2 text-xs font-medium text-background-card transition lg:w-full",
            showVideo ? "border-primary shadow-soft" : "border-border",
          )}
          type="button"
          aria-label={`Xem video của ${productName}`}
          aria-pressed={showVideo}
          onClick={() => setShowVideo(true)}
        >
          Video
        </button>
      </div>

      <div className="order-1 overflow-hidden rounded-card bg-background-card shadow-feather ring-1 ring-primary-soft/20 lg:order-2">
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
