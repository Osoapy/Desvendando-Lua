import { DiscordSnowflake } from '@sapphire/snowflake';
import { Application, Guild, Message, User } from './features';
import { FakeDiscord } from 'src/FakeDiscord';

export class DiscordServer {
    public static instance: DiscordServer = new DiscordServer();
    private connectedUsers: User[] = [];
    private applications: WeakMap<User, Application> = new WeakMap();
    private guilds: WeakMap<User, Guild> = new WeakMap();
    private validUsers: Map<string, User> = new Map();
    
    private apiVersion: number = 8;

    constructor() {
        if (DiscordServer.instance) {
            return DiscordServer.instance;
        }
        DiscordServer.instance = this;
    }

    public createApplication(name: string, description: string, owner: User): Application {
        const application = new Application(name, description, owner);
        this.applications.set(owner, application);
        return application;
    }

    public deleteApplication(application: Application): void {
        this.applications.delete(application.owner);
    }

    public createBot(mainUser: FakeDiscord, username: string, avatar: number, application: Application): User {
        const user = this.createUser(mainUser, username, avatar, true);
        application.setBot(user);
        this.validUsers.set(username, user);
        return user;
    }

    public createGuild(mainUser: FakeDiscord, name: string, icon: string): Guild {
        const guild = new Guild(name, icon, mainUser.getDiscordUser()!);
        this.guilds.set(mainUser.getDiscordUser()!, guild);
        return guild;
    }

    public deleteGuild(guild: Guild): void {
        this.guilds.delete(guild.owner);
    }

    public createUser(mainUser: FakeDiscord, username: string, avatar: number, isBot: boolean = false): User {
        const user = new User(mainUser, username, avatar, isBot);
        this.validUsers.set(username, user)
        return user;
    }

    public deleteUser(user: User): void {
        this.validUsers.delete(user.username);
    }
}
