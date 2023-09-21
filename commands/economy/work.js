const { SlashCommandBuilder } = require('@discordjs/builders');
const moment = require('moment');

const economyDatabase = require('../../database/economySchema');
const { economy: { workAmount } } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work to earn some coins!')
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const data = await economyDatabase.findOne({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });
    
            const lastCollectedUnix = data && data.lastWorked ? moment(data.lastWorked).add(4, 'hours').unix() : 0;
            const currentTimeUnix = moment().unix();
    
            if (lastCollectedUnix > currentTimeUnix) {
                const expiryTimeUnix = moment(data.lastWorked).add(4, 'hours').unix();
                const message = `⏳ • You are on cooldown. Please try again <t:${expiryTimeUnix}:R>.`;
    
                return await interaction.editReply({
                    content: message,
                    ephemeral: true
                });
            }
    
            const { job, payout } = randomWork(workAmount);
    
            await economyDatabase.findOneAndUpdate({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            }, {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                $inc: {
                    cash: payout,
                    total: payout
                },
                lastWorked: new Date()
            }, {
                upsert: true,
                new: true
            }).catch(error => {
                throw new Error(error);
            });
    
            await interaction.editReply({
                content: `✅ • ${job}`
            });
        } catch (error) {
            await interaction.editReply({
                content: `⚠️ • ${error.message ? error.message : "We're sorry, but we encountered an issue while processing your work. Please try again later."}`
            });
        }
    }
}

function randomWork(workAmount) {
    const payout = Math.floor(Math.random() * (workAmount.max - workAmount.min + 1)) + workAmount.min;
    const jobs = [
        { job: `You tripped over a rock and found ${payout} coins underneath!`, payout: payout },
        { job: `You helped Poco tune his guitar and he gave you ${payout} coins!`, payout: payout },
        { job: `You helped Mortis catch his bats and he gave you ${payout} coins!`, payout: payout },
        { job: `You helped Pam repair her healing turret and she gave you ${payout} coins!`, payout: payout },
        { job: `You helped Rico find his lost bouncy balls and he gave you ${payout} coins!`, payout: payout },
        { job: `You won a dance-off against El Primo and earned ${payout} coins!`, payout: payout },
        { job: `You found ${payout} coins in Barley's tip jar!`, payout: payout },
        { job: `You helped Spike water his cactus and he gave you ${payout} coins!`, payout: payout },
        { job: `You found ${payout} coins while cleaning up Scrappy's scrap metal!`, payout: payout },
        { job: `You helped Crow count his poison bottles and he gave you ${payout} coins!`, payout: payout },
        { job: `You found ${payout} coins in Tick's bomb fragments!`, payout: payout },
        { job: `You helped Leon find his invisibility cloak and he gave you ${payout} coins!`, payout: payout },
        { job: `You found ${payout} coins while helping Gale shovel snow!`, payout: payout },
        { job: `You helped Nani find Peep and she gave you ${payout} coins!`, payout: payout },
        { job: `You found ${payout} coins while helping Colette organize her Brawler merchandise!`, payout: payout }
    ];

    return jobs[Math.floor(Math.random() * jobs.length)];
}