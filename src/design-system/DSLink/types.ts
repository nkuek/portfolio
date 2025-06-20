import { LinkProps } from "next/link";
import { PropsWithChildren } from "react";

export type DSLinkProps = PropsWithChildren<LinkProps & { className?: string }>;
