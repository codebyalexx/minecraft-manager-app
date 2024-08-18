"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useTransition } from "react"

const CopyButton = ({ text }: { text: string }) => {
    const [check, startCheck] = useTransition()

    const handleClick = () => {
        startCheck(async () => {
            navigator.clipboard.writeText(text)

            await new Promise(res => setTimeout(res, 850))
        })
    }

    return <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <button className="absolute top-1.5 right-3.5 w-2 h-2 text-white/70" onClick={handleClick} disabled={check}>
                    {check ? <>
                        <CheckIcon className="w-4 h-4" strokeWidth={3} />
                    </> : <CopyIcon className="w-4 h-4" strokeWidth={3} />}
                </button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Copy to clipboard</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
}

export const CodeBlock = ({ children, inline = false }: { children: string, inline?: boolean }) => {
    const className = "bg-black/40 p-1 px-2 rounded-lg pr-8 relative"

    const Content = () => <>
        {children} <CopyButton text={children} />
    </>

    if (inline) return <code className={className}><Content /></code>

    return <p className={className}>
        <Content />
    </p>
}