import { EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js";
import { ICommand } from "src/types";

export default {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Info about BOT"),

  run: async ({ interaction }) => {
    const interactionMember = interaction.member as GuildMember;

    if (!interactionMember.voice.channel)
      return interaction.editReply(
        "You need to be in a Voice Channel to use this command"
      );

    const embed = new EmbedBuilder().setDescription(`Infos for you: ...`);
    if (!embed) return interaction.editReply("Oops.. Embed Error.");

    return interaction.editReply({
      embeds: [embed],
    });
  },
} as ICommand;
