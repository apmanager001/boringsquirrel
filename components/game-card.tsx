import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import type { GameEntry } from "@/lib/site";

type GameCardProps = {
  game: GameEntry;
};

export function GameCard({ game }: GameCardProps) {
  return (
    <article className="card-surface group flex h-full flex-col overflow-hidden rounded-3xl">
      <Link href={`/games/${game.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-16/10 overflow-hidden border-b border-base-300/15 bg-base-200/15">
          <Image
            src={game.heroImage}
            alt={game.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute right-4 top-4 rounded-full bg-base-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-base-content">
            {game.status}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="space-y-2">
            <p className="section-kicker before:w-8">{game.eyebrow}</p>
            <h3 className="display-font text-2xl font-semibold leading-tight">
              {game.name}
            </h3>
            <p className="text-sm leading-7 text-base-content/80">
              {game.description}
            </p>
          </div>

          <div className="mt-auto glass-strip flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-base-content/80">
            <Trophy className="size-4 shrink-0 text-primary" />
            <span>{game.scoreHook}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
