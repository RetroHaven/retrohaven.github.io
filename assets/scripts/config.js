// API Configuration
const CONFIG = {
    // API Base URL - Update this to your actual API server
    API_BASE: 'https://api.retrohaven.org',

    // WebSocket URL - Update this to your actual WebSocket server (use wss:// for HTTPS sites)
    WS_URL: 'wss://api.retrohaven.org/ws',

    // MC Heads API for player head images
    MC_HEADS_API: 'https://mc-heads.net/avatar/',

    // Refresh intervals (in milliseconds)
    LEADERBOARD_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
    ONLINE_PLAYERS_POLL_INTERVAL: 30 * 1000, // 30 seconds
    WEBSOCKET_RECONNECT_DELAY: 5 * 1000, // 5 seconds

    // API Endpoints
    ENDPOINTS: {
        ONLINE_PLAYERS: '/api/players/online',
        PLAYTIME_LEADERBOARD: '/api/leaderboard/playtime',
        PLAYER_PLAYTIME: '/api/playtime/', // Add player name after this
        PLAYER_UUID: '/api/players/', // Add player name after this, append /uuid
        PLAYER_FIRST_SEEN: '/api/players/', // Add player name after this, append /first-seen
        PLAYER_LAST_SEEN: '/api/players/', // Add player name after this, append /last-seen
        RECENT_BANS: '/api/bans/recent', // Get recent bans list
        PLAYER_BAN: '/api/bans/player/', // Add player name after this to search for specific player ban
        BAN_STATS: '/api/bans/stats' // Get ban statistics (total, active, expired)
    }
};

// Make config available globally
window.CONFIG = CONFIG;
