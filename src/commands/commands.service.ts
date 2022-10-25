import fs from "fs";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { IClient, ICommand } from "src/types";

export class CommandsService {
  constructor(private readonly client: IClient) {}

  private getFiles() {
    const isProduction = process.env.NODE_ENV === "production";
    const commands: string[] = [];

    commands.push(
      ...fs
        .readdirSync(`${__dirname}/basic`)
        .filter((command) =>
          isProduction ? command.endsWith(".js") : command.endsWith(".ts")
        )
    );

    return commands;
  }

  public commands() {
    const files = this.getFiles();
    return files.map((file) => {
      const cmd = require(`${__dirname}/basic/${file}`).default as ICommand;
      this.client.commands.set(cmd?.data.name, cmd);
      return cmd?.data;
    });
  }

  public async commandsInit(guildId: string) {
    try {
      const rest = new REST({ version: "9" }).setToken(process.env.TOKEN!);
      const res = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
        {
          body: this.commands(),
        }
      );
      if (res) console.log("Success Loading BASIC Commands.", res);
    } catch (err) {
      console.log(err);
    }
  }

  public async commandCreate(guildId: string, newCommand: SlashCommandBuilder) {
    try {
      const rest = new REST({ version: "9" }).setToken(process.env.TOKEN!);
      const res = await rest.post(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
        {
          body: newCommand,
        }
      );

      if (res) {
        console.log("Success Loading NEW Command.");
        return res;
      }
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  public async commandDelete(guildId: string, commandId: string) {
    try {
      const rest = new REST({ version: "9" }).setToken(process.env.TOKEN!);
      const res = await rest.delete(
        Routes.applicationGuildCommand(
          process.env.CLIENT_ID!,
          guildId,
          commandId
        )
      );
      if (res) console.log("Success DELETE Command.");
    } catch (err) {
      console.log(err);
    }
  }

  public async commandsGet(guildId: string) {
    try {
      const rest = new REST({ version: "9" }).setToken(process.env.TOKEN!);
      return rest.get(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId)
      );
    } catch (err) {
      console.log(err);
    }
  }

  public async isExistingCommand(
    newCmd: string,
    guildId: string
  ): Promise<boolean> {
    const existingCommands = ((await this.commandsGet(guildId)) as any[]).map(
      (cmd) => cmd.name
    );
    return existingCommands.includes(newCmd);
  }
}
