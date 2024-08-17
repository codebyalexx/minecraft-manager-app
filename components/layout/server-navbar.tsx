"use client";

import Link from "next/link"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "../ui/navigation-menu"
import { HardDriveIcon, HomeIcon, ServerIcon, TerminalIcon, WrenchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"
import { ReactNode } from "react"
import { Url } from "next/dist/shared/lib/router/router"
import { usePathname } from "next/navigation";

export const ServerNavbar = ({ serverId }: { serverId: string }) => {
    const pathname = usePathname();

    return <>
        <div className="flex items-center justify-center bg-zinc-700 rounded-lg">
            <div className="w-full flex flex-col items-center">
                <nav className="">
                    <NavigationMenu>
                        <NavigationMenuList className="space-x-4">
                            <Link href={`/servers/manage/${serverId}`} legacyBehavior passHref>
                                <NavigationMenuLink className={cn(
                                    "px-4 py-2 flex items-center border-b-[3px] border-t-[3px] border-transparent",
                                    pathname === `/servers/manage/${serverId}` ? "border-b-zinc-400" : "",
                                )} aria-disabled>
                                    <TerminalIcon className="w-4 h-4 mr-2" /> Console
                                </NavigationMenuLink>
                            </Link>
                            <Link href={`/servers/manage/${serverId}/files`} legacyBehavior passHref>
                                <NavigationMenuLink className={cn(
                                    "px-4 py-2 flex items-center border-b-[3px] border-t-[3px] border-transparent",
                                    pathname === `/servers/manage/${serverId}/files` ? "border-b-zinc-400" : "",
                                )} aria-disabled>
                                    <HardDriveIcon className="w-4 h-4 mr-2" /> File Manager
                                </NavigationMenuLink>
                            </Link>
                            <Link href={`/servers/manage/${serverId}/settings`} legacyBehavior passHref>
                                <NavigationMenuLink className={cn(
                                    "px-4 py-2 flex items-center border-b-[3px] border-t-[3px] border-transparent",
                                    pathname === `/servers/manage/${serverId}/settings` ? "border-b-zinc-400" : "",
                                )} aria-disabled>
                                    <WrenchIcon className="w-4 h-4 mr-2" /> Settings
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuList>
                    </NavigationMenu>
                </nav>
            </div>
        </div>
    </>
}