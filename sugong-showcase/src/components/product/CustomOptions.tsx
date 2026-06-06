import { useState } from "react";
import { cn } from "../../lib/cn";

type Option = {
  label: string;
  value: string;
};

type Props = {
  customizable: boolean;
};

const colorOptions: Option[] = [
  { label: "Lavender", value: "lavender" },
  { label: "Kem", value: "cream" },
  { label: "Hồng nhạt", value: "pink" },
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
    <div className="space-y-5 rounded-card border border-border bg-background-card p-5 shadow-soft">
      <div>
        <p className="text-sm font-semibold text-primary-dark">Màu sắc</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {colorOptions.map((option) => (
            <button
              className={cn(
                "min-h-10 rounded-button border px-4 text-sm font-medium transition",
                color === option.value
                  ? "border-primary bg-primary text-background-card"
                  : "border-border bg-background-card text-text-secondary hover:border-primary-soft hover:text-primary-dark",
              )}
              type="button"
              aria-pressed={color === option.value}
              onClick={() => setColor(option.value)}
              key={option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-primary-dark">Kích thước</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizeOptions.map((option) => (
            <button
              className={cn(
                "min-h-10 rounded-button border px-4 text-sm font-medium transition",
                size === option.value
                  ? "border-primary bg-primary text-background-card"
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
      </div>

      <div className="rounded-button bg-background-section p-4 text-sm leading-6 text-text-secondary">
        {customizable
          ? "Có thể đổi màu vải, thêu tên hoặc thêm chi tiết nhỏ theo yêu cầu."
          : "Mẫu này hiện bán theo thiết kế có sẵn, chưa nhận thay đổi chi tiết."}
      </div>
    </div>
  );
}
