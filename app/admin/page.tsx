import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Admin",
  description: "Admin area for Boring Squirrel.",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="space-y-6">
        <p className="section-kicker">Admin</p>
        <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
          The admin surface is intentionally staged behind future auth and role
          checks.
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-base-content/80">
          This page is present so the route structure exists, but the actual
          message inbox and view analytics remain hidden until better-auth and
          admin roles are wired.
        </p>
      </section>
    </main>
  );
}
