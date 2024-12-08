import { ConsoleEngine, Engine, Logger } from '@promisepending/logger.js';
import { FakeDiscord } from './FakeDiscord';
import { LoggableClass } from './utils';
import Express from 'express';
import path from 'path';
import fs from 'fs';
import ws from 'ws';
import { DiscordServer } from './discordMock/DiscordServer';

const serverPort = 2018;
const webserverPort = 2019;

export class Main extends LoggableClass {
  private logger: Logger;
  private wsServer: ws.Server;
  private Users: FakeDiscord[];
  private app: Express.Application;
  private discordManager: DiscordServer;

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

    this.discordManager = new DiscordServer();

    this.logger.info('Starting MiniLua Backend...');
  }

  startWebServer() {
    this.app = Express();
    this.app.use(Express.json());
    this.app.use('/assets', Express.static(path.resolve(__dirname, '..', '..', '..', 'assets')));
    this.app.use('/editor/assets', Express.static(path.resolve(__dirname, '..', '..', 'assets')));
    this.app.get('/', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', 'index.html')));
    this.app.get('/index.html', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', 'index.html')));
    this.app.get('/style.css', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', 'style.css')));
    this.app.get('/editor/', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', 'index.html')));
    this.app.get('/editor/index.html', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', 'index.html')));
    this.app.get('/editor/index.css', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', 'index.css')));
    this.app.get('/editor/index.js', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', 'index.js')));

    ///////////////////////////////////

    this.app.get('/api/v8/user/@me', (req, res) => {
      const authorization = req.headers.authorization; // token gerado pelo fakediscord
      if (!authorization) {
        res.sendStatus(403);
        return;
      }
      const owner = this.Users.find((user) => user.getBotUser()?.getToken() === authorization);
      if (!owner) {
        res.sendStatus(403);
        return;
      }
      res.json(owner.getBotUser()!.toDiscordJSON());
    });

    this.app.get('/api/v8/gateway', (_, res) => {
      res.json({
        url: `ws://localhost:${serverPort}`,
      });
    });

    this.app.get('/api/v8/gateway/bot', (_, res) => {
      res.json({
        url: `ws://localhost:${serverPort}`,
        "shards": 1,
        "session_start_limit": {
          "total": 1000,
          "remaining": 999,
          "reset_after": 14400000,
          "max_concurrency": 1
        }
      });
    });

    ///////////////////////////////////

    this.app.listen(webserverPort, () => {
      this.logger.info(`Web server started on port ${serverPort}`);
    });
  }

  startTerminalServer() {
    this.wsServer = new ws.Server({ port: serverPort });
    this.wsServer.on('connection', (socket) => {
      const user = new FakeDiscord(this.loggerEngine, socket, this.discordManager, this);
      this.Users.push(user);
      socket.on('close', () => {
        this.Users = this.Users.filter((u) => u !== user);
      });
    })
  }

  findUserByName(name: string): FakeDiscord | undefined {
    return this.Users.find((value) => value.getName() === name);
  }
}

const main = new Main(new ConsoleEngine({ debug: true }));
main.startTerminalServer();
main.startWebServer();
