import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import type { GameEntry } from "@/lib/site";

type GameCardProps = {
  game: GameEntry;
};

export function GameTable({ game }: GameCardProps) {
  return (
    <article className="h-full">
      <Link
        href={`/games/${game.slug}`}
        className="card-surface group relative flex h-full overflow-hidden rounded-[1.9rem] p-2 transition duration-300 hover:-translate-y-0.5 hover:bg-white/70"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition duration-500 group-hover:bg-primary/15" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl transition duration-500 group-hover:bg-accent/15" />

        <div className="relative grid h-full w-full grid-cols-[6.75rem_minmax(0,1fr)] gap-3 rounded-[1.45rem] border border-white/25 bg-linear-to-br from-white/55 via-white/35 to-white/18 p-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
          <div className="relative min-h-32 overflow-hidden rounded-[1.2rem] border border-base-300/10 bg-base-200/20">
            <Image
              src={game.heroImage}
              alt={game.name}
              fill
              sizes="(max-width: 640px) 108px, 128px"
              className="object-cover transition duration-500 group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/52 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-primary/18 to-transparent mix-blend-screen" />
            <div className="absolute bottom-3 left-3 right-3 rounded-full border border-white/18 bg-black/30 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
              {game.eyebrow}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-1">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="inline-flex items-center rounded-full border border-base-300/15 bg-base-100/65 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-base-content/70">
                    {game.status}
                  </div>

                  <h3 className="display-font text-[1.35rem] font-semibold leading-tight text-base-content">
                    {game.name}
                  </h3>
                </div>

                <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-base-300/15 bg-white/45 text-base-content/60 transition duration-300 group-hover:border-primary/25 group-hover:bg-primary/10 group-hover:text-primary">
                  <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-0.5" />
                </div>
              </div>

              <p className="line-clamp-2 text-sm leading-6 text-base-content/75">
                {game.description}
              </p>
            </div>

            <div className="glass-strip flex items-start gap-3 rounded-[1.15rem] px-3 py-3 text-sm text-base-content/80">
              <Trophy className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="line-clamp-2 leading-5">{game.scoreHook}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}