import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FinanceProvider } from "@/lib/finance-store";
import { AppHeader } from "@/components/AppHeader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Finance",
  description: "A self-hosted personal finance dashboard with pluggable widgets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <FinanceProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">{children}</main>
        </FinanceProvider>
      </body>
    </html>
  );
}
