import Link from "next/link";
import { Inbox, Mail, ShieldAlert, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import {
  removeContactMessage,
  updateContactMessageReadState,
} from "@/app/admin/actions";
import { ContactMessageDeleteButton } from "@/components/admin/contact-message-delete-button";
import { ContactMessageReviewButton } from "@/components/admin/contact-message-review-button";
import { getAuthSession, getSessionIdentityFromUnknown } from "@/lib/auth";
import {
  ADMIN_CONTACT_INBOX_LIMIT,
  getAdminContactInbox,
  normalizeAdminContactFilter,
  type AdminContactMessageFilter,
} from "@/lib/contact";
import { hasBetterAuthConfig } from "@/lib/env";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Admin",
  description: "Admin area for Boring Squirrel.",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const adminLoginHref = `/login?callbackURL=${encodeURIComponent("/admin")}`;

const adminInboxFilters = [
  { label: "All messages", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
] as const;

const adminTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

type AdminPageProps = {
  searchParams: Promise<{ filter?: string | string[] }>;
};

function getAdminFilterHref(filter: AdminContactMessageFilter) {
  return filter === "all"
    ? "/admin"
    : `/admin?filter=${encodeURIComponent(filter)}`;
}

function formatAdminTimestamp(input: string) {
  return adminTimestampFormatter.format(new Date(input));
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  if (!hasBetterAuthConfig()) {
    return (
      <main className="page-shell py-14 sm:py-20">
        <section className="space-y-6">
          <p className="section-kicker">Admin Panel</p>
          <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
            Auth env setup is still required before admin access can be enforced
            here.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-base-content/80">
            The permission model is wired into Better Auth, but this deployment
            still needs the auth environment values before the protected admin
            surface can run.
          </p>
        </section>
      </main>
    );
  }

  const session = await getAuthSession();

  if (!session?.user) {
    redirect(adminLoginHref);
  }

  const identity = getSessionIdentityFromUnknown(session.user);

  if (!identity) {
    redirect(adminLoginHref);
  }

  if (!identity.isAdmin) {
    redirect("/settings");
    // return (
      // <main className="page-shell py-14 sm:py-20">
      //   <section className="space-y-6">
      //     <p className="section-kicker">Admin</p>
      //     <div className="card-surface rounded-4xl p-6 sm:p-8">
      //       <ShieldAlert className="size-6 text-warning" />
      //       <h1 className="display-font mt-4 text-4xl font-bold leading-[0.98] text-base-content sm:text-5xl">
      //         This account is signed in, but it does not have admin access.
      //       </h1>
      //       <p className="mt-4 max-w-3xl text-lg leading-8 text-base-content/80">
      //         New signups now default to the <strong>user</strong> role. To
      //         promote this account manually in MongoDB, set the Better Auth user
      //         document&apos;s <strong>role</strong> field to{" "}
      //         <strong>admin</strong>.
      //       </p>
      //       <p className="mt-4 text-sm leading-7 text-base-content/70">
      //         Signed in as {identity.email} with role{" "}
      //         <strong>{identity.role}</strong>.
      //       </p>
      //       <div className="mt-6 flex flex-wrap gap-3">
      //         <Link
      //           href="/settings"
      //           className="btn btn-primary rounded-full px-5"
      //         >
      //           Back to settings
      //         </Link>
      //         <Link href="/" className="btn btn-ghost rounded-full px-5">
      //           Return home
      //         </Link>
      //       </div>
      //     </div>
      //   </section>
      // </main>
    // );
  }

  const params = await searchParams;
  const filter = normalizeAdminContactFilter(
    typeof params.filter === "string" ? params.filter : undefined,
  );
  const inbox = await getAdminContactInbox(filter);
  const visibleMessageCount = inbox.messages.length;
  const showingAllFetchedMessages = inbox.totalCount <= visibleMessageCount;

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="space-y-6">
        <p className="section-kicker">Admin</p>
        <div className="space-y-4">
          <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
            Review incoming messages and keep the admin queue under control.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-base-content/80">
            Contact submissions now land in a real admin inbox. You can review
            each message here, jump into a reply, and mark items as read or
            unread while future moderation reports build on the same surface.
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <div className="card-surface rounded-4xl p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-success" />
              <h2 className="display-font text-2xl font-semibold">
                Admin session
              </h2>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-7 text-base-content/78">
              <div className="flex items-center justify-between gap-4">
                <span>Email</span>
                <span className="font-semibold text-base-content">
                  {identity.email}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Role</span>
                <span className="font-semibold uppercase tracking-[0.18em] text-base-content">
                  {identity.role}
                </span>
              </div>
            </div>
          </div>

          <div className="card-surface rounded-4xl p-6">
            <div className="flex items-center gap-3">
              <Inbox className="size-5 text-primary" />
              <h2 className="display-font text-2xl font-semibold">
                Inbox summary
              </h2>
            </div>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-base-content/78">
              <div className="rounded-3xl border border-base-300/15 bg-white/45 px-4 py-3">
                <p className="section-kicker before:w-4">Total</p>
                <p className="display-font mt-2 text-4xl font-semibold text-base-content">
                  {inbox.totalCount}
                </p>
              </div>
              <div className="rounded-3xl border border-base-300/15 bg-white/45 px-4 py-3">
                <p className="section-kicker before:w-4">Unread</p>
                <p className="display-font mt-2 text-4xl font-semibold text-base-content">
                  {inbox.unreadCount}
                </p>
              </div>
              <div className="rounded-3xl border border-base-300/15 bg-white/45 px-4 py-3">
                <p className="section-kicker before:w-4">Read</p>
                <p className="display-font mt-2 text-4xl font-semibold text-base-content">
                  {inbox.readCount}
                </p>
              </div>
            </div>
          </div>

          <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
            <p className="section-kicker before:w-6">Next review types</p>
            <p className="mt-4">
              Contact messages are live now. Profile flags, moderation reports,
              and other user review queues can slot into this same admin area
              next.
            </p>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="card-surface rounded-4xl p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="section-kicker before:w-5">Contact inbox</p>
                <h2 className="display-font mt-3 text-3xl font-semibold">
                  Message review
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {adminInboxFilters.map((option) => {
                  const isActive = filter === option.value;

                  return (
                    <Link
                      key={option.value}
                      href={getAdminFilterHref(option.value)}
                      className={`btn rounded-full px-5 ${
                        isActive ? "btn-primary" : "btn-ghost"
                      }`}
                    >
                      {option.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-base-content/75">
              {showingAllFetchedMessages
                ? `Showing ${visibleMessageCount} ${
                    visibleMessageCount === 1 ? "message" : "messages"
                  } in the ${filter} view.`
                : `Showing the latest ${visibleMessageCount} messages in the ${filter} view. Older items stay in Mongo and can be paged later if needed.`}
            </p>
          </div>

          {!inbox.available ? (
            <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
              Contact inbox data is unavailable because the database connection
              is not ready in this environment.
            </div>
          ) : inbox.messages.length === 0 ? (
            <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
              {filter === "unread"
                ? "No unread contact messages are waiting for review."
                : filter === "read"
                  ? "No contact messages have been marked as read yet."
                  : "No contact messages have been submitted yet."}
            </div>
          ) : (
            <div className="grid gap-4">
              {inbox.messages.map((message) => (
                <article
                  key={message.id}
                  className={`card-surface rounded-4xl border p-6 ${
                    message.isRead
                      ? "border-base-300/12 bg-white/40"
                      : "border-primary/18 bg-primary/6"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`badge badge-sm px-3 py-3 font-semibold uppercase tracking-[0.16em] ${
                            message.isRead ? "badge-ghost" : "badge-primary"
                          }`}
                        >
                          {message.isRead ? "Read" : "Unread"}
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                          Received {formatAdminTimestamp(message.createdAt)}
                        </span>
                        {message.readAt ? (
                          <span className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                            Reviewed {formatAdminTimestamp(message.readAt)}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <p className="section-kicker before:w-5">From</p>
                        <h3 className="display-font mt-3 text-3xl font-semibold text-base-content">
                          {message.subject}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-base-content/80">
                          {message.name} · {message.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`mailto:${message.email}?subject=${encodeURIComponent(
                          `Re: ${message.subject}`,
                        )}`}
                        className="btn btn-secondary rounded-full px-5"
                      >
                        <Mail className="size-4" />
                        Reply
                      </a>
                      <form action={updateContactMessageReadState}>
                        <input
                          type="hidden"
                          name="messageId"
                          value={message.id}
                        />
                        <input type="hidden" name="filter" value={filter} />
                        <input
                          type="hidden"
                          name="nextReadState"
                          value={message.isRead ? "unread" : "read"}
                        />
                        <ContactMessageReviewButton
                          nextReadState={message.isRead ? "unread" : "read"}
                        />
                      </form>
                      <form action={removeContactMessage}>
                        <input
                          type="hidden"
                          name="messageId"
                          value={message.id}
                        />
                        <input type="hidden" name="filter" value={filter} />
                        <ContactMessageDeleteButton />
                      </form>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-base-300/12 bg-white/55 p-4">
                    <p className="wrap-break-word whitespace-pre-wrap text-sm leading-7 text-base-content/82">
                      {message.message}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {inbox.available && inbox.totalCount > ADMIN_CONTACT_INBOX_LIMIT ? (
            <div className="rounded-3xl border border-base-300/12 bg-white/45 px-5 py-4 text-sm leading-7 text-base-content/75">
              The inbox currently shows the latest {ADMIN_CONTACT_INBOX_LIMIT}
              messages. If you want pagination, archive states, or search next,
              that can slot into this screen cleanly.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
