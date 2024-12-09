export class Role {
  public id: string;
  public name: string;
  public color: number = 0;
  public hoist: boolean = false;
  public position: number = 0;
  public permissions: string = "3072";
  public managed: boolean = false;
  public mentionable: boolean = false;
  public flags: number = 0;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  public toDiscordJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      hoist: this.hoist,
      position: this.position,
      permissions: this.permissions,
      managed: this.managed,
      mentionable: this.mentionable,
      flags: this.flags,
    };
  }
}