const { EmbedBuilder, PermissionsBitField } = require('discord.js');

async function cannotJoinVoiceOrTalk(interaction) {
    const channel = interaction.member.voice.channel;

    if (!channel.joinable || !channel.speakable) {
        const embed = new EmbedBuilder()
            .setColor(0xEA8A8C)
            .setDescription(`⚠️ • I do not have permission to play audio in ${channel}`)
        await interaction.editReply({
            embeds: [embed]
        });
        return true;
    }
    return false;
}

async function cannotSendMessageInChannel(interaction) {
    const channel = interaction.channel;

    if (!channel.viewable) {
        const embed = new EmbedBuilder()
            .setColor(0xEA8A8C)
            .setDescription(`⚠️ • I do not have \`${PermissionsBitField.Flags.SendMessages}\` permission to send message replies in ${channel}.`)
        await interaction.editReply({
            embeds: [embed]
        });
        return true;
    }
    return false;
}

module.exports = {
    cannotJoinVoiceOrTalk,
    cannotSendMessageInChannel
}