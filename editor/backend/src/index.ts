import { ConsoleEngine, Engine, Logger } from '@promisepending/logger.js';
import { DiscordServer } from './discordMock/DiscordServer';
import configs from '../configs/general.json';
import { FakeDiscord } from './FakeDiscord';
import { LoggableClass } from './utils';
import { User } from './discordMock';
import Express from 'express';
import path from 'path';
import ws from 'ws';
import fs from 'fs';


const serverPort = configs.mainWebsocketPort;
const webserverPort = configs.webServerPort;
const host = configs.host;

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

    this.discordManager = new DiscordServer(configs.discordPort);

    if (fs.existsSync(path.resolve(__dirname, '..', '..', 'interpreter', 'cache'))) {
      this.logger.info('Cleaning cache...');
      fs.rmSync(path.resolve(__dirname, '..', '..', 'interpreter', 'cache'), { recursive: true });
    }
    this.logger.info('Starting MiniLua Backend...');
  }

  startWebServer() {
    this.app = Express();
    this.app.use(Express.json());
    this.app.use('/assets', Express.static(path.resolve(__dirname, '..', '..', '..', '..', 'assets')));
    this.app.use('/editor/assets', Express.static(path.resolve(__dirname, '..', '..', '..', 'assets')));
    this.app.get('/', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', '..', 'index.html')));
    this.app.get('/index.html', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', '..', 'index.html')));
    this.app.get('/style.css', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', '..', 'style.css')));
    this.app.get('/editor/', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', 'index.html')));
    this.app.get('/editor/index.html', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', 'index.html')));
    this.app.get('/editor/index.css', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', 'index.css')));
    this.app.get('/editor/index.js', (_, res) => res.sendFile(path.resolve(__dirname, '..', '..', '..', 'index.js')));

    ///////////////////////////////////

    const getBotByAuth = (authorization?: string): User | undefined => {
      if (!authorization) return;
      const token = authorization.split(' ')[1];
      if (!token) return;
      const owner = this.Users.find((user) => user.getBotUser()?.getToken() === token);
      if (!owner) return;
      return owner.getBotUser();
    }

    this.app.post('/v8/channels/:channel/messages', (req, res) => {
      const bot = getBotByAuth(req.headers.authorization);
      if (!bot) {
        res.sendStatus(403);
        return;
      }

      const content = req.body.content;
      if (!content) {
        res.sendStatus(400);
        return;
      }

      const guild = this.discordManager.getUserGuilds(bot).find((guild) => guild.channels.find((channel) => channel.id === req.params.channel));

      if (!guild) {
        res.sendStatus(401);
        return;
      }

      const message = bot.sendMessage(guild.channels.find((channel) => channel.id === req.params.channel)!, content);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(message.toDiscordJSON()));
      res.end();
    });

    this.app.get('/v8/users/@me', (req, res) => {
      const bot = getBotByAuth(req.headers.authorization);
      if (!bot) {
        res.sendStatus(403);
        return;
      }
      const json = JSON.stringify(bot.toDiscordJSON());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(json);
      res.end();
    });

    this.app.get('/v8/oauth2/applications/@me', (req, res) => {
      const bot = getBotByAuth(req.headers.authorization);
      if (!bot) {
        res.sendStatus(403);
        return;
      }
      const json = JSON.stringify(bot.getMainUser().getUserApplication()!.toDiscordJSON());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(json);
      res.end();
    });

    this.app.get('/v8/gateway', (_, res) => {
      const json = {
        url: `ws://${host}:${configs.discordPort}/`,
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(json));
      res.end();
    });

    this.app.get('/v8/gateway/bot', (req, res) => {
      const authorization = req.headers.authorization; // token gerado pelo fakediscord
      if (!authorization) {
        res.sendStatus(403);
        return;
      }
      const token = authorization.split(' ')[1];
      if (!token) {
        res.sendStatus(403);
        return;
      }
      const owner = this.Users.find((user) => user.getBotUser()?.getToken() === token);
      if (!owner) {
        res.sendStatus(403);
        return;
      }
      const json = {
        url: `ws://${host}:${configs.discordPort}/`,
        "shards": 1,
        "session_start_limit": {
          "total": 1000,
          "remaining": 999,
          "reset_after": 14400000,
          "max_concurrency": 1
        }
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(json));
      res.end();
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

const main = new Main(new ConsoleEngine({ debug: false }));
main.startTerminalServer();
main.startWebServer();
