"use client"

import { cn } from "@/lib/utils"
import { TriangleAlertIcon, XIcon } from "lucide-react"
import { ReactNode, useState } from "react"

export const ErrorMessage = ({ children }: { children: ReactNode }) => {
    const [closed, setClosed] = useState(false)

    return <div className={cn("p-2 bg-red-500 border-b-2 border-b-red-700 rounded-lg w-full max-w-lg flex items-start gap-3 justify-between", closed ? "hidden" : "")}>
        <span>
            <TriangleAlertIcon />
        </span>
        <p className="w-full font-light">
            <strong>Error!</strong> {children}
        </p>
        <button className="cursor-pointer" onClick={() => setClosed(true)}>
            <XIcon />
        </button>
    </div>
}