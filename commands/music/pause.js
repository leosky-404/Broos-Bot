const { SlashCommandBuilder, CommandInteraction } = require('discord.js');
const { useQueue } = require('discord-player');

const { notInVoiceChannel, notInSameVoiceChannel } = require('../../validations/voiceChannelValidator');
const { queueDoesNotExist, queueNoCurrentTrack } = require('../../validations/queueValidator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current track.')
        .setDMPermission(false),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.deferReply();
        const queue = useQueue(interaction.guild.id);

        if (await notInVoiceChannel(interaction) ||
            await notInSameVoiceChannel(interaction, queue) ||
            await queueDoesNotExist(interaction, queue) ||
            await queueNoCurrentTrack(interaction, queue)) {
            return
        }

        try {
            const isPaused = queue.node.isPaused();

            if (isPaused) {
                const message = '⏸️ • The track is already paused.';
                return await interaction.editReply(message);
            } else {
                queue.node.setPaused(true);
                const { title, url } = queue.currentTrack;
                const message = `⏸️ • Paused Track **[${title}](${url})**`;
                return await interaction.editReply(message);
            }
        } catch (error) {
            const message = '⚠️ • Failed to pause the track. Something unexpected happened.';
            return await interaction.editReply(message);
        }
    }
}