"use client"

import { Server } from "@prisma/client"
import { Button } from "./ui/button"
import { DotIcon, PlayIcon, PlugZapIcon, PowerIcon, PowerOff, PowerOffIcon, RecycleIcon, RefreshCcwIcon, SquareIcon, StopCircleIcon, Trash2Icon, ZapIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getServers, getServerState } from "@/queries/server.query"
import { getServerManager, ServerState } from "@/lib/servers"
import { setServers } from "dns"
import { restartServer, startServer, stopServer } from "@/actions/server.action"
import { Loader } from "./loader"
import { socket } from "@/lib/socket"

export const ServersList = ({ servers }: { servers: Server[] }) => {
    const [isConnected, setIsConnected] = useState<boolean>(socket.connected)

    const [_servers, setServers] = useState(servers)
    const [serverStates, setServerStates] = useState<{ [key: string]: ServerState | "FETCHING" }>({})

    useEffect(() => {
        /* It's opening connection to the socket */
        socket.connect()

        /* It's making servers in fetching state */
        for (const server of servers) {
            setServerStates(previous => {
                return {
                    ...previous,
                    [server.id]: "FETCHING"
                }
            })
        }

        /* It's handling connect event */
        function onConnect() {
            setIsConnected(true)
        }

        /* It's handling disonnect event */
        function onDisconnect() {
            setIsConnected(false)
        }

        /* It's handling serverStateUpate event */
        function onServerStateUpdate(value: {
            serverId: string,
            state: ServerState
        }) {
            console.log(value)
            setServerStates(state => {
                return {
                    ...state,
                    [value.serverId]: value.state
                }
            });
        }

        socket.on('connect', onConnect)
        socket.on('disconnect', onDisconnect)
        socket.on('serverStateUpdate', onServerStateUpdate)

        return () => {
            socket.off('connect', onConnect)
            socket.off('disconnect', onDisconnect)
            socket.off('serverStateUpdate', onServerStateUpdate)
        }
    }, [servers])

    return servers.length === 0 ? <>
        <p className="text-sm text-muted-foreground">You don&apos;have any servers yet. Create one using &quote;Create Server&quote; button above.</p>
    </> : <>
        <div className="space-y-3">
            {servers.map(server => <Link href={`/servers/manage/${server.id}`} key={server.id} className="flex justify-between items-center p-3 px-4 bg-zinc-800 rounded-lg cursor-pointer">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        serverStates[server.id] === "ON" ? "text-green-500" : "",
                        ["OFF", "FETCHING"].includes(serverStates[server.id]) ? "text-zinc-500" : "",
                        ["STARTING", "STOPPING"].includes(serverStates[server.id]) ? "text-orange-500" : "",
                    )}>
                        {serverStates[server.id] === "ON" ? <ZapIcon className="w-6 h-6" /> : ""}
                        {["STARTING", "STOPPING", "FETCHING"].includes(serverStates[server.id]) ? <Loader /> : ""}
                        {serverStates[server.id] === "OFF" ? <PlugZapIcon className="w-6 h-6" /> : ""}
                    </span>
                    <p className="text-lg">{server.label}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button className="size-8 p-0 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-600" disabled={serverStates[server.id] !== "OFF" || serverStates[server.id] === "FETCHING"} onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const req = await startServer(server.id)
                        if (req.success)
                            setServerStates({
                                ...serverStates,
                                [server.id]: "STARTING"
                            })
                    }}>
                        <PowerIcon className="w-4 h-4" />
                    </Button>
                    <Button className="size-8 p-0 flex items-center justify-center bg-zinc-800 text-white hover:bg-zinc-600" disabled={serverStates[server.id] === "OFF" || serverStates[server.id] === "FETCHING"} onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        await stopServer(server.id)
                    }}>
                        <SquareIcon className="w-4 h-4" />
                    </Button>
                </div>
            </Link>)}
        </div>
    </>
}