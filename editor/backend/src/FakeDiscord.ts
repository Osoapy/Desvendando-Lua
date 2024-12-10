import { IMessageStruct } from './interfaces';
import { spawn } from 'child_process';
import { Engine, Logger } from '@promisepending/logger.js';
import { LoggableClass } from './utils';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import ws from 'ws';
import { DiscordServer, Application, Guild, User } from './discordMock/';
import { Main } from './';
import { Stream } from 'stream';

export class FakeDiscord extends LoggableClass {
  private runnerProcess: any;
  private isRunning: boolean;
  private userName: string;
  private logger: Logger;
  private uuid: string;
  private icon: number;
  private socket: ws;
  private discordUser?: User;
  private discordBotUser: User;
  private mainServer: Main;
  private discordManager: DiscordServer;
  private userGuild?: Guild;
  private botApplication?: Application;

  constructor(engine: Engine, socket: ws, discordManager: DiscordServer, mainServer: Main) {
    super(engine);
    this.socket = socket;
    this.uuid = randomUUID();
    // set icon as a random number between 0 and 5
    this.icon = Math.floor(Math.random() * 6);
    this.logger = new Logger({ prefixes: [`User-${this.uuid}`] });
    this.loggerEngine.registerLogger(this.logger);
    this.mainServer = mainServer;
    this.discordManager = discordManager;
    
    this.logger.debug(`Hello! i'm ${this.uuid}!`);

    this.sendEvent('RegisterUUID', this.uuid);
    this.socket.on('message', this.messageHandler.bind(this));
    this.socket.on('close', this.onDisconnect.bind(this));
  }

  getName(): string {
    return this.userName;
  }

  getUUID(): string {
    return this.uuid;
  }

  getUserApplication(): Application | undefined {
    return this.botApplication;
  }

  sendEvent(eventName: string, data: any) {
    this.socket.send(JSON.stringify({ name: eventName, data }));
  }

  getDiscordManager(): DiscordServer {
    return this.discordManager;
  }

  messageHandler(message: string) {
    let msg: IMessageStruct | null = null;
    try {
      msg = JSON.parse(message);
    } catch {
      this.logger.error('Invalid message received from client!');
    }
    if (!msg) return;

    if (msg.name === 'setName') this.setName(msg.data.toString());
    else if (msg.name === 'executeCode') this.runInterpreter(msg.data.toString());
    else if (msg.name === 'stopCodeExecution') this.stopCodeExecution();
    else if (msg.name === 'mensagem') this.handleClientMessage(msg.data.toString());
    else if (msg.name === 'appData') this.createOrUpdateApplication(msg.data); 
    else if (msg.name === 'botData') this.createOrUpdateBot(msg.data);
    else if (msg.name === 'terminalMessage') this.terminalMessage(msg.data.toString());

    if (this.userName) this.sendStatus();
  }

  setName(name: string) {
    if (this.mainServer.findUserByName(name)) {
      this.sendEvent('invalidName', { errorTitle: 'Usuário Invalido!', errorBody: 'Um usuário com este nome já existe!'});
    } else {
      this.userName = name;
      this.discordUser = this.discordManager.createUser(this, this.userName, this.icon);
      this.userGuild = this.discordManager.createGuild(this, `Guild do ${this.userName}`, '0');
      this.sendEvent('channelId', this.userGuild.channels[0]?.id);
    }
  }

  sendStatus() {
    this.logger.debug('Sending user status...');
    this.sendEvent('userStatus', {
      uuid: this.uuid,
      name: this.userName,
      icon: this.icon,
    })
  }

  handleClientMessage(message: string) {
    this.sendEvent('ChatMessage', {
      username: this.userName,
      icon: this.icon,
      content: message,
    });
    this.discordUser?.sendMessage(this.userGuild!.channels[0]!, message);
  }

  handleBotMessage(message: string) {
    this.sendEvent('ChatMessage', {
      username: this.discordBotUser?.username,
      icon: this.discordBotUser?.avatar,
      content: message,
    });
  }

  createOrUpdateApplication(data: { name: string, description: string, botName: string }) {
    if (!this.botApplication) {
      this.botApplication = this.discordManager.createApplication(data.name, data.description, this.discordUser!);
    } else {
      this.botApplication.name = data.name;
      this.botApplication.description = data.description;
    }
    this.sendEvent('ApplicationEvent', null);
  }

  createOrUpdateBot(data: { name: string }) {
    if (!this.discordBotUser) {
      const botPFP = Math.floor(Math.random() * 6);
      this.discordBotUser = this.discordManager.createBot(this, data.name, botPFP, this.botApplication!);
      this.userGuild?.addMember(this.discordBotUser);
      this.discordBotUser.sendMessage(this.userGuild?.channels[0]!,`Olá eu sou ${data.name}`);
      this.sendEvent('botToken', this.discordBotUser.getToken());
    } else {
      this.discordBotUser.username = data.name;
    }
    this.sendEvent('updateBot', { name: this.discordBotUser.username, icon: this.discordBotUser.avatar });
  }

  getBotUser(): User | undefined {
    return this.discordBotUser;
  }

  getDiscordUser(): User | undefined {
    return this.discordUser;
  }

  formatLogMessage(message: any): string {
    const errorMsg = message.toString();
    const splitEM = errorMsg.split('stack ABOBORAtraceback:');
    const finalMsg = splitEM[0].replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\s\|\s/g, '');
    return finalMsg;
  }

  runInterpreter(code: string) {
    if (this.isRunning) return this.stopCodeExecution();
    this.isRunning = true;
    // write the code to a file
    const userCodeFile = path.resolve(__dirname, '..', '..', 'interpreter', 'cache', this.uuid + '.lua');
    if (!fs.existsSync(path.resolve(__dirname, '..', '..', 'interpreter', 'cache'))) fs.mkdirSync(path.resolve(__dirname, '..', '..', 'interpreter', 'cache'));
    let userCode = '';
    userCode += 'os.execute = function(...) print("os.execute está desativado!") return nil, nil, nil end\n';
    userCode += `local ffi = require('ffi')
ffi.cdef[[
  int fcntl(int fd, int cmd, ...);
  int ioctl(int fd, unsigned long request, ...);
  static const int F_GETFL = 3;
  static const int F_SETFL = 4;
  static const int O_NONBLOCK = 0x800;
]]
local fd = 0 -- stdin
local flags = ffi.C.fcntl(fd, ffi.C.F_GETFL)
ffi.C.fcntl(fd, ffi.C.F_SETFL, bit.band(flags, bit.bnot(ffi.C.O_NONBLOCK)))\n`;
    userCode += code;

    fs.writeFileSync(userCodeFile, userCode);

    this.sendEvent('startingCodeExecution', null);

    // creates a sub-process to run the interpreter
    this.runnerProcess = spawn(path.resolve(__dirname, '..', '..', 'interpreter', 'luvit'), [userCodeFile], { stdio: 'pipe', cwd: path.resolve(__dirname, '..', '..', 'interpreter'), shell: true });
    
    this.runnerProcess.stdin.setDefaultEncoding('utf-8');
    this.runnerProcess.stdin.on('error', (err: any) => {
      this.logger.error('Error on stdin:', err);
    });

    this.runnerProcess.stdout.on('data', (data: any) => {
      this.sendEvent('interpreterOutput', this.formatLogMessage(data));
    });

    this.runnerProcess.stderr.on('data', (data: any) => {
      this.sendEvent('interpreterOutputErr', this.formatLogMessage(data));
    });

    this.runnerProcess.on('close', (code: number) => {
      this.sendEvent('interpreterClosed', code);
      this.isRunning = false;
    });
  }

  stopCodeExecution() {
    this.isRunning = false;
    if (this.runnerProcess) this.runnerProcess.kill();
  }

  terminalMessage(message: string) {
    if (this.runnerProcess && this.runnerProcess.stdin.writable) {
      this.runnerProcess.stdin.write(message + '\n');
    }
  }

  onDisconnect() {
    this.logger.info('Client disconnected!');
    // delete their cache file
    const userCodeFile = path.resolve(__dirname, '..', '..', 'interpreter', 'cache', this.uuid + '.lua');
    if (this.runnerProcess) this.runnerProcess.kill();
    if (fs.existsSync(userCodeFile)) fs.unlinkSync(userCodeFile);
    if (this.discordUser) this.discordManager.deleteUser(this.discordUser);
    if (this.discordBotUser) this.discordManager.deleteUser(this.discordBotUser);
    if (this.userGuild) this.discordManager.deleteGuild(this.userGuild);
  }
}
