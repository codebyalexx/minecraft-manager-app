import { ServerNavbar } from "@/components/layout/server-navbar";
import { ReactNode } from "react";

export default function layout({ children, params }: { children: ReactNode, params: { id: string } }) {
    return <div className="space-y-2">
        <ServerNavbar serverId={params.id} />
        {children}
    </div>
}