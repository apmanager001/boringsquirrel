import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

type HoverTipsProps = {
  content: ReactNode;
  title?: string;
  align?: "start" | "center" | "end";
  children: ReactNode;
};

const tooltipAlignment = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
} as const;

export function HoverTips({
  content,
  title = "Field note",
  align = "center",
  children,
}: HoverTipsProps) {
  return (
    <span className="group relative inline-flex max-w-full align-baseline">
      <button
        type="button"
        className="inline cursor-help rounded-sm border-b border-dotted border-primary/65 font-semibold text-primary outline-none transition-colors duration-200 hover:text-primary/80 focus-visible:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary/35"
      >
        {children}
      </button>

      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-20 mb-3 w-72 max-w-[calc(100vw-2rem)] rounded-[1.25rem] border border-[rgba(38,109,211,0.2)] border-l-4 bg-[rgba(238,246,255,0.98)] p-4 text-left text-base-content opacity-0 invisible translate-y-2 shadow-[0_20px_60px_rgba(24,36,18,0.18)] backdrop-blur-sm transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${tooltipAlignment[align]}`}
        style={{ borderLeftColor: "var(--color-info)" }}
      >
        <span className="mb-2 inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-info/80">
          <Lightbulb className="size-3.5 text-info" />
          {title}
        </span>
        <span className="block text-sm leading-6 text-base-content/80">
          {content}
        </span>
      </span>
    </span>
  );
}

export default HoverTips;
