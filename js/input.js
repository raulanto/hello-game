window.addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) e.preventDefault();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysMap.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keysMap.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        if (!keysMap.up && state === 'playing') {
            if (player.onGround || player.jumps < 2) {
                player.vy = JUMP_VELOCITY;
                player.onGround = false;
                player.jumps++;
                player.anim = 'jump';
                SoundFX.playJump();
            }
        }
        keysMap.up = true;
    }
});

window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysMap.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keysMap.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keysMap.up = false;
});

function bindTouch(id, prop) {
    const el = document.getElementById(id);
    const on = ev => { 
        ev.preventDefault(); 
        if (prop === 'up' && state === 'playing' && !keysMap.up) { 
            if (player.onGround || player.jumps < 2) {
                player.vy = JUMP_VELOCITY;
                player.onGround = false;
                player.jumps++;
                SoundFX.playJump();
            }
        }
        keysMap[prop] = true;
    };
    const off = ev => { ev.preventDefault(); keysMap[prop] = false; };
    el.addEventListener('touchstart', on);
    el.addEventListener('touchend', off);
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
}

bindTouch('btnLeft', 'left');
bindTouch('btnRight', 'right');
bindTouch('btnJump', 'up');
