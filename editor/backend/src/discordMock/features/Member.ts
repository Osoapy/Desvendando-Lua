import { Role, User } from ".";

export class Member {
  public user: User;
  public nick: string | null = null;
  public roles: Role[] = [];
  public joinedAt: Date;
  public deaf: boolean = false;
  public mute: boolean = false;
  public flags: number = 0;
  public permissions: string = '0';

  constructor(user: User) {
    this.user = user;
    this.joinedAt = new Date();
  }

  public getDisplayName(): string {
    return this.nick || this.user.username;
  }

  public addRole(role: Role): void {
    this.roles.push(role);
  }

  public removeRole(role: Role): void {
    this.roles = this.roles.filter((r) => r.id !== role.id);
  }

  public toDiscordJSON() {
    return {
      user: this.user.toDiscordJSON(),
      nick: this.nick,
      roles: this.roles.map((role) => role.id),
      joined_at: this.joinedAt.toISOString(),
      deaf: this.deaf,
      mute: this.mute,
      flags: this.flags,
      permissions: this.permissions,
    };
  }
}