import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FernhollowAudio, FernhollowMuteButton } from "@/components/FernhollowAudio";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fernhollow",
  description:
    "A tiny village in the woods: Clover, Rosie, Scout, and Wren — your agentic home for Blirt, Saudade, and PrintBooth.",
};

/** Phones and notched screens: correct scale, full-bleed game, browser chrome color. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f160f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <FernhollowAudio />
        <FernhollowMuteButton />
        {children}
      </body>
    </html>
  );
}
