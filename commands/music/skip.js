const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

const { notInVoiceChannel, notInSameVoiceChannel } = require('../../validations/voiceChannelValidator');
const { queueDoesNotExist, queueNoCurrentTrack } = require('../../validations/queueValidator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip current or to a specified track.')
        .setDMPermission(false)
        .addNumberOption(option => option
            .setName('track')
            .setDescription('Track number to skip to in the queue.')
            .setMinValue(1)),

    async execute(interaction) {
        if (await notInVoiceChannel(interaction)) {
            return;
        }

        const queue = useQueue(interaction.guild.id);

        if (await queueDoesNotExist(interaction, queue)) {
            return;
        }

        if (await notInSameVoiceChannel(interaction, queue)) {
            return;
        }

        if (await queueNoCurrentTrack(interaction, queue)) {
            return;
        }

        const skipToTrack = interaction.options.getNumber('track');

        if (skipToTrack) {
            if (skipToTrack > queue.tracks.data.length) {
                const message = `⚠️ • There are only **${queue.tracks.data.length}** tracks in the queue. You cannot skip to track **${skipToTrack}**.`;
                return await interaction.reply(message);
            } else {
                const skippedTrack = queue.currentTrack;
                queue.node.skipTo(skipToTrack - 1);

                const message = `⏭️ • Skipped **[${skippedTrack.title}](<${skippedTrack.url}>)**`;
                return await interaction.reply(message);
            }
        } else {
            if (queue.tracks.data.length === 0) {
                const message = '⚠️ • There are no tracks in the queue to skip to.';
                return await interaction.reply(message);
            } else {
                const skippedTrack = queue.currentTrack;
                queue.node.skip();
                const message = `⏭️ • Skipped **[${skippedTrack.title}](<${skippedTrack.url}>)**`;
                return await interaction.reply(message);
            }
        }
    }
}