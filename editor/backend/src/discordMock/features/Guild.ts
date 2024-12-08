import { DiscordSnowflake } from '@sapphire/snowflake';
import { Channel } from './Channel';
import { Member } from './Member';
import { Role } from './Role';
import { User } from './User';

export class Guild {
  public readonly id: string;
  public name: string;
  public icon: string;
  public splash: string | null;
  public ownerId: string;
  public afkChannelId: string | null = null;
  public afkTimeout: number = 0;
  public widgetEnabled: boolean = false;
  public widgetChannelId: string | null = null;
  public verificationLevel: number = 0;
  public defaultMessageNotifications: number = 0;
  public explicitContentFilter: number = 0;
  public roles: Role[] = [];
  public emojis: any[] = [];
  public features: any[] = [];
  public mfaLevel: number = 0;
  public applicationId: string | null = null;
  public systemChannelId: string | null = null;
  public systemChannelFlags: number = 0;
  public rulesChannelId: string | null = null;
  public vanityUrlCode: string | null = null;
  public description: string | null = null;
  public banner: string | null = null;
  public premiumTier: number = 0;
  public premiumSubscriptionCount: number = 0;
  public preferredLocale: string = 'pt-BR';
  public publicUpdatesChannelId: string | null = null;
  public nsfwLevel: number = 0;
  public premiumProgressBarEnabled: boolean = false;
  public safetyAlertsChannelId: string | null = null;

  public joinedAt: string = new Date().toISOString();
  public large: boolean = false;
  public voiceStates: any[] = [];
  public channels: Channel[] = [];
  public threads: any[] = [];
  public presences: any[] = [];
  public stageInstances: any[] = [];
  public guildScheduledEvents: any[] = [];
  public soundboardSounds: any[] = [];

  public owner: User;
  private members: Member[] = [];

  constructor(name: string, icon: string, owner: User) {
    this.id = DiscordSnowflake.generate().toString();
    this.name = name;
    this.icon = icon;
    this.owner = owner;
    this.roles.push(new Role(this.id, '@everyone'));
    this.channels.push(new Channel(this.id, 'general'));
    this.addMember(this.owner);
    this.ownerId = owner.id;
  }

  public addMember(user: User): Member {
    const member = new Member(user);
    member.addRole(this.roles[0]!);
    this.members.push(member);
    return member;
  }

  public removeMember(user: User): void {
    this.members = this.members.filter((m) => m.user.id !== user.id);
  }

  public guildCreateJSONEvent() {
    return {
      joined_at: this.joinedAt,
      large: this.large,
      member_count: this.members.length,
      voice_states: this.voiceStates,
      members: this.members.map((member) => member.toDiscordJSON()),
      channels: this.channels.map((channel) => channel.toDiscordJSON()),
      threads: this.threads,
      presences: this.presences,
      stage_instances: this.stageInstances,
      guild_scheduled_events: this.guildScheduledEvents,
      soundboard_sounds: this.soundboardSounds,
    }
  }

  public toDiscordJSON() {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      splash: this.splash,
      owner_id: this.ownerId,
      afk_channel_id: this.afkChannelId,
      afk_timeout: this.afkTimeout,
      widget_enabled: this.widgetEnabled,
      widget_channel_id: this.widgetChannelId,
      verification_level: this.verificationLevel,
      default_message_notifications: this.defaultMessageNotifications,
      explicit_content_filter: this.explicitContentFilter,
      roles: this.roles.map((role) => role.toDiscordJSON()),
      emojis: this.emojis,
      features: this.features,
      mfa_level: this.mfaLevel,
      application_id: this.applicationId,
      system_channel_id: this.systemChannelId,
      system_channel_flags: this.systemChannelFlags,
      rules_channel_id: this.rulesChannelId,
      vanity_url_code: this.vanityUrlCode,
      description: this.description,
      banner: this.banner,
      premium_tier: this.premiumTier,
      premium_subscription_count: this.premiumSubscriptionCount,
      preferred_locale: this.preferredLocale,
      public_updates_channel_id: this.publicUpdatesChannelId,
      nsfw_level: this.nsfwLevel,
      premium_progress_bar_enabled: this.premiumProgressBarEnabled,
      safety_alerts_channel_id: this.safetyAlertsChannelId,
    };
  }
}
