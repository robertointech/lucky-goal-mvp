import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Lexend } from "next/font/google";
import { NearWalletProvider } from "@/providers/NearWalletProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lucky Goal - Trivia + Penalties",
  description: "Where trivia meets penalty kicks. Multichain: Avalanche + Arbitrum + NEAR.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${lexend.variable}`}>
      <body className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary">
        <NearWalletProvider>
          <LanguageProvider>
            <LanguageToggle />
            {children}
          </LanguageProvider>
        </NearWalletProvider>
      </body>
    </html>
  );
}
