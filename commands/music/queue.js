const { SlashCommandBuilder, EmbedBuilder, CommandInteraction } = require('discord.js');
const { useQueue } = require('discord-player');

const { notInVoiceChannel } = require('../../validations/voiceChannelValidator');
const { queueDoesNotExist } = require('../../validations/queueValidator');
const { playerOptions } = require('../../config.json');

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
                return await interaction.reply(message);
            } else {
                const message = '⚠️ • The queue is currently empty, first add some tracks with **`/play`**!';
                return await interaction.reply(message);
            }
        }

        const queueLength = queue.tracks.data.length;
        const totalPages = Math.ceil(queueLength / 10) || 1;

        if (pageIndex >= totalPages - 1) {
            const message = `⚠️ • Page **${pageIndex + 1}** is not a valid page number.`;
            return await interaction.reply(message);
        }

        if (queue.tracks.data.length === 0) {
            const message = '⚠️ • The queue is empty, add some tracks with **`/play`**!';
            return await interaction.reply(message);
        } else {
            queueString = queue.tracks.data
                .slice(pageIndex * 10, pageIndex * 10 + 10)
                .map((track, index) => {
                    return `${index + 1}. **[${track.title}](${track.url})**`;
                })
                .join('\n');
        }

        const currentTrack = queue.currentTrack;

        if (!currentTrack) {
            const message = '⚠️ • There is no current track playing.';
            return await interaction.reply(message);
        }

        const timestamp = queue.node.getTimestamp();
        let bar = `**\`${timestamp.current.label}\`** ${queue.node.createProgressBar({
            queue: false,
            length: playerOptions.progressBar.length ?? 12,
            timecodes: playerOptions.progressBar.timecodes ?? false,
            indicator: playerOptions.progressBar.indicator ?? '🔘',
            leftChar: playerOptions.progressBar.leftChar ?? '▬',
            rightChar: playerOptions.progressBar.rightChar ?? '▬'
        })} **\`${timestamp.total.label}\`**`;

        if (currentTrack.raw.duration === 0 || currentTrack.duration === '0:00') {
            bar = 'No duration available.';
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.guild.name} Queue`, iconURL: interaction.guild.iconURL() })
            .setColor(0xEA8A8C)
            .setThumbnail(currentTrack.thumbnail)
            .setDescription(`**🎵 Now playing**\n${currentTrack ? `**[${currentTrack.title}](${currentTrack.url})**` : 'None'} - Requested by: <@${currentTrack.requestedBy.id}>\n ${bar}\n\n**🎶 Tracks in queue**\n${queueString}`)
            .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages} (${queueLength} tracks)`});

        return await interaction.reply({
            embeds: [embed]
        });
    }
}