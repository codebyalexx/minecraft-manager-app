"use server"

import { ChildProcess, exec, spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { lstat, readdir, unlink } from "fs/promises";
import { join } from "path";
import chalk from "chalk"
import { Server as IOServer, Socket } from "socket.io"
import { Server as SSHServer } from "ssh2"
// @ts-ignore
import SFTPServer from "ssh2-sftp-server"
import util from "util"
import { on } from "events";

export type ServerState = "OFF" | "ON" | "STARTING" | "STOPPING";

class ServerInstance {
    /* Server Infos */
    manager: ServerManager | null = null;
    id: string = "";
    path: string = "";
    cmdline: string = "";
    state: ServerState = "OFF";
    debug: boolean = false;
    logs: string[] = [];
    runId: string = "";
    serverType: string = "";

    /* Processes */
    instance: ChildProcess | null = null;

    constructor(id: string, path: string, cmdline: string, manager: ServerManager) {
        this.id = id;
        this.path = path;
        this.cmdline = cmdline;
        this.manager = manager;
        console.log(chalk.green("[ServerManager] Registered instance of server ", id))
    }

    async start() {
        if (this.startable) {
            console.log(chalk.green("[ServerManager] Starting up", this.id, "server"))
            this.runId = new Date().getTime().toString()

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
                stdio: ["pipe", "pipe", "pipe"],
            })
            this.instance = instance
            this.setState("STARTING")

            /* It's handling process events */

            const handleLog = this.handleLog.bind(this)
            instance.stdout.on('data', handleLog)

            const handleError = this.handleError.bind(this)
            instance.stderr.on('data', handleError)

            const handleClose = this.handleClose.bind(this)
            instance.on('close', handleClose)
        } else {
            console.error(chalk.red("[ServerManager] Attemped to start", this.id, " ERROR: Already Running"))
        }
    }

    async stop(force = false) {
        if (this.stoppable) {
            console.log("[")
            console.log("[ServerManager] Stopping", this.id, "server")
            this.setState("STOPPING")

            /* It's killing process after 15s if the server isn't closed */
            const runId = this.runId
            setTimeout(() => {
                if (this.runId === runId && !this.instance?.killed) {
                    console.log(chalk.red('[ServerManager] 15s since server stop signal has come, forcing stop of', this.id))
                    this.instance?.kill('SIGKILL')
                }
            }, 15000)

            /* It's sending instruction to the server to stop */
            if (this.serverType === "spigot") {
                await this.executeCommand("stop")
            } else {
                const os = process.platform
                const pid = this.instance?.pid

                if (!pid) {
                    console.log(chalk.red("[ServerManager] Could not stop", this.id, "server cause subprocess has no PID"))
                    return
                }

                // Windows
                if (os === "win32") {
                    exec(`taskkill /pid ${pid} /f`, (err, stdout, stderr) => {
                        if (err) {
                            console.log(chalk.red("[ServerManager] Could not stop", this.id, "server, error has happened:", err.message))
                            this.setState("ON")
                            return
                        }

                        if (stderr) {
                            console.log(chalk.red("[ServerManager] Could not stop", this.id, "server, error has happened:", stderr))
                            this.setState("ON")
                            return
                        }

                        this.instance?.kill("SIGKILL")
                        console.log(chalk.yellow(`[ServerManager] killed ${this.id} server (pid: ${pid}). stdout: ${stdout}`))
                    })
                } else {
                    console.log(chalk.red("[ServerManager] Could not stop", this.id, "server cause OS is not supported, trying a subprocess.kill (result no guaranteed)"))
                    this.instance?.kill("SIGKILL")
                }
            }

        } else {
            console.log(chalk.red("[ServerManager] Attemped to stop", this.id, " ERROR: Server instance is null or the server is not stoppable"))
        }
    }

    async restart() {
        if (this.restartable) {
            console.log(chalk.yellow("[ServerManager] Restarting", this.id, "server"))
            this.stop()
            this.start()

        } else {
            console.log(chalk.red("[ServerManager] Attemped to restart", this.id, " ERROR: Server is not restartable"))
        }
    }

    async executeCommand(cmd: string) {
        this.instance?.stdin?.write(cmd + "\n")
        console.log(chalk.blue("[ServerManager] Successfully executed '", cmd, "' command on", this.id, "reponse:"))
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
        if (this.debug) console.log(chalk.grey("[ServerManager] [" + this.id.slice(0, 5) + "]", d))
        this.logs.push(d)
        this.manager?.sendServerLogs(this.id, JSON.stringify(this.logs))

        /* It's waiting for the server to be ON */
        if (this.state === "STARTING") {
            const loadedConditions = [
                this.logs.some(x => x.includes("Enabled BungeeCord version")) && this.logs.some(x => x.includes("[INFO] Listening on /")),
                this.logs.some(x => x.includes("Loading libraries, please wait...")) && this.logs.some(x => x.includes("For help, type \"help\""))
            ]
            if (loadedConditions.some(b => b === true)) {
                console.log(chalk.green("[ServerManager] marked", this.id, "server as running"))
                this.setState("ON")
            }

            if (loadedConditions[0] === true) this.serverType = "bungeecord"
            if (loadedConditions[1] === true) this.serverType = "spigot"
        }
    }

    handleError(data: string) {
        const d = data.toString()
        if (this.debug) console.error("[ServerManager] [" + this.id.slice(0, 5) + "]", d)
        this.logs.push(d)
        this.manager?.sendServerLogs(this.id, JSON.stringify(this.logs))
    }

    handleClose() {
        console.log(chalk.yellow("[ServerManager] Server", this.id, "process has stopped"))
        this.instance?.kill()
        this.instance = null
        this.setState("OFF")
        this.runId = ""
        this.logs = []
    }

    /* getters */

    setState(newState: ServerState) {
        this.manager?.sendServerState(this.id, newState)
        this.state = newState
    }

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

    get cwd() {
        let parsedPath = this.path;
        parsedPath = parsedPath.replace(/(?<!\/)\/(?!\/)/g, "\\") // replacing slashes with anti slashes
        parsedPath = parsedPath.replace(/(?<!\/\/)\/\/(?!\/\/)/g, "\\") // replacing double slashes with anti slashes
        const jarFilename = parsedPath.split("\\")[parsedPath.split("\\").length - 1];
        const cwd = parsedPath.replace(jarFilename, "")
        return cwd
    }
}

class ServerManager {
    instances: ServerInstance[] = [];
    ioServer: IOServer | null = null;

    constructor() {
        this.initSftp()

        console.log(chalk.yellow("[ServerManager] Starting WebSocket server..."))

        this.ioServer = new IOServer({
            cors: {
                origin: 'http://localhost:3000'
            }
        })
        this.ioServer.listen(4000)

        const handleSocketConnection = this.handleSocketConnection.bind(this)
        this.ioServer.on('connection', handleSocketConnection)
    }

    register(id: string, path: string, cmdline: string) {
        this.instances.push(new ServerInstance(id, path, cmdline, this))
    }

    getInstance(id: string) {
        return this.instances.find(instance => instance.id === id);
    }

    handleSocketConnection(socket: Socket) {
        console.log(chalk.cyan("[ServerManager] New connection to WebSocket", socket.id))

        for (const instance of this.instances) {
            this.sendServerState(instance.id, instance.state, socket)
            this.sendServerLogs(instance.id, JSON.stringify(instance.logs))
        }
    }

    sendServerState(id: string, state: ServerState, s: Socket | undefined = undefined) {
        if (s === undefined) {
            const sockets = this.ioServer?.sockets.sockets
            if (!sockets) return
            sockets.forEach(socket => {
                if (!socket.connected) return
                socket.emit('serverStateUpdate', {
                    serverId: id,
                    state
                })
                console.log(chalk.cyan("[ServerManager] Send server", id, "state to", socket.id))
            })
        } else {
            if (!s.connected) return
            s.emit('serverStateUpdate', {
                serverId: id,
                state
            })
            console.log(chalk.cyan("[ServerManager] Send server", id, "state to", s.id))
        }
    }

    sendServerLogs(id: string, logs: string, s: Socket | undefined = undefined) {
        if (s === undefined) {
            const sockets = this.ioServer?.sockets.sockets
            if (!sockets) return
            sockets.forEach(socket => {
                if (!socket.connected) return
                socket.emit('serverLogs', {
                    serverId: id,
                    logs
                })
                console.log(chalk.cyan("[ServerManager] Send server", id, "state to", socket.id))
            })
        } else {
            if (!s.connected) return
            s.emit('serverLogs', {
                serverId: id,
                logs
            })
            console.log(chalk.cyan("[ServerManager] Send server", id, "state to", s.id))
        }
    }

    async initSftp() {
        console.log(chalk.blueBright(`[ServerManager] Initializing SFTP Server`))

        console.log(join(__dirname, "host.key"))
        const keyExists = existsSync(join(__dirname, "host.key"))

        if (!keyExists) {
            const asyncExec = util.promisify(exec)
            const cmd = `ssh-keygen -t rsa -b 4096 -f host.key -N ""`
            const { stderr, stdout } = await asyncExec(cmd, {
                cwd: __dirname
            })

            if (stderr) {
                console.log(chalk.red("[ServerManager] Error has happened while trying to create a key for ssh server"))
                console.error(stderr)
            }

            console.log(chalk.blueBright("[ServerManager] Create key at", join(__dirname, "host.key"), "for SSH Server"))
        }

        const sshServer = new SSHServer({
            hostKeys: [readFileSync(join(__dirname, "host.key"))]
        }, (client) => {
            console.log("Client Connected")

            let username: any = null

            client.on('authentication', (ctx) => {
                if (this.instances.some(instance => instance.id === ctx.username)) {
                    username = ctx.username
                    ctx.accept()
                } else {
                    ctx.reject()
                }
            }).on('ready', () => {
                console.log(chalk.blueBright("[ServerManager] A new client has connected to SSH"))

                client.on('session', (accept, reject) => {
                    const session = accept()

                    session.on('sftp', (accept, reject) => {
                        console.log(chalk.blueBright("[ServerManager] SFTP Session started", username))

                        if (username) {
                            const serverInstance = this.instances.find(instance => instance.id === username)

                            if (serverInstance) {
                                const sftpStream = accept()

                                const sftpServer = new SFTPServer(sftpStream, {
                                    readOnly: false,
                                    root: serverInstance.cwd
                                })

                                sftpServer.on('error', (err: any) => {
                                    console.log(chalk.red("[ServerManager] An error has happened on the SFTP:"))
                                    console.error(err)
                                })

                                sftpServer.on('end', () => {
                                    console.log(chalk.blueBright("[ServerManager] SFTP Session", username, "ended"))
                                })
                            } else {
                                reject()
                            }
                        } else {
                            reject()
                        }
                    })
                }).on('end', () => {
                    console.log(chalk.blueBright("[ServerManager] SSH Client", username, "disconnected"))
                })
            })
        })

        sshServer.listen(2022, '0.0.0.0', () => {
            console.log(chalk.blueBright(`[ServerManager] SFTP Server is Listening on 0.0.0.0:2022`))
        })
    }
}

export async function getServerManager() {
    if (!(global as any).SERVER_MANAGER) {
        (global as any).SERVER_MANAGER = new ServerManager();
    }

    return (global as any).SERVER_MANAGER as ServerManager;
}