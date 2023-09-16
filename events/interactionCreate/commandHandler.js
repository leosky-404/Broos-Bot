const { Events, CommandInteraction } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            return;
        }

        if (interaction.isChatInputCommand()) {
            try {
                await command.execute(interaction);
            } catch (error) {
                interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
                console.error(error);
            }
        }

        if (interaction.isAutocomplete()) {
            try {
                await command.autoComplete(interaction);
            } catch (error) {
                // Do nothing here to prevent logging the error
            }
        }
    }
}