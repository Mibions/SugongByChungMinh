import { useState } from "react";
import { Palette, Ruler } from "lucide-react";
import { cn } from "../../lib/cn";

type Option = {
  label: string;
  value: string;
  swatch?: string;
};

type Props = {
  customizable: boolean;
};

const colorOptions: Option[] = [
  { label: "Lavender", value: "lavender", swatch: "bg-primary-soft" },
  { label: "Kem", value: "cream", swatch: "bg-accent-cream" },
  { label: "Hồng nhạt", value: "pink", swatch: "bg-accent-pink" },
];

const sizeOptions: Option[] = [
  { label: "Nhỏ", value: "small" },
  { label: "Vừa", value: "medium" },
  { label: "Lớn", value: "large" },
];

export function CustomOptions({ customizable }: Props) {
  const [color, setColor] = useState(colorOptions[0].value);
  const [size, setSize] = useState(sizeOptions[1].value);

  return (
    <div className="space-y-5 rounded-card border border-primary-soft/55 bg-background-card p-5 shadow-soft">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-primary-dark">
          <Palette size={17} aria-hidden="true" />
          Màu sắc
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {colorOptions.map((option) => (
            <button
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
                color === option.value
                  ? "border-primary bg-background-section text-primary-dark ring-2 ring-primary-soft/55"
                  : "border-border bg-background-card text-text-secondary hover:border-primary-soft hover:text-primary-dark",
              )}
              type="button"
              aria-pressed={color === option.value}
              onClick={() => setColor(option.value)}
              key={option.value}
            >
              <span className={cn("h-4 w-4 rounded-full border border-background-card shadow-soft", option.swatch)} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-primary-dark">
          <Ruler size={17} aria-hidden="true" />
          Kích thước
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizeOptions.map((option) => (
            <button
              className={cn(
                "min-h-11 rounded-full border px-5 text-sm font-medium transition",
                size === option.value
                  ? "border-primary bg-primary text-background-card shadow-soft"
                  : "border-border bg-background-card text-text-secondary hover:border-primary-soft hover:text-primary-dark",
              )}
              type="button"
              aria-pressed={size === option.value}
              onClick={() => setSize(option.value)}
              key={option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-text-secondary">Kích thước có thể điều chỉnh theo yêu cầu.</p>
      </div>

      <div className="rounded-card bg-background-section p-4 text-sm leading-6 text-text-secondary">
        {customizable
          ? "Có thể đổi màu vải, thêu tên hoặc thêm chi tiết nhỏ theo yêu cầu."
          : "Mẫu này hiện bán theo thiết kế có sẵn, chưa nhận thay đổi chi tiết."}
      </div>
    </div>
  );
}
