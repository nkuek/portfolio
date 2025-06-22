import { tv } from "tailwind-variants";

export const buttonVariants = tv({
  variants: {
    base: "text-text-on-button transition-colors duration-[250ms]",
    variant: {
      primary: "bg-primary hover:bg-primary-hover",
      secondary:
        "bg-secondary hover:bg-secondary-hover border disabled:opacity-50",
      tertiary: "bg-tertiary hover:bg-tertiary-hover",
    },
    size: {
      big: "rounded-xl px-6 py-3",
      small: "rounded-md px-4 py-2",
    },
  },
  defaultVariants: {
    size: "big",
  },
});
