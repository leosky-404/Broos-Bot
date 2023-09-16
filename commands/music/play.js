const { SlashCommandBuilder } = require('discord.js');
const { useQueue, useMainPlayer } = require('discord-player');

const { notInVoiceChannel, notInSameVoiceChannel } = require('../../validations/voiceChannelValidator');
const { cannotJoinVoiceOrTalk } = require('../../validations/permissionValidator');
const { transformQuery } = require('../../validations/transformQuery')
const { playerOptions } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song')
        .setDMPermission(false)
        .addStringOption(option => option
            .setName('song')
            .setDescription('The song name or URL.')
            .setRequired(true)
            .setAutocomplete(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const client = interaction.client;

        if (await notInVoiceChannel(interaction, client)) {
            return;
        }

        if (await cannotJoinVoiceOrTalk(interaction)) {
            return;
        }

        let queue = useQueue(interaction.guild.id);
        if (queue && (await notInSameVoiceChannel(interaction, queue))) {
            return;
        }

        const player = useMainPlayer();
        const query = interaction.options.getString('song');

        const transformedQuery = await transformQuery(query);

        let searchResult;

        try {
            searchResult = await player.search(transformedQuery, {
                requestedBy: interaction.user
            });
        } catch (error) {
            console.error(error);
        }

        if (!searchResult || searchResult.tracks.length === 0) {
            const message = `⚠️ • No tracks were found for **${transformedQuery}**. Make sure the specified url is valid and public.`;
            return await interaction.editReply(message);
        }

        queue = useQueue(interaction.guild.id);
        let queueSize = queue?.size ?? 0;

        if (searchResult.playlist && searchResult.tracks.length > playerOptions.maxQueueSize - queueSize) {
            const message = `⚠️ • Playlist too large. Maximum amount of tracks allowed: **${playerOptions.maxQueueSize}**`;
            return await interaction.editReply(message);
        }

        let track;

        try {
            ({ track } = await player.play(interaction.member.voice.channel, searchResult, {
                requestedBy: interaction.user,
                nodeOptions: {
                    leaveOnEmpty: playerOptions.leaveOnEmpty ?? true,
                    leaveOnEmptyCooldown: playerOptions.leaveOnEmptyCooldown ?? 300000,
                    leaveOnEnd: playerOptions.leaveOnEnd ?? true,
                    leaveOnEndCooldown: playerOptions.leaveOnEndCooldown ?? 300000,
                    leaveOnStop: playerOptions.leaveOnStop ?? true,
                    leaveOnStopCooldown: playerOptions.leaveOnStopCooldown ?? 300000,
                    maxSize: playerOptions.maxQueueSize ?? 1000,
                    maxHistorySize: playerOptions.maxHistorySize ?? 100,
                    volume: playerOptions.defaultVolume ?? 50,
                    bufferingTimeout: playerOptions.bufferingTimeout ?? 3000,
                    connectionTimeout: playerOptions.connectionTimeout ?? 30000,
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.client,
                        requestedBy: interaction.user,
                        track: searchResult.tracks[0]
                    }
                }
            }));
        } catch (error) {
            const errorMessages = {
                'Sign in to confirm your age': '⚠️ •  The audio for the track cannot be retrieved due to age restrictions and login requirements. This prevents me from playing the audio content.',
                'The following content may contain': '⚠️ • The audio from this source is unplayable because the video contains a warning for graphic or sensitive content. Manual confirmation is needed to play the video, preventing me from playing the audio.',
                'Cannot read properties of null (reading \'createStream\')': `⚠️ • Found track. But failed to retrieve audio for ${query}`,
                'Failed to fetch resources for ytdl streaming': `⚠️ •  Found track. But failed to retrieve audio for ${query}`,
                'Could not extract stream for this track': `⚠️ • Found track. But failed to retrieve audio for ${query}`,
                'Cancelled': '⚠️ • Failed to add the track. Something unexpected happened.',
            };

            for (const errorMessage in errorMessages) {
                if (error.message.includes(errorMessage)) {
                    const message = errorMessages[errorMessage];
                    return await interaction.editReply(message);
                }
            }
        }

        queue = useQueue(interaction.guild.id);

        if (!queue) {
            return await interaction.editReply('⚠️ • Failed to add the track. There was an issue playing this track.');
        }

        if (searchResult.playlist && searchResult.tracks.length > 1) {
            return await interaction.editReply({
                content: `🎶 • Added **[${track.title}](${track.url})** and ${searchResult.tracks.length - 1} more tracks to the queue...`
            });
        }

        if (queue.currentTrack === track && queue.tracks.data.length === 0) {
            return await interaction.editReply({
                content: `🎵 • Added **[${track.title}](${track.url})** to the queue.`
            });
        }

        return await interaction.editReply({
            content: `🎵 • Added **[${track.title}](${track.url})** to the queue.`
        });
    },

    async autoComplete(interaction) {
        const player = useMainPlayer();
        const query = (interaction.options.getFocused('query', true)).value;
        const searchResults = await player.search(query);
        let response = [];

        response = searchResults.tracks.slice(0, 10).map((track) => {
            if (track.url.length > 100) {
                track.url.slice(0, 100);
            }

            const trackName = `${track.title} [Author: ${track.author}]`.length > 100
                ? `${track.title}`.slice(0, 100)
                : `${track.title} | ${track.author}`;
            const trackUrl = track.url;

            return {
                name: trackName,
                value: trackUrl
            };
        });

        if (!response || response.length === 0) {
            return await interaction.respond([]);
        }

        return interaction.respond(response);
    }
}