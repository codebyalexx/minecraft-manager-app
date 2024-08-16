import type { Metadata } from "next";
import { Inter, Merienda, Pacifico } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });
const merienda = Merienda({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Minecraft Manager",
  description: "Easily manage your local minecraft server instances",
};

export default function RootLayout({
  children,
  modal
}: Readonly<{
  children: React.ReactNode;
  modal?: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("w-screen h-full dark", inter.className)}>
        <div className="w-full flex flex-col items-center my-10 mx-2">
          <div className="w-full max-w-4xl space-y-8">
            <header className="flex flex-col gap-6">
              <h1 className={cn("text-3xl text-center", merienda.className)}>Minecraft Manager</h1>
              <Navbar />
            </header>
            {children}
            {modal}
          </div>
        </div>
      </body>
    </html>
  );
}
