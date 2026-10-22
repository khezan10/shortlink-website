import type { Metadata } from "next";
import { DotGothic16, Space_Mono } from "next/font/google";
import "./globals.css";

const display = DotGothic16({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const mono = Space_Mono({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "mzg.my.id — Free Link Shortener",
  description:
    "Shorten links for free at mzg.my.id. Dead destinations are removed automatically.",
  openGraph: {
    title: "mzg.my.id — Free Link Shortener",
    description:
      "Shorten links for free. Dead destinations are removed automatically.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
