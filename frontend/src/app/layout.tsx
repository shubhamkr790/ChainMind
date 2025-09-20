import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "ChainMind - Decentralized AI Compute Marketplace",
  description: "Connect AI developers with GPU providers through blockchain technology. Affordable, decentralized, and trustless AI compute resources.",
  keywords: ["AI", "blockchain", "GPU", "compute", "marketplace", "Web3", "machine learning"],
  authors: [{ name: "ChainMind Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "ChainMind - Decentralized AI Compute Marketplace",
    description: "Connect AI developers with GPU providers through blockchain technology.",
    url: "https://chainmind.ai",
    siteName: "ChainMind",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ChainMind - Decentralized AI Compute Marketplace",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainMind - Decentralized AI Compute Marketplace",
    description: "Connect AI developers with GPU providers through blockchain technology.",
    images: ["/og-image.png"],
    creator: "@ChainMindAI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-gray-900 text-white min-h-screen`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
