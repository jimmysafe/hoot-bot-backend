import "reflect-metadata";
import { initialize } from "./firestore";
initialize();

import dotenv from "dotenv";
import { CommandsService } from "./commands/commands.service";
import { ICommand, IHoot, Plan } from "./types";
import { Client } from "./client";
import express from "express";
import { SlashCommandBuilder } from "discord.js";
import { hootCommand } from "./commands/hoot";
import cors from "cors";

import { hootRepository } from "./models/hoot";
import { guildRepository } from "./models/guild";
dotenv.config();

const PORT = process.env.PORT;

const client = new Client().init();
const commandsService = new CommandsService(client);

client.on("ready", async () => {
  console.log(`🚀 Logged in as ${client?.user?.tag} 🚀`);
});
/**
 * ON GUILD JOIN
 * Add slash commands into that guild.
 */
client.on("guildCreate", async (guild) => {
  await guildRepository.create({
    id: guild.id,
    name: guild.name,
    plan: Plan.BASIC,
  });
  // await firestore.collection("guilds").doc().set({
  //   id: guild.id,
  //   name: guild.name,
  //   plan: Plan.BASIC,
  // });

  return commandsService.commandsInit(guild.id);
});
/**
 * ON MESSAGE RECEIVED
 * Handle interactions (commands)
 */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply({ ephemeral: true });

  // BASIC COMMANDS HANDLER
  commandsService.commands();
  const command = client.commands.get(interaction.commandName) as ICommand;
  if (command) return command.run({ client, interaction });

  const hoot = await hootRepository
    .whereEqualTo((hoot) => hoot.name, interaction.commandName)
    .whereEqualTo((hoot) => hoot.guildId, interaction.guildId)
    .findOne();

  // HOSTED COMMANDS HANDLER

  if (hoot) {
    return hootCommand({
      hoot,
      client,
      interaction,
    });
  }

  return interaction.editReply("Not a valid command");
});

client.login(process.env.TOKEN);

const api = express();

api.use(express.json());
api.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

api.post("/uploads/:guildId", async (req, res) => {
  const { guildId } = req.params;
  const { name, url, start, end } = req.body as IHoot;

  const isExistingCommand = await commandsService.isExistingCommand(
    name,
    guildId
  );

  if (isExistingCommand)
    return res.status(500).json({
      error: true,
      message: "A Command with that name already exists.",
    });

  // Update guild commands.
  const newCommand = new SlashCommandBuilder()
    .setName(name)
    .setDescription("Custom Command");
  const cmd = await commandsService.commandCreate(guildId, newCommand);

  const newHoot = await hootRepository.create({
    id: cmd.id,
    name,
    guildId,
    url,
    start,
    end,
  });

  return res.json(newHoot);
});

api.delete("/uploads/:guildId/:id", async (req, res) => {
  const { id, guildId } = req.params;
  await commandsService.commandDelete(guildId, id);

  await hootRepository.delete(id);

  res.json({
    success: true,
  });
});

api.get("/uploads/:guildId", async (req, res) => {
  const { guildId } = req.params;

  const hoots = await hootRepository
    .whereEqualTo((hoot) => hoot.guildId, guildId)
    .find();

  res.json(hoots);
});

api.get("/uploads/:guildId/:id", async (req, res) => {
  const { guildId, id } = req.params;

  const data = await hootRepository
    .whereEqualTo((hoot) => hoot.guildId, guildId)
    .whereEqualTo((hoot) => hoot.id, id)
    .findOne();

  res.json(data);
});

api.patch("/uploads/:guildId/:id", async (req, res) => {
  const { guildId, id } = req.params;
  const { end, start, name } = req.body;

  const hoot = await hootRepository
    .whereEqualTo((hoot) => hoot.guildId, guildId)
    .whereEqualTo((hoot) => hoot.id, id)
    .findOne();

  if (!hoot) return res.status(404).send("Not Found");

  const data = await hootRepository.update({
    ...hoot,
    end,
    start,
    name,
  });

  return res.json(data);
});

api.get("/uploads/check/:guildId/:name", async (req, res) => {
  const { guildId, name } = req.params;

  const existingCommand = await commandsService.isExistingCommand(
    name,
    guildId
  );

  res.json({
    ok: !existingCommand,
  });
});

api.listen(PORT ?? 4000, () =>
  console.log(`🚀 API listening on port http://localhost:${PORT}`)
);
