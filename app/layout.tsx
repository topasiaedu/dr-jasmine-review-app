import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Clean display serif. Avoids Fraunces soft/wonk axes that skewed the brand title. */
const sourceSerif = Source_Serif_4({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Leave a review for Dr Jasmine",
  description: "Craft a Google review for Dr Jasmine Chiew (Metanova Health)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
