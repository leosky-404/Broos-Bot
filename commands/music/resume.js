const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

const { notInVoiceChannel, notInSameVoiceChannel } = require('../../validations/voiceChannelValidator');
const { queueDoesNotExist, queueNoCurrentTrack } = require('../../validations/queueValidator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused track.')
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply();
        const queue = useQueue(interaction.guild.id);

        if (
            await notInVoiceChannel(interaction) ||
            await queueDoesNotExist(interaction, queue) ||
            await notInSameVoiceChannel(interaction, queue) ||
            await queueNoCurrentTrack(interaction, queue)
            ) {
            return;
        }
        try {
            const isPaused = queue.node.isPaused();

            if (!isPaused) {
                const message = '▶️ • The track is already playing.';
                return await interaction.editReply(message);
            } else {
                queue.node.setPaused(false);
                const { title, url } = queue.currentTrack;
                const message = `▶️ • Resumed Track **[${title}](${url})**`;
                return await interaction.editReply(message);
            }
        } catch (error) {
            console.error(error);
            const message = '⚠️ • Failed to resume the track. Something unexpected happened.';
            return await interaction.editReply(message);
        }
    }
}