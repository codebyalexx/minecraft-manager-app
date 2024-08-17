"use client"

import { Server } from "@prisma/client"
import { Button } from "./ui/button"
import { DotIcon, PlayIcon, PlugZapIcon, RecycleIcon, RefreshCcwIcon, SquareIcon, StopCircleIcon, Trash2Icon, ZapIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getServers, getServerState } from "@/queries/server.query"
import { getServerManager, ServerState } from "@/lib/servers"
import { setServers } from "dns"
import { restartServer, startServer, stopServer } from "@/actions/server.action"
import { Loader } from "./loader"

export const ServersList = ({ servers }: { servers: Server[] }) => {
    const [_servers, setServers] = useState(servers)
    const [serverStates, setServerStates] = useState<{ [key: string]: ServerState }>({})

    useEffect(() => {
        const fetchStates = async () => {
            let state: { [key: string]: ServerState } = {}
            for await (const server of servers) {
                const req = await getServerState(server.id);
                if (req.success) state[server.id] = req.data || "OFF"
            }
            setServerStates(state)
        }
        /* It's creating a loop that retrieves server status every 3 seconds */
        const loop = setInterval(async () => {
            await fetchStates()
        }, 3000);
        fetchStates()

        return () => {
            clearInterval(loop);
        }
    }, [servers])

    console.log(serverStates);

    return servers.length === 0 ? <>
        <p className="text-sm text-muted-foreground">You don&apos;have any servers yet. Create one using &quote;Create Server&quote; button above.</p>
    </> : <>
        <div className="space-y-3">
            {servers.map(server => <Link href={`/servers/manage/${server.id}`} key={server.id} className="flex justify-between items-center p-3 px-4 bg-zinc-800 rounded-lg cursor-pointer">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        serverStates[server.id] === "ON" ? "text-green-500" : "",
                        serverStates[server.id] === "OFF" ? "text-zinc-500" : "",
                        ["STARTING", "STOPPING"].includes(serverStates[server.id]) ? "text-orange-500" : "",
                    )}>
                        {serverStates[server.id] === "ON" ? <ZapIcon className="w-6 h-6" /> : ""}
                        {["STARTING", "STOPPING"].includes(serverStates[server.id]) ? <Loader /> : ""}
                        {serverStates[server.id] === "OFF" ? <PlugZapIcon className="w-6 h-6" /> : ""}
                    </span>
                    <p className="text-lg">{server.label}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="size-8 p-0 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-600" disabled={serverStates[server.id] !== "OFF"} onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const req = await startServer(server.id)
                        if (req.success)
                            setServerStates({
                                ...serverStates,
                                [server.id]: "STARTING"
                            })
                    }}>
                        <PlayIcon className="w-4 h-4" />
                    </Button>
                    <Button className="size-8 p-0 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-600" disabled={serverStates[server.id] === "OFF"} onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        await stopServer(server.id)
                    }}>
                        <SquareIcon className="w-4 h-4" />
                    </Button>
                    <Button className="size-8 p-0 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-600" disabled={serverStates[server.id] === "OFF"} onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const req = await restartServer(server.id)
                        if (req.success) if (req.success)
                            setServerStates({
                                ...serverStates,
                                [server.id]: "STARTING"
                            })
                    }}>
                        <RefreshCcwIcon className="w-4 h-4" />
                    </Button>
                </div>
            </Link>)}
        </div>
    </>
}