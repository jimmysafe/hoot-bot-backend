import dotenv from "dotenv";
import { CommandsService } from "./commands/commands.service";
import { ICommand, IGuild, IHoot, Plan } from "./types";
import { Client } from "./client";
import express from "express";
import { SlashCommandBuilder } from "discord.js";
import { supabase } from "./supabase.config";
import { hootCommand } from "./commands/hoot";
import cors from "cors";

dotenv.config();
const PORT = process.env.PORT;

const client = new Client().init();
const commandsService = new CommandsService(client);

client.on("ready", () =>
  console.log(`🚀 Logged in as ${client?.user?.tag} 🚀`)
);
/**
 * ON GUILD JOIN
 * Add slash commands into that guild.
 */
client.on("guildCreate", async (guild) => {
  const { error } = await supabase
    .from("guilds")
    .insert(<IGuild>{ id: guild.id, name: guild.name, plan: Plan.BASIC });
  if (error) return console.log(error);
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

  // HOSTED COMMANDS HANDLER
  const { data: hoot } = await supabase
    .from<IHoot>("hoots")
    .select("*")
    .eq("name", interaction.commandName)
    .eq("guildId", interaction.guildId ?? "")
    .single();

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

  // Upload to supabase
  const { error, data } = await supabase.from("hoots").insert(<IHoot>{
    id: cmd.id,
    name,
    guildId,
    url,
    start,
    end,
  });
  if (error) return console.log(error);

  res.json(data);
});

api.delete("/uploads/:guildId/:id", async (req, res) => {
  const { id, guildId } = req.params;
  await commandsService.commandDelete(guildId, id);
  const { error } = await supabase.from("hoots").delete().match({ id });
  if (error) return console.log(error);
  res.json({
    success: true,
  });
});

api.get("/uploads/:guildId", async (req, res) => {
  const { guildId } = req.params;

  const { error, data } = await supabase
    .from("hoots")
    .select("*")
    .match({ guildId });
  if (error) res.send(error);

  res.json(data);
});

api.get("/uploads/:guildId/:id", async (req, res) => {
  const { guildId, id } = req.params;

  const { error, data } = await supabase
    .from("hoots")
    .select("*")
    .match({ guildId, id })
    .single();

  if (error) {
    res.send(error);
    return;
  }

  res.json(data);
});

api.patch("/uploads/:guildId/:id", async (req, res) => {
  const { guildId, id } = req.params;
  const { end, start, name } = req.body;

  const { error, data } = await supabase
    .from("hoots")
    .update({ end, start, name })
    .eq("id", id)
    .eq("guildId", guildId)
    .select();

  if (error) {
    res.send(error);
    return;
  }

  res.json(data);
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
