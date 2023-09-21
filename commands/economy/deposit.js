const { SlashCommandBuilder } = require('discord.js');
const economyDatabase = require('../../database/economySchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deposit')
        .setDescription('Deposit coins into your bank.')
        .setDMPermission(false)
        .addNumberOption(option => option
            .setName('amount')
            .setDescription('The amount of coins to deposit.')
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

            if (data.cash < amount) {
                const message = `⚠️ • You do not have enough coins in your wallet.`;
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
                    cash: -amount,
                    bank: amount
                }
            }, {
                upsert: true,
                new: true
            }).catch(error => {
                throw new Error(error);
            });

            await interaction.editReply({
                content: `✅ • You have successfully deposited 🪙 **${amount}** coins into your bank.`
            });
        } catch (error) {
            await interaction.editReply({
                content: `⚠️ • ${error.message ? error.message : "We're sorry, but we encountered an issue while processing your deposit. Please try again later."}`
            });
        }
    }
}