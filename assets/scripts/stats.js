// Stats and Leaderboard Management
class StatsManager {
    constructor() {
        this.leaderboardDiv = document.getElementById('playtime-leaderboard');
    }

    // Initialize stats functionality
    init() {
        this.fetchLeaderboard();

        // Refresh leaderboard every 5 minutes
        setInterval(() => {
            this.fetchLeaderboard();
        }, CONFIG.LEADERBOARD_REFRESH_INTERVAL);
    }

    // Format playtime to total hours with decimals
    // Handles both seconds and minutes from API
    formatPlaytime(value) {
        if (!value) return '0.00h';

        let totalHours;
        // If value is very large (> 1000), assume it's in seconds
        // Otherwise treat as minutes for backwards compatibility
        if (value > 1000) {
            // Convert seconds to hours
            totalHours = (value / 3600).toFixed(2);
        } else {
            // Convert minutes to hours
            totalHours = (value / 60).toFixed(2);
        }

        return `${totalHours}h`;
    }

    // Fetch and display playtime leaderboard
    async fetchLeaderboard() {
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.PLAYTIME_LEADERBOARD}?limit=10`;
            console.log('Fetching leaderboard from:', url);

            const response = await fetch(url);
            console.log('Leaderboard response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Leaderboard error response:', errorText);
                throw new Error(`Failed to fetch leaderboard: ${response.status}`);
            }

            const data = await response.json();
            console.log('Leaderboard data:', data);

            // Handle different response formats
            let leaderboardArray = data;

            // If data is wrapped in an object, try to find the array
            if (!Array.isArray(data)) {
                leaderboardArray = data.leaderboard || data.players || data.data || [];
            }

            if (!leaderboardArray || leaderboardArray.length === 0) {
                this.leaderboardDiv.innerHTML = '<p class="empty-message">No playtime data available</p>';
                return;
            }

            this.displayLeaderboard(leaderboardArray);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            this.leaderboardDiv.innerHTML = `<p class="error-message">Failed to load leaderboard: ${error.message}</p>`;
        }
    }

    // Display leaderboard data
    displayLeaderboard(data) {
        let html = '<div class="leaderboard-list">';
        data.forEach((player, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';

            // Try different possible username fields
            const playerName = player.username || player.player_name || player.name || player.player || 'Unknown';

            // Try different possible playtime fields (could be seconds, minutes, or playtime)
            const playtime = player.playtime || player.seconds || player.minutes || player.time || 0;

            html += `
                <div class="leaderboard-item ${rankClass}">
                    <span class="rank">#${rank}</span>
                    <span class="player-name">${playerName}</span>
                    <span class="playtime">${this.formatPlaytime(playtime)}</span>
                </div>
            `;
        });
        html += '</div>';
        this.leaderboardDiv.innerHTML = html;
    }

    // Fetch individual player playtime (can be used for future features)
    async fetchPlayerPlaytime(playerName) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.PLAYER_PLAYTIME}${playerName}`);
            if (!response.ok) throw new Error('Failed to fetch player playtime');

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching player playtime:', error);
            return null;
        }
    }
}

// Make StatsManager available globally
window.StatsManager = StatsManager;
