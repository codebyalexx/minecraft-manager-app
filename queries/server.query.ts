"use server"

import prisma from "@/lib/prisma"

export const getServers = async () => {
    /* It's getting servers from the database and returning them */
    const servers = await prisma.server.findMany();

    return servers;
}