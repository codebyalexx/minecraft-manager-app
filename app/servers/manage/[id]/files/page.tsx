"use client"

import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { getServerDir } from "@/queries/server.query";
import { Cloud, CreditCard, FileArchive, FileArchiveIcon, FileDownIcon, FileIcon, FilePenIcon, FileTextIcon, FolderIcon, Github, Keyboard, LifeBuoy, LogOut, Mail, MessageSquare, MoreVertical, PenIcon, Plus, PlusCircle, Settings, Trash2Icon, User, UserPlus, Users } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

export default function Page({ params }: { params: { id: string } }) {
    const [path, setPath] = useState("/");
    const [files, setFiles] = useState<any>([]);
    const [isLoading, startTransition] = useTransition()

    useEffect(() => {
        setFiles([])
        setTimeout(async () => {
            startTransition(async () => {
                const res = await getServerDir(params.id, path);
                setFiles(res)
            })
        }, 10);
    }, [path, params.id])

    const handleDirChange = (dir: string) => {
        setPath(`${path}${dir}/`)
    }

    const handleGoBack = (dir: string) => {
        let s = path.split('/');
        s = s.slice(0, s.length - 2);
        setPath(s.join("/") + "/")
    }

    return <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
        <label htmlFor="select-all" className="flex items-center gap-6 cursor-pointer px-1"><Checkbox id="select-all" /> {path.length > 1 ? path : "/"}</label>
        {isLoading ? <Loader /> : <div>
            {path.length > 1 ? <FileLine onDirChange={handleGoBack} file={{
                name: "..",
                size: 0,
                type: "dir",
                modifiedAt: "?"
            }} /> : ""}
            {files.filter((file: any) => file.type === "dir").map((file: any) => <FileLine onDirChange={handleDirChange} key={file.name} file={file} />)}
            {files.filter((file: any) => file.type === "file").map((file: any) => <FileLine key={file.name} file={file} />)}
        </div>}
    </div>
}

const FileLine = ({ file, onDirChange }: { file: any, onDirChange?: (dir: string) => void }) => {
    const isDir = file.type === "dir"

    return <div key={file.name} className="grid grid-cols-4 w-full py-1 px-3 hover:bg-zinc-900 rounded-lg cursor-pointer" onClick={(e) => {
        if (isDir && onDirChange !== undefined) {
            onDirChange(file.name);
        }
    }}>
        <div className="flex items-center gap-6 col-span-2">
            <Checkbox id={"f_" + file.name} className="size-4" />
            {isDir ? <FolderIcon className="w-5 h-4" /> : <FileTextIcon className="w-4 h-4" />}
            <span className="font-normal">{file.name}</span>
        </div>
        <div className="flex items-center justify-end">
            {isDir ? "" : <span className="text-white/70">{formatBytes(file.size)}</span>}
        </div>
        <div className="flex items-center justify-end gap-2">
            <span className="text-muted-foreground">{formatDate(file.modifiedAt)}</span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="outline-none group"><MoreVertical className="transition-all group-hover:stroke-[4px]" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-36 bg-zinc-900">
                    {isDir ? "" : <DropdownMenuItem>
                        <FilePenIcon className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>}
                    <DropdownMenuItem>
                        <PenIcon className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <FileArchiveIcon className="mr-2 h-4 w-4" />
                        <span>Archive</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <FileDownIcon className="mr-2 h-4 w-4" />
                        <span>Download</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
}