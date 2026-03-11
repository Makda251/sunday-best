import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KemisHouse - Your Home for Habesha Elegance",
  description: "Buy and sell new and pre-loved traditional Habesha dresses. Your home for Habesha elegance through beautiful cotton and chiffon kemis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.variable} style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
