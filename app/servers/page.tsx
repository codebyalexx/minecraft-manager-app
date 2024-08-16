import { ServersList } from "@/components/servers-list";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getServers } from "@/queries/server.query";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default async function page() {
    const servers = await getServers();

    return <div className="space-y-2">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-4">Servers</h1>
            <Link className={cn(
                buttonVariants({
                    variant: "outline"
                })
            )} href={"/servers/create"}>
                <PlusIcon className="w-4 h-4 mr-2" /> Create Server
            </Link>
        </div>
        <ServersList servers={servers} />
    </div>;
}