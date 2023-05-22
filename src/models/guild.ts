import { Collection, getRepository } from "fireorm";

@Collection("guilds")
export class Guild {
  id: string;
  name: string;
  plan: string;
}

export const guildRepository = getRepository(Guild);
