import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type GameCardItem = {
  id: string;
  icon: LucideIcon;
  iconClassName?: string;
  title: ReactNode;
  description: ReactNode;
};

type GameCardsProps = {
  items: GameCardItem[];
  className?: string;
};

function GameCards({ items, className }: GameCardsProps) {
  const sectionClassName = className
    ? `grid gap-2.5 sm:gap-6 sm:grid-cols-3 ${className}`
    : "grid gap-2.5 sm:gap-6 sm:grid-cols-3";

  return (
    <section className={sectionClassName}>
      {items.map(
        ({
          id,
          icon: Icon,
          iconClassName = "text-primary",
          title,
          description,
        }) => (
          <div
            key={id}
            className="card-surface grid sm:grid-cols-3 items-start rounded-xl sm:block sm:rounded-3xl p-5"
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`size-3 sm:size-5 ${iconClassName}`}
              />
              <h2 className="text-sm font-semibold uppercase text-base-content/60">
                {title}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-7 text-base-content/78">
              {description}
            </p>
          </div>
        ),
      )}
    </section>
  );
}

export default GameCards;
