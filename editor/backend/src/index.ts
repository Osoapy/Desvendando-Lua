import { ConsoleEngine, Engine, Logger,  } from '@promisepending/logger.js';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import fs from 'fs';
import ws from 'ws';
import path from 'path';

const serverPort = 2018;

interface IMessageStruct {
  name: string,
  data: any
}

interface chatMessage {}
interface UserMessage extends chatMessage {}
interface BotMessage extends chatMessage {}
interface BotSettings {}

class LoggableClass {
  public loggerEngine: Engine;
  constructor(engine: Engine) {
    this.loggerEngine = engine;
  }
}

class FakeDiscord extends LoggableClass {
  private logger: Logger;
  private uuid: string;
  private socket: ws;
  private userName: string;
  private icon: number;
  private chat: (UserMessage | BotMessage)[];
  private botSettings: BotSettings;
  private runnerProcess: any;
  private isRunning: boolean;

  constructor(engine: Engine, socket: ws) {
    super(engine);
    this.socket = socket;
    this.uuid = randomUUID();
    // set icon as a random number between 0 and 5
    this.icon = Math.floor(Math.random() * 6);
    this.logger = new Logger({ prefixes: [`User-${this.uuid}`] });
    this.loggerEngine.registerLogger(this.logger);

    this.logger.debug(`Hello! i'm ${this.uuid}!`);

    this.sendEvent('RegisterUUID', this.uuid);
    this.socket.on('message', this.messageHandler.bind(this));
    this.socket.on('close', this.onDisconnect.bind(this));
  }

  getUUID(): string {
    return this.uuid;
  }

  sendEvent(eventName: string, data: any) {
    this.socket.send(JSON.stringify({ name: eventName, data }));
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

    this.sendStatus();
  }

  setName(name: string) {
    this.userName = name;
  }

  sendStatus() {
    this.logger.debug('Sending user status...');
    this.sendEvent('userStatus', {
      uuid: this.uuid,
      name: this.userName,
      icon: this.icon,
    })
  }

  runInterpreter(code: string) {
    if (this.isRunning) this.stopCodeExecution();
    // write the code to a file
    const userCodeFile = path.resolve(__dirname, '..', 'cache', this.uuid + '.lua');
    if (!fs.existsSync(path.resolve(__dirname, '..', 'cache'))) fs.mkdirSync(path.resolve(__dirname, '..', 'cache'));
    fs.writeFileSync(userCodeFile, code);

    this.sendEvent('startingCodeExecution', null);

    // creates a sub-process to run the interpreter
    this.runnerProcess = spawn(path.resolve(__dirname, '..', 'interpreter', 'luvit'), [userCodeFile], { stdio: 'pipe' });
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
  }
}

class Main extends LoggableClass {
  private logger: Logger;
  private wsServer: ws.Server;
  private Users: FakeDiscord[];

  constructor(engine: Engine) {
    super(engine);
    this.logger = new Logger({
      prefixes: ['MiniLua-Backend'],
      coloredBackground: true,
      allLineColored: true,
      disableFatalCrash: true,
    });
    engine.registerLogger(this.logger);
    this.Users = [];

    this.logger.info('Starting MiniLua Backend...');
  }

  startWebServer() {

  }

  startTerminalServer() {
    this.wsServer = new ws.Server({ port: serverPort });
    this.wsServer.on('connection', (socket) => {
      const user = new FakeDiscord(this.loggerEngine, socket);
      this.Users.push(user);
    })
  }
}

const main = new Main(new ConsoleEngine({ debug: true }));
main.startTerminalServer();
main.startWebServer();