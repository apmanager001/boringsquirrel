import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Sora } from "next/font/google";
import { AnalyticsScript } from "@/components/analytics-script";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { absoluteUrl, siteConfig } from "@/lib/site";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.defaultAuthor }],
  creator: siteConfig.defaultAuthor,
  publisher: siteConfig.name,
  keywords: siteConfig.defaultKeywords,
  alternates: {
    canonical: "/",
  },
  category: "games",
  verification: siteConfig.googleSiteVerification
    ? {
        google: siteConfig.googleSiteVerification,
      }
    : undefined,
  icons: {
    icon: "/squirrelglasses.webp",
    apple: "/squirrelglasses.webp",
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    title: siteConfig.name,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: "en_US",
    images: [
      {
        url: absoluteUrl(siteConfig.ogImage),
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.ogImage)],
  },
};

export const viewport: Viewport = {
  themeColor: "#a7de83",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="boringsquirrel"
      data-scroll-behavior="smooth"
      className={`${sora.variable} ${fraunces.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-base-content">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
        <AnalyticsScript />
      </body>
    </html>
  );
}
