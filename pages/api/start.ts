import { getServerManager } from "@/lib/servers"
import { getServers } from "@/queries/server.query";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const serverManager = await getServerManager();
    const servers = await getServers();

    for (const server of servers) {
        if (serverManager.getInstance(server.id) === undefined) serverManager.register(server.id, server.path, server.cmdline, server.autoStart);
    }
    res.status(200).json({ success: true })
}