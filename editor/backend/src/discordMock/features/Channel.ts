import { DiscordSnowflake } from '@sapphire/snowflake';
import { Message } from './Message';

export class Channel {
  public id: string;
  public type: number = 0;
  public guild_id: string;
  public position: number = 0;
  public permission_overwrites: any[] = [];
  public name: string;
  public nsfw: boolean = false;
  public lastMessageId: string | null = null;
  public permissions: string = "3072";

  public messages: Message[] = [];

  constructor(guild_id: string, name: string) {
    this.id = DiscordSnowflake.generate().toString();
    this.guild_id = guild_id;
    this.name = name;
  }


  public toDiscordJSON() {
    return {
      id: this.id,
      type: this.type,
      guild_id: this.guild_id,
      position: this.position,
      permission_overwrites: this.permission_overwrites,
      name: this.name,
      nsfw: this.nsfw,
      last_message_id: this.lastMessageId,
      permissions: this.permissions,
    };
  }
}
