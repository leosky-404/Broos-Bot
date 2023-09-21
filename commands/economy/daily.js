const { SlashCommandBuilder, CommandInteraction } = require('discord.js');
const moment = require('moment');

const economyDatabase = require('../../database/economySchema');
const { economy: { dailyAmount } } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward!')
        .setDMPermission(false),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.deferReply();

        try {
            let data = await economyDatabase.findOne({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });

            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            const alreadyCollectedToday = data && data.lastDaily ? new Date(data.lastDaily).setUTCHours(0, 0, 0, 0) === today.getTime() : false;
            const dailyReward = Math.floor(Math.random() * (dailyAmount.max - dailyAmount.min + 1)) + dailyAmount.min;

            if (alreadyCollectedToday) {
                const utcDate = new Date(data.lastDaily);
                const expiryTimeUnix = moment(utcDate).add(1, 'day').unix();

                const message = `⏳ • You have already collected your daily reward. Please try again <t:${expiryTimeUnix}:R>.`;
                return await interaction.editReply(message);
            } else {
                await economyDatabase.findOneAndUpdate({
                    userId: interaction.user.id,
                    guildId: interaction.guild.id
                }, {
                    userId: interaction.user.id,
                    guildId: interaction.guild.id,
                    $inc: {
                        cash: dailyReward,
                        total: dailyReward
                    },
                    lastDaily: today
                }, {
                    upsert: true,
                    new: true
                }).catch(error => {
                    throw new Error(error);
                });

                await interaction.editReply({
                    content: `✅ • You have successfully collected your daily reward of 🪙 **${dailyReward}** coins.`
                });
            }
        } catch (error) {
            await interaction.editReply({
                content: `⚠️ • ${error.message ? error.message : "We're sorry, but we encountered an issue while processing your daily reward. Please try again later."}`
            });
        }
    }
}