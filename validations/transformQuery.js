async function transformQuery(query) {
    if (query.startsWith('https://open.spotify.com/')) {
        try {
            const regex = new RegExp('https://open.spotify.com/([a-z]{2,4}-[a-z]{2,4}/|[a-z]{2,4}/)?track/([a-zA-Z0-9]+)');
            const isCountryBased = regex.test(query);

            if (isCountryBased) {
                const trackId = query.match(regex)[2];
                query = `https://open.spotify.com/track/${trackId}`;
            }
        } catch (error) {
            console.error(error);
        }
    }
    return query;
}

module.exports = {
    transformQuery
};
