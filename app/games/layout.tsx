import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { GameInfoDrawerProvider } from "@/components/games/game-info-drawer";

type GamesLayoutProps = {
  children: ReactNode;
};

export default function GamesLayout({ children }: GamesLayoutProps) {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 5000,
          className: "site-toast",
          style: {
            border: "2px solid rgba(15,23,42,0.12)",
            padding: "18px 22px",
            color: "#0f172a",
            background: "#fff7ed",
            fontSize: "15px",
            fontWeight: 700,
            borderRadius: "12px",
            boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
            maxWidth: "100%",
          },
          success: {
            style: {
              background: "#D1FADF",
              color: "#065F46",
              borderColor: "#10B981",
            },
          },
          error: {
            style: {
              background: "#FFE7E7",
              color: "#991B1B",
              borderColor: "#EF4444",
            },
          },
        }}
      />
      <GameInfoDrawerProvider>{children}</GameInfoDrawerProvider>
    </>
  );
}
