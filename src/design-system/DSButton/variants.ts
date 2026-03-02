import { tv } from "tailwind-variants";

export const buttonVariants = tv({
  base: "text-text-on-button outline-accent transition-[color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-97",
  variants: {
    variant: {
      primary: "bg-primary hover:bg-primary-hover",
      secondary:
        "bg-secondary hover:bg-secondary-hover hover:text-link-hover border disabled:opacity-50",
      tertiary: "bg-tertiary [a]:hover:bg-tertiary-hover",
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
