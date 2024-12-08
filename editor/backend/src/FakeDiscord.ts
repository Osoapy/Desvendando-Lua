import { IBotMessage, IBotSettings, IUserMessage, IMessageStruct } from './interfaces';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { Engine, Logger } from '@promisepending/logger.js';
import { LoggableClass } from './utils';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import ws from 'ws';
import { DiscordServer } from './discordMock/DiscordServer';
import { Application, Guild, User } from './discordMock/features';
import { Main } from 'src';

export class FakeDiscord extends LoggableClass {
  private runnerProcess: ChildProcessWithoutNullStreams;
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

  sendEvent(eventName: string, data: any) {
    this.socket.send(JSON.stringify({ name: eventName, data }));
  }

  messageHandler(message: string) {
    console.log(message.toString());
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

    if (this.userName) this.sendStatus();
  }

  setName(name: string) {
    if (this.mainServer.findUserByName(name)) {
      this.sendEvent('invalidName', { errorTitle: 'Usuário Invalido!', errorBody: 'Um usuário com este nome já existe!'});
    } else {
      this.userName = name;
      this.discordUser = this.discordManager.createUser(this, this.userName, this.icon);
      this.userGuild = this.discordManager.createGuild(this, `Guild do ${this.userName}`, '0');
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
  }

  handleBotMessage(message: string) {
    this.sendEvent('ChatMessage', {
      username: this.discordBotUser?.username,
      icon: this.discordBotUser?.avatar,
      content: message,
    });
  }

  createOrUpdateApplication(data: { name: string, description: string}) {
    if (!this.botApplication) {
      this.botApplication = this.discordManager.createApplication(data.name, data.description, this.discordUser!);
      const botPFP = Math.floor(Math.random() * 6);
      this.discordBotUser = this.discordManager.createBot(this, data.name, botPFP, this.botApplication);
      this.userGuild?.addMember(this.discordBotUser);
      this.discordBotUser.sendMessage(this.userGuild?.channels[0]!,`Olá eu sou ${data.name}`);
    } else {
      this.botApplication.name = data.name;
      this.botApplication.description = data.description;
      this.discordBotUser.username = data.name;
    }
  }

  getBotUser(): User | undefined {
    return this.discordBotUser;
  }

  getDiscordUser(): User | undefined {
    return this.discordUser;
  }

  runInterpreter(code: string) {
    if (this.isRunning) this.stopCodeExecution();
    // write the code to a file
    const userCodeFile = path.resolve(__dirname, '..', 'cache', this.uuid + '.lua');
    if (!fs.existsSync(path.resolve(__dirname, '..', 'cache'))) fs.mkdirSync(path.resolve(__dirname, '..', 'cache'));
    fs.writeFileSync(userCodeFile, code);

    this.sendEvent('startingCodeExecution', null);

    // creates a sub-process to run the interpreter
    this.runnerProcess = spawn(path.resolve(__dirname, '..', 'interpreter', 'luvit'), [userCodeFile], { stdio: 'pipe', cwd: path.resolve(__dirname, '..', 'interpreter') });
    this.runnerProcess.stdout.on('data', (data: any) => {
      this.sendEvent('interpreterOutput', data.toString());
    });

    this.runnerProcess.stderr.on('data', (data: any) => {
      this.sendEvent('interpreterOutputErr', data.toString());
    });

    this.runnerProcess.on('close', (code: number) => {
      this.sendEvent('interpreterClosed', code);
    });
  }

  stopCodeExecution() {
    if (this.runnerProcess) this.runnerProcess.kill();
  }

  onDisconnect() {
    this.logger.info('Client disconnected!');
    // delete their cache file
    const userCodeFile = path.resolve(__dirname, '..', 'cache', this.uuid + '.lua');
    if (this.runnerProcess) this.runnerProcess.kill();
    if (fs.existsSync(userCodeFile)) fs.unlinkSync(userCodeFile);
    if (this.discordUser) this.discordManager.deleteUser(this.discordUser);
    if (this.discordBotUser) this.discordManager.deleteUser(this.discordBotUser);
    if (this.userGuild) this.discordManager.deleteGuild(this.userGuild);
  }
}
