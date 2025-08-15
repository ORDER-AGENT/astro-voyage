import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarLayout from "@/components/SidebarLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RootClientLayout from "@/components/RootClientLayout";
import AppHeader from "@/components/AppHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Astro Voyage",
  description: "NASAのデータを使って、宇宙の美しい画像や天体の情報を探索するサイトです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RootClientLayout>
          <SidebarLayout>
            <div className="flex flex-col h-screen w-full flex-1 min-w-0"> {/* AppHeaderとContentLayoutを縦に並べるためのコンテナ */}
              <AppHeader /> {/* グローバルヘッダー */}
              {children}
            </div>
          </SidebarLayout>
        </RootClientLayout>
      </body>
    </html>
  );
}