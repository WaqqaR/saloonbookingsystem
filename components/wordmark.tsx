import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-7xl",
};

/**
 * The bonheur wordmark.
 * Lowercase, italic, light-weight Cormorant — set in a fashion-house style.
 */
export function Wordmark({
  size = "md",
  className,
  as: Tag = "span",
}: {
  size?: Size;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const name = process.env.NEXT_PUBLIC_APP_NAME || process.env.APP_NAME || "bonheur";
  return (
    <Tag
      className={cn(
        "font-display italic font-light lowercase",
        size === "xl" ? "tracking-[-0.01em]" : "tracking-wide",
        sizes[size],
        className
      )}
    >
      {name}
    </Tag>
  );
}
