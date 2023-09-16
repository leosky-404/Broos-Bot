async function sendErrorMessage(interaction, message) {
    await interaction.editReply({
        content: `⚠️ • ${message}`
    });
}

async function queueDoesNotExist(interaction, queue) {
    if (!queue) {
        await sendErrorMessage(interaction, "There are no tracks in the queue, and nothing is currently playing.");
        return true;
    }
    return false;
}

async function queueNoCurrentTrack(interaction, queue) {
    if (!queue.currentTrack) {
        await sendErrorMessage(interaction, "There is nothing currently playing.");
        return true;
    }
    return false;
}

async function queueIsEmpty(interaction, queue) {
    if (queue.tracks.data.length === 0) {
        await sendErrorMessage(interaction, "There are no tracks in the queue.");
        return true;
    }
    return false;
}

module.exports = {
    queueDoesNotExist,
    queueNoCurrentTrack,
    queueIsEmpty
}