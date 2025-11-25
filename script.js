// Game State
const gameState = {
    teamA: {
        name: 'TIME A',
        score: 0,
        sets: 0,
        serving: true
    },
    teamB: {
        name: 'TIME B',
        score: 0,
        sets: 0,
        serving: false
    },
    currentSet: 1,
    setHistory: [],
    history: [],
    settings: {
        pointsToWin: 25,
        minDifference: 2,
        setsToWin: 3,
        tiebreakPoints: 15,
        soundEnabled: true
    }
};

// DOM Elements
const elements = {
    teamAName: document.getElementById('teamAName'),
    teamBName: document.getElementById('teamBName'),
    scoreA: document.getElementById('scoreA'),
    scoreB: document.getElementById('scoreB'),
    setsA: document.getElementById('setsA'),
    setsB: document.getElementById('setsB'),
    currentSet: document.getElementById('currentSet'),
    serveA: document.getElementById('serveA'),
    serveB: document.getElementById('serveB'),
    teamA: document.getElementById('teamA'),
    teamB: document.getElementById('teamB'),
    historyContent: document.getElementById('historyContent'),
    settingsModal: document.getElementById('settingsModal'),
    winnerModal: document.getElementById('winnerModal'),
    winnerName: document.getElementById('winnerName'),
    winnerStats: document.getElementById('winnerStats')
};

// Sound Effects (using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    if (!gameState.settings.soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playScoredSound() {
    playSound(800, 0.15);
    setTimeout(() => playSound(1000, 0.15), 100);
}

function playSetWonSound() {
    playSound(600, 0.2);
    setTimeout(() => playSound(800, 0.2), 150);
    setTimeout(() => playSound(1200, 0.3), 300);
}

function playGameWonSound() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => playSound(800 + i * 100, 0.2), i * 100);
    }
}

// Initialize
function init() {
    loadSettings();
    updateDisplay();
    attachEventListeners();
    loadGameState();
}

// Event Listeners
function attachEventListeners() {
    // Score buttons
    document.querySelectorAll('.score-btn').forEach(btn => {
        btn.addEventListener('click', handleScoreClick);
    });
    
    // Control buttons
    document.getElementById('switchServeBtn').addEventListener('click', switchServe);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('newSetBtn').addEventListener('click', startNewSet);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeModal').addEventListener('click', closeSettings);
    document.getElementById('newGameBtn').addEventListener('click', () => {
        closeWinnerModal();
        resetGame();
    });
    
    // Team name inputs
    elements.teamAName.addEventListener('change', (e) => {
        gameState.teamA.name = e.target.value || 'TIME A';
        saveGameState();
    });
    
    elements.teamBName.addEventListener('change', (e) => {
        gameState.teamB.name = e.target.value || 'TIME B';
        saveGameState();
    });
    
    // Settings inputs
    document.getElementById('pointsToWin').addEventListener('change', (e) => {
        gameState.settings.pointsToWin = parseInt(e.target.value) || 25;
        saveSettings();
    });
    
    document.getElementById('minDifference').addEventListener('change', (e) => {
        gameState.settings.minDifference = parseInt(e.target.value) || 2;
        saveSettings();
    });
    
    document.getElementById('setsToWin').addEventListener('change', (e) => {
        gameState.settings.setsToWin = parseInt(e.target.value) || 3;
        saveSettings();
    });
    
    document.getElementById('tiebreakPoints').addEventListener('change', (e) => {
        gameState.settings.tiebreakPoints = parseInt(e.target.value) || 15;
        saveSettings();
    });
    
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        gameState.settings.soundEnabled = e.target.checked;
        saveSettings();
        if (e.target.checked) {
            playSound(600, 0.1);
        }
    });
    
    // Close modal on outside click
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettings();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

function handleKeyboard(e) {
    if (elements.settingsModal.classList.contains('active') || 
        elements.winnerModal.classList.contains('active')) return;
    
    switch(e.key) {
        case 'a':
        case 'A':
            addPoint('a');
            break;
        case 'b':
        case 'B':
            addPoint('b');
            break;
        case 's':
        case 'S':
            switchServe();
            break;
        case 'z':
        case 'Z':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                undo();
            }
            break;
        case 'n':
        case 'N':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                startNewSet();
            }
            break;
    }
}

function handleScoreClick(e) {
    const team = e.target.dataset.team;
    const action = e.target.dataset.action;
    
    if (action === 'plus') {
        addPoint(team);
    } else if (action === 'minus') {
        removePoint(team);
    }
}

// Game Logic
function addPoint(team) {
    saveHistory();
    
    const targetTeam = team === 'a' ? gameState.teamA : gameState.teamB;
    targetTeam.score++;
    
    playScoredSound();
    
    const scoreElement = team === 'a' ? elements.scoreA : elements.scoreB;
    scoreElement.classList.add('animate');
    setTimeout(() => scoreElement.classList.remove('animate'), 500);
    
    updateDisplay();
    checkSetWin();
    saveGameState();
}

function removePoint(team) {
    saveHistory();
    
    const targetTeam = team === 'a' ? gameState.teamA : gameState.teamB;
    if (targetTeam.score > 0) {
        targetTeam.score--;
        updateDisplay();
        saveGameState();
    }
}

function switchServe() {
    saveHistory();
    gameState.teamA.serving = !gameState.teamA.serving;
    gameState.teamB.serving = !gameState.teamB.serving;
    updateDisplay();
    saveGameState();
}

function checkSetWin() {
    const { teamA, teamB, currentSet, settings } = gameState;
    const maxSets = settings.setsToWin * 2 - 1;
    const isTiebreak = currentSet === maxSets;
    const pointsNeeded = isTiebreak ? settings.tiebreakPoints : settings.pointsToWin;
    
    let winner = null;
    
    if (teamA.score >= pointsNeeded && teamA.score - teamB.score >= settings.minDifference) {
        winner = 'a';
    } else if (teamB.score >= pointsNeeded && teamB.score - teamA.score >= settings.minDifference) {
        winner = 'b';
    }
    
    if (winner) {
        playSetWonSound();
        
        gameState.setHistory.push({
            set: currentSet,
            scoreA: teamA.score,
            scoreB: teamB.score,
            winner: winner
        });
        
        if (winner === 'a') {
            teamA.sets++;
        } else {
            teamB.sets++;
        }
        
        updateSetHistory();
        
        if (teamA.sets >= settings.setsToWin || teamB.sets >= settings.setsToWin) {
            setTimeout(() => showWinner(winner), 500);
        } else {
            setTimeout(() => {
                alert(`${winner === 'a' ? teamA.name : teamB.name} venceu o Set ${currentSet}!`);
                startNewSet();
            }, 500);
        }
    }
}

function startNewSet() {
    if (gameState.teamA.score === 0 && gameState.teamB.score === 0 && 
        gameState.setHistory.length > 0) {
        return;
    }
    
    saveHistory();
    gameState.currentSet++;
    gameState.teamA.score = 0;
    gameState.teamB.score = 0;
    elements.currentSet.textContent = gameState.currentSet;
    updateDisplay();
    saveGameState();
}

function resetGame() {
    if (!confirm('Tem certeza que deseja resetar o jogo?')) return;
    
    gameState.teamA.score = 0;
    gameState.teamB.score = 0;
    gameState.teamA.sets = 0;
    gameState.teamB.sets = 0;
    gameState.currentSet = 1;
    gameState.setHistory = [];
    gameState.history = [];
    
    updateDisplay();
    updateSetHistory();
    saveGameState();
}

function saveHistory() {
    gameState.history.push(JSON.parse(JSON.stringify({
        teamA: gameState.teamA,
        teamB: gameState.teamB,
        currentSet: gameState.currentSet,
        setHistory: gameState.setHistory
    })));
    
    if (gameState.history.length > 50) {
        gameState.history.shift();
    }
}

function undo() {
    if (gameState.history.length === 0) {
        alert('Nada para desfazer!');
        return;
    }
    
    const lastState = gameState.history.pop();
    gameState.teamA = lastState.teamA;
    gameState.teamB = lastState.teamB;
    gameState.currentSet = lastState.currentSet;
    gameState.setHistory = lastState.setHistory;
    
    updateDisplay();
    updateSetHistory();
    saveGameState();
}

// Display Updates
function updateDisplay() {
    elements.teamAName.value = gameState.teamA.name;
    elements.teamBName.value = gameState.teamB.name;
    elements.scoreA.textContent = gameState.teamA.score;
    elements.scoreB.textContent = gameState.teamB.score;
    elements.setsA.textContent = gameState.teamA.sets;
    elements.setsB.textContent = gameState.teamB.sets;
    elements.currentSet.textContent = gameState.currentSet;
    
    // Serve indicators
    elements.serveA.classList.toggle('active', gameState.teamA.serving);
    elements.serveB.classList.toggle('active', gameState.teamB.serving);
    
    // Winning team highlight
    if (gameState.teamA.score > gameState.teamB.score) {
        elements.teamA.classList.add('winning');
        elements.teamB.classList.remove('winning');
    } else if (gameState.teamB.score > gameState.teamA.score) {
        elements.teamB.classList.add('winning');
        elements.teamA.classList.remove('winning');
    } else {
        elements.teamA.classList.remove('winning');
        elements.teamB.classList.remove('winning');
    }
}

function updateSetHistory() {
    if (gameState.setHistory.length === 0) {
        elements.historyContent.innerHTML = '<div class="empty-history">Nenhum set finalizado ainda</div>';
        return;
    }
    
    elements.historyContent.innerHTML = gameState.setHistory.map(set => {
        const winnerName = set.winner === 'a' ? gameState.teamA.name : gameState.teamB.name;
        return `
            <div class="set-result">
                <strong>Set ${set.set}:</strong>
                <span>${set.scoreA} - ${set.scoreB}</span>
                <span class="winner">Vencedor: ${winnerName}</span>
            </div>
        `;
    }).join('');
}

// Winner Modal
function showWinner(winner) {
    playGameWonSound();
    
    const winnerTeam = winner === 'a' ? gameState.teamA : gameState.teamB;
    const loserTeam = winner === 'a' ? gameState.teamB : gameState.teamA;
    
    elements.winnerName.textContent = winnerTeam.name;
    elements.winnerStats.innerHTML = `
        <p><strong>Sets Vencidos:</strong> ${winnerTeam.sets} - ${loserTeam.sets}</p>
        <p><strong>Placar Final:</strong> ${winnerTeam.score} - ${loserTeam.score}</p>
        <p><strong>Total de Sets:</strong> ${gameState.setHistory.length}</p>
    `;
    
    createConfetti();
    elements.winnerModal.classList.add('active');
}

function closeWinnerModal() {
    elements.winnerModal.classList.remove('active');
}

function createConfetti() {
    const confetti = document.querySelector('.confetti');
    confetti.innerHTML = '';
    
    const colors = ['#ff3b3b', '#00d9ff', '#00ff88', '#ffff00', '#ff00ff'];
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '-10px';
        particle.style.borderRadius = '50%';
        particle.style.animation = `fall ${2 + Math.random() * 3}s linear infinite`;
        particle.style.animationDelay = Math.random() * 2 + 's';
        confetti.appendChild(particle);
    }
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            to {
                transform: translateY(600px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Settings
function openSettings() {
    elements.settingsModal.classList.add('active');
    document.getElementById('pointsToWin').value = gameState.settings.pointsToWin;
    document.getElementById('minDifference').value = gameState.settings.minDifference;
    document.getElementById('setsToWin').value = gameState.settings.setsToWin;
    document.getElementById('tiebreakPoints').value = gameState.settings.tiebreakPoints;
    document.getElementById('soundToggle').checked = gameState.settings.soundEnabled;
}

function closeSettings() {
    elements.settingsModal.classList.remove('active');
}

// Local Storage
function saveGameState() {
    localStorage.setItem('volleyballGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('volleyballGameState');
    if (saved) {
        const loadedState = JSON.parse(saved);
        Object.assign(gameState, loadedState);
        updateDisplay();
        updateSetHistory();
    }
}

function saveSettings() {
    localStorage.setItem('volleyballSettings', JSON.stringify(gameState.settings));
}

function loadSettings() {
    const saved = localStorage.getItem('volleyballSettings');
    if (saved) {
        Object.assign(gameState.settings, JSON.parse(saved));
    }
}

// Start the app
init();