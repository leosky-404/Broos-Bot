const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { OpenAI } = require('openai');
const moment = require('moment');

const { openAiKey } = require('../../config.json');
const { Canvas, loadImage } = require('@napi-rs/canvas');
const cooldowns = new Map();

const openAi = new OpenAI({
    apiKey: openAiKey
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagine')
        .setDescription('Imagine something!')
        .setDMPermission(false)
        .addStringOption(option => option
            .setName('prompt')
            .setDescription('The prompt to imagine.')
            .setRequired(true)),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            return await interaction.reply({
                content: `⏳ • You are on cooldown. Please try again <t:${cooldowns.get(interaction.user.id)}:R>.`,
                ephemeral: true
            });
        }

        await interaction.deferReply();
        const prompt = interaction.options.getString('prompt');
        try {
            cooldowns.set(interaction.user.id, moment().add(5, 'minutes').unix());

            setTimeout(() => {
                cooldowns.delete(interaction.user.id);
            }, 5 * 60 * 1000);

            const moderation = await openAi.moderations.create({
                input: prompt,
                model: 'text-moderation-latest'
            }).catch(error => {
                throw new Error(error);
            });

            const { categories, flagged } = moderation.results[0];

            if (flagged) {
                const message = `⚠️ • **${interaction.client.user.username} Auto Moderation System** has flagged your message for **\`${Object.keys(categories).filter(category => categories[category]).join(', ')}\`**. Your request could not be completed. Please try again.`;
                return await interaction.editReply({
                    content: message
                });
            } else {
                const response = await openAi.images.generate({
                    prompt: prompt,
                    n: 1,
                    response_format: 'url',
                    size: '1024x1024',
                    user: interaction.user.id
                });

                const canvas = new Canvas(1024, 1024);
                const context = canvas.getContext('2d');

                const image = await loadImage(response.data[0].url);
                context.drawImage(image, 0, 0, 1024, 1024);

                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'imagine.png', description: prompt });

                await interaction.editReply({
                    content: `🖼️ • **${prompt}** - Requested by ${interaction.user}`,
                    files: [attachment]
                });
            }
        } catch (error) {
            const errorMessage = error.message ? error.message : 'An error occurred while executing this command.';
            return await interaction.editReply({
                content: `❌ • ${errorMessage}`
            });
        }
    }
};
