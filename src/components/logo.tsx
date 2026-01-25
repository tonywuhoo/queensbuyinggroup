import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function Logo({ className, size = "md", showText = true, href = "/" }: LogoProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link href={href} className={cn("flex items-center gap-3 hover:opacity-90 transition-opacity", className)}>
      {/* Crown Icon */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-lg bg-gradient-to-br from-queens-purple to-queens-violet shadow-lg",
          sizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-2/3 h-2/3"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 17L4 7L8 10L12 4L16 10L20 7L22 17H2Z"
            fill="white"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 20H20"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="#7C3AED" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-display font-bold tracking-tight text-foreground leading-none",
              textSizes[size]
            )}
          >
            Cash Out
          </span>
          <span className="text-xs text-queens-purple tracking-widest uppercase font-semibold">
            Queens
          </span>
        </div>
      )}
    </Link>
  );
}
