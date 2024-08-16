"use client";

import Link from "next/link"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "../ui/navigation-menu"
import { HomeIcon, ServerIcon, WrenchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"
import { ReactNode } from "react"
import { Url } from "next/dist/shared/lib/router/router"
import { usePathname } from "next/navigation";

type NavbarItem = {
    href: Url;
    contents: ReactNode;
};

const items: NavbarItem[] = [
    {
        href: "/",
        contents: <>
            <HomeIcon className="w-4 h-4 mr-2" /> Home
        </>
    },
    {
        href: "/servers",
        contents: <>
            <ServerIcon className="w-4 h-4 mr-2" /> Servers
        </>
    },
    {
        href: "/settings",
        contents: <>
            <WrenchIcon className="w-4 h-4 mr-2" /> Settings
        </>
    }
]

export const Navbar = () => {
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
                                    pathname === item.href ? "!bg-blue-600" : "",
                                )} aria-disabled>
                                    {item.contents}
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>)}
                    </NavigationMenuList>
                </NavigationMenu>
            </nav>
        </div>
    </>
}