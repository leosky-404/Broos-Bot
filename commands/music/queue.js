const { SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

const { notInVoiceChannel } = require('../../validations/voiceChannelValidator');
const { queueDoesNotExist } = require('../../validations/queueValidator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the list of tracks added to the queue.')
        .setDMPermission(false)
        .addNumberOption(option => option
            .setName('page')
            .setDescription('Page number of the queue')
            .setMinValue(1)),

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @returns 
     */
    async execute(interaction) {
        await interaction.deferReply();

        try {
            if (await notInVoiceChannel(interaction)) {
                return;
            }

            const queue = useQueue(interaction.guild.id);
            let queueString = '';

            if (await queueDoesNotExist(interaction, queue)) {
                return;
            }

            const pageIndex = (interaction.options.getNumber('page') || 1) - 1;

            if (!queue) {
                if (pageIndex >= 1) {
                    const message = `⚠️ • Page **${pageIndex + 1}** is not a valid page number.`;
                    return await interaction.editReply(message);
                } else {
                    const message = '⚠️ • The queue is currently empty, first add some tracks with **`/play`**!';
                    return await interaction.editReply(message);
                }
            }

            const queueLength = queue.tracks.data.length;
            const totalPages = Math.ceil(queueLength / 10) || 1;

            if (pageIndex >= totalPages - 1) {
                const message = `⚠️ • Page **${pageIndex + 1}** is not a valid page number.`;
                return await interaction.editReply(message);
            }

            if (queue.tracks.data.length === 0) {
                const message = '⚠️ • The queue is empty, add some tracks with **`/play`**!';
                return await interaction.editReply(message);
            } else {
                queueString = queue.tracks.data
                    .slice(pageIndex * 10, pageIndex * 10 + 10)
                    .map((track, index) => {
                        return `${(pageIndex * 10) + index + 1}. **[${track.title}](${track.url})**`;
                    })
                    .join('\n');
            }

            const currentTrack = queue.currentTrack;

            if (!currentTrack) {
                const message = '⚠️ • There is no current track playing.';
                return await interaction.editReply(message);
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${interaction.guild.name} Queue`, iconURL: interaction.guild.iconURL() })
                .setColor(0xEA8A8C)
                .setThumbnail(currentTrack.thumbnail)
                .setDescription(`**🎵 Now playing**\n${currentTrack ? `**[${currentTrack.title}](${currentTrack.url})**` : 'None'} - Requested by: <@${currentTrack.requestedBy.id}>\n\n**🎶 Tracks in queue**\n${queueString}`)
                .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages} (${queueLength} tracks)` });

            return await interaction.editReply({
                embeds: [embed]
            });
        } catch (error) {
            await interaction.editReply('⚠️ • An error occurred while executing this command.');
            console.error(error);
        }
    }
}