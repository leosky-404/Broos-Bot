const { SlashCommandBuilder } = require('discord.js');
const economyDatabase = require('../../database/economySchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw coins from your bank.')
        .setDMPermission(false)
        .addNumberOption(option => option
            .setName('amount')
            .setDescription('The amount of coins to withdraw.')
            .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const amount = interaction.options.getNumber('amount');
            const data = await economyDatabase.findOne({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });

            if (!data) {
                const message = `⚠️ • You do not have an economy account.`;
                return await interaction.editReply({
                    content: message
                });
            }

            if (data.bank < amount) {
                const message = `⚠️ • You do not have enough coins in your bank.`;
                return await interaction.editReply({
                    content: message
                });
            }

            await economyDatabase.findOneAndUpdate({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            }, {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                $inc: {
                    cash: amount,
                    bank: -amount
                }
            }, {
                upsert: true,
                new: true
            }).catch(error => {
                throw new Error(error);
            });

            await interaction.editReply({
                content: `✅ • You have successfully withdrawn 🪙 **${amount}** coins from your bank.`
            });
        } catch (error) {
            await interaction.editReply({
                content: `⚠️ • ${error.message ? error.message : "We're sorry, but we encountered an issue while processing your withdrawal. Please try again later."}`
            });
        }
    }
}