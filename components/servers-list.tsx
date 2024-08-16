import { Server } from "@prisma/client"
import { Button } from "./ui/button"
import { PlayIcon, RecycleIcon, RefreshCcwIcon, SquareIcon, StopCircleIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"

export const ServersList = ({ servers }: { servers: Server[] }) => {
    return servers.length === 0 ? <>
        <p className="text-sm text-muted-foreground">You don&apos;have any servers yet. Create one using &quote;Create Server&quote; button above.</p>
    </> : <>
        <div className="space-y-3">
            {servers.map(server => <Link href={`/servers/manage/${server.id}`} key={server.id} className="flex justify-between items-center p-3 px-4 bg-zinc-800 rounded-lg cursor-pointer">
                <div className="flex items-center gap-2">
                    <span className="text-red-500 text-2xl">•</span><p className="text-lg">{server.label}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="size-8 p-0 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-600">
                        <PlayIcon className="w-4 h-4" />
                    </Button>
                    <Button className="size-8 p-0 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-600" disabled>
                        <SquareIcon className="w-4 h-4" />
                    </Button>
                    <Button className="size-8 p-0 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-600" disabled>
                        <RefreshCcwIcon className="w-4 h-4" />
                    </Button>
                </div>
            </Link>)}
        </div>
    </>
}