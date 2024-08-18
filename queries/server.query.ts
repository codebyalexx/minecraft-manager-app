"use server"

import prisma from "@/lib/prisma"
import { getServerManager } from "@/lib/servers";

export const getServers = async () => {
    /* It's getting servers from the database and returning them */
    const servers = await prisma.server.findMany();

    return servers;
}

export const getServer = async (id: string) => {
    /* It's getting server from the database and returning it */
    const server = await prisma.server.findUnique({
        where: {
            id
        }
    })

    return server;
}

export const getServerState = async (id: string) => {
    /* It's retrieving server instance */
    const serverManager = await getServerManager();
    const serverInstance = serverManager.getInstance(id);

    if (!serverInstance) return {
        success: false,
        error: "The server instance hasn't been found!"
    }

    /* It's returning server state */
    return {
        success: true,
        data: serverInstance.getState()
    }
}

export const getSftpDir = async (serverId: string, dir: string) => {
    /* It's retrieving server instance */
    const serverManager = await getServerManager();
    const serverInstance = serverManager.getInstance(serverId);

    if (!serverInstance) return {
        success: false,
        error: "The server instance hasn't been found!"
    }

    /* It's getting dir files */
    return []
}
