import type { Metadata, Viewport } from "next";
import { NearWalletProvider } from "@/providers/NearWalletProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucky Goal - Trivia + Penalties",
  description: "Where trivia meets penalty kicks. Built on Avalanche.",
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
    <html lang="en">
      <body className="min-h-screen bg-lucky-dark">
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
