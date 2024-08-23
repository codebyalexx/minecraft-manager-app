"use client"

import { Trash2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { useTransition } from "react"
import { Loader } from "./loader"
import { getServerManager } from "@/lib/servers"
import { toast } from "sonner"
import { deleteServer, stopServer } from "@/actions/server.action"
import { useRouter } from "next/navigation"
import { getServerState } from "@/queries/server.query"

export const DeleteServerDialog = ({ serverId }: { serverId: string }) => {
    const [isLoading, startTransition] = useTransition()
    const router = useRouter()

    return <Dialog>
        <DialogTrigger asChild>
            <Button variant={"destructive"} className="gap-2">
                <Trash2Icon className="w-4 h-4" /> Delete this server
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Confirm deletion?</DialogTitle>
                <DialogDescription>
                    Do you really want to delete this server? It will be removed from the app and no longer managed by it.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button type="submit" variant={"destructive"} onClick={async () => {
                    startTransition(async () => {
                        const state = await getServerState(serverId)
                        if (state.data !== "OFF") {
                            const stop = await stopServer(serverId);
                            if (!stop.success) {
                                toast.error(stop.error || "An unknown error has happened")
                                return;
                            }
                        }

                        const res = await deleteServer(serverId)
                        if (res.success) {
                            toast.success("Successfully deleted server, redirecting...")
                            setTimeout(() => {
                                router.push('/servers')
                                router.refresh()
                            }, 2500);
                        } else {
                            toast.error("An error has happened while trying to delete server from database!")
                        }
                    })
                }} disabled={isLoading} className="flex items-center gap-2">
                    {isLoading ? <><Loader /> Deleting...</> : <>Yes, delete</>}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}