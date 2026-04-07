"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleUserRound,
  ExternalLink,
  Gamepad2,
  House,
  LogOut,
  Mail,
  Menu,
  NotebookText,
  ShieldUser,
  Trophy,
  UserRoundPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { authClient, type AuthSession } from "@/lib/auth-client";

type NavLink = {
  label: string;
  href: string;
};

type MobileSiteDockProps = {
  siteName: string;
  logoPath: string;
  authEnabled: boolean;
  dockItems: readonly NavLink[];
  menuItems: readonly NavLink[];
};

type MobileSiteDockFrameProps = MobileSiteDockProps & {
  session?: AuthSession | null;
  sessionPending?: boolean;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isAccountPath(pathname: string) {
  return ["/login", "/register", "/settings", "/profile", "/verify-email"].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

function getNavIcon(href: string): LucideIcon {
  if (href === "/contact") {
    return Mail;
  }

  if (href === "/games") {
    return Gamepad2;
  }

  if (href === "/leaderboard") {
    return Trophy;
  }

  if (href === "/blog" || href === "/blog/recent") {
    return NotebookText;
  }

  if (href === "/register") {
    return UserRoundPlus;
  }

  return House;
}

function DockLink({
  href,
  label,
  active,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-w-0 flex-col items-center gap-1 rounded-[1.35rem] px-2 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.18em] ${
        active
          ? "bg-neutral text-neutral-content shadow-lg shadow-base-300/20"
          : "text-base-content/76 hover:bg-white/60"
      }`}
    >
      <Icon className="size-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function AuthenticatedMobileSiteDock(props: MobileSiteDockProps) {
  const { data: session, isPending } = authClient.useSession();

  return (
    <MobileSiteDockFrame
      {...props}
      session={session}
      sessionPending={isPending}
    />
  );
}

function MobileSiteDockFrame({
  siteName,
  logoPath,
  authEnabled,
  dockItems,
  menuItems,
  session,
  sessionPending = false,
}: MobileSiteDockFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signOutPending, startSignOutTransition] = useTransition();
  const closeDrawer = useEffectEvent(() => {
    setDrawerOpen(false);
  });

  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  const userLabel =
    session?.user && "displayUsername" in session.user
      ? String(session.user.displayUsername || session.user.name || "Account")
      : session?.user?.name || "Account";

  const accountLabel = session?.user ? "Account" : "Login";
  const accountHref = session?.user ? "/settings" : "/login";
  const profileHref =
    typeof session?.user?.id === "string" && session.user.id.length > 0
      ? `/profile/${session.user.id}`
      : null;

  async function handleSignOut() {
    startSignOutTransition(async () => {
      await authClient.signOut();
      setDrawerOpen(false);
      router.push("/");
      router.refresh();
    });
  }
  const identity = session?.user;
  console.log(identity)

  return (
    <>
      {drawerOpen ? (
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-neutral/35 backdrop-blur-sm transition-opacity duration-200 lg:hidden"
          aria-label="Close menu"
        />
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">
        <div className="page-shell pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {drawerOpen ? (
            <div className="mb-3 max-h-[70vh] overflow-y-auto rounded-4xl border border-white/10 bg-neutral/92 p-5 text-neutral-content shadow-[0_28px_80px_rgba(12,18,10,0.42)] backdrop-blur-2xl transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-content/55">
                    More links
                  </p>
                  <h2 className="display-font mt-2 text-2xl font-semibold">
                    {siteName}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-content/72">
                    Check out your stash.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/12 bg-white/6 text-neutral-content/78 hover:bg-white/12 hover:text-neutral-content"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                {menuItems.map((item) => {
                  const Icon = getNavIcon(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between rounded-[1.35rem] border px-4 py-3 text-sm font-medium transition ${
                        isActivePath(pathname, item.href)
                          ? "border-white/16 bg-white/12 text-neutral-content"
                          : "border-white/10 bg-white/4 text-neutral-content/82 hover:border-white/16 hover:bg-white/10 hover:text-neutral-content"
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                      <span className="text-neutral-content/45">
                        <ExternalLink className="size-4" />
                      </span>
                    </Link>
                  );
                })}
                {identity?.role === "admin" && (
                  <Link
                    key='admin'
                    href='/admin'
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center justify-between rounded-[1.35rem] border px-4 py-3 text-sm font-medium transition border-white/10 bg-white/4 text-neutral-content/82 hover:border-white/16 hover:bg-white/10 hover:text-neutral-content"
                    }`}
                  >
                    <span className="inline-flex items-center gap-3">
                      <ShieldUser className="size-4" />
                      Admin
                    </span>
                    <span className="text-neutral-content/45">
                      <ExternalLink className="size-4" />
                    </span>
                  </Link>
                  )}
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-neutral-content/55">
                  Account
                </p>
                <p className="mt-2 text-sm text-neutral-content/75">
                  {session?.user
                    ? `Signed in as ${userLabel}.`
                    : authEnabled
                      ? "Create an account to save scores and react to posts."
                      : "Authentication links stay available here while env setup is still incomplete."}
                </p>

                {session?.user ? (
                  <div className="mt-4 grid gap-3">
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        onClick={() => setDrawerOpen(false)}
                        className="inline-flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/4 px-4 py-3 text-sm font-medium text-neutral-content/82 hover:border-white/16 hover:bg-white/10 hover:text-neutral-content"
                      >
                        <CircleUserRound className="size-4" />
                        Your Profile
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signOutPending}
                      className="inline-flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/4 px-4 py-3 text-left text-sm font-medium text-neutral-content/82 hover:border-white/16 hover:bg-white/10 hover:text-neutral-content disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <LogOut className="size-4" />
                      {signOutPending ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    <Link
                      href="/register"
                      onClick={() => setDrawerOpen(false)}
                      className="inline-flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/4 px-4 py-3 text-sm font-medium text-neutral-content/82 hover:border-white/16 hover:bg-white/10 hover:text-neutral-content"
                    >
                      <UserRoundPlus className="size-4" />
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-[1fr_1fr_auto_1fr_1fr] items-end gap-1 rounded-4xl border border-base-300/18 bg-white/74 p-2 shadow-[0_20px_55px_rgba(15,25,12,0.24)] backdrop-blur-2xl">
            {dockItems.map((item) => (
              <DockLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActivePath(pathname, item.href)}
                icon={getNavIcon(item.href)}
              />
            ))}

            <Link
              href="/"
              className="flex flex-col items-center gap-1 px-1 pb-1"
              aria-label={`${siteName} home`}
            >
              <span
                className={`relative flex size-14 items-center justify-center overflow-hidden rounded-[1.35rem] border shadow-lg transition ${
                  isActivePath(pathname, "/")
                    ? "border-base-300/30 bg-white"
                    : "border-base-300/18 bg-white/82"
                }`}
              >
                <Image
                  src={logoPath}
                  alt={`${siteName} logo`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
              <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-base-content/78">
                Home
              </span>
            </Link>

            <DockLink
              href={accountHref}
              label={sessionPending ? "Account" : accountLabel}
              active={isAccountPath(pathname)}
              icon={CircleUserRound}
            />

            <button
              type="button"
              onClick={() => setDrawerOpen((open) => !open)}
              aria-expanded={drawerOpen}
              aria-label="Open menu"
              className={`flex min-w-0 flex-col items-center gap-1 rounded-[1.35rem] px-2 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.18em] ${
                drawerOpen
                  ? "bg-neutral text-neutral-content shadow-lg shadow-base-300/20"
                  : "text-base-content/76 hover:bg-white/60"
              }`}
            >
              <Menu className="size-5 shrink-0" />
              <span className="truncate">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function MobileSiteDock(props: MobileSiteDockProps) {
  if (!props.authEnabled) {
    return <MobileSiteDockFrame {...props} />;
  }

  return <AuthenticatedMobileSiteDock {...props} />;
}
