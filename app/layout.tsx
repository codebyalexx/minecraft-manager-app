import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Minecraft Manager",
  description: "Easily manage your local minecraft server instances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("w-screen h-full dark", inter.className)}>
        <div className="w-full flex flex-col items-center my-10 mx-2">
          <div className="w-full max-w-4xl space-y-8">
            <Navbar />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
