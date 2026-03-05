import styles from "./ScrollReveal.module.css";

type ScrollRevealProps = React.HTMLAttributes<HTMLElement> & {
  variant: "skill" | "stagger" | "card";
  as?: keyof React.JSX.IntrinsicElements;
  children: React.ReactNode;
};

const VARIANT_CLASS = {
  skill: styles.skill,
  stagger: styles.stagger,
  card: styles.card,
};

export default function ScrollReveal({
  variant,
  as: Tag = "div",
  children,
  className = "",
  ...rest
}: ScrollRevealProps) {
  return (
    // @ts-expect-error -- dynamic tag is safe with intrinsic element keys
    <Tag className={`${VARIANT_CLASS[variant]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
