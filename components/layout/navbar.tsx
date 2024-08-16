import Link from "next/link"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "../ui/navigation-menu"
import { HomeIcon, ServerIcon, WrenchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"

export const Navbar = () => {
    return <>
        <div className="w-full flex flex-col items-center">
            <nav className="">
                <NavigationMenu>
                    <NavigationMenuList className="space-x-4">
                        <NavigationMenuItem>
                            <Link href="/" legacyBehavior passHref>
                                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), buttonVariants({
                                    variant: "secondary"
                                }))}>
                                    <HomeIcon className="w-4 h-4 mr-2" /> Home
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link href="/servers" legacyBehavior passHref>
                                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), buttonVariants({
                                    variant: "secondary"
                                }))}>
                                    <ServerIcon className="w-4 h-4 mr-2" /> Servers
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link href="/settings" legacyBehavior passHref>
                                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), buttonVariants({
                                    variant: "secondary"
                                }))}>
                                    <WrenchIcon className="w-4 h-4 mr-2" /> Settings
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </nav>
        </div>
    </>
}