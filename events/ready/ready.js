const { Events, Client, ActivityType, ActivityFlags } = require('discord.js');
const { version } = require('../../package.json');
const path = require('path');

module.exports = {
    name: Events.ClientReady,
    once: false,

    /**
     * Executes when the client is ready.
     * @param {Client} client
     */
    async execute(client) {
        client.user.setActivity({
            type: ActivityType.Custom,
            name: 'custom',
            state: `v${version} update out now!`,
        });
        console.log(`${client.user.tag} is online.`);
    }
};
