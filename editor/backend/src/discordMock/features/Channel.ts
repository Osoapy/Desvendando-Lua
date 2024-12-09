import { DiscordSnowflake } from '@sapphire/snowflake';
import { Guild, Message, User } from './';

export class Channel {
  public id: string;
  public type: number = 0;
  public position: number = 0;
  public permission_overwrites: any[] = [];
  public name: string;
  public nsfw: boolean = false;
  public lastMessageId: string | null = null;
  public permissions: string = "3072";
  public parentID: string | null = null;
  
  public messages: Message[] = [];
  private guild: Guild;

  constructor(guild: Guild, name: string) {
    this.id = DiscordSnowflake.generate().toString();
    this.guild = guild;
    this.name = name;
  }

  public toMentionJSON(): Record<string, unknown> {
    return {
      id: this.id,
      guild_id: this.guild.id,
      name: this.name,
      type: this.type,
    };
  }

  public sendMessage(author: User, content: string): Message {
    const message = new Message(this.id, author, content);
    this.messages.push(message);
    this.lastMessageId = message.id;
    author.getMainUser().getDiscordManager().getWebSocketServer().sendDiscordMessage(this.guild, message);
    return message;
  }

  public toDiscordJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      guild_id: this.guild.id,
      position: this.position,
      permission_overwrites: this.permission_overwrites,
      name: this.name,
      nsfw: this.nsfw,
      last_message_id: this.lastMessageId,
      permissions: this.permissions,
      parent_id: this.parentID,
    };
  }
}
