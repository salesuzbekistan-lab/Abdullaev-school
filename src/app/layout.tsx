import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const interBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const cormorantDisplay = Cormorant_Garamond({
  variable: "--font-display",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Abdullayev School",
  description: "Abdullayev School — student, parent va teacher platformasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${interBody.variable} ${cormorantDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
