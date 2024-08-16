"use client";

import { ChangeEvent, ChangeEventHandler, FormEvent, useState, useTransition } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { createServer } from "@/actions/create-server";

export type ServerDataType = {
    label: string;
    path: string;
    cmdline: string;
}

export type FormInputErrorType = {
    input: string;
    message: string;
}

const defaultFormData: ServerDataType = {
    label: "",
    path: "",
    cmdline: "java -Xms256M -Xmx1G -jar {JAR_FILENAME}",
}

export const CreateServerForm = () => {
    const [formData, setFormData] = useState<ServerDataType>(defaultFormData)
    const [errors, setErrors] = useState<FormInputErrorType[]>([])
    const [isLoading, startTransition] = useTransition();

    const labelError = errors.find(e => e.input === "label");
    const pathError = errors.find(e => e.input === "path");
    const cmdlineError = errors.find(e => e.input === "cmdline");

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const name = e.target.id;
        const value = e.target.value;
        setFormData({
            ...formData,
            [name]: value
        });
    }

    return <form onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        setErrors([]);

        startTransition(async () => {
            const req = await createServer(formData)

            if (req.success) {
                alert("Succès !")
            } else {
                setErrors(req.errors || [])
            }
        });
    }} className="space-y-4">
        <h2 className="text-xl font-bold">Create Server</h2>
        <div className="w-full space-y-1">
            <Label htmlFor="label" className={labelError ? "text-red-500" : ""}>Server Label</Label>
            <Input id="label" placeholder="Lobby" required value={formData.label} onChange={handleChange} className={labelError ? "border-red-500" : ""} />
            {labelError ? <p className="text-sm text-red-500 font-semibold">{labelError.message}</p> : null}
        </div>
        <div className="w-full space-y-1">
            <Label htmlFor="path" className={pathError ? "text-red-500" : ""}>Executable Path</Label>
            <div className="flex items-center gap-2">
                <Input id="path" placeholder="/var/servers/lobby/server.jar" required value={formData.path} onChange={handleChange} className={pathError ? "border-red-500" : ""} />
                {pathError ? <p className="text-sm text-red-500 font-semibold">{pathError.message}</p> : null}
            </div>
        </div>
        <div className="w-full space-y-1">
            <Label htmlFor="cmdline" className={cmdlineError ? "text-red-500" : ""}>Java Command Line</Label>
            <Input id="cmdline" placeholder="java -Xms256M -Xmx1G -jar {JAR_FILENAME}" required value={formData.cmdline} onChange={handleChange} className={cmdlineError ? "border-red-500" : ""} />
            {cmdlineError ? <p className="text-sm text-red-500 font-semibold">{cmdlineError.message}</p> : null}
        </div>
        <Button type="submit" variant={"secondary"}>
            Confirm
        </Button>
    </form>
}