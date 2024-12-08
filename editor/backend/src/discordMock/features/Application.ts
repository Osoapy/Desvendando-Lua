import { DiscordSnowflake } from '@sapphire/snowflake';
import { randomName } from '../../utils';
import { Guild } from "./Guild";
import { User } from "./User";

export class Application {
  public readonly id: string;
  public name: string;
  public icon: string | null = null;
  public description: string;
  public botPublic: boolean = false;
  public botRequireCodeGrant: boolean = false;
  public bot: User | null = null;
  public owner: User;
  public verifyKey: string;
  public flags: number;
  public approximateGuildCount: number = 1;
  public approximateUserInstallCount: number = 1;
  public tags: string[] = [];

  constructor(name: string, description: string, owner: User) {
    this.id = DiscordSnowflake.generate().toString();
    this.name = name;
    this.description = description;
    this.owner = owner;
    this.verifyKey = randomName(32);
    this.flags = 0;
  }

  public setBot(bot: User) {
    this.bot = bot;
  }

  public toDiscordJSON() {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      description: this.description,
      bot_public: this.botPublic,
      bot_require_code_grant: this.botRequireCodeGrant,
      bot: this.bot ? this.bot.toDiscordJSON() : null,
      owner: this.owner.toDiscordJSON(),
      verify_key: this.verifyKey,
      flags: this.flags,
      approximate_guild_count: this.approximateGuildCount,
      approximate_user_install_count: this.approximateUserInstallCount,
      tags: this.tags,
    };
  }
}
