// Ban Details Management
class BanDetailsManager {
    constructor() {
        this.playerName = this.getPlayerNameFromURL();
        this.playerHeadImg = document.getElementById('ban-player-head');
        this.playerNameDisplay = document.getElementById('ban-player-name');
        this.banStatusDisplay = document.getElementById('ban-status-display');
        this.errorMessage = document.getElementById('error-message');
    }

    // Get player name from URL parameters
    getPlayerNameFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('name');
    }

    // Initialize ban details page
    init() {
        if (!this.playerName) {
            this.showError('No player name specified');
            return;
        }

        // Set initial player name
        this.playerNameDisplay.textContent = this.playerName;

        // Load ban data
        this.fetchBanDetails();
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

    // Fetch ban details from API
    async fetchBanDetails() {
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.PLAYER_BAN}${encodeURIComponent(this.playerName)}`;
            console.log('Fetching ban details from:', url);

            const response = await fetch(url);
            console.log('Ban details response status:', response.status);

            // Try to parse the response
            const data = await response.json();
            console.log('Ban details data:', data);

            // Check if the response indicates no ban found
            if (response.status === 404 ||
                data.message === 'Player not banned' ||
                data.message === 'No ban found' ||
                data.error === 'Player not found' ||
                data.error === 'No ban found' ||
                data.banned === false ||
                data.isBanned === false ||
                !data.player) {
                this.showError('No ban found for this player.');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch ban details');
            }

            // Handle different response formats
            let banData = data;
            if (data.ban) {
                banData = data.ban;
            }

            // Additional check: if response is an empty object or missing critical data
            if (!banData || typeof banData !== 'object') {
                this.showError('No ban found for this player.');
                return;
            }

            // Check if banData doesn't have essential ban fields, treat as not banned
            if (!banData.reason && !banData.banned_at && !banData.created_at && !banData.timestamp) {
                this.showError('No ban found for this player.');
                return;
            }

            this.displayBanDetails(banData);
        } catch (error) {
            console.error('Error fetching ban details:', error);
            this.showError('Failed to load ban details. Player may not be banned.');
        }
    }

    // Display ban details
    displayBanDetails(data) {
        // Set player head image using mc-heads.net
        this.playerHeadImg.src = `${CONFIG.MC_HEADS_API}${encodeURIComponent(this.playerName)}`;
        this.playerHeadImg.alt = `${this.playerName}'s head`;

        // Set player name
        const playerName = data.player || data.player_name || data.username || data.name || this.playerName;
        this.playerNameDisplay.textContent = playerName;

        // Set ban status
        const isActive = data.active !== false;
        const statusText = isActive ? 'Banned' : 'Unbanned';
        const statusClass = isActive ? 'status-banned' : 'status-expired';
        this.banStatusDisplay.textContent = `Status: ${statusText}`;
        this.banStatusDisplay.className = `ban-status-text ${statusClass}`;

        // Set ban reason
        const reason = data.reason || 'No reason specified';
        document.getElementById('ban-reason').textContent = reason;

        // Set banned by
        const bannedBy = data.bannedBy || data.banned_by || data.banner || data.source || 'Console';
        document.getElementById('ban-bannedby').textContent = bannedBy;

        // Set ban date
        const bannedAt = data.banned_at || data.created_at || data.timestamp;
        document.getElementById('ban-date').textContent = this.formatDate(bannedAt);

        // Set expiration
        const expiresAt = data.expires_at || data.expires || data.expiration;
        const expiresText = expiresAt ? this.formatDate(expiresAt) : 'Permanent';
        document.getElementById('ban-expires').textContent = expiresText;

        // Hide error message if it was shown
        this.errorMessage.style.display = 'none';
    }

    // Show error message
    showError(message) {
        this.errorMessage.querySelector('p').textContent = message;
        this.errorMessage.style.display = 'block';

        // Hide the entire player card when there's no ban
        const playerCard = document.querySelector('.player-card');
        const playerStatsGrid = document.querySelector('.player-stats-grid');
        const playerHeader = document.querySelector('.player-header');

        if (playerStatsGrid) playerStatsGrid.style.display = 'none';
        if (playerHeader) playerHeader.style.display = 'none';

        // Show player name in error message for clarity
        this.errorMessage.querySelector('p').textContent = `This player is not banned`;
    }
}

// Make BanDetailsManager available globally
window.BanDetailsManager = BanDetailsManager;
