import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthGate } from "@/features/auth/components/AuthGate";
import "./globals.css";

const themeBootScript = `(function(){try{var t=localStorage.getItem('depthloop-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "DepthLoop";
  const description = "Conecta la información de tu empresa, confirma su significado y trabaja con una visión compartida.";
  return {
    metadataBase: base,
    title,
    description,
    icons: { icon: "/depthloop-icon-v2.png", shortcut: "/depthloop-icon-v2.png", apple: "/depthloop-icon-v2.png" },
    openGraph: { title, description, type: "website", images: [{ url: "/og.png", width: 1734, height: 907, alt: "DepthLoop Map" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
