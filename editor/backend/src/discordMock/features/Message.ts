import { DiscordSnowflake } from '@sapphire/snowflake';
import { Channel, Guild, Role, User } from './';

export class Message {
  public id: string;
  public channelID: string;
  public author: User;
  public content: string;
  public timestamp: number = Date.now();
  public editedTimestamp: number | null = null;
  public tts: boolean = false;
  public mentionEveryone: boolean = false;
  public mentions: User[] = [];
  public mentionRoles: Role[] = [];
  public mentionChannels: Channel[] = [];
  public attachments: any[] = [];
  public embeds: any[] = [];
  public reactions: any[] = [];
  public pinned: boolean = false;
  public type: number = 0;

  public constructor(channelID: string, author: User, content: string) {
    this.id = DiscordSnowflake.generate().toString();
    this.channelID = channelID;
    this.author = author;
    this.content = content;
  }

  public edit(content: string): void {
    this.content = content;
    this.editedTimestamp = Date.now();
  }

  public toDiscordJSON(): Record<string, unknown> {
    return {
      id: this.id,
      channel_id: this.channelID,
      author: this.author.toDiscordJSON(),
      content: this.content,
      timestamp: this.timestamp,
      edited_timestamp: this.editedTimestamp,
      tts: this.tts,
      mention_everyone: this.mentionEveryone,
      mentions: this.mentions.map((user) => user.toDiscordJSON()),
      mention_roles: this.mentionRoles.map((role) => role.toDiscordJSON()),
      mention_channels: this.mentionChannels.map((channel) => channel.toDiscordJSON()),
      attachments: this.attachments,
      embeds: this.embeds,
      reactions: this.reactions,
      pinned: this.pinned,
      type: this.type,
    };
  }

  public toMessageCreatePayload(guild: Guild): Record<string, unknown> {
    return {
      ...this.toDiscordJSON(),
      guild_id: guild.id,
      member: guild.getMember(this.author)?.toDiscordJSON()
    }
  }

  public toMessageUpdatePayload(guild: Guild): Record<string, unknown> {
    return {
      ...this.toMessageCreatePayload(guild),
      tts: false
    }
  }
}
