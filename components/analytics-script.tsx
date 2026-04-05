import Script from "next/script";
import { env } from "@/lib/env";

export function AnalyticsScript() {
  if (!env.gaId) {
    return null;
  }

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${env.gaId}`}
      />
      <Script id="google-analytics">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${env.gaId}');`}
      </Script>
    </>
  );
}
