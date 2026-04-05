import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell py-20">
      <section className="card-surface rounded-[2rem] p-8 sm:p-12">
        <p className="section-kicker">404</p>
        <h1 className="display-font mt-5 text-5xl font-bold leading-none text-base-content sm:text-6xl">
          The squirrel couldn’t find that page.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-base-content/80">
          Try the homepage, the games hub, or the blog index instead.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary rounded-full">
            Home
          </Link>
          <Link href="/blog" className="btn btn-secondary rounded-full">
            Blog
          </Link>
          <Link
            href="/games"
            className="btn btn-ghost rounded-full border border-base-300/25 bg-white/35"
          >
            Games
          </Link>
        </div>
      </section>
    </main>
  );
}
