"use server"

import { FormInputErrorType, ServerDataType } from "@/components/create-server-form"
import prisma from "@/lib/prisma";

export const createServer = async ({ label, path, cmdline }: ServerDataType) => {
    const errors: FormInputErrorType[] = [];

    /* It's checking the label validity */
    const labelRegex = /^[A-Za-z -.\[\]\(\)]+$/;
    if (label.length === 0) {
        errors.push({
            input: "label",
            message: "Label input should not be empty."
        })
    }
    else if (!labelRegex.test(label)) {
        errors.push({
            input: "label",
            message: "Label input is valid. Here is the allowed chars: A-Za-z -.[]()"
        })
    }

    /* It's checking the path validity */
    if (path.length === 0) {
        errors.push({
            input: "path",
            message: "Path input should not be empty."
        })
    }

    /* It's checking the cmdline validity */
    if (cmdline.length === 0) {
        errors.push({
            input: "cmdline",
            message: "Command Line input should not be empty."
        })
    }

    /* It's returning errors if has some */
    if (errors.length > 0) return {
        success: false,
        errors
    }

    /* It's adding server to the database and returning success */
    const serverData = await prisma.server.create({
        data: {
            label,
            path,
            cmdline
        }
    })

    return {
        success: true,
        data: serverData
    }
}