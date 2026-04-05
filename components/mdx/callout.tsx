import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

type CalloutProps = {
  title?: string;
  children: ReactNode;
};

export function Callout({ title = "Field note", children }: CalloutProps) {
  return (
    <aside className="card-surface my-8 rounded-3xl border-l-4 border-primary p-5">
      <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-base-content/70">
        <Lightbulb className="size-4 text-primary" />
        {title}
      </div>
      <div className="text-sm leading-7 text-base-content/80">{children}</div>
    </aside>
  );
}
