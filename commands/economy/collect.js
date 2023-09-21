const { SlashCommandBuilder, CommandInteraction} = require('discord.js');
const moment = require('moment');

const economyDatabase = require('../../database/economySchema');
const { economy: { roleIncome } } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collect')
        .setDescription('Collect your role-income!')
        .setDMPermission(false),

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @returns 
     */
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const data = await economyDatabase.findOne({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });

            const rolesWithIncome = [];
            const userRoles = interaction.member.roles.cache
            
            for (const role of roleIncome) {
                const roleId = role.role;

                if (userRoles.has(roleId)) {
                    rolesWithIncome.push(role);
                }
            }

            if (rolesWithIncome.length === 0) {
                const message = `⚠️ • You do not have any roles with income.`;
                return await interaction.editReply({
                    content: message
                });
            }


            const lastCollectedUnix = data && data.lastCollected ? moment(data.lastCollected).add(4, 'hours').unix() : 0;
            const currentTimeUnix = moment().unix();

            if (lastCollectedUnix > currentTimeUnix) {
                const expiryTimeUnix = moment(data.lastWorked).add(4, 'hours').unix();
                const message = `⏳ • You are on cooldown. Please try again <t:${expiryTimeUnix}:R>.`;
    
                return await interaction.editReply({
                    content: message
                });
            }

            let totalIncome = 0;

            for (const role of rolesWithIncome) {
                totalIncome += role.income;
            }

            await economyDatabase.findOneAndUpdate({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            }, {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                $inc: {
                    cash: totalIncome,
                    total: totalIncome
                },
                lastCollected: new Date()
            }, {
                upsert: true,
                new: true
            }).catch(error => {
                throw new Error(error);
            });

            const message = `✅ • You have successfully collected your role-income for following roles:\n${rolesWithIncome.map(role => `- <@&${role.role}> - :coin: **${role.income}** coins`).join('\n')}`;
            await interaction.editReply({
                content: message,
                allowedMentions: {
                    roles: []
                }
            });
        } catch (error) {
            await interaction.editReply({
                content: `⚠️ • ${error.message ? error.message : "We're sorry, but we encountered an issue while processing your role-income. Please try again later."}`
            });
        }
    }
}