// Efectos de sonido sintetizados con Web Audio API.
// No se usan archivos de audio: cada sonido se genera en código para que sea
// ligero y quede en el mismo estilo tierno/infantil del juego.

const SoundFX = (() => {
    let audioCtx = null;
    let muted = false;

    function getCtx() {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AC();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    // Crea un oscilador con envolvente ADSR simple y lo conecta al destino.
    function playTone(ac, t0, { freq, freqEnd, type = 'sine', duration = 0.2, peak = 0.2, delay = 0 }) {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        const start = t0 + delay;
        osc.frequency.setValueAtTime(freq, start);
        if (freqEnd !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), start + duration);
        }
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.02, duration / 3));
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(start);
        osc.stop(start + duration + 0.05);
    }

    // Salto: un "boing" cortito y alegre, subiendo de tono.
    function playJump() {
        if (muted) return;
        const ac = getCtx();
        const t0 = ac.currentTime;
        playTone(ac, t0, { freq: 320, freqEnd: 760, type: 'sine', duration: 0.14, peak: 0.28 });
        playTone(ac, t0, { freq: 640, freqEnd: 1000, type: 'triangle', duration: 0.1, peak: 0.08, delay: 0.02 });
    }

    // Moneda / corazón: dos notas ascendentes tipo "ding-ding" brillante.
    function playCoin() {
        if (muted) return;
        const ac = getCtx();
        const t0 = ac.currentTime;
        playTone(ac, t0, { freq: 988, type: 'square', duration: 0.14, peak: 0.16 });
        playTone(ac, t0, { freq: 1319, type: 'square', duration: 0.22, peak: 0.18, delay: 0.07 });
        playTone(ac, t0, { freq: 1976, type: 'sine', duration: 0.18, peak: 0.06, delay: 0.09 });
    }

    // Globo: un planeo burbujeante hacia arriba con un brillo final, como si flotara.
    function playBalloon() {
        if (muted) return;
        const ac = getCtx();
        const t0 = ac.currentTime;
        playTone(ac, t0, { freq: 420, freqEnd: 880, type: 'triangle', duration: 0.28, peak: 0.22 });
        playTone(ac, t0, { freq: 880, freqEnd: 660, type: 'sine', duration: 0.22, peak: 0.12, delay: 0.18 });
        playTone(ac, t0, { freq: 1200, type: 'sine', duration: 0.16, peak: 0.1, delay: 0.22 });
        playTone(ac, t0, { freq: 1600, type: 'sine', duration: 0.18, peak: 0.08, delay: 0.28 });
    }

    // Vida extra: un pequeño arpegio feliz de tres notas.
    function playLife() {
        if (muted) return;
        const ac = getCtx();
        const t0 = ac.currentTime;
        [784, 988, 1319].forEach((f, i) => {
            playTone(ac, t0, { freq: f, type: 'triangle', duration: 0.2, peak: 0.16, delay: i * 0.09 });
        });
    }

    function setMuted(value) { muted = value; }
    function getMuted() { return muted; }
    function unlock() { getCtx(); }

    return { playJump, playCoin, playBalloon, playLife, setMuted, getMuted, unlock };
})();
