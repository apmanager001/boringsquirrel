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
            className="card-surface grid grid-cols-[auto_1fr] items-start gap-x-2.5 gap-y-1.5 rounded-[1.15rem] p-3 sm:block sm:rounded-[1.6rem] sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Icon
                className={`size-3.5 shrink-0 sm:size-5 ${iconClassName}`}
              />
              <h2 className="display-font text-base font-semibold leading-snug sm:text-2xl">
                {title}
              </h2>
            </div>
            <p className="col-span-2 text-[11px] leading-5 text-base-content/80 sm:mt-3 sm:text-sm sm:leading-7">
              {description}
            </p>
          </div>
        ),
      )}
    </section>
  );
}

export default GameCards;
