import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Flag,
  Globe,
  Inbox,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import {
  banReportedProfileUser,
  removeContactMessage,
  removeReportedBlogComment,
  updateBlogCommentReportReadState,
  updateContactMessageReadState,
  updateProfileReportReadState,
} from "@/app/admin/actions";
import { CommentReportDeleteButton } from "@/components/admin/comment-report-delete-button";
import { CommentReportReviewButton } from "@/components/admin/comment-report-review-button";
import { ContactMessageDeleteButton } from "@/components/admin/contact-message-delete-button";
import { ContactMessageReviewButton } from "@/components/admin/contact-message-review-button";
import { ProfileReportBanButton } from "@/components/admin/profile-report-ban-button";
import {
  ADMIN_BLOG_COMMENT_REPORT_LIMIT,
  getAdminBlogCommentReports,
  normalizeAdminBlogCommentReportFilter,
  type AdminBlogCommentReportFilter,
} from "@/lib/blog-comments";
import {
  getAuthSession,
  getRegisteredUserCount,
  getSessionIdentityFromUnknown,
} from "@/lib/auth";
import { getAllBlogPostsForAdmin, type BlogPostSummary } from "@/lib/blog";
import {
  ADMIN_CONTACT_INBOX_LIMIT,
  getAdminContactInbox,
  normalizeAdminContactFilter,
  type AdminContactMessageFilter,
} from "@/lib/contact";
import { hasBetterAuthConfig } from "@/lib/env";
import {
  ADMIN_PROFILE_REPORT_LIMIT,
  getAdminProfileReports,
  normalizeAdminProfileReportFilter,
  type AdminProfileReportFilter,
} from "@/lib/profile-reports";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Admin",
  description: "Admin area for Boring Squirrel.",
  path: "/admin",
  noIndex: true,
});

export const dynamic = "force-dynamic";

const adminLoginHref = `/login?callbackURL=${encodeURIComponent("/admin")}`;

const adminMessageFilters = [
  { label: "All messages", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
] as const;

const adminCommentReportFilters = [
  { label: "All reports", value: "all" },
  { label: "Open", value: "open" },
  { label: "Reviewed", value: "reviewed" },
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

type AdminPanelView = "blog" | "messages" | "reports" | "profile-reports";

type AdminSummaryCardProps = {
  title: string;
  icon: LucideIcon;
  iconClassName: string;
  items: Array<{
    label: string;
    value: string;
  }>;
};

type BlogInventoryListProps = {
  posts: BlogPostSummary[];
};

function getAdminMessageFilterHref(filter: AdminContactMessageFilter) {
  return filter === "all"
    ? "/admin?view=messages"
    : `/admin?view=messages&filter=${encodeURIComponent(filter)}`;
}

function getAdminCommentReportFilterHref(filter: AdminBlogCommentReportFilter) {
  return filter === "all"
    ? "/admin?view=reports"
    : `/admin?view=reports&filter=${encodeURIComponent(filter)}`;
}

function getAdminProfileReportFilterHref(filter: AdminProfileReportFilter) {
  return filter === "all"
    ? "/admin?view=profile-reports"
    : `/admin?view=profile-reports&filter=${encodeURIComponent(filter)}`;
}

function normalizeAdminPanelView(
  value: string | string[] | undefined,
): AdminPanelView {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (normalizedValue === "blog") {
    return "blog";
  }

  if (normalizedValue === "reports") {
    return "reports";
  }

  if (normalizedValue === "profile-reports") {
    return "profile-reports";
  }

  return "messages";
}

function getAdminViewHref(
  view: AdminPanelView,
  messageFilter: AdminContactMessageFilter,
  reportFilter: AdminBlogCommentReportFilter,
  profileReportFilter: AdminProfileReportFilter,
) {
  if (view === "blog") {
    return "/admin?view=blog";
  }

  if (view === "profile-reports") {
    return getAdminProfileReportFilterHref(profileReportFilter);
  }

  if (view === "reports") {
    return getAdminCommentReportFilterHref(reportFilter);
  }

  return getAdminMessageFilterHref(messageFilter);
}

function getAdminMessageViewLabel(filter: AdminContactMessageFilter) {
  return filter === "all" ? "inbox" : `${filter} filter`;
}

function getAdminCommentReportViewLabel(filter: AdminBlogCommentReportFilter) {
  if (filter === "all") {
    return "report queue";
  }

  return filter === "open" ? "open reports" : "reviewed reports";
}

function getAdminProfileReportViewLabel(filter: AdminProfileReportFilter) {
  if (filter === "all") {
    return "profile report queue";
  }

  return filter === "open"
    ? "open profile reports"
    : "reviewed profile reports";
}

function getAdminProfileHandleEntries(socialLinks: {
  steamHandle: string;
  discordHandle: string;
  xboxHandle: string;
  playstationHandle: string;
  twitchHandle: string;
}) {
  return [
    { label: "Steam", value: socialLinks.steamHandle },
    { label: "Discord", value: socialLinks.discordHandle },
    { label: "Xbox", value: socialLinks.xboxHandle },
    { label: "PlayStation", value: socialLinks.playstationHandle },
    { label: "Twitch", value: socialLinks.twitchHandle },
  ].filter((entry) => entry.value.length > 0);
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
  icon: Icon,
  iconClassName,
  items,
}: AdminSummaryCardProps) {
  return (
    <div className="block card-surface rounded-3xl p-4 sm:rounded-4xl sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="flex size-9 items-center justify-center rounded-2xl border border-base-300/12 bg-white/65 sm:size-11">
          <Icon className={`size-4 sm:size-5 ${iconClassName}`} />
        </span>
        <p className="section-kicker text-[10px] before:w-3 sm:text-xs sm:before:w-4">
          {title}
        </p>
      </div>
      <div className="mt-3 space-y-3 sm:mt-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-end justify-between gap-4 border-b border-base-300/10 pb-3 last:border-b-0 last:pb-0"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-base-content/50">
              {item.label}
            </span>
            <span className="display-font text-3xl font-semibold text-base-content sm:text-4xl">
              {item.value}
            </span>
          </div>
        ))}
      </div>
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
  const rawFilter =
    typeof params.filter === "string" ? params.filter : undefined;
  const messageFilter = normalizeAdminContactFilter(rawFilter);
  const reportFilter = normalizeAdminBlogCommentReportFilter(rawFilter);
  const profileReportFilter = normalizeAdminProfileReportFilter(rawFilter);
  const [
    resolvedInbox,
    resolvedBlogPosts,
    registeredUserCount,
    resolvedCommentReports,
    resolvedProfileReports,
  ] = await Promise.all([
    getAdminContactInbox(messageFilter),
    getAllBlogPostsForAdmin(),
    getRegisteredUserCount(),
    getAdminBlogCommentReports(reportFilter),
    getAdminProfileReports(profileReportFilter),
  ]);

  const livePosts = resolvedBlogPosts.filter((post) => !post.draft);
  const draftPosts = resolvedBlogPosts.filter((post) => post.draft);
  const visibleMessageCount = resolvedInbox.messages.length;
  const showingAllFetchedMessages =
    visibleMessageCount >= resolvedInbox.filteredCount;
  const visibleReportCount = resolvedCommentReports.reports.length;
  const showingAllFetchedReports =
    visibleReportCount >= resolvedCommentReports.filteredCount;
  const visibleProfileReportCount = resolvedProfileReports.reports.length;
  const showingAllFetchedProfileReports =
    visibleProfileReportCount >= resolvedProfileReports.filteredCount;
  const livePostShare =
    resolvedBlogPosts.length === 0
      ? 0
      : (livePosts.length / resolvedBlogPosts.length) * 100;
  const draftPostShare =
    resolvedBlogPosts.length === 0
      ? 0
      : (draftPosts.length / resolvedBlogPosts.length) * 100;
  const messageViewLabel = getAdminMessageViewLabel(messageFilter);
  const reportViewLabel = getAdminCommentReportViewLabel(reportFilter);
  const profileReportViewLabel =
    getAdminProfileReportViewLabel(profileReportFilter);

  return (
    <main className="page-shell py-14 sm:py-20">
      <section className="space-y-6">
        <p className="section-kicker">Admin</p>
        <div className="space-y-4">
          <h1 className="display-font text-5xl font-bold leading-[0.96] text-base-content sm:text-6xl">
            Admin Panel
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-base-content/80">
            Track what is live, what is still in draft, which contact messages
            still need a response, which blog comments were flagged for review,
            and which player profiles were reported for moderation.
          </p>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <AdminSummaryCard
          title="Posts and users"
          icon={FileText}
          iconClassName="text-base-content"
          items={[
            {
              label: "All Posts",
              value: formatAdminNumber(resolvedBlogPosts.length),
            },
            {
              label: "Users",
              value: formatAdminNumber(registeredUserCount),
            },
          ]}
        />
        <AdminSummaryCard
          title="Posts"
          icon={Globe}
          iconClassName="text-success"
          items={[
            {
              label: "Live",
              value: formatAdminNumber(livePosts.length),
            },
            {
              label: "Draft",
              value: formatAdminNumber(draftPosts.length),
            },
          ]}
        />
        <AdminSummaryCard
          title="Inbox"
          icon={Inbox}
          iconClassName="text-primary"
          items={[
            {
              label: "Total",
              value: formatAdminNumber(resolvedInbox.totalCount),
            },
            {
              label: "Unread",
              value: formatAdminNumber(resolvedInbox.unreadCount),
            },
          ]}
        />
        <AdminSummaryCard
          title="Open reports"
          icon={Flag}
          iconClassName="text-warning"
          items={[
            {
              label: "Comments",
              value: formatAdminNumber(resolvedCommentReports.openCount),
            },
            {
              label: "Profiles",
              value: formatAdminNumber(resolvedProfileReports.openCount),
            },
          ]}
        />
      </section>

      <section className="mt-6 flex flex-wrap justify-center sm:gap-3" id="admin-tabs">
        {[
          { label: "Blog inventory", value: "blog" as const, icon: FileText },
          { label: "Message review", value: "messages" as const, icon: Inbox },
          { label: "Comment reports", value: "reports" as const, icon: Flag },
          {
            label: "Profile reports",
            value: "profile-reports" as const,
            icon: UserRound,
          },
        ].map((option) => {
          const isActive = panelView === option.value;
          const Icon = option.icon;

          return (
            <Link
              key={option.value}
              href={getAdminViewHref(
                option.value,
                messageFilter,
                reportFilter,
                profileReportFilter,
              ) + `#admin-tabs`
            }
              className={`btn btn-xs sm:btn-md sm:rounded-full px-5 w-20 h-12 sm:w-auto sm:h-auto ${
                isActive ? "btn-primary" : "btn-ghost"
              }`}
            >
              <Icon className="size-4" />
              {option.label}
            </Link>
          );
        })}
      </section>

      <section className="sm:mt-6 grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
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
                {resolvedBlogPosts.length === 0
                  ? "No blog posts are indexed yet. Add an MDX post under app/blog to populate this view."
                  : `${formatAdminNumber(resolvedBlogPosts.length)} posts are currently indexed. Each row links to the public blog URL; draft rows still stay hidden from production visitors until published.`}
              </p>

              <div className="mt-6">
                <BlogInventoryList posts={resolvedBlogPosts} />
              </div>
            </div>
          ) : panelView === "messages" ? (
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
                    {adminMessageFilters.map((option) => {
                      const isActive = messageFilter === option.value;

                      return (
                        <Link
                          key={option.value}
                          href={getAdminMessageFilterHref(option.value)}
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
                  {!resolvedInbox.available
                    ? "Contact inbox data is unavailable because the database connection is not ready in this environment."
                    : showingAllFetchedMessages
                      ? `Showing all ${formatAdminNumber(resolvedInbox.filteredCount)} ${resolvedInbox.filteredCount === 1 ? "message" : "messages"} in the ${messageViewLabel}.`
                      : `Showing the latest ${formatAdminNumber(visibleMessageCount)} of ${formatAdminNumber(resolvedInbox.filteredCount)} ${resolvedInbox.filteredCount === 1 ? "message" : "messages"} in the ${messageViewLabel}.`}
                </p>
              </div>

              {!resolvedInbox.available ? (
                <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
                  Contact inbox data is unavailable because the database
                  connection is not ready in this environment.
                </div>
              ) : resolvedInbox.messages.length === 0 ? (
                <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
                  {messageFilter === "unread"
                    ? "No unread contact messages are waiting for review."
                    : messageFilter === "read"
                      ? "No contact messages have been marked as read yet."
                      : "No contact messages have been submitted yet."}
                </div>
              ) : (
                <div className="grid gap-4">
                  {resolvedInbox.messages.map((message) => (
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
                            <input
                              type="hidden"
                              name="filter"
                              value={messageFilter}
                            />
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
                            <input
                              type="hidden"
                              name="filter"
                              value={messageFilter}
                            />
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

              {resolvedInbox.available &&
              resolvedInbox.filteredCount > ADMIN_CONTACT_INBOX_LIMIT ? (
                <div className="rounded-3xl border border-base-300/12 bg-white/45 px-5 py-4 text-sm leading-7 text-base-content/75">
                  The {messageViewLabel} currently shows the latest{" "}
                  {ADMIN_CONTACT_INBOX_LIMIT} of{" "}
                  {formatAdminNumber(resolvedInbox.filteredCount)} messages. If
                  you want pagination, archive states, or search next, that can
                  slot into this screen cleanly.
                </div>
              ) : null}
            </>
          ) : panelView === "profile-reports" ? (
            <>
              <div className="card-surface rounded-4xl p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="section-kicker before:w-5">
                      Profile moderation
                    </p>
                    <h2 className="display-font mt-3 text-3xl font-semibold">
                      Reported profiles
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {adminCommentReportFilters.map((option) => {
                      const isActive = profileReportFilter === option.value;

                      return (
                        <Link
                          key={option.value}
                          href={getAdminProfileReportFilterHref(option.value)}
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
                  {!resolvedProfileReports.available
                    ? "Profile report data is unavailable because the database connection is not ready in this environment."
                    : showingAllFetchedProfileReports
                      ? `Showing all ${formatAdminNumber(resolvedProfileReports.filteredCount)} ${resolvedProfileReports.filteredCount === 1 ? "report" : "reports"} in the ${profileReportViewLabel}.`
                      : `Showing the latest ${formatAdminNumber(visibleProfileReportCount)} of ${formatAdminNumber(resolvedProfileReports.filteredCount)} ${resolvedProfileReports.filteredCount === 1 ? "report" : "reports"} in the ${profileReportViewLabel}.`}
                </p>
              </div>

              {!resolvedProfileReports.available ? (
                <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
                  Profile report data is unavailable because the database
                  connection is not ready in this environment.
                </div>
              ) : resolvedProfileReports.reports.length === 0 ? (
                <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
                  {profileReportFilter === "open"
                    ? "No open profile reports are waiting for review."
                    : profileReportFilter === "reviewed"
                      ? "No profile reports have been marked as reviewed yet."
                      : "No public profiles have been reported yet."}
                </div>
              ) : (
                <div className="grid gap-4">
                  {resolvedProfileReports.reports.map((report) => {
                    const reportedUserLabel =
                      report.reportedDisplayName.toLowerCase() !==
                      report.reportedUsername.toLowerCase()
                        ? `${report.reportedDisplayName} (@${report.reportedUsername})`
                        : `@${report.reportedUsername}`;
                    const reporterLabel =
                      report.reporterDisplayName.toLowerCase() !==
                      report.reporterUsername.toLowerCase()
                        ? `${report.reporterDisplayName} (@${report.reporterUsername})`
                        : `@${report.reporterUsername}`;
                    const handleEntries = getAdminProfileHandleEntries(
                      report.reportedSocialLinks,
                    );
                    const profileHref = `/profile/${encodeURIComponent(report.reportedUserId)}`;

                    return (
                      <article
                        key={report.id}
                        className={`card-surface rounded-4xl border p-6 ${
                          report.isRead
                            ? "border-base-300/12 bg-white/40"
                            : "border-warning/18 bg-warning/6"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <span
                                className={`badge badge-sm px-3 py-3 font-semibold uppercase tracking-[0.16em] ${
                                  report.isRead
                                    ? "badge-ghost"
                                    : "badge-warning"
                                }`}
                              >
                                {report.isRead ? "Reviewed" : "Open"}
                              </span>
                              <span className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                                Reported{" "}
                                {formatAdminTimestamp(report.createdAt)}
                              </span>
                              {report.readAt ? (
                                <span className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                                  Reviewed {formatAdminTimestamp(report.readAt)}
                                </span>
                              ) : null}
                            </div>

                            <div>
                              <p className="section-kicker before:w-5">
                                Profile
                              </p>
                              <h3 className="display-font mt-3 text-3xl font-semibold text-base-content">
                                {reportedUserLabel}
                              </h3>
                              <p className="mt-2 text-sm leading-7 text-base-content/80">
                                {report.reportedUserExists
                                  ? report.reportedUserIsBanned
                                    ? "Account is already banned and public content is hidden."
                                    : "Live profile currently visible at "
                                  : "Account no longer exists in auth storage."}
                                {report.reportedUserExists &&
                                !report.reportedUserIsBanned ? (
                                  <Link
                                    href={profileHref}
                                    className="font-semibold text-primary hover:text-primary/80"
                                  >
                                    {profileHref}
                                  </Link>
                                ) : null}
                              </p>
                              <p className="mt-1 text-sm leading-7 text-base-content/72">
                                Reported by {reporterLabel}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {report.reportedUserExists &&
                            !report.reportedUserIsBanned ? (
                              <Link
                                href={profileHref}
                                className="btn btn-secondary rounded-full px-5"
                              >
                                <UserRound className="size-4" />
                                View profile
                              </Link>
                            ) : (
                              <span className="btn btn-ghost rounded-full px-5">
                                <UserRound className="size-4" />
                                Profile hidden
                              </span>
                            )}
                            <form action={updateProfileReportReadState}>
                              <input
                                type="hidden"
                                name="reportId"
                                value={report.id}
                              />
                              <input
                                type="hidden"
                                name="filter"
                                value={profileReportFilter}
                              />
                              <input
                                type="hidden"
                                name="nextReadState"
                                value={report.isRead ? "open" : "reviewed"}
                              />
                              <CommentReportReviewButton
                                nextReadState={
                                  report.isRead ? "open" : "reviewed"
                                }
                              />
                            </form>
                            <form action={banReportedProfileUser}>
                              <input
                                type="hidden"
                                name="reportedUserId"
                                value={report.reportedUserId}
                              />
                              <input
                                type="hidden"
                                name="filter"
                                value={profileReportFilter}
                              />
                              <ProfileReportBanButton
                                alreadyBanned={report.reportedUserIsBanned}
                              />
                            </form>
                          </div>
                        </div>

                        <div className="mt-5 rounded-3xl border border-base-300/12 bg-white/55 p-4">
                          <div className="space-y-3 text-sm leading-7 text-base-content/82">
                            <div className="flex items-center justify-between gap-4">
                              <span>Username</span>
                              <span className="font-semibold text-base-content">
                                {report.reportedUsername}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span>Display name</span>
                              <span className="font-semibold text-base-content">
                                {report.reportedDisplayName}
                              </span>
                            </div>
                            {handleEntries.length === 0 ? (
                              <p className="text-base-content/72">
                                No shared social handles were saved when this
                                report was submitted.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {handleEntries.map((entry) => (
                                  <span
                                    key={entry.label}
                                    className="rounded-full border border-base-300/15 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-base-content/72"
                                  >
                                    {entry.label}: {entry.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {resolvedProfileReports.available &&
              resolvedProfileReports.filteredCount >
                ADMIN_PROFILE_REPORT_LIMIT ? (
                <div className="rounded-3xl border border-base-300/12 bg-white/45 px-5 py-4 text-sm leading-7 text-base-content/75">
                  The {profileReportViewLabel} currently shows the latest{" "}
                  {ADMIN_PROFILE_REPORT_LIMIT} of{" "}
                  {formatAdminNumber(resolvedProfileReports.filteredCount)}{" "}
                  reports. If you want pagination or moderator notes next, that
                  can slot into this screen cleanly.
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="card-surface rounded-4xl p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="section-kicker before:w-5">
                      Comment moderation
                    </p>
                    <h2 className="display-font mt-3 text-3xl font-semibold">
                      Reported comments
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {adminCommentReportFilters.map((option) => {
                      const isActive = reportFilter === option.value;

                      return (
                        <Link
                          key={option.value}
                          href={getAdminCommentReportFilterHref(option.value)}
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
                  {!resolvedCommentReports.available
                    ? "Comment report data is unavailable because the database connection is not ready in this environment."
                    : showingAllFetchedReports
                      ? `Showing all ${formatAdminNumber(resolvedCommentReports.filteredCount)} ${resolvedCommentReports.filteredCount === 1 ? "report" : "reports"} in the ${reportViewLabel}.`
                      : `Showing the latest ${formatAdminNumber(visibleReportCount)} of ${formatAdminNumber(resolvedCommentReports.filteredCount)} ${resolvedCommentReports.filteredCount === 1 ? "report" : "reports"} in the ${reportViewLabel}.`}
                </p>
              </div>

              {!resolvedCommentReports.available ? (
                <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
                  Comment report data is unavailable because the database
                  connection is not ready in this environment.
                </div>
              ) : resolvedCommentReports.reports.length === 0 ? (
                <div className="card-surface rounded-4xl p-6 text-sm leading-7 text-base-content/78">
                  {reportFilter === "open"
                    ? "No open comment reports are waiting for review."
                    : reportFilter === "reviewed"
                      ? "No comment reports have been marked as reviewed yet."
                      : "No blog comments have been reported yet."}
                </div>
              ) : (
                <div className="grid gap-4">
                  {resolvedCommentReports.reports.map((report) => {
                    const commentAuthorLabel =
                      report.commentAuthorDisplayName.toLowerCase() !==
                      report.commentAuthorUsername.toLowerCase()
                        ? `${report.commentAuthorDisplayName} (@${report.commentAuthorUsername})`
                        : `@${report.commentAuthorUsername}`;
                    const reporterLabel =
                      report.reporterDisplayName.toLowerCase() !==
                      report.reporterUsername.toLowerCase()
                        ? `${report.reporterDisplayName} (@${report.reporterUsername})`
                        : `@${report.reporterUsername}`;
                    const commentHref = report.commentExists
                      ? `/blog/${report.slug}#comment-${report.commentId}`
                      : `/blog/${report.slug}`;

                    return (
                      <article
                        key={report.id}
                        className={`card-surface rounded-4xl border p-6 ${
                          report.isRead
                            ? "border-base-300/12 bg-white/40"
                            : "border-warning/18 bg-warning/6"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <span
                                className={`badge badge-sm px-3 py-3 font-semibold uppercase tracking-[0.16em] ${
                                  report.isRead
                                    ? "badge-ghost"
                                    : "badge-warning"
                                }`}
                              >
                                {report.isRead ? "Reviewed" : "Open"}
                              </span>
                              <span className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                                Reported{" "}
                                {formatAdminTimestamp(report.createdAt)}
                              </span>
                              {report.readAt ? (
                                <span className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                                  Reviewed {formatAdminTimestamp(report.readAt)}
                                </span>
                              ) : null}
                            </div>

                            <div>
                              <p className="section-kicker before:w-5">
                                Comment
                              </p>
                              <h3 className="display-font mt-3 text-3xl font-semibold text-base-content">
                                {commentAuthorLabel}
                              </h3>
                              <p className="mt-2 text-sm leading-7 text-base-content/80">
                                {report.commentExists
                                  ? "Live comment on "
                                  : "Comment was removed from "}
                                <Link
                                  href={commentHref}
                                  className="font-semibold text-primary hover:text-primary/80"
                                >
                                  {`/blog/${report.slug}`}
                                </Link>
                              </p>
                              <p className="mt-1 text-sm leading-7 text-base-content/72">
                                Reported by {reporterLabel}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Link
                              href={commentHref}
                              className="btn btn-secondary rounded-full px-5"
                            >
                              <Flag className="size-4" />
                              {report.commentExists
                                ? "View comment"
                                : "View post"}
                            </Link>
                            <form action={updateBlogCommentReportReadState}>
                              <input
                                type="hidden"
                                name="reportId"
                                value={report.id}
                              />
                              <input
                                type="hidden"
                                name="filter"
                                value={reportFilter}
                              />
                              <input
                                type="hidden"
                                name="nextReadState"
                                value={report.isRead ? "open" : "reviewed"}
                              />
                              <CommentReportReviewButton
                                nextReadState={
                                  report.isRead ? "open" : "reviewed"
                                }
                              />
                            </form>
                            <form action={removeReportedBlogComment}>
                              <input
                                type="hidden"
                                name="commentId"
                                value={report.commentId}
                              />
                              <input
                                type="hidden"
                                name="commentSlug"
                                value={report.slug}
                              />
                              <input
                                type="hidden"
                                name="filter"
                                value={reportFilter}
                              />
                              <CommentReportDeleteButton
                                commentExists={report.commentExists}
                              />
                            </form>
                          </div>
                        </div>

                        <div className="mt-5 rounded-3xl border border-base-300/12 bg-white/55 p-4">
                          <p className="wrap-break-word whitespace-pre-wrap text-sm leading-7 text-base-content/82">
                            {report.commentBody}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {resolvedCommentReports.available &&
              resolvedCommentReports.filteredCount >
                ADMIN_BLOG_COMMENT_REPORT_LIMIT ? (
                <div className="rounded-3xl border border-base-300/12 bg-white/45 px-5 py-4 text-sm leading-7 text-base-content/75">
                  The {reportViewLabel} currently shows the latest{" "}
                  {ADMIN_BLOG_COMMENT_REPORT_LIMIT} of{" "}
                  {formatAdminNumber(resolvedCommentReports.filteredCount)}{" "}
                  reports. If you want pagination or moderator notes next, that
                  can slot into this screen cleanly.
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
