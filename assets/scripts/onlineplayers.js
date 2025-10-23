// Online Players Management
class OnlinePlayersManager {
    constructor() {
        this.ws = null;
        this.onlineDiv = document.getElementById('online-players');
        this.countSpan = document.getElementById('online-count');
    }

    // Initialize online players functionality
    init() {
        this.fetchOnlinePlayers();
        this.connectWebSocket();

        // Fallback: poll online players every 30 seconds if WebSocket fails
        setInterval(() => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.fetchOnlinePlayers();
            }
        }, CONFIG.ONLINE_PLAYERS_POLL_INTERVAL);
    }

    // Fetch online players (REST API fallback)
    async fetchOnlinePlayers() {
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.ONLINE_PLAYERS}`;
            console.log('Fetching online players from:', url);

            const response = await fetch(url);
            console.log('Online players response status:', response.status);

            if (!response.ok) throw new Error('Failed to fetch online players');

            const data = await response.json();
            console.log('Online players data:', data);

            this.updateOnlinePlayers(data);
        } catch (error) {
            console.error('Error fetching online players:', error);
            this.onlineDiv.innerHTML = '<p class="error-message">Failed to load online players</p>';
        }
    }

    // Update online players display
    updateOnlinePlayers(players) {
        console.log('Updating online players with data:', players);

        // Handle different response formats
        let playerList = [];
        if (Array.isArray(players)) {
            playerList = players;
        } else if (players.players && Array.isArray(players.players)) {
            playerList = players.players;
        } else if (players.online && Array.isArray(players.online)) {
            playerList = players.online;
        } else if (players.data && Array.isArray(players.data)) {
            playerList = players.data;
        }

        console.log('Player list:', playerList);
        this.countSpan.textContent = playerList.length;

        if (playerList.length === 0) {
            this.onlineDiv.innerHTML = '<p class="empty-message">No players online</p>';
            return;
        }

        let html = '<div class="online-list">';
        playerList.forEach(player => {
            console.log('Processing player:', player);

            // Handle both string usernames and player objects
            let name;
            if (typeof player === 'string') {
                // Player is just a username string
                name = player;
            } else {
                // Player is an object, try different possible username fields
                name = player.username || player.player_name || player.name || player.player || player.displayName || player.user || 'Unknown';
            }

            html += `<div class="online-player">${name}</div>`;
        });
        html += '</div>';
        this.onlineDiv.innerHTML = html;
    }

    // Connect to WebSocket for real-time online players
    connectWebSocket() {
        try {
            this.ws = new WebSocket(CONFIG.WS_URL);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('WebSocket event:', data);

                // Handle different message types
                if (data.type === 'online_players' || data.players) {
                    this.updateOnlinePlayers(data);
                } else if (data.type === 'player_join' || data.type === 'player_leave') {
                    // Refresh online players on join/leave events
                    this.fetchOnlinePlayers();
                }
            };

            this.ws.onerror = (error) => {
                console.warn('WebSocket connection failed, using REST API polling instead');
            };

            this.ws.onclose = (event) => {
                // Don't retry if connection was explicitly closed or if it's a connection error
                if (event.code !== 1000 && event.code !== 1006) {
                    console.log('WebSocket disconnected, retrying in 5s...');
                    setTimeout(() => this.connectWebSocket(), CONFIG.WEBSOCKET_RECONNECT_DELAY);
                } else {
                    console.log('WebSocket unavailable, using REST API polling');
                }
            };
        } catch (error) {
            console.warn('WebSocket not available, using REST API polling instead');
            this.ws = null;
        }
    }
}

// Make OnlinePlayersManager available globally
window.OnlinePlayersManager = OnlinePlayersManager;
