import { DiscordServer } from '../DiscordServer';
import { IOPCode2 } from '../interfaces';
import { Message, Guild } from '../features/';
import { Client } from './Client';
import WebSocket from 'ws';

export class WebSocketServer {
  private discordServer: DiscordServer;
  private clients: Client[] = [];
  private wss: WebSocket.Server;

  constructor(discordServer: DiscordServer, port: number) {
    this.wss = new WebSocket.Server({ port });
    this.discordServer = discordServer;

    this.wss.on('connection', (ws: WebSocket) => this.onConnection(ws));
  }

  private onConnection(ws: WebSocket): void {
    console.log('[DISCORD] Connection established');
    ws.on('message', (message: string | Buffer) => this.onMessage(ws, message));
    ws.on('close', () => {
      console.log('[DISCORD] Connection closed');
      this.clients = this.clients.filter((client) => client.getSocket() !== ws);
    });
    const client = new Client(this.discordServer, ws)
    this.clients.push(client);
    client.sendHello();
  }

  private onIdentify(ws: WebSocket, data: IOPCode2): void {
    const token = data.d.token.split(' ')[1];
    if (!token) {
      this.disconnectClientByInvalidToken(ws);
      return;
    }

    const user = this.discordServer.getUserByToken(token);
    if (!user) {
      this.disconnectClientByInvalidToken(ws);
      return;
    }

    console.log(`[DISCORD] Hello, ${user.username} O/`);

    const client = this.clients.find((client) => client.getSocket() === ws);
    if (!client) {
      console.log(`[DISCORD] Client not found WTF O_o`);
      this.disconnectClientByInvalidToken(ws);
      return;
    }

    client.setDiscordUser(user);
    client.setIdentity(data.d);
    client.setReady();
  }

  private disconnectClientByInvalidToken(ws: WebSocket): void {
    console.log('[DISCORD] Invalid token');
      ws.send(
        JSON.stringify({
          op: 9,
          d: false,
        })
      );
      ws.close();
      this.clients = this.clients.filter((client) => client.getSocket() !== ws);
  }

  private onMessage(ws: WebSocket, message: string | Buffer): void {
    const data = JSON.parse(message.toString());
    switch (data.op) {
      case 1:
        ws.send(
          JSON.stringify({
            op: 11,
          })
        );
        break;
      case 2:
        this.onIdentify(ws, data);
        break;
      default:
        console.log(`[DISCORD] Unhandled op code: ${data.op}`);
    }
  }

  public sendDiscordMessage(guild: Guild, message: Message): void {
    guild.getMembers().forEach((member) => {
      const client = this.clients.find((client) => client.getDiscordUser().id === member.user.id);
      if (client) {
        client.sendMessage(guild, message);
      }
    });
  }
}
