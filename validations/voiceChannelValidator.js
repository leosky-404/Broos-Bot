const { EmbedBuilder } = require('discord.js');

async function notInVoiceChannel(interaction) {
    if (!interaction.member.voice.channel) {
        const embed = new EmbedBuilder()
            .setColor(0xEA8A8C)
            .setDescription(`⚠️ • You need to be in a voice channel to use this command.`)
        await interaction.editReply({
            embeds: [embed]
        });
        return true;
    }
    return false;
}

async function notInSameVoiceChannel(interaction, queue) {
    if (!queue.dispatcher) {
        return true
    }

    if (interaction.member.voice.channel.id !== queue.dispatcher.channel.id) {
        const embed = new EmbedBuilder()
            .setColor(0xEA8A8C)
            .setDescription(`⚠️ • I am already playing in ${queue.dispatcher.channel}`)
        await interaction.editReply({
            embeds: [embed]
        });
        return true;
    }
    return false;
}

module.exports = {
    notInVoiceChannel,
    notInSameVoiceChannel
}