import { EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js";
import { ICommand } from "src/types";

export default {
  data: new SlashCommandBuilder()
    .setName("upload")
    .setDescription("upload audio from youtube")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("the audio's youtube url")
        .setRequired(true)
    ),

  run: async ({ interaction }) => {
    const interactionMember = interaction.member as GuildMember;

    if (!interactionMember.voice.channel)
      return interaction.editReply(
        "You need to be in a Voice Channel to use this command"
      );

    const url = interaction.options.getString("url");
    if (!url) return interaction.editReply("No URL");

    const encodedUrl = Buffer.from(url).toString("base64");

    const embed = new EmbedBuilder().setDescription(
      `Visit this link to complete the audio upload: ${process.env.CLIENT_URL}/uploads/${interactionMember.guild.id}?url=${encodedUrl}`
    );
    if (!embed) return interaction.editReply("Oops.. Embed Error.");

    return interaction.editReply({
      embeds: [embed],
    });
  },
} as ICommand;
