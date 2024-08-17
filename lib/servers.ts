"use server"

import { ChildProcess, ChildProcessWithoutNullStreams, spawn } from "child_process";
import { assert } from "console";
import { existsSync } from "fs";
import { lstat, readdir, unlink } from "fs/promises";
import { join } from "path";

export type ServerState = "OFF" | "ON" | "STARTING" | "STOPPING";

class ServerInstance {
    /* Server Infos */
    id: string = "";
    path: string = "";
    cmdline: string = "";
    state: ServerState = "OFF";
    debug: boolean = false;
    logs: string[] = [];

    /* Processes */
    instance: ChildProcess | null = null;

    constructor(id: string, path: string, cmdline: string) {
        this.id = id;
        this.path = path;
        this.cmdline = cmdline;
        console.log("[ServerManager] Registered instance of server ", id)
    }

    async start() {
        if (this.startable) {
            console.log("[ServerManager] Starting up", this.id, "server")

            /* It's parsing the path */
            let parsedPath = this.path;
            parsedPath = parsedPath.replace(/(?<!\/)\/(?!\/)/g, "\\") // replacing slashes with anti slashes
            parsedPath = parsedPath.replace(/(?<!\/\/)\/\/(?!\/\/)/g, "\\") // replacing double slashes with anti slashes

            /* It's parsing command line */
            let parsedCmdLine = this.cmdline
            const jarFilename = parsedPath.split("\\")[parsedPath.split("\\").length - 1];
            parsedCmdLine = parsedCmdLine.replaceAll("{JAR_FILENAME}", jarFilename)

            /* It's deleting session lock files */
            const cwd = parsedPath.replace(jarFilename, "")
            await this.deleteSessionLock(cwd)

            /* Creating subprocess */
            const args = parsedCmdLine.split(' ')
            const java = args.shift() || "java"

            const instance = spawn(java, args, {
                cwd,
            })
            this.instance = instance
            this.state = "STARTING";

            const handleLog = this.handleLog.bind(this)
            instance.stdout.on('data', handleLog)

            const handleError = this.handleError.bind(this)
            instance.stderr.on('data', handleError)

            const handleClose = this.handleClose.bind(this)
            instance.on('close', handleClose)
        } else {
            console.error("[ServerManager] Attemped to start", this.id, " ERROR: Already Running")
        }
    }

    async stop(force = false) {
        if (this.stoppable) {
            this.state = "STOPPING"
            await this.executeCommand("stop")
            await this.executeCommand("end")
        } else {
            console.error("[ServerManager] Attemped to stop", this.id, " ERROR: Server instance is null or the server is not stoppable")
        }
    }

    async restart() {
        if (this.restartable) {
            console.log("[ServerManager] Restarting", this.id, "server")
            this.stop()
            this.start()

        } else {
            console.error("[ServerManager] Attemped to restart", this.id, " ERROR: Server is not restartable")
        }
    }

    async executeCommand(cmd: string) {
        this.instance?.stdin?.write(cmd + "\n")
        console.log("[ServerManager] Successfully executed '", cmd, "' command on", this.id, "reponse:")
    }

    async deleteSessionLock(dir: string) {
        /* It's checking that the directory exists */
        const exists = existsSync(dir)
        if (!exists) return

        /* It's looping trough files */
        const files = await readdir(dir)
        for await (const file of files) {
            const path = join(dir, file)
            const stat = await lstat(path)
            const isDir = stat.isDirectory()

            if (isDir) {
                await this.deleteSessionLock(path)
            } else {
                if (file === "session.lock") await unlink(path)
            }
        }
    }

    handleLog(data: string) {
        const d = data.toString()
        if (this.debug) console.log("[ServerManager] [" + this.id.slice(0, 5) + "]", d)
        this.logs.push(d)

        const loadedConditions = [
            this.logs.some(x => x.includes("Enabled BungeeCord version")) && this.logs.some(x => x.includes("[INFO] Listening on /")),
            this.logs.some(x => x.includes("Loading libraries, please wait...")) && this.logs.some(x => x.includes("For help, type \"help\""))
        ]
        if (loadedConditions.some(b => b === true)) this.state = "ON"
    }

    handleError(data: string) {
        const d = data.toString()
        if (this.debug) console.error("[ServerManager] [" + this.id.slice(0, 5) + "]", d)
        this.logs.push(d)
    }

    handleClose() {
        console.log("[ServerManager] Server", this.id, "process has stopped")
        this.instance?.kill()
        this.instance = null
        this.state = "OFF"
    }

    /* getters */

    getState() {
        return this.state;
    }

    getLogs() {
        return this.logs
    }

    get startable() {
        return ["OFF"].includes(this.state) && this.instance === null;
    }

    get stoppable() {
        return ["ON", "STARTING"].includes(this.state) && this.instance !== null;
    }

    get restartable() {
        return ["ON"].includes(this.state) && this.instance !== null;
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