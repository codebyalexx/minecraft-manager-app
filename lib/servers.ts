"use server"

import { ChildProcess, exec, spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { lstat, readdir, unlink } from "fs/promises";
import { join } from "path";
import chalk from "chalk"
import { Server as IOServer, Socket } from "socket.io"
import util from "util"
import ftpd from "ftpd"
import { FileInfo, Client as FTPClient } from "basic-ftp"

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
    ftpClient: any | null = null;


    /* Processes */
    instance: ChildProcess | null = null;

    constructor(id: string, path: string, cmdline: string, manager: ServerManager) {
        this.id = id;
        this.path = path;
        this.cmdline = cmdline;
        this.manager = manager;
        console.log(chalk.green("[ServerManager] Registered instance of server ", id))
        this.requireFtp()
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
            } else if (this.serverType === "bungeecord") {
                await this.executeCommand("end")
            } else {
                this.instance?.kill("SIGTERM")
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
        const stdin = this.instance?.stdin

        stdin?.write(cmd + "\n\r")

        if (stdin) { console.log(chalk.blue("[ServerManager] Successfully executed '", cmd, "' command on", this.id)) } else {
            console.log(chalk.red("[ServerManager] An error has happened while trying to execute commad on", this.id, ": STDIN is no present"))
        }
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

    async requireFtp() {
        return new Promise(async (resolve) => {
            const interv = setInterval(async () => {
                if (this.manager?.ftpStarted === false) return;
                if (this.ftpClient === null) {
                    this.ftpClient = new FTPClient()
                    this.ftpClient.verbose = false

                    await this.ftpClient.access({
                        host: "localhost",
                        user: this.id,
                        password: "",
                        secure: false,
                    })

                    clearInterval(interv);
                    resolve(true)
                } else {
                    if (!this.ftpClient.connected) {
                        await this.ftpClient.access({
                            host: "localhost",
                            user: this.id,
                            password: "",
                            secure: false,
                        })
                    }

                    clearInterval(interv)
                    resolve(true)
                }
            }, 500);
        })
    }

    async listDir(path: string) {
        return new Promise(async (resolve) => {
            const rvalue: any[] = []

            // wait for ftp connection if needed
            await this.requireFtp()

            const dirFiles: FileInfo[] = await this.ftpClient.list(path)

            for (const file of dirFiles) {
                rvalue.push({
                    type: file.isFile ? "file" : (file.isDirectory ? "dir" : "?"),
                    name: file.name,
                    modifiedAt: file.modifiedAt || file.rawModifiedAt || null,
                    size: file.size
                })
            }

            resolve(rvalue)
        })
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
    ftpStarted: boolean = false;

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

    register(id: string, path: string, cmdline: string, start: boolean) {
        const instance = new ServerInstance(id, path, cmdline, this)
        this.instances.push(instance)
        if (start) {
            instance.start()
        }
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
        console.log(chalk.blueBright(`[ServerManager] Initializing FTP Server`))

        const self = this

        const keyExists = existsSync(join(__dirname, "ftpd.key"))
        const crsExists = existsSync(join(__dirname, "ftpd.crs"))
        const crtExists = existsSync(join(__dirname, "ftpd.crt"))

        if (!keyExists) {
            const asyncExec = util.promisify(exec)
            const cmd = `openssl genpkey -algorithm RSA -out ftpd.key -pkeyopt rsa_keygen_bits:2048`
            const { stderr, stdout } = await asyncExec(cmd, {
                cwd: __dirname
            })

            console.log(chalk.blueBright("[ServerManager] Created key at", join(__dirname, "ftpd.key"), "for FTP Server. Outputs:"))
            console.log(chalk.gray(stderr, stdout))
        }

        if (!crsExists) {
            const asyncExec = util.promisify(exec)
            const cmd = `openssl req -new -key ftpd.key -out ftpd.csr -subj "/C=FR/ST=Ile-de-France/L=Paris/O=CodeByAlexx/OU=IT/CN=imalexx.com"`
            const { stderr, stdout } = await asyncExec(cmd, {
                cwd: __dirname
            })

            console.log(chalk.blueBright("[ServerManager] Created CRS at", join(__dirname, "ftpd.crs"), "for FTP Server. Outputs:"))
            console.log(chalk.gray(stderr, stdout))
        }

        if (!crtExists) {
            const asyncExec = util.promisify(exec)
            const cmd = `openssl x509 -req -in ftpd.csr -signkey ftpd.key -out ftpd.crt -days 365`
            const { stderr, stdout } = await asyncExec(cmd, {
                cwd: __dirname
            })

            console.log(chalk.blueBright("[ServerManager] Created CRT at", join(__dirname, "ftpd.crt"), "for FTP Server. Outputs:"))
            console.log(chalk.gray(stderr, stdout))
        }

        const ftpOptions = {
            host: "127.0.0.1",
            port: 21,
            tls: {
                key: readFileSync(join(__dirname, "ftpd.key")),
                cert: readFileSync(join(__dirname, "ftpd.crt"))
            }
        }

        const ftp = new ftpd.FtpServer(ftpOptions.host, {
            getInitialCwd: function (connection, callback: any) {
                if (callback) callback(null, '/')
            },
            getRoot: function (connection) {
                const { username } = connection

                const serverInstance = self.instances.find((instance) => instance.id === username)

                if (serverInstance) return serverInstance.cwd

                return process.cwd()
            },
            pasvPortRangeStart: 1025,
            pasvPortRangeEnd: 1050,
            tlsOptions: ftpOptions.tls,
            allowUnauthorizedTls: true,
            useWriteFile: false,
            useReadFile: false,
            uploadMaxSlurpSize: 7000,
            // @ts-ignore
            allowedCommands: [
                'XMKD',
                'AUTH',
                'TLS',
                'SSL',
                'USER',
                'PASS',
                'PWD',
                'OPTS',
                'TYPE',
                'PORT',
                'PASV',
                'LIST',
                'CWD',
                'MKD',
                'SIZE',
                'STOR',
                'MDTM',
                'DELE',
                'QUIT',
                'EPSV',
                'RETR',
                'MLSD'
            ],
            logLevel: 0
        })

        ftp.on('error', function (error: any) {
            console.log('FTP Server error:', error)
        })

        ftp.on('client:connected', function (connection: any) {
            let username: any = null

            console.log('client connected: ' + connection.remoteAddress)

            connection.on('command:user', function (user: any, success: any, failure: any) {
                username = user
                success()
            })

            connection.on('command:pass', function (pass: any, success: any, failure: any) {
                success(username)
            })
        })

        ftp.debugging = 4
        ftp.listen(ftpOptions.port)
        console.log('Listening on port ' + ftpOptions.port)
        this.ftpStarted = true;
    }
}

export async function getServerManager() {
    if (!(global as any).SERVER_MANAGER) {
        (global as any).SERVER_MANAGER = new ServerManager();
    }

    return (global as any).SERVER_MANAGER as ServerManager;
}