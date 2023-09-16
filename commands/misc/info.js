const { SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require('discord.js');
const { version, dependencies } = require('../../package.json');

/**
 * 
 * @param {number} uptimeSeconds
 * @returns 
 */
function formatUptime(uptimeSeconds) {
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const formattedUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    return formattedUptime;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows some information about the bot.')
        .setDMPermission(false),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        try {
            const client = interaction.client;
            const botName = client.user.username;
            const botAvatar = client.user.displayAvatarURL({ dynamic: true });

            const botDeveloper = await client.users.fetch('932226255955320883');
            const uptime = formatUptime(require('os').uptime());
            const ping = client.ws.ping;

            const totalSystemMemory = Math.ceil(require('os').totalmem() / 1024 / 1024 / 1024)
            const memoryUsageRam = (process.memoryUsage().rss + process.memoryUsage().heapTotal) / 1024 / 1024;
            const nodeVersion = process.version;
            const discordJsVersion = dependencies['discord.js'].replace('^', 'v');

            const guildCount = client.guilds.cache.size;
            const channelCount = client.channels.cache.size;
            const userCount = client.users.cache.size;

            const embed = new EmbedBuilder()
                .setColor(0xEA8A8C)
                .setAuthor({ name: `${botName} Info`, iconURL: botAvatar })
                .addFields(
                    { name: '👤 Developer', value: `┕  ${botDeveloper}`, inline: true },
                    { name: '⏰ Uptime', value: `┕  \`${uptime}\``, inline: true },
                    { name: '🏓 Ping', value: `┕  \`${ping}ms\``, inline: true },
                    { name: '💾 RAM Usage', value: `┕  \`${memoryUsageRam.toFixed(2)} MB / ${totalSystemMemory} GB\``, inline: true },
                    { name: '🚀 Node Version', value: `┕  \`${nodeVersion}\``, inline: true },
                    { name: '🤖 Discord.js Version', value: `┕  \`${discordJsVersion}\``, inline: true },
                    { name: '🌐 Server Count', value: `┕  \`${guildCount}\``, inline: true },
                    { name: '📝 Channel Count', value: `┕  \`${channelCount}\``, inline: true },
                    { name: '👥 User Count', value: `┕  \`${userCount}\``, inline: true },
                )
                .setFooter({ text: `Bot Version: ${version}` });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            console.error(error);
        }
    }
}
