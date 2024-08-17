import { cn } from "@/lib/utils"
import { LoaderCircle } from "lucide-react"

export const Loader = ({ className }: { className?: string }) => {
    return <LoaderCircle className={cn("animate-spin w-4 h-4", className)} />
}