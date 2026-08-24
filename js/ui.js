const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const endTitle = document.getElementById('endTitle');
const endMsg = document.getElementById('endMsg');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const bgMusic = document.getElementById('bgMusic');
const muteBtn = document.getElementById('muteBtn');

bgMusic.volume = 0.5;

muteBtn.addEventListener('click', () => {
    bgMusic.muted = !bgMusic.muted;
    SoundFX.setMuted(bgMusic.muted);
    muteBtn.textContent = bgMusic.muted ? '🔇' : '🔊';
});

document.getElementById('charPick').addEventListener('click', e => {
    const btn = e.target.closest('button[data-char]');
    if (!btn) return;
    character = btn.dataset.char;
    document.querySelectorAll('#charPick button').forEach(b => b.classList.toggle('active', b === btn));
});

document.getElementById('startBtn').addEventListener('click', () => {
    const sel = document.getElementById('levelSelect');
    const startIdx = sel ? parseInt(sel.value) : 0;
    
    // Play music and unlock sound effects on first user interaction
    bgMusic.play().catch(e => console.log('Audio autoplay prevented', e));
    SoundFX.unlock();
    
    resetLevel(true, startIdx); // Function defined in engine.js
    state = 'playing';
    startOverlay.classList.add('hidden');
});

document.getElementById('restartBtn').addEventListener('click', () => {
    endOverlay.classList.add('hidden');
    resetLevel(lives <= 0); // restart whole game if no lives, else restart level
    state = 'playing';
});

nextLevelBtn.addEventListener('click', () => {
    endOverlay.classList.add('hidden');
    currentLevelIndex++;
    scoreAtLevelStart = score;
    resetLevel(false);
    state = 'playing';
});
