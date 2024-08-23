import { ServersList } from "@/components/servers-list";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getServerManager } from "@/lib/servers";
import { cn } from "@/lib/utils";
import { getServers } from "@/queries/server.query";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default async function page() {
    const serverManager = await getServerManager();
    const servers = await getServers();

    for (const server of servers) {
        if (serverManager.getInstance(server.id) === undefined) serverManager.register(server.id, server.path, server.cmdline, server.autoStart);
    }

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