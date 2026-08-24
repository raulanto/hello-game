// El juego ha sido modularizado.
// Los demás archivos se encargan de la configuración, estado, lógicas y renderizado.

function loop(t) {
    const dt = Math.min(0.033, (t - lastTime) / 1000 || 0);
    lastTime = t;
    
    update(dt);
    draw(t);
    
    requestAnimationFrame(loop);
}

// Iniciar el juego
resetLevel(true);
requestAnimationFrame(loop);
