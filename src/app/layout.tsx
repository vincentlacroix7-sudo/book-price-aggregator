import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Book Price Aggregator — Find the best book deals",
  description: "Compare book prices across Amazon, Indigo, Book Outlet, AbeBooks & more. Find the best deals on new and used books.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="bg-zinc-950 text-white min-h-screen">{children}</body>
    </html>
  );
}