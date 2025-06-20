import { VariantProps } from "tailwind-variants";
import { buttonVariants } from "./variants";

export type DSButtonVariantProps = VariantProps<typeof buttonVariants>;
export type DSButtonProps = DSButtonVariantProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;
