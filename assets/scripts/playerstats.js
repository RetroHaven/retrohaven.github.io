// Player Stats Management
class PlayerStatsManager {
    constructor() {
        this.playerName = this.getPlayerNameFromURL();
        this.playerHeadImg = document.getElementById('player-head');
        this.playerNameDisplay = document.getElementById('player-name');
        this.playerUUID = document.getElementById('player-uuid');
        this.errorMessage = document.getElementById('error-message');
    }

    // Get player name from URL parameters
    getPlayerNameFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('name');
    }

    // Initialize player stats page
    init() {
        if (!this.playerName) {
            this.showError('No player name specified');
            return;
        }

        // Set initial player name
        this.playerNameDisplay.textContent = this.playerName;

        // Load player data
        this.fetchPlayerStats();
    }

    // Format playtime to total hours with decimals
    // Handles both seconds and minutes from API
    formatPlaytime(value, unit = 'seconds') {
        if (!value) return '0.00 Hours';

        let totalHours;
        // If value is very large (> 1000), assume it's in seconds
        // Otherwise treat as minutes for backwards compatibility
        if (value > 1000 || unit === 'seconds') {
            // Convert seconds to hours
            totalHours = (value / 3600).toFixed(2);
        } else {
            // Convert minutes to hours
            totalHours = (value / 60).toFixed(2);
        }

        return `${totalHours} Hours`;
    }

    // Format date to readable format
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';

        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Unknown';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Fetch player UUID from API
    async fetchPlayerUUID() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.PLAYER_UUID}${encodeURIComponent(this.playerName)}/uuid`);
            if (response.ok) {
                const data = await response.json();
                return data.uuid || data.player_uuid || null;
            }
        } catch (error) {
            console.error('Error fetching player UUID:', error);
        }
        return null;
    }

    // Fetch player first seen from API
    async fetchPlayerFirstSeen() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.PLAYER_FIRST_SEEN}${encodeURIComponent(this.playerName)}/first-seen`);
            if (response.ok) {
                const data = await response.json();
                return data.first_seen || data.firstSeen || data.timestamp || null;
            }
        } catch (error) {
            console.error('Error fetching player first seen:', error);
        }
        return null;
    }

    // Fetch player last seen from API
    async fetchPlayerLastSeen() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.PLAYER_LAST_SEEN}${encodeURIComponent(this.playerName)}/last-seen`);
            if (response.ok) {
                const data = await response.json();
                return data.last_seen || data.lastSeen || data.timestamp || null;
            }
        } catch (error) {
            console.error('Error fetching player last seen:', error);
        }
        return null;
    }

    // Fetch online status by checking online players list
    async fetchOnlineStatus() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.ONLINE_PLAYERS}`);
            if (response.ok) {
                const data = await response.json();
                // Check if player is in the online players list
                const onlinePlayers = data.players || data.online_players || [];
                return onlinePlayers.some(player =>
                    (typeof player === 'string' && player.toLowerCase() === this.playerName.toLowerCase()) ||
                    (typeof player === 'object' && (player.name || player.username || '').toLowerCase() === this.playerName.toLowerCase())
                );
            }
        } catch (error) {
            console.error('Error fetching online status:', error);
        }
        return false;
    }

    // Fetch player stats from API
    async fetchPlayerStats() {
        try {
            // Fetch playtime data
            const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.PLAYER_PLAYTIME}${encodeURIComponent(this.playerName)}`);

            if (!response.ok) {
                throw new Error('Player not found');
            }

            const data = await response.json();

            // Fetch additional data if not in playtime response
            const fetchPromises = [];

            // Fetch UUID if missing
            if (!data.uuid && !data.player_uuid) {
                fetchPromises.push(
                    this.fetchPlayerUUID().then(uuid => {
                        if (uuid) data.uuid = uuid;
                    })
                );
            }

            // Fetch first seen if missing
            if (!data.first_join && !data.firstJoin && !data.joined) {
                fetchPromises.push(
                    this.fetchPlayerFirstSeen().then(firstSeen => {
                        if (firstSeen) data.first_join = firstSeen;
                    })
                );
            }

            // Fetch last seen if missing
            if (!data.last_seen && !data.lastSeen && !data.last_login) {
                fetchPromises.push(
                    this.fetchPlayerLastSeen().then(lastSeen => {
                        if (lastSeen) data.last_seen = lastSeen;
                    })
                );
            }

            // Always fetch online status from the online players endpoint
            fetchPromises.push(
                this.fetchOnlineStatus().then(isOnline => {
                    data.online = isOnline;
                })
            );

            // Wait for all additional fetches to complete
            await Promise.all(fetchPromises);

            this.displayPlayerStats(data);
        } catch (error) {
            console.error('Error fetching player stats:', error);
            this.showError('Failed to load player stats. Player may not exist.');
        }
    }

    // Display player stats
    displayPlayerStats(data) {
        // Set player head image using mc-heads.net
        this.playerHeadImg.src = `${CONFIG.MC_HEADS_API}${encodeURIComponent(this.playerName)}`;
        this.playerHeadImg.alt = `${this.playerName}'s head`;

        // Set player name
        this.playerNameDisplay.textContent = data.username || data.name || this.playerName;

        // Set UUID
        const uuid = data.uuid || data.player_uuid || 'Unknown';
        this.playerUUID.textContent = `UUID: ${uuid}`;

        // Set playtime (handle both seconds and minutes)
        const playtime = data.playtime || data.minutes || data.seconds || 0;
        // Check if API specifies the unit, otherwise auto-detect
        const unit = data.playtime_unit || (data.seconds ? 'seconds' : 'auto');
        document.getElementById('stat-playtime').textContent = this.formatPlaytime(playtime, unit);

        // Set first join
        const firstJoin = data.first_join || data.firstJoin || data.joined;
        document.getElementById('stat-firstjoin').textContent = this.formatDate(firstJoin);

        // Set last seen
        const lastSeen = data.last_seen || data.lastSeen || data.last_login;
        document.getElementById('stat-lastseen').textContent = this.formatDate(lastSeen);

        // Set status
        const isOnline = data.online || data.is_online || false;
        const statusElement = document.getElementById('stat-status');
        statusElement.textContent = isOnline ? 'Online' : 'Offline';
        statusElement.className = isOnline ? 'stat-value status-online' : 'stat-value status-offline';

        // Hide error message if it was shown
        this.errorMessage.style.display = 'none';
    }

    // Show error message
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';

        // Hide stats if there's an error
        this.playerNameDisplay.textContent = this.playerName || 'Unknown';
        this.playerUUID.textContent = 'UUID: Not found';
        this.playerHeadImg.style.display = 'none';

        document.getElementById('stat-playtime').textContent = 'N/A';
        document.getElementById('stat-firstjoin').textContent = 'N/A';
        document.getElementById('stat-lastseen').textContent = 'N/A';
        document.getElementById('stat-status').textContent = 'N/A';
    }
}

// Make PlayerStatsManager available globally
window.PlayerStatsManager = PlayerStatsManager;
