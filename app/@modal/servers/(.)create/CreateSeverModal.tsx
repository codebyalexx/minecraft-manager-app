"use client"

import { CreateServerForm } from "@/components/create-server-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePathname, useRouter } from "next/navigation";

export const CreateServerModal = () => {
    const router = useRouter();
    const pathname = usePathname();

    return <Dialog open={pathname === "/servers/create"} onOpenChange={() => router.back()}>
        <DialogContent className="w-full max-w-2xl">
            <CreateServerForm />
        </DialogContent>
    </Dialog>;
}