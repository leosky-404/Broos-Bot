const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

const { notInVoiceChannel, notInSameVoiceChannel } = require('../../validations/voiceChannelValidator');
const { queueDoesNotExist, queueNoCurrentTrack } = require('../../validations/queueValidator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('now')
        .setDescription('Shows the current track')
        .setDMPermission(false)
        .addSubcommand(subcommand => subcommand
            .setName('playing')
            .setDescription('Shows the current track playing')),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            if (await notInVoiceChannel(interaction)) {
                return;
            }

            const queue = useQueue(interaction.guildId);

            if (await queueDoesNotExist(interaction, queue) ||
                await notInSameVoiceChannel(interaction, queue) ||
                await queueNoCurrentTrack(interaction, queue)) {
                return;
            }

            const { title, author, duration, thumbnail, url } = queue.currentTrack;
            const { requestedBy: user } = queue.metadata;

            const embed = new EmbedBuilder()
                .setColor(0xEA8A8C)
                .setThumbnail(thumbnail)
                .setAuthor({ name: author })
                .setDescription(`▶️ **Now Playing:** [${title}](${url})\n⏱️ **Duration:** ${duration}`)
                .setFooter({ text: `Requested by: ${user.username}`, iconURL: user.displayAvatarURL() })
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply('⚠️ • An error occurred while executing this command.');
        }
    }
}