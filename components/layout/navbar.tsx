"use client";

import Link from "next/link"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "../ui/navigation-menu"
import { ArrowDown, HomeIcon, PowerIcon, ServerIcon, SquareIcon, WrenchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "../ui/button"
import { ReactNode } from "react"
import { Url } from "next/dist/shared/lib/router/router"
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Server } from "@prisma/client";

type NavbarItem = {
    href: Url;
    contents: ({ servers }: { servers?: Server[] }) => ReactNode;
};

const items: NavbarItem[] = [
    {
        href: "/",
        contents: () => <>
            <HomeIcon className="w-4 h-4 mr-2" /> Home
        </>
    },
    {
        href: "/servers",
        contents: ({ servers }) => <span className="flex items-center gap-2 group">
            <ServerIcon className="w-4 h-4" /> Servers <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="bg-transparent hover:bg-transparent">
                        <ArrowDown className="w-4 h-4 group-hover:stroke-[3px] transition-all delay-100" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                    <DropdownMenuLabel>
                        Servers
                    </DropdownMenuLabel>
                    {servers?.map((server) => <DropdownMenuItem key={server.id} asChild>
                        <Link href={`/servers/manage/${server.id}`}>
                            {server.label}
                        </Link>
                    </DropdownMenuItem>)}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>
                        Actions
                    </DropdownMenuLabel>
                    <DropdownMenuItem>
                        <PowerIcon className="w-4 h-4 mr-2" /> Start All
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <SquareIcon className="w-4 h-4 mr-2" /> Stop All
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </span>
    },
    {
        href: "/settings",
        contents: () => <>
            <WrenchIcon className="w-4 h-4 mr-2" /> Settings
        </>
    }
]

export const Navbar = ({ servers }: { servers: Server[] }) => {
    const pathname = usePathname();

    return <>
        <div className="w-full flex flex-col items-center">
            <nav className="">
                <NavigationMenu>
                    <NavigationMenuList className="space-x-4">
                        {items.map((item) => <NavigationMenuItem key={item.href.toString()}>
                            <Link href={item.href} legacyBehavior passHref>
                                <NavigationMenuLink className={cn(
                                    navigationMenuTriggerStyle(),
                                    buttonVariants({
                                        variant: "secondary"
                                    }),
                                    pathname === item.href ? "!bg-fuchsia-500" : "",
                                )} aria-disabled>
                                    {item.contents({ servers })}
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>)}
                    </NavigationMenuList>
                </NavigationMenu>
            </nav>
        </div>
    </>
}