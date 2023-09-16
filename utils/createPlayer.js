const { Player } = require("discord-player");
const { SpotifyExtractor, SoundCloudExtractor } = require('@discord-player/extractor');
const { client } = require("../index");
const { EmbedBuilder } = require("discord.js");

(async () => {
    const player = new Player(client, {
        useLegacyFFmpeg: false,
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    });

    await player.extractors.register(SpotifyExtractor, {});
    await player.extractors.register(SoundCloudExtractor, {});

    player.events.on('playerStart', async (queue, track) => {
        const { title, author, duration, thumbnail, url } = track;
        const { requestedBy: user, channel } = queue.metadata;

        const embed = new EmbedBuilder()
            .setColor(0xEA8A8C)
            .setThumbnail(thumbnail)
            .setAuthor({ name: author })
            .setDescription(`▶️ **Now Playing:** [${title}](${url})\n⏱️ **Duration:** ${duration}`)
            .setFooter({ text: `Requested by: ${user.username}`, iconURL: user.displayAvatarURL() })
            .setTimestamp();


        await channel.send({
            embeds: [embed]
        });
    });
});