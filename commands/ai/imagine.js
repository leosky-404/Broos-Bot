const { SlashCommandBuilder, AttachmentBuilder, CommandInteraction } = require('discord.js');

const { replicateAPIKey } = require('../../config.json');
const { models } = require('../../utils/imageGenerationModels');
const cooldowns = new Set();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagine')
        .setDescription('Imagine something!')
        .setDMPermission(false)
        .addStringOption(option => option
            .setName('prompt')
            .setDescription('The prompt to imagine.')
            .setRequired(true))
        .addStringOption(option => option
            .setName('model')
            .setDescription('The model to use.')
            .addChoices(...models)
            .setRequired(false)),

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            await interaction.reply({
                content: '❌ • You are on cooldown! Please wait a few seconds before using this command again.',
                ephemeral: true
            });
        }
        await interaction.deferReply({ fetchReply: true });

        const prompt = interaction.options.getString('prompt');
        const model = interaction.options.getString('model') || models[0].value;

        interaction.editReply({ content: '🤖 • Starting to generate image... This may take a while.' });

        try {
            cooldowns.add(interaction.user.id);
            setTimeout(() => cooldowns.delete(interaction.user.id), 20000);

            const { default: Replicate } = await import('replicate');
            const replicate = new Replicate({
                auth: replicateAPIKey
            });

            const generatedImage = await replicate.run(model, {
                input: { prompt }
            });

            const attachment = new AttachmentBuilder(generatedImage[0], { name: 'imagine.png', description: prompt });
            
            await interaction.editReply({
                content: `🖼️ • **${prompt}** - Requested by: ${interaction.user}`,
                files: [attachment]
            });
        } catch (error) {
            console.error(error);
            const errorMessage = error.message || 'An error occurred while generating the image.';
            interaction.editReply({ content: `❌ • **Error:** ${errorMessage}` });
        }
    }
}
