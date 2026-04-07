"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";

type GameInfoDrawerPayload = {
  title?: string;
  content: ReactNode;
};

type GameInfoDrawerContextValue = {
  isOpen: boolean;
  openDrawer: (payload: GameInfoDrawerPayload) => void;
  closeDrawer: () => void;
};

type GameInfoDrawerProviderProps = {
  children: ReactNode;
};

type DrawerState = {
  isOpen: boolean;
  pathname: string | null;
  title: string;
  content: ReactNode;
};

const initialDrawerState: DrawerState = {
  isOpen: false,
  pathname: null,
  title: "Game info",
  content: null,
};

const GameInfoDrawerContext = createContext<GameInfoDrawerContextValue | null>(
  null,
);

export function GameInfoDrawerProvider({
  children,
}: GameInfoDrawerProviderProps) {
  const pathname = usePathname();
  const [drawerState, setDrawerState] =
    useState<DrawerState>(initialDrawerState);
  const isDrawerOpen = drawerState.isOpen && drawerState.pathname === pathname;

  const closeDrawer = useCallback(() => {
    setDrawerState((current) =>
      current.isOpen ? { ...current, isOpen: false } : current,
    );
  }, []);

  const openDrawer = useCallback(
    (payload: GameInfoDrawerPayload) => {
      setDrawerState({
        isOpen: true,
        pathname,
        title: payload.title ?? "Game info",
        content: payload.content,
      });
    },
    [pathname],
  );

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerState((current) => ({ ...current, isOpen: false }));
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <GameInfoDrawerContext.Provider
      value={{
        isOpen: isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}

      {isDrawerOpen ? (
        <>
          <button
            type="button"
            onClick={closeDrawer}
            className="fixed inset-0 z-70 bg-neutral/35 backdrop-blur-sm transition-opacity duration-200"
            aria-label="Close game information"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={drawerState.title}
            className="fixed inset-y-0 right-0 z-80 flex w-4/5 max-w-md flex-col border-l border-base-300/14 bg-base-100/96 shadow-[0_28px_80px_rgba(15,25,12,0.28)] backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-base-300/12 px-5 py-5 sm:px-6">
              <div>
                <p className="section-kicker before:w-4">Game drawer</p>
                <h2 className="display-font mt-3 text-3xl font-semibold text-base-content">
                  {drawerState.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex size-11 items-center justify-center rounded-full border border-base-300/16 bg-white/70 text-base-content/78 hover:bg-white hover:text-base-content"
                aria-label="Close game information"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="space-y-4 text-sm leading-7 text-base-content/78">
                {drawerState.content}
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </GameInfoDrawerContext.Provider>
  );
}

export function useGameInfoDrawer() {
  const context = useContext(GameInfoDrawerContext);

  if (!context) {
    throw new Error(
      "useGameInfoDrawer must be used within a GameInfoDrawerProvider.",
    );
  }

  return context;
}
