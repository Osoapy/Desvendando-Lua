import { Application, Guild, User } from './features';
import { FakeDiscord } from '../FakeDiscord';
import { WebSocketServer } from './servers';

export class DiscordServer {
  private applications: Map<User, Application> = new Map();
  private validUsers: Map<string, User> = new Map();
  private guilds: Map<User, Guild> = new Map();

  private wss: WebSocketServer;
  
  private apiVersion: number = 8;

  constructor(wsPort: number) {
    this.wss = new WebSocketServer(this, wsPort);
  }

  public createApplication(name: string, description: string, owner: User): Application {
    const application = new Application(name, description, owner);
    this.applications.set(owner, application);
    return application;
  }

  public deleteApplication(application: Application): void {
    this.applications.delete(application.owner);
  }

  public createBot(mainUser: FakeDiscord, username: string, avatar: number, application: Application): User {
    const user = this.createUser(mainUser, username, avatar, true);
    application.setBot(user);
    this.validUsers.set(username, user);
    return user;
  }

  public createGuild(mainUser: FakeDiscord, name: string, icon: string): Guild {
    const guild = new Guild(name, icon, mainUser.getDiscordUser()!);
    this.guilds.set(mainUser.getDiscordUser()!, guild);
    return guild;
  }

  public deleteGuild(guild: Guild): void {
    this.guilds.delete(guild.owner);
  }

  public createUser(mainUser: FakeDiscord, username: string, avatar: number, isBot: boolean = false): User {
    const user = new User(mainUser, username, avatar, isBot);
    this.validUsers.set(username, user)
    return user;
  }

  public deleteUser(user: User): void {
    this.validUsers.delete(user.username);
  }

  public getUserGuilds(user: User): Guild[] {
    return Array.from(this.guilds.values()).filter(guild => guild.getMember(user));
  }

  public getUserById(id: string): User | undefined {
    return Array.from(this.validUsers.values()).find(user => user.id === id);
  }

  public getUserByToken(token: string): User | undefined {
    return Array.from(this.validUsers.values()).find(user => user.getToken() === token);
  }

  public getBotApplication(user: User): Application | undefined {
    return Array.from(this.applications.values()).find(application => application.getBot() === user);
  }

  public getWebSocketServer(): WebSocketServer {
    return this.wss;
  }

  public getApiVersion(): number {
    return this.apiVersion;
  }
}
