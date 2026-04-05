import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock3, Trophy } from "lucide-react";
import type { GameEntry } from "@/lib/site";

type GameDetailPageProps = {
  game: GameEntry;
};

export function GameDetailPage({ game }: GameDetailPageProps) {
  return (
    <main className="page-shell py-14 sm:py-18">
      <div className="mb-8">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 text-sm font-medium text-base-content/75 hover:text-base-content"
        >
          <ArrowLeft className="size-4" />
          Back to all games
        </Link>
      </div>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="section-kicker">{game.eyebrow}</p>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="display-font text-5xl font-bold leading-none text-base-content sm:text-6xl">
                  {game.name}
                </h1>
                <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-content">
                  {game.status}
                </span>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                {game.longDescription}
              </p>
            </div>
          </div>

          <div className="card-surface relative overflow-hidden rounded-[2rem] p-3">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.4rem]">
              <Image
                src={game.heroImage}
                alt={game.name}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          </div>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="card-surface rounded-[1.6rem] p-6">
              <h2 className="display-font text-2xl font-semibold">
                What’s planned
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-base-content/80">
                {game.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <BadgeCheck className="mt-1 size-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-surface rounded-[1.6rem] p-6">
              <h2 className="display-font text-2xl font-semibold">
                Score model
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-base-content/80">
                <p className="inline-flex items-start gap-3">
                  <Trophy className="mt-1 size-4 shrink-0 text-primary" />
                  <span>{game.scoreHook}</span>
                </p>
                <p className="inline-flex items-start gap-3">
                  <Clock3 className="mt-1 size-4 shrink-0 text-accent" />
                  <span>
                    Guests will be able to play freely; authenticated, verified
                    users will later save scores to the leaderboard.
                  </span>
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="card-surface rounded-[1.8rem] p-6 lg:sticky lg:top-28">
          <p className="section-kicker before:w-6">Launch note</p>
          <h2 className="display-font mt-4 text-3xl font-semibold">
            Coming soon
          </h2>
          <p className="mt-4 text-sm leading-7 text-base-content/80">
            This route is already live and fully indexable for SEO, while the
            actual game loop, score saving, and authenticated leaderboard are
            being wired next.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {game.keywords.slice(0, 5).map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-base-300/20 bg-white/35 px-3 py-1 text-xs font-medium text-base-content/70"
              >
                {keyword}
              </span>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
