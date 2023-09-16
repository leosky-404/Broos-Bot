const { SlashCommandBuilder, AttachmentBuilder, CommandInteraction } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { join } = require('path');

const levelDatabase = require('../../database/levelSchema');
GlobalFonts.registerFromPath(join(__dirname, '../../assets/fonts/VarelaRound-Regular.ttf'), 'VarelaRound-Regular');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the server leaderboard.')
        .setDMPermission(false),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const guildId = interaction.guild.id;

        try {
            const data = await levelDatabase.find()
            const guildData = data.filter(data => data.guildId === guildId).sort((a, b) => b.level - a.level || b.exp - a.exp).slice(0, 10);

           const fetchedUsers = [];
            for (const userdata of guildData) {
                const userObject = await interaction.client.users.fetch(userdata.userId);
                fetchedUsers.push({
                    username: userObject.username,
                    avatar: userObject.displayAvatarURL({ format: 'png' }),
                    level: userdata.level
                });
            }

            const canvasWidth = 680;
            const canvasHeight = 745;
            const rowHeight = 70;
            const numberOfRows = Math.min(10, fetchedUsers.length);
            const gapBetweenRows = numberOfRows > 1 ? (canvasHeight - numberOfRows * rowHeight) / (numberOfRows - 1) : 0;
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const context = canvas.getContext('2d');

            context.fillStyle = 'rgba(255, 255, 255, 1)';
            context.font = '30 VarelaRound-Regular';

            for (let i = 0; i < numberOfRows; i++) {
                const y = i * (rowHeight + gapBetweenRows);

                context.fillStyle = 'black';
                context.globalAlpha = 0.5;
                context.fillRect(0, y, canvasWidth, rowHeight);

                context.fillStyle = 'white';
                context.globalAlpha = 1;

                const avatar = await loadImage(fetchedUsers[i].avatar);
                context.drawImage(avatar, 10, y, rowHeight, rowHeight);

                const position = `#${i + 1}`;
                const username = fetchedUsers[i].username;
                const level = `Level ${fetchedUsers[i].level}`;

                context.fillText(`${position} • ${username} • ${level}`, rowHeight + 20, y + (rowHeight / 2) + 10);
            }

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'leaderboard.png' });
            await interaction.editReply({ files: [attachment] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: '❌ · An error occurred while executing this command.'
            });
        }
    }
}