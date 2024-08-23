import { getServerManager } from "@/lib/servers"
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    getServerManager();
    res.status(200).json({ success: true })
}