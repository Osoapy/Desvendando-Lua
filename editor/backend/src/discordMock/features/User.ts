import { Channel, Message } from './';
import { DiscordSnowflake } from '@sapphire/snowflake';
import { FakeDiscord } from '../../FakeDiscord';

export class User {
  public id: string;
  public username: string;
  public discriminator: string;
  public globalName: string | null = null;
  public avatar: string;
  public bot: boolean;
  public system: boolean = false;
  public mfaEnabled?: boolean;
  public banner: string | null = null;
  public accentColor: number | null = null;
  public locale?: string;
  public verified?: boolean;
  public email?: string | null;
  public flags: number = 0;
  public premiumType?: number;
  public publicFlags?: number = 0;

  private mainUser: FakeDiscord;
  private token: string;

  constructor(mainUser: FakeDiscord, username: string, avatar: number, isBot: boolean) {
    this.mainUser = mainUser;

    this.id = DiscordSnowflake.generate().toString();
    this.username = username;
    this.discriminator = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.avatar = avatar.toString();
    this.bot = isBot;
    this.token = (`${Buffer.from(this.id).toString('base64')}.${Buffer.from(this.discriminator).toString('base64')}.${Buffer.from(this.username).toString('base64')}`)
        .replaceAll('=', '');
    if (!isBot) {
      this.locale = 'pt-BR';
      this.verified = true;
      this.premiumType = 0;
      this.email = `${username}@example.com`;
      this.mfaEnabled = false;
    } else {
      this.globalName = username;
    }
  }

  public sendMessage(channel: Channel, message: string): Message {
    console.log(`[Discord] ${this.username}#${this.discriminator} sent a message: ${message} in channel ${channel.id}`);
    if (this.bot) this.mainUser.handleBotMessage(message);
    return channel.sendMessage(this, message);
  }

  public toString(): string {
    return `${this.username}#${this.discriminator}`;
  }

  public getToken(): string {
    return this.token;
  }

  public getMainUser(): FakeDiscord {
    return this.mainUser;
  }

  public toDiscordJSON(): Record<string, unknown> {
    return {
      id: this.id,
      username: this.username,
      discriminator: this.discriminator,
      avatar: this.avatar,
      bot: this.bot,
      system: this.system,
      mfa_enabled: this.mfaEnabled,
      banner: this.banner,
      accent_color: this.accentColor,
      locale: this.locale,
      verified: this.verified,
      email: this.email,
      flags: this.flags,
      premium_type: this.premiumType,
      public_flags: this.publicFlags
    };
  }
}
