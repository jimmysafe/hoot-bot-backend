import { Collection, getRepository } from "fireorm";

@Collection("hoots")
export class Hoot {
  id: string;
  name: string;
  end: number;
  start: number;
  url: string;
  guildId: string;
}

export const hootRepository = getRepository(Hoot);
