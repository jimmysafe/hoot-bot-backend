import {
  CacheType,
  ChatInputCommandInteraction,
  Client,
  Collection,
  SlashCommandBuilder,
} from "discord.js";
import { definitions } from "./generated";

export interface IClient extends Client {
  commands: Collection<unknown, unknown>;
}

export interface ICommandRunParams {
  client: IClient;
  interaction: ChatInputCommandInteraction<CacheType>;
}

export interface ICommand {
  data: SlashCommandBuilder;
  run: (params: ICommandRunParams) => any;
}

export enum Plan {
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
}

type IBaseGuild = definitions["guilds"];
export interface IGuild extends IBaseGuild {
  plan: Plan;
}

type IBaseHoot = definitions["hoots"];
export interface IHoot extends IBaseHoot {}
