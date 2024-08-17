import { buttonVariants } from "@/components/ui/button";
import { getServerManager } from "@/lib/servers";
import { cn } from "@/lib/utils";
import { getServer } from "@/queries/server.query";
import Link from "next/link";

export default async function page({ params }: { params: { id: string } }) {
    const serverManager = await getServerManager();
    const serverData = await getServer(params.id);

    const err = (error: string) => <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-center">
            <strong>Error: </strong>{error}
        </p>
        <Link href={"/servers"} className={cn(buttonVariants({
            variant: "secondary"
        }), "block w-fit")}>
            Back to servers list
        </Link>
    </div>

    if (!serverData) return err("Server not found in the database.")

    const serverInstance = serverManager.getInstance(serverData.id);

    if (!serverInstance) return err("Server instance not found in the process.")

    return <>
        <h2 className="text-xl font-bold text-center"><span className={cn(
            "mr-2",
            serverInstance.getState() === "OFF" ? "text-zinc-500" : "",
            serverInstance.getState() === "STARTING" ? "text-yellow-500" : "",
            serverInstance.getState() === "ON" ? "text-green-500" : ""
        )}>•</span>{serverData.label}</h2>
    </>;
}