import type { Metadata } from "next";
import { Josefin_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const main = Josefin_Sans({
  subsets: ["latin"],
  weight: ["100", "300", "400", "600", "700"],
  variable: "--font-lato",
  display: "swap",
});

// Monospace with proper Greek glyphs (Courier New leaves gaps around ι)
const mono = JetBrains_Mono({
  subsets: ["latin", "greek"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "pickle",
  description: "your shared grocery list",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "pickle",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${main.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
