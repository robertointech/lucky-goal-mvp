import type { Metadata, Viewport } from "next";
import { ThirdwebProvider } from "thirdweb/react";
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
    <html lang="es">
      <body className="min-h-screen bg-lucky-dark">
        <ThirdwebProvider>
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
