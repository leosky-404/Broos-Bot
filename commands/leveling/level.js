const { SlashCommandBuilder, CommandInteraction, GuildMember } = require('discord.js');
const { Rank } = require('canvacord');

const calculateLevelExp = require('../../utils/calculateLevelExp');
const levelDatabase = require('../../database/levelSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check yours or another user\'s level.')
        .setDMPermission(false)
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user\'s level to check.')
            .setRequired(false)),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.deferReply();

        /**
         * @type {GuildMember}
         */
        const user = interaction.options.getMember('user') ?? interaction.member;

        const query = {
            userId: user.id,
            guildId: interaction.guild.id
        };

        try {
            const userLevel = await levelDatabase.findOne(query);


            if (userLevel) {
                const allLevels = await levelDatabase.find({ guildId: interaction.guild.id }).select('userId exp level');
                allLevels.sort((a, b) => {
                    if (a.level === b.level) {
                        return b.exp - a.exp;
                    } else {
                        return b.level - a.level;
                    }
                });
                const userRank = allLevels.findIndex(level => level.userId === user.id) + 1;
                const requiredXp = calculateLevelExp(userLevel.level + 1);

                const rankImage = await new Rank()
                    .setAvatar(user.user.displayAvatarURL({ dynamic: false, format: 'png', size: 2048 }))
                    .setUsername(user.user.username)
                    .setCurrentXP(userLevel.exp)
                    .setRequiredXP(requiredXp)
                    .setLevel(userLevel.level)
                    .setRank(userRank)
                    .setProgressBar('#FFFFFF', 'COLOR')
                    .setStatus(user.presence?.status ?? 'offline')
                    .setProgressBarTrack('#000000')
                    .build();

                await interaction.editReply({
                    files: [{
                        attachment: rankImage,
                        name: `${user.id}-rank.png`
                    }]
                });
            } else {
                const isSelf = interaction.user.id === user.id;

                const message = isSelf
                    ? '❌ · You do not have a level yet. Keep chatting to gain exp and level up!'
                    : `❌ · **${user.user.username}** does not have a level yet.`;

                await interaction.editReply({
                    content: message
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: '❌ · An error occurred while executing this command.'
            });
        }
    }
}