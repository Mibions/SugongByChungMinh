import Button from "./Button.astro";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    href: "#",
    variant: "primary",
  },
};

export default meta;

export const Primary = {
  args: {
    variant: "primary",
    default: "Nhắn Zalo",
  },
};

export const Secondary = {
  args: {
    variant: "secondary",
    default: "Xem sản phẩm",
  },
};
