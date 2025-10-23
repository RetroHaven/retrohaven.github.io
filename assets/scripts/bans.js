// Bans Management
class BansManager {
    constructor() {
        this.searchForm = document.getElementById('ban-search-form');
        this.searchInput = document.getElementById('ban-search-input');
        this.searchResult = document.getElementById('ban-search-result');
        this.totalBansSpan = document.getElementById('total-bans');
    }

    // Initialize bans functionality
    init() {
        this.fetchBanStats();

        // Refresh ban stats every 5 minutes
        setInterval(() => {
            this.fetchBanStats();
        }, CONFIG.LEADERBOARD_REFRESH_INTERVAL);

        // Handle ban search - redirect to ban details page
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const playerName = this.searchInput.value.trim();
            if (playerName) {
                window.location.href = `ban.html?name=${encodeURIComponent(playerName)}`;
            }
        });
    }

    // Format date to readable format
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';

        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Unknown';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Search for a specific player's ban
    async searchPlayerBan(playerName) {
        try {
            this.searchResult.style.display = 'block';
            this.searchResult.innerHTML = '<p class="loading">Searching...</p>';

            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.PLAYER_BAN}${encodeURIComponent(playerName)}`;
            console.log('Searching for player ban:', url);

            const response = await fetch(url);
            console.log('Player ban search response status:', response.status);

            // Try to parse the response regardless of status code
            const data = await response.json();
            console.log('Player ban data:', data);

            // Check if the response indicates no ban found
            if (response.status === 404 || data.message === 'Player not banned' || data.error || !data.player) {
                this.searchResult.innerHTML = `<p class="info-message">No ban found for player: ${playerName}</p>`;
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to search player ban: ${response.status}`);
            }

            // Handle different response formats
            let banData = data;
            if (data.ban) {
                banData = data.ban;
            }

            this.displaySearchResult(banData, playerName);
        } catch (error) {
            console.error('Error searching player ban:', error);
            this.searchResult.innerHTML = `<p class="error-message">Failed to search ban: ${error.message}</p>`;
        }
    }

    // Display search result
    displaySearchResult(ban, playerName) {
        const bannedBy = ban.bannedBy || ban.banned_by || ban.banner || ban.source || 'Console';
        const reason = ban.reason || 'No reason specified';
        const bannedAt = this.formatDate(ban.banned_at || ban.created_at || ban.timestamp);
        const isActive = ban.active !== false;

        const statusClass = isActive ? 'ban-active' : 'ban-expired';
        const statusText = isActive ? 'Active' : 'Expired';

        const html = `
            <div class="ban-item ${statusClass}">
                <div class="ban-header">
                    <img src="${CONFIG.MC_HEADS_API}${encodeURIComponent(playerName)}" alt="${playerName}" class="ban-player-head">
                    <div class="ban-player-info">
                        <span class="ban-player-name">${playerName}</span>
                        <span class="ban-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="ban-details">
                    <p class="ban-reason"><strong>Reason:</strong> ${reason}</p>
                    <p class="ban-meta">
                        <span>Banned by: ${bannedBy}</span> |
                        <span>Date: ${bannedAt}</span>
                    </p>
                </div>
            </div>
        `;

        this.searchResult.innerHTML = html;
    }

    // Fetch ban statistics
    async fetchBanStats() {
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.BAN_STATS}`;
            console.log('Fetching ban stats from:', url);

            const response = await fetch(url);
            console.log('Ban stats response status:', response.status);

            if (!response.ok) {
                throw new Error(`Failed to fetch ban stats: ${response.status}`);
            }

            const data = await response.json();
            console.log('Ban stats data:', data);

            // Update statistics
            if (this.totalBansSpan) {
                this.totalBansSpan.textContent = data.totalBans || data.total || data.total_bans || '0';
            }
        } catch (error) {
            console.error('Error fetching ban stats:', error);
            if (this.totalBansSpan) {
                this.totalBansSpan.textContent = 'Error';
            }
        }
    }
}

// Make BansManager available globally
window.BansManager = BansManager;
