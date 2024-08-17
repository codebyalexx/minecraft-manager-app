"use client"

import { startServer, stopServer } from "@/actions/server.action";
import { ServerDataType } from "@/components/create-server-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { getServerManager, ServerState } from "@/lib/servers";
import { cn } from "@/lib/utils";
import { getServer, getServerState } from "@/queries/server.query";
import { CpuIcon, DotIcon, EthernetPortIcon, HardDriveIcon, InfinityIcon, MemoryStick, MemoryStickIcon, PowerIcon, ServerIcon, SquareIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function page({ params }: { params: { id: string } }) {
    const [serverData, setServerData] = useState<ServerDataType>();
    const [serverState, setServerState] = useState<ServerState>('OFF')

    useEffect(() => {
        const fetch = async () => {
            const req = await getServer(params.id)
            if (req === null) {
                console.error("Error")
            } else {
                setServerData(req)
            }
        }

        const fetchState = async () => {
            const req = await getServerState(params.id)

            if (req.success) {
                setServerState(req.data || "OFF")
            } else {
                console.error("Error", req.error)
            }
        }

        setTimeout(async () => {
            await fetch()
            await fetchState()
        }, 0);

        const loop = setInterval(async () => {
            await fetchState()
        }, 3000);

        return () => {
            clearInterval(loop)
        }
    }, [params.id])

    return <div className="grid grid-cols-7 gap-2">
        <aside className="col-span-2 w-full flex flex-col gap-2">
            <div className="bg-zinc-700 rounded-lg p-3 space-y-1.5">
                <h2 className="uppercase flex items-center font-medium mb-4 gap-2"><ServerIcon className="w-5 h-5" />{serverData?.label}</h2>
                <p className="flex items-center gap-2 text-sm font-semibold font-mono">
                    <span className="flex items-center justify-center w-4 h-4">
                        <span className={cn(
                            "w-3 h-3 rounded-full",
                            serverState === "ON" ? "bg-green-500" : "",
                            serverState === "OFF" ? "bg-zinc-500" : "",
                            ["STARTING", "STOPPING"].includes(serverState) ? "bg-yellow-500" : ""
                        )}></span>
                    </span>
                    {serverState}
                </p>
                <p className="flex items-center gap-2 text-sm font-semibold font-mono">
                    <EthernetPortIcon className="w-4 h-4" /> <span>Unknown bind address</span>
                </p>
                <p className="flex items-center gap-2 text-sm font-semibold font-mono">
                    <CpuIcon className="w-4 h-4" /> <span>Unknown CPU usage</span>
                </p>
                <p className="flex items-center gap-2 text-sm font-semibold font-mono">
                    <MemoryStickIcon className="w-4 h-4" /> <span>Unknown RAM usage <span className="text-muted-foreground inline-flex items-center gap-1">/ <InfinityIcon className="h-4" /></span></span>
                </p>
                <p className="flex items-center gap-2 text-sm font-semibold font-mono">
                    <HardDriveIcon className="w-4 h-4" /> <span>Unknown DISK usage <span className="text-muted-foreground inline-flex items-center gap-1">/ <InfinityIcon className="h-4" /></span></span>
                </p>
            </div>
            <div className="bg-zinc-700 rounded-lg p-3 flex items-center justify-between gap-2">
                <Button className="w-full font-semibold" variant={"secondary"} disabled={["ON", "STARTING", "STOPPING"].includes(serverState)} onClick={async () => {
                    const req = await startServer(params.id)

                    if (req.success) {
                        setServerState("STARTING")
                    }
                }}>
                    <PowerIcon className="w-4 h-4 mr-2" /> Start
                </Button>
                <Button className="w-full font-semibold" variant={"secondary"} disabled={["OFF", "STOPPING", "STARTING"].includes(serverState)} onClick={async () => {
                    const req = await stopServer(params.id)

                    if (req.success) {
                        setServerState("STOPPING")
                    }
                }}>
                    <SquareIcon className="w-4 h-4 mr-2" /> Stop
                </Button>
            </div>
        </aside>
        <main className="col-span-5 space-y-2">
            <div className="flex flex-col justify-between h-96 bg-zinc-700 rounded-lg">
                <div className="p-3 text-xs font-mono overflow-y-scroll">
                    term output
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg">
                    <span className="text-white font-medium">$</span>
                    <input type="text" name="" id="" className="bg-transparent font-mono outline-none" placeholder="Type a command..." />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-700 flex flex-col p-3 rounded-lg space-y-2">
                    <h3 className="uppercase flex items-center font-medium gap-2"><MemoryStickIcon className="w-5 h-5" />MEMORY USAGE</h3>
                    <p className="text-sm text-muted-foreground">Memory usage is not supported yet.</p>
                </div>
                <div className="bg-zinc-700 flex flex-col p-3 rounded-lg space-y-2">
                    <h3 className="uppercase flex items-center font-medium gap-2"><CpuIcon className="w-5 h-5" />CPU USAGE</h3>
                    <p className="text-sm text-muted-foreground">Memory usage is not supported yet.</p>
                </div>
            </div>
        </main>
    </div>
}