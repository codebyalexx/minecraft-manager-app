"use server"

import prisma from "@/lib/prisma"

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