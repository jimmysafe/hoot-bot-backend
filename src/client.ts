import Discord from "discord.js";
import { IClient } from "src/types";

export class Client {
  private declare() {
    return new Discord.Client({
      intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildVoiceStates,
      ],
    }) as IClient;
  }

  public init() {
    const client = this.declare();
    client.commands = new Discord.Collection();

    return client;
  }
}
