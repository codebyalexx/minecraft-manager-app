import { CodeBlock } from "@/components/code-block";
import { ErrorMessage } from "@/components/error-message";
import { ServerSettings } from "@/components/server-settings";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getServer } from "@/queries/server.query";
import { TwitterIcon } from "lucide-react";
import Link from "next/link";

export default async function page({ params }: { params: { id: string } }) {
    const serverData = await getServer(params.id)

    if (!serverData) return <div>
        <ErrorMessage>The server <CodeBlock inline>{params.id}</CodeBlock> cannot be found in the database.</ErrorMessage>
    </div>

    const { cmdline, label, path, autoStart } = serverData

    return <div className="grid grid-cols-2 gap-2">
        <ServerSettings defaultFormData={{
            cmdline,
            label,
            path,
            autoStart
        }} serverId={params.id} />
        <div className="space-y-4 bg-zinc-800 p-4 rounded-lg w-full">
            <h2 className="text-xl font-bold">Networking</h2>
            <p className="text-muted-foreground flex items-center gap-3">
                Networking features will be soon available!
                <Link href={"https://x.com/codebyalexx"} target="_blank" className={"text-fuchsia-500"}><TwitterIcon /></Link>
            </p>
        </div>
        <div className="col-span-2 grid grid-cols-3 gap-2">
            <div className="space-y-4 bg-zinc-800 p-4 rounded-lg w-full">
                <h2 className="text-xl font-bold">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h2>
                <Skeleton className="w-full h-32 bg-zinc-900" />
            </div>
            <div className="space-y-4 bg-zinc-800 p-4 rounded-lg w-full">
                <h2 className="text-xl font-bold">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h2>
                <Skeleton className="w-full h-32 bg-zinc-900" />
            </div>
            <div className="space-y-4 bg-zinc-800 p-4 rounded-lg w-full">
                <h2 className="text-xl font-bold">Delete</h2>
                <Skeleton className="w-full h-32 bg-zinc-900" />
            </div>
        </div>
    </div>;
}