import { Flame, Route, Trophy } from "lucide-react";
import { OilcapGameShell } from "@/components/games/oilcap-game-shell";
import { buildMetadata, getGameBySlug } from "@/lib/site";

const game = getGameBySlug("oilcap");

export const metadata = buildMetadata({
  title: "Oilcap",
  description: game?.longDescription,
  path: "/games/oilcap",
  image: game?.heroImage,
  keywords: game?.keywords,
});

export default function OilcapPage() {
  if (!game) {
    return null;
  }

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="grid gap-8 xl:items-start">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="section-kicker">{game.eyebrow}</p>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Flame className="size-4" />
                {game.status}
              </div>
              <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
                Route the pressure, waste less pipe, and seal the cap before the
                board runs dry.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-base-content/80">
                {game.longDescription}
              </p>
            </div>
          </div>

          <section className="grid gap-6 md:grid-cols-3 2xl:grid-cols-3">
            <div className="card-surface rounded-[1.6rem] p-6">
              <Route className="size-5 text-primary" />
              <h2 className="display-font mt-4 text-2xl font-semibold">
                Queue-based routing
              </h2>
              <p className="mt-3 text-sm leading-7 text-base-content/80">
                Pick from three upcoming pieces, then commit that tile to the
                board. Every placement changes the next decision.
              </p>
            </div>
            <div className="card-surface rounded-[1.6rem] p-6">
              <Trophy className="size-5 text-accent" />
              <h2 className="display-font mt-4 text-2xl font-semibold">
                Efficiency scoring
              </h2>
              <p className="mt-3 text-sm leading-7 text-base-content/80">
                Reachable pipes and matched connections add points. Isolated
                junk and leaks strip the run back down.
              </p>
            </div>
            <div className="card-surface rounded-[1.6rem] p-6">
              <Flame className="size-5 text-secondary" />
              <h2 className="display-font mt-4 text-2xl font-semibold">
                Tight move budget
              </h2>
              <p className="mt-3 text-sm leading-7 text-base-content/80">
                You only get twelve placements per delivery. Clean routes
                preserve enough budget for a bonus finish.
              </p>
            </div>
          </section>

          <section className="card-surface rounded-[1.8rem] p-6 sm:p-7">
            <p className="section-kicker before:w-5">How it scores</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-base-content/78">
              <p>{game.scoreHook}</p>
              <p>
                Each run starts with a fresh cap row on the right wall. Connect
                the source on row 3 to that cap using the existing SVG pipe
                pieces, and try to finish with placements left for the bonus.
              </p>
            </div>
          </section>
        </div>

        <OilcapGameShell />
      </section>
    </main>
  );
}
