"use server"

import { FormInputErrorType, ServerDataType } from "@/components/create-server-form"
import prisma from "@/lib/prisma";
import { getServerManager } from "@/lib/servers";

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

export const startServer = async (id: string) => {
    /* It's retrieving server instance */
    const serverManager = await getServerManager();
    const serverInstance = serverManager.getInstance(id);

    if (!serverInstance) return {
        success: false,
        error: "The server instance hasn't been found!"
    }

    /* It's checking if the server is startable */
    if (!serverInstance.startable) return {
        success: false,
        error: "The server is not startable!"
    }

    /* It's starting the server */
    serverInstance.start()
    return {
        success: true
    }
}

export const stopServer = async (id: string) => {
    /* It's retrieving server instance */
    const serverManager = await getServerManager();
    const serverInstance = serverManager.getInstance(id);

    if (!serverInstance) return {
        success: false,
        error: "The server instance hasn't been found!"
    }

    /* It's checking if the server is stoppable */
    if (!serverInstance.stoppable) return {
        success: false,
        error: "The server is not stoppable!"
    }

    /* It's starting the server */
    serverInstance.stop()
    return {
        success: true
    }
}

export const restartServer = async (id: string) => {
    /* It's retrieving server instance */
    const serverManager = await getServerManager();
    const serverInstance = serverManager.getInstance(id);

    if (!serverInstance) return {
        success: false,
        error: "The server instance hasn't been found!"
    }

    /* It's checking if the server is restartable */
    if (!serverInstance.restartable) return {
        success: false,
        error: "The server is not restartable!"
    }

    /* It's starting the server */
    serverInstance.restart()
    return {
        success: true
    }
}
