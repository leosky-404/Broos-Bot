const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const economyDatabase = require('../../database/economySchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your balance!')
        .setDMPermission(false)
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to check the balance of.')
            .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const user = interaction.options.getUser('user') || interaction.user;
        const userId = user.id;
        const guildId = interaction.guild.id;

        try {
            const data = await economyDatabase.findOne({
                userId: userId,
                guildId: guildId
            });

            if (!data) {
                const message = `⚠️ • **${user.username}** does not have a balance yet.`;
                return await interaction.editReply({
                    content: message
                });
            }

            const cashBalance = data.cash ?? 0;
            const bankBalance = data.bank ?? 0;
            const totalBalance = data.total ?? 0;

            const embed = new EmbedBuilder()
                .setColor(0xEA8A8C)
                .setAuthor({ name: `${user.username}'s Balance`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`🪙 • **Cash:** ${cashBalance}\n🏦 • **Bank:** ${bankBalance}\n💰 • **Total:** ${totalBalance}`);

            await interaction.editReply({
                embeds: [embed]
            })
        } catch (error) {
            const errorMessage = `⚠️ • ${error.message ?? 'An error occurred while executing this command.'}`;
            return await interaction.editReply({
                content: errorMessage
            });
        }
    }
}