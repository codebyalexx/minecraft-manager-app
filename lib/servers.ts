"use server"

import { ChildProcess, ChildProcessWithoutNullStreams, spawn } from "child_process";

type ServerState = "OFF" | "ON" | "STARTING";

class ServerInstance {
    /* Server Infos */
    id: string = "";
    path: string = "";
    cmdline: string = "";
    state: ServerState = "OFF";

    /* Processes */
    process: ChildProcess | null = null;

    constructor(id: string, path: string, cmdline: string) {
        this.id = id;
        this.path = path;
        this.cmdline = cmdline;
        console.log("[ServerManager] Registered instance of server ", id)
    }

    async start() {
        if (this.process === null) {
            console.log("[ServerManager] Starting up", this.id, "server")

            const args = this.path.split(' ')
            const process = spawn(args.shift() || "java", args)
            this.process = spawn(args.shift() || "java", args);
            this.state = "STARTING";

            process.stdin.on('data', (data) => {
                console.log("[ServerManager] [" + this.id.slice(0, 5) + "]", data)
            })

            process.stderr.on('data', (data) => {
                console.error("[ServerManager] [" + this.id.slice(0, 5) + "]", data)
            })

            process.on('close', () => {
                console.log("[ServerManager] Server", this.id, "process has stopped")
                this.state = "OFF";
            })
        } else {
            console.error("[ServerManager] Attemped to start", this.id, " ERROR: Already Running")
        }
    }

    async stop(force = false) {
        if (this.process === null) {
            console.error("[ServerManager] Attemped to stop", this.id, " ERROR: Already Stopped")
        } else {
            console.log("[ServerManager] Stopping", this.id, "server")
            this.process.kill();
            this.state = "OFF"
        }
    }

    async restart() {
        if (this.process === null) {
            console.error("[ServerManager] Attemped to restart", this.id, " ERROR: Server is OFF")
        } else {
            console.log("[ServerManager] Restarting", this.id, "server")
            this.stop()
            this.start()
        }
    }

    async executeCommand(cmd: string) {
        console.log("[ServerManager] Successfully executed '", cmd, "' command on", this.id)
    }

    /* getters */

    getState() {
        return this.state;
    }
}

class ServerManager {
    instances: ServerInstance[] = [];

    register(id: string, path: string, cmdline: string) {
        this.instances.push(new ServerInstance(id, path, cmdline))
    }

    getInstance(id: string) {
        return this.instances.find(instance => instance.id === id);
    }
}

export async function getServerManager() {
    if (!(global as any).SERVER_MANAGER) {
        (global as any).SERVER_MANAGER = new ServerManager();
    }

    return (global as any).SERVER_MANAGER as ServerManager;
}