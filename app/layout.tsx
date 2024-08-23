import type { Metadata } from "next";
import { Inter, Merienda, Pacifico } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import { getServers } from "@/queries/server.query";

const inter = Inter({ subsets: ["latin"] });
const merienda = Merienda({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Minecraft Manager",
  description: "Easily manage your local minecraft server instances",
};

export default async function RootLayout({
  children,
  modal
}: Readonly<{
  children: React.ReactNode;
  modal?: ReactNode;
}>) {
  const servers = await getServers();

  return (
    <html lang="en">
      <body className={cn("w-screen h-full dark", inter.className)}>
        <div className="w-full flex flex-col items-center my-10 mx-2">
          <div className="w-full max-w-6xl space-y-8">
            <header className="flex flex-col gap-6">
              <h1 className={cn("w-full flex items-center justify-center py-4", merienda.className)}>
                <Image src={"/logo.png"} alt="Logo" width={1920} height={600} className="w-96" />
              </h1>
              <Navbar servers={servers} />
            </header>
            {children}
            {modal}
          </div>
        </div>
        <Toaster richColors={true} />
      </body>
    </html>
  );
}
