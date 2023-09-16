const { Events, Message } = require('discord.js');
const { LevelUp } = require('canvafy');

const calculateLevelXP = require('../../utils/calculateLevelExp');
const levelDatabase = require('../../database/levelSchema');
const cooldowns = new Set();

/**
 * 
 * @param {Number} min 
 * @param {Number} max 
 * @returns 
 */
function getRandomExp(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    name: Events.MessageCreate,
    once: false,

    /**
     * 
     * @param {Message} message 
     */
    async execute(message) {
        if (message.author.bot || !message.guild || cooldowns.has(message.author.id)) return;

        const expToGive = getRandomExp(15, 40);
        const query = {
            userId: message.author.id,
            guildId: message.guild.id
        };

        try {
            const userLevel = await levelDatabase.findOne(query);

            if (userLevel) {
                userLevel.exp += expToGive;

                if (userLevel.exp > calculateLevelXP(userLevel.level)) {
                    userLevel.exp = 0;
                    userLevel.level += 1;

                    const levelUpImage = await new LevelUp()
                        .setAvatar(message.author.displayAvatarURL({ dynamic: false, format: 'png', size: 2048 }))
                        .setUsername(message.author.username)
                        .setBorder('#000000')
                        .setAvatarBorder('#FF0000')
                        .setOverlayOpacity(0.7)
                        .setLevels(userLevel.level - 1, userLevel.level)
                        .build();

                    await message.channel.send({
                        content: `${message.author}, you have leveled up to level **${userLevel.level}**!`,
                        files: [{
                            attachment: levelUpImage,
                            name: `${message.author.id}-levelup.png`
                        }]
                    });
                }

                await userLevel.save().catch(console.error);

                cooldowns.add(message.author.id);
                setTimeout(() => {
                    cooldowns.delete(message.author.id);
                }, 60000);
            } else {
                const newLevel = new levelDatabase({
                    userId: message.author.id,
                    guildId: message.guild.id,
                    exp: expToGive
                });

                await newLevel.save().catch(console.error);

                cooldowns.add(message.author.id);
                setTimeout(() => {
                    cooldowns.delete(message.author.id);
                }, 60000);
            }
        } catch (error) {
            console.error(error);
        }
    }
}