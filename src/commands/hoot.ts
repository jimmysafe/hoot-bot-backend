import {
  ChatInputCommandInteraction,
  CacheType,
  GuildMember,
  EmbedBuilder,
  GuildResolvable,
  GuildChannelResolvable,
} from "discord.js";
import { IClient, IHoot } from "src/types";
import ytdl from "ytdl-core";
import FfmpegInstaller from "@ffmpeg-installer/ffmpeg";
import Ffmpeg from "fluent-ffmpeg";
import { createAudioResource } from "@discordjs/voice";
import { Player } from "discord-player";
import { formatToHMS } from "../helpers";
Ffmpeg.setFfmpegPath(FfmpegInstaller.path);

type HootCommandProps = {
  hoot: IHoot;
  client: IClient;
  interaction: ChatInputCommandInteraction<CacheType>;
};

export const hootCommand = async ({
  hoot,
  client,
  interaction,
}: HootCommandProps) => {
  const interactionMember = interaction.member as GuildMember;

  // if (!interactionMember.voice.channel)
  //   return interaction.editReply(
  //     "You need to be in a Voice Channel to use this command"
  //   );

  const input = ytdl(hoot.url, {
    quality: "lowest",
  });

  const process = Ffmpeg(input)
    .toFormat("mp3")
    .setStartTime(formatToHMS(hoot.start))
    .setDuration(formatToHMS(hoot.end - hoot.start))
    .on("error", (err) => {
      console.log(err);
    })
    .pipe();

  const player = new Player(client);
  const queue = player.createQueue(interaction?.guild as GuildResolvable);
  if (!queue.connection)
    await queue.connect(
      interactionMember.voice.channel as GuildChannelResolvable
    );

  const resource = createAudioResource(process as any);
  //@ts-expect-error
  queue.connection.playStream(resource);

  const embed = new EmbedBuilder().setDescription(`Hoot: ${hoot.name}`);
  if (!embed) return interaction.editReply("Oops.. Embed Error.");

  return interaction.editReply({
    embeds: [embed],
  });
};
