import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Globe,
  Inbox,
  Mail,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";
import {
  removeContactMessage,
  updateContactMessageReadState,
} from "@/app/admin/actions";
import { ContactMessageDeleteButton } from "@/components/admin/contact-message-delete-button";
import { ContactMessageReviewButton } from "@/components/admin/contact-message-review-button";
import { getAuthSession, getSessionIdentityFromUnknown } from "@/lib/auth";
import { getAllBlogPostsForAdmin, type BlogPostSummary } from "@/lib/blog";
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

const adminDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

const adminNumberFormatter = new Intl.NumberFormat("en-US");

type AdminPageProps = {
  searchParams: Promise<{
    filter?: string | string[];
    view?: string | string[];
  }>;
};

type AdminPanelView = "blog" | "messages";

type AdminSummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

type BlogInventoryListProps = {
  posts: BlogPostSummary[];
};

function getAdminFilterHref(filter: AdminContactMessageFilter) {
  return filter === "all"
    ? "/admin?view=messages"
    : `/admin?view=messages&filter=${encodeURIComponent(filter)}`;
}

function normalizeAdminPanelView(
  value: string | string[] | undefined,
): AdminPanelView {
  return (Array.isArray(value) ? value[0] : value) === "blog"
    ? "blog"
    : "messages";
}

function getAdminViewHref(
  view: AdminPanelView,
  filter: AdminContactMessageFilter,
) {
  if (view === "blog") {
    return "/admin?view=blog";
  }

  return getAdminFilterHref(filter);
}

function getAdminMessageViewLabel(filter: AdminContactMessageFilter) {
  return filter === "all" ? "inbox" : `${filter} filter`;
}

function formatAdminDate(input: string) {
  return adminDateFormatter.format(new Date(input));
}

function formatAdminTimestamp(input: string) {
  return adminTimestampFormatter.format(new Date(input));
}

function formatAdminNumber(value: number) {
  return adminNumberFormatter.format(value);
}

function AdminSummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: AdminSummaryCardProps) {
  return (
    <div className="block card-surface rounded-3xl p-4 sm:rounded-4xl sm:p-5">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="flex size-9 items-center justify-center rounded-2xl border border-base-300/12 bg-white/65 sm:size-11">
          <Icon className={`size-4 sm:size-5 ${iconClassName}`} />
        </span>
        <p className="section-kicker text-[10px] before:w-3 sm:text-xs sm:before:w-4">
          {title}
        </p>
      </div>
      <p className="display-font mt-3 text-3xl font-semibold text-base-content sm:mt-4 sm:text-4xl">
        {value}
      </p>
      <p className="mt-3 hidden text-sm leading-7 text-base-content/75 sm:block">
        {description}
      </p>
    </div>
  );
}

function BlogInventoryList({ posts }: BlogInventoryListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-base-300/12 bg-white/45 px-5 py-4 text-sm leading-7 text-base-content/75">
        No blog posts are indexed yet. Add an MDX post under app/blog to
        populate this view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-4xl border border-base-300/12 bg-white/50">
      <div className="hidden border-b border-base-300/12 bg-white/65 px-5 py-4 md:grid md:grid-cols-[7rem_minmax(0,1.8fr)_9rem_9rem_6rem_6rem] md:items-center md:gap-4">
        <p className="section-kicker before:w-4">Status</p>
        <p className="section-kicker before:w-4">Post</p>
        <p className="section-kicker before:w-4">Published</p>
        <p className="section-kicker before:w-4">Updated</p>
        <p className="section-kicker before:w-4">Views</p>
        <p className="section-kicker before:w-4">Likes</p>
      </div>

      <div className="divide-y divide-base-300/12">
        {posts.map((post) => {
          const isDraft = post.draft;
          const badgeClassName = isDraft ? "badge-warning" : "badge-success";

          return (
            <Link
              key={post.slug}
              href={post.canonicalPath}
              className={`block px-5 py-4 transition hover:bg-base-200/30 ${
                isDraft
                  ? "focus:bg-warning/8 hover:bg-warning/6"
                  : "focus:bg-success/8 hover:bg-success/5"
              }`}
            >
              <div className="grid gap-4 md:grid-cols-[7rem_minmax(0,1.8fr)_9rem_9rem_6rem_6rem] md:items-center">
                <div className="text-center">
                  <span
                    className={`badge badge-sm px-3 py-3 font-semibold uppercase tracking-[0.16em] ${badgeClassName}`}
                  >
                    {isDraft ? "Draft" : "Live"}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="display-font truncate text-2xl font-semibold text-base-content ">
                    {post.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm leading-6 text-base-content/72">
                    <span className="truncate">{post.canonicalPath}</span>
                    <span className="hidden text-base-content/35 sm:inline">
                      •
                    </span>
                    <span>{post.category}</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm leading-7 text-base-content/78">
                    {formatAdminDate(post.date)}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm leading-7 text-base-content/78">
                    {formatAdminDate(post.updated)}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm leading-7 text-base-content/78">
                    {formatAdminNumber(post.viewCount)}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm leading-7 text-base-content/78">
                    {formatAdminNumber(post.likeCount)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
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
  }

  const params = await searchParams;
  const panelView = normalizeAdminPanelView(params.view);
  const filter = normalizeAdminContactFilter(
    typeof params.filter === "string" ? params.filter : undefined,
  );
  const [inbox, blogPosts] = await Promise.all([
    getAdminContactInbox(filter),
    getAllBlogPostsForAdmin(),
  ]);

  const livePosts = blogPosts.filter((post) => !post.draft);
  const draftPosts = blogPosts.filter((post) => post.draft);
  const visibleMessageCount = inbox.messages.length;
  const showingAllFetchedMessages = visibleMessageCount >= inbox.filteredCount;
  const livePostShare =
    blogPosts.length === 0 ? 0 : (livePosts.length / blogPosts.length) * 100;
  const draftPostShare =
    blogPosts.length === 0 ? 0 : (draftPosts.length / blogPosts.length) * 100;
  const messageViewLabel = getAdminMessageViewLabel(filter);

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="space-y-6">
        <p className="section-kicker">Admin</p>
        <div className="space-y-4">
          <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
            Admin Panel
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-base-content/80">
            Track what is live, what is still in draft, and which contact
            messages still need a response.
          </p>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        <AdminSummaryCard
          title="Total posts"
          value={formatAdminNumber(blogPosts.length)}
          description="Every MDX blog entry currently indexed in the app."
          icon={FileText}
          iconClassName="text-base-content"
        />
        <AdminSummaryCard
          title="Live posts"
          value={formatAdminNumber(livePosts.length)}
          description="Public posts that ship to production routes and feeds."
          icon={Globe}
          iconClassName="text-success"
        />
        <AdminSummaryCard
          title="Draft posts"
          value={formatAdminNumber(draftPosts.length)}
          description="Private posts still waiting for the draft flag to be removed."
          icon={PenLine}
          iconClassName="text-warning"
        />
        <AdminSummaryCard
          title="Inbox total"
          value={formatAdminNumber(inbox.totalCount)}
          description={
            inbox.available
              ? "Stored contact submissions currently in MongoDB."
              : "Inbox data is unavailable in this environment."
          }
          icon={Inbox}
          iconClassName="text-primary"
        />
        <AdminSummaryCard
          title="Unread"
          value={formatAdminNumber(inbox.unreadCount)}
          description="Messages that still have not been reviewed."
          icon={Mail}
          iconClassName="text-secondary"
        />
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        {[
          { label: "Blog inventory", value: "blog" as const, icon: FileText },
          { label: "Message review", value: "messages" as const, icon: Inbox },
        ].map((option) => {
          const isActive = panelView === option.value;
          const Icon = option.icon;

          return (
            <Link
              key={option.value}
              href={getAdminViewHref(option.value, filter)}
              className={`btn rounded-full px-5 ${
                isActive ? "btn-primary" : "btn-ghost"
              }`}
            >
              <Icon className="size-4" />
              {option.label}
            </Link>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <div className="hidden lg:block card-surface rounded-4xl p-6">
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

          <div className="hidden lg:block card-surface rounded-4xl p-6">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-base-content" />
              <h2 className="display-font text-2xl font-semibold">
                Publishing split
              </h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-base-content/78">
              Live posts are public in production. Drafts stay visible here so
              you can audit the publishing queue without changing the public
              blog behavior.
            </p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-base-content/78">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span>Live</span>
                  <span className="font-semibold text-base-content">
                    {formatAdminNumber(livePosts.length)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-base-300/12">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${livePostShare}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span>Draft</span>
                  <span className="font-semibold text-base-content">
                    {formatAdminNumber(draftPosts.length)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-base-300/12">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: `${draftPostShare}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {panelView === "blog" ? (
            <div className="card-surface rounded-4xl p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="section-kicker before:w-5">
                    Publishing overview
                  </p>
                  <h2 className="display-font mt-3 text-3xl font-semibold">
                    Blog inventory
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-base-content/72">
                  <span className="rounded-full border border-success/15 bg-success/8 px-4 py-2">
                    {formatAdminNumber(livePosts.length)} live
                  </span>
                  <span className="rounded-full border border-warning/18 bg-warning/8 px-4 py-2">
                    {formatAdminNumber(draftPosts.length)} draft
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-base-content/75">
                {blogPosts.length === 0
                  ? "No blog posts are indexed yet. Add an MDX post under app/blog to populate this view."
                  : `${formatAdminNumber(blogPosts.length)} posts are currently indexed. Each row links to the public blog URL; draft rows still stay hidden from production visitors until published.`}
              </p>

              <div className="mt-6">
                <BlogInventoryList posts={blogPosts} />
              </div>
            </div>
          ) : (
            <>
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
                  {!inbox.available
                    ? "Contact inbox data is unavailable because the database connection is not ready in this environment."
                    : showingAllFetchedMessages
                      ? `Showing all ${formatAdminNumber(inbox.filteredCount)} ${inbox.filteredCount === 1 ? "message" : "messages"} in the ${messageViewLabel}.`
                      : `Showing the latest ${formatAdminNumber(visibleMessageCount)} of ${formatAdminNumber(inbox.filteredCount)} ${inbox.filteredCount === 1 ? "message" : "messages"} in the ${messageViewLabel}.`}
                </p>
              </div>

              {!inbox.available ? (
                <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
                  Contact inbox data is unavailable because the database
                  connection is not ready in this environment.
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

              {inbox.available &&
              inbox.filteredCount > ADMIN_CONTACT_INBOX_LIMIT ? (
                <div className="rounded-3xl border border-base-300/12 bg-white/45 px-5 py-4 text-sm leading-7 text-base-content/75">
                  The {messageViewLabel} currently shows the latest{" "}
                  {ADMIN_CONTACT_INBOX_LIMIT} of{" "}
                  {formatAdminNumber(inbox.filteredCount)} messages. If you want
                  pagination, archive states, or search next, that can slot into
                  this screen cleanly.
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
