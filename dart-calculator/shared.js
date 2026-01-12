// --- CONSTANTS ---
const PLAYER_COLORS = [
    '#F43F5E', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6366F1', '#14B8A6',
    '#06B6D4', '#84CC16', '#F97316', '#D946EF', '#A855F7', '#0EA5E9', '#22C55E', '#EAB308',
    '#EF4444', '#64748B', '#71717A', '#737373', '#78716C'
];

const TEAM_COLORS = [
    '#2563EB', '#DC2626', '#16A34A', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4F46E5',
    '#059669', '#EA580C', '#9333EA', '#C026D3', '#0284C7', '#10B981', '#F59E0B', '#6366F1',
    '#F43F5E', '#8B5CF6', '#F97316', '#06B6D4'
];
const INITIAL_LIVES = 3;
const TTT_WINS = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7], [2, 5, 8], [3, 6, 9], [1, 5, 9], [3, 5, 7]];
const MODES = [
    { id: '501', name: '501', desc: 'Race to zero! Standard rules.', icon: 'target', color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-500/40' },
    { id: 'Cricket', name: 'Cricket', desc: 'Close numbers 15-20 & Bull.', icon: 'hash', color: 'from-green-400 to-emerald-600', shadow: 'shadow-green-500/40' },
    { id: 'Killer', name: 'Killer', desc: 'Take lives from opponents!', icon: 'skull', color: 'from-red-400 to-rose-600', shadow: 'shadow-red-500/40' },
    { id: 'Tic-Tac-Toe', name: 'Tic-Tac-Toe', desc: 'Claim squares, get 3 in a row.', icon: 'box', color: 'from-orange-400 to-amber-500', shadow: 'shadow-orange-500/40' },
    { id: 'Highest Score', name: 'Highest Score', desc: 'Highest total after n rounds wins!', icon: 'trending-up', color: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/40' },
    { id: 'Lowest Score', name: 'Lowest Score', desc: 'Lowest total after n rounds wins!', icon: 'trending-down', color: 'from-purple-400 to-pink-500', shadow: 'shadow-purple-500/40' },
];

// --- STATE MANAGEMENT ---
function getState() {
    const saved = localStorage.getItem('darts_state');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse state', e);
        }
    }
    return {
        gameMode: '501',
        players: [
            { id: 'p1', name: 'Player 1', score: 0, color: PLAYER_COLORS[0], active: true },
            { id: 'p2', name: 'Player 2', score: 0, color: PLAYER_COLORS[1], active: true }
        ],
        teams: [
            { id: 't1', name: 'Team 1', score: 0, color: TEAM_COLORS[0], players: [] },
            { id: 't2', name: 'Team 2', score: 0, color: TEAM_COLORS[1], players: [] }
        ],
        isPlayerType: true,
        currentPlayerIndex: 0,
        activeParticipants: [],
        winner: null,
        history: [],
        roundThrows: [],
        isDark: localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
        soundEnabled: localStorage.getItem('darts_sound_enabled') !== 'false'
    };
}

function saveState(state) {
    localStorage.setItem('darts_state', JSON.stringify(state));
}

function getGameState() {
    const saved = localStorage.getItem('darts_game_state');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse game state', e);
        }
    }
    return null;
}

function saveGameState(gameState) {
    localStorage.setItem('darts_game_state', JSON.stringify(gameState));
}

function clearGameState() {
    localStorage.removeItem('darts_game_state');
}

// --- DATABASE (IndexedDB) ---
const db = {
    name: 'DartsPartyDB',
    version: 2,
    instance: null,

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains('setup')) {
                    database.createObjectStore('setup', { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains('games')) {
                    database.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
                }
                if (!database.objectStoreNames.contains('throws')) {
                    const throwsStore = database.createObjectStore('throws', { keyPath: 'id', autoIncrement: true });
                    throwsStore.createIndex('gameId', 'gameId', { unique: false });
                    throwsStore.createIndex('playerId', 'playerId', { unique: false });
                    throwsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
            request.onsuccess = (e) => {
                this.instance = e.target.result;
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async saveParticipants() {
        if (!this.instance) return;
        const state = getState();
        const tx = this.instance.transaction('setup', 'readwrite');
        const store = tx.objectStore('setup');
        await store.put({ id: 'players', data: JSON.parse(JSON.stringify(state.players)) });
        await store.put({ id: 'teams', data: JSON.parse(JSON.stringify(state.teams)) });
        await store.put({ id: 'config', data: { isPlayerType: state.isPlayerType } });
    },

    async loadParticipants() {
        if (!this.instance) return;
        const tx = this.instance.transaction('setup', 'readonly');
        const store = tx.objectStore('setup');
        const playersReq = store.get('players');
        const teamsReq = store.get('teams');
        const configReq = store.get('config');

        return new Promise((resolve) => {
            let loaded = 0;
            const state = getState();
            const check = () => {
                if (++loaded === 3) resolve();
            };
            playersReq.onsuccess = () => { 
                if (playersReq.result) { 
                    state.players = playersReq.result.data;
                    // Ensure all players have 'active' property for backward compatibility
                    state.players.forEach(p => {
                        if (p.active === undefined) p.active = true;
                    });
                    saveState(state); 
                } 
                check(); 
            };
            teamsReq.onsuccess = () => { if (teamsReq.result) { state.teams = teamsReq.result.data; saveState(state); } check(); };
            configReq.onsuccess = () => { if (configReq.result) { state.isPlayerType = configReq.result.data.isPlayerType; saveState(state); } check(); };
            playersReq.onerror = teamsReq.onerror = configReq.onerror = check;
        });
    },

    async saveGame(gameData) {
        if (!this.instance) return;
        const tx = this.instance.transaction('games', 'readwrite');
        const store = tx.objectStore('games');
        const gameRecord = {
            ...gameData,
            throwsCount: gameData.throwsCount || 0,
            timestamp: new Date().toISOString()
        };
        const request = store.add(gameRecord);
        return new Promise((resolve, reject) => {
            request.onsuccess = (e) => resolve(e.target.result); // Returns the gameId
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async saveThrow(throwData) {
        if (!this.instance) return;
        const tx = this.instance.transaction('throws', 'readwrite');
        const store = tx.objectStore('throws');
        const throwRecord = {
            ...throwData,
            timestamp: new Date().toISOString()
        };
        await store.add(throwRecord);
    },

    async getThrowsForGame(gameId) {
        if (!this.instance) return [];
        const tx = this.instance.transaction('throws', 'readonly');
        const store = tx.objectStore('throws');
        const index = store.index('gameId');
        const request = index.getAll(gameId);
        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
            request.onerror = () => resolve([]);
        });
    },

    async getGames() {
        if (!this.instance) return [];
        const tx = this.instance.transaction('games', 'readonly');
        const store = tx.objectStore('games');
        const request = store.getAll();
        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            request.onerror = () => resolve([]);
        });
    },

    async clearHistory() {
        if (!this.instance) return;
        const tx = this.instance.transaction('games', 'readwrite');
        const store = tx.objectStore('games');
        await store.clear();
    }
};

// --- THEME & SOUND ---
function updateTheme() {
    const state = getState();
    document.documentElement.classList.toggle('dark', state.isDark);
    localStorage.setItem('theme', state.isDark ? 'dark' : 'light');
}

function toggleTheme() {
    const state = getState();
    state.isDark = !state.isDark;
    saveState(state);
    updateTheme();
    lucide.createIcons();
}

function updateSoundIcons() {
    const state = getState();
    const soundOnIcon = document.getElementById('sound-on-icon');
    const soundOffIcon = document.getElementById('sound-off-icon');
    if (soundOnIcon) soundOnIcon.classList.toggle('hidden', !state.soundEnabled);
    if (soundOffIcon) soundOffIcon.classList.toggle('hidden', state.soundEnabled);
}

function toggleSound() {
    const state = getState();
    state.soundEnabled = !state.soundEnabled;
    saveState(state);
    localStorage.setItem('darts_sound_enabled', state.soundEnabled);
    updateSoundIcons();
    playSound('click');
}

const createSound = (type) => {
    const state = getState();
    if (!state.soundEnabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'save') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'delete') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'win') {
        [0, 0.1, 0.2, 0.3, 0.4].forEach((t, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.value = 440 * Math.pow(1.5, i);
            gain.gain.setValueAtTime(0.2, now + t);
            gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.3);
            osc.start(now + t); osc.stop(now + t + 0.3);
        });
    } else if (type === 'milestone') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
};

function playSound(type) { try { createSound(type); } catch (e) { } }

// --- CONFETTI ---
let confettiAnimationId;
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particles = [];
    const COLORS = ['#F472B6', '#FBBF24', '#60A5FA', '#34D399', '#A78BFA', '#F87171'];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: canvas.width / 2, y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 - 5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 10,
            size: Math.random() * 8 + 4
        });
    }
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.vx *= 0.96; p.rotation += p.rotationSpeed;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore();
            if (p.y > canvas.height) particles.splice(i, 1);
        });
        if (particles.length > 0) confettiAnimationId = requestAnimationFrame(animate);
        else canvas.classList.add('hidden');
    }
    animate();
}
