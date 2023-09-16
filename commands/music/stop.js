const { SlashCommandBuilder, CommandInteraction } = require('discord.js');
const { useQueue } = require('discord-player');

const { notInVoiceChannel, notInSameVoiceChannel } = require('../../validations/voiceChannelValidator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop playing audio and clear the queue.')
        .setDMPermission(false),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.deferReply();

        try {
            if (await notInVoiceChannel(interaction)) {
                return;
            }

            const queue = useQueue(interaction.guild.id);

            if (!queue) {
                const message = '⚠️ • There is no active queue to stop.';
                return interaction.editReply({
                    content: message
                });
            }

            if (await notInSameVoiceChannel(interaction, queue)) {
                const message = '⚠️ • You are not in the same voice channel as the me.';
                return interaction.editReply({
                    content: message
                });
            }

            if (!queue.deleted) {
                queue.setRepeatMode(0);
                queue.clear();
                queue.node.stop();
            }

            const message = '🛑 • Stopped playing audio and cleared the queue.'
            return await interaction.editReply({
                content: message
            });
        } catch (error) {
            return interaction.editReply({
                content: '⚠️ • An error occurred while trying to stop the queue.'
            });
        }
    }
}