const { SlashCommandBuilder } = require('discord.js');
const economyDatabase = require('../../database/economySchema');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rob')
        .setDescription('Rob a user.')
        .setDMPermission(false)
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to rob.')
            .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.user;
        const targetUser = interaction.options.getUser('user');

        if (user.id === targetUser.id) {
            return await interaction.editReply(`⚠️ • You can't rob yourself.`);
        }

        try {
            const [userData, targetUserData] = await Promise.all([
                economyDatabase.findOne({
                    userId: user.id,
                    guildId: interaction.guild.id
                }),
                economyDatabase.findOne({
                    userId: targetUser.id,
                    guildId: interaction.guild.id
                })
            ]);

            if (!userData || userData.cash <= 0) {
                const message = `⚠️ • You do not have any money in cash. Withdraw some coins from your bank.`;
                return await interaction.editReply(message);
            }

            if (userData.cash < 100) {
                const message = `⚠️ • You need at least 100 coins to rob others.`;
                return await interaction.editReply(message);
            }

            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            const alreadyRobbedToday = userData && userData.lastRobbed ? new Date(userData.lastRobbed).setUTCHours(0, 0, 0, 0) === today.getTime() : false;

            if (alreadyRobbedToday) {
                const utcDate = new Date(userData.lastRobbed);
                const expiryTimeUnix = moment(utcDate).add(1, 'day').unix();

                const message = `⏳ • You have already robbed someone today. Please try again <t:${expiryTimeUnix}:R>.`;
                return await interaction.editReply(message);
            }

            if (!targetUserData) {
                const message = `⚠️ • **${targetUser.username}** does not have an economy account.`;
                return await interaction.editReply(message);
            }

            let message = '';

            if (Math.random() >= 0.5) {
                const amountToRob = Math.floor(targetUserData.cash * 0.6);
                targetUserData.cash -= amountToRob;
                targetUserData.total -= amountToRob;
                userData.cash += amountToRob;
                userData.total += amountToRob;

                message = `💰 • You have successfully robbed **${targetUser.username}** and got ${amountToRob} coins.`;
            } else {
                const amountToLose = Math.floor(userData.cash * 0.6);
                userData.cash -= amountToLose;
                userData.total -= amountToLose;
                targetUserData.cash += amountToLose;
                targetUserData.total += amountToLose;

                message = `💔 • You failed to rob **${targetUser.username}** and lost ${amountToLose} coins.`;
            }

            userData.lastRobbed = today;
            await Promise.all([
                economyDatabase.findOneAndUpdate({ userId: user.id, guildId: interaction.guild.id }, userData, { new: true }),
                economyDatabase.findOneAndUpdate({ userId: targetUser.id, guildId: interaction.guild.id }, targetUserData, { new: true })
            ]).catch(error => {
                throw new Error(error);
            });

            await interaction.editReply({
                content: message
            });
        } catch (error) {
            await interaction.editReply({
                content: `⚠️ • ${error.message ? error.message : "We're sorry, but we encountered an issue while processing your rob. Please try again later."}`
            });
        }
    }
};