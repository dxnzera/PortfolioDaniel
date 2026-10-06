import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: [
    { path: "../public/fonts/manrope-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/manrope-semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Daniel Mendes — Desenvolvedor front-end & designer",
  description: "Conheça Daniel Mendes, desenvolvedor front-end e designer, e seus projetos web e mobile.",
  openGraph: {
    title: "Daniel Mendes — Desenvolvedor front-end & designer",
    description: "Conheça Daniel Mendes e seus projetos de desenvolvimento e design.",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = { themeColor: "#080809" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
