import { DiscordServer, Guild, User, Message } from '..';
import { randomName } from '../../utils';
import { IOPCode2 } from '../interfaces';
import WebSocket from 'ws';

export class Client {
  private discordServer: DiscordServer;
  private isReady: boolean = false;
  private identity: IOPCode2['d'];
  private eventList: any[] = [];
  private discordUser: User;
  private sessionID: string;
  private ws: WebSocket;

  constructor(discordServer: DiscordServer, ws: WebSocket) {
    this.discordServer = discordServer;
    this.sessionID = randomName(10);
    this.ws = ws;
  }

  public sendHello(): void {
    this.send({
      op: 10,
      d: {
        heartbeat_interval: 45000,
      }
    });
  }

  public setDiscordUser(user: User): void {
    this.discordUser = user;
  }

  public setIdentity(identity: IOPCode2['d']): void {
    this.identity = identity;
  }

  public getDiscordUser(): User {
    return this.discordUser;
  }

  public send(data: any): void {
    this.eventList.push(data);
    this.ws.send(JSON.stringify(data));
  }

  public setReady(): void {
    if (this.isReady) return;
    this.isReady = true;
    const guilds = this.discordServer.getUserGuilds(this.discordUser)
    this.send({
      op: 0,
      d: {
        v: this.discordServer.getApiVersion(),
        user: this.discordUser.toDiscordJSON(),
        guilds: guilds.map((guild) => { return { id: guild.id, unavailable: true }  }),
        session_id: this.sessionID,
        resume_gateway_url: 'ws://example.com',
        shard: this.identity.shard,
        application: this.discordServer.getBotApplication(this.discordUser)?.toDiscordJSON(),
        private_channels: [], // Antigamente dm vinha aqui
        relationships: [], // Legacy
        presences: [], // Legacy
        notes: {}, // Legacy
      },
      s: this.eventList.length,
      t: 'READY'
    });
    this.addedToGuilds(guilds)
  }

  public addedToGuilds(guilds: Guild[]): void {
    guilds.forEach((guild) => this.addedToGuild(guild));
  }

  public addedToGuild(guild: Guild): void {
    this.send({
      op: 0,
      d: {
        ...guild.toDiscordJSON(),
        ...guild.guildCreateJSONEvent()
      },
      s: this.eventList.length,
      t: 'GUILD_CREATE'
    });
  }

  public sendMessage(guild: Guild, message: Message): void {
    this.send({
      op: 0,
      d: message.toMessageCreatePayload(guild),
      s: this.eventList.length,
      t: 'MESSAGE_CREATE'
    });
  }

  public getEventList(): any[] {
    return this.eventList;
  }

  public getSocket(): WebSocket {
    return this.ws;
  }
}
