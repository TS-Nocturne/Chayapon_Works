import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/lib/cart-context";
import { DEFAULT_DESCRIPTION, getSiteUrl, SITE_NAME } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Chayapon Works — รถมือสอง อสังหาริมทรัพย์ และอะไหล่รถยนต์",
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "รถมือสอง",
    "ขายรถ",
    "อสังหาริมทรัพย์",
    "อะไหล่รถยนต์",
    "E-Commerce",
    "Chayapon Works",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "/",
    siteName: SITE_NAME,
    title: "Chayapon Works — รถมือสอง อสังหาริมทรัพย์ และอะไหล่รถยนต์",
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/marketplace-hero-v2.png", alt: "Chayapon Works ร้านค้าออนไลน์" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chayapon Works — รถมือสอง อสังหาริมทรัพย์ และอะไหล่รถยนต์",
    description: DEFAULT_DESCRIPTION,
    images: ["/marketplace-hero-v2.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full min-w-0 max-w-full flex flex-col overflow-x-clip w-full relative pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <CartProvider>
          <Suspense>
            <Navbar />
          </Suspense>
          <div className="min-w-0 max-w-full flex-1">{children}</div>
        </CartProvider>
      </body>
    </html>
  );
}
