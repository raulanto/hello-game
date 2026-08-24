function resetLevel(fullReset = false, startLevel = -1) {
    if (fullReset) {
        currentLevelIndex = startLevel !== -1 ? startLevel : 0;
        lives = 3;
        score = 0;
        scoreAtLevelStart = 0;
    } else {
        score = scoreAtLevelStart;
    }
    
    document.getElementById('levelIndicator').innerText = `Nivel ${currentLevelIndex + 1}`;
    
    const lvl = LEVELS[currentLevelIndex];
    
    groundSegments = lvl.ground.map(g => ({ ...g }));
    worldWidth = groundSegments[groundSegments.length - 1].x2 + 100;
    goalX = groundSegments[groundSegments.length - 1].x2 - 60;
    
    platforms = (lvl.platforms || []).map(p => ({ 
        ...p, 
        baseX: p.x, baseY: p.y,
        falling: false, fallTimer: 0 
    }));
    obstacles = (lvl.obstacles || []).map(o => ({ ...o }));
    collectibles = (lvl.collectibles || []).map(c => ({ ...c, taken: false }));
    switches = (lvl.switches || []).map(s => ({ ...s, active: false }));
    doors = (lvl.doors || []).map(d => ({ ...d, open: false }));
    keysObj = (lvl.keys || []).map(k => ({ ...k, taken: false }));
    birds = (lvl.birds || []).map(b => ({
        ...b, baseX: b.x, baseY: b.y,
        frame: Math.floor(Math.random() * BIRD_FLAP_FRAMES.length), frameTimer: 0, facing: 1
    }));

    cameraX = 0;
    balloonFuel = 0;
    checkpointX = 40;
    inventory = [];
    levelTime = 0;
    
    player = {
        x: 40, y: GROUND_Y, vx: 0, vy: 0,
        w: 26, h: 54,
        facing: 1, onGround: true, jumps: 0,
        anim: 'stand', frame: 0, frameTimer: 0,
        hurtTimer: 0, bumpTimer: 0, skidTimer: 0,
        fallTimer: 0, invuln: 0
    };
}

function groundAt(x) {
    for (const seg of groundSegments) {
        if (x >= seg.x1 && x <= seg.x2) return seg;
    }
    return null;
}

function setAnim(name) {
    if (player.anim !== name) { player.anim = name; player.frame = 0; player.frameTimer = 0; }
}

function update(dt) {
    if (state === 'dying') {
        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;
        player.dyingTimer -= dt;
        if (player.dyingTimer <= 0) {
            if (lives <= 0) {
                endGame(false, false);
            } else {
                resetLevel(false);
                state = 'playing';
            }
        }
        player.frameTimer += dt;
        if (player.frameTimer >= 0.15) {
            player.frameTimer = 0;
            const frames = images[character]['fall'];
            if (frames) player.frame = (player.frame + 1) % frames.length;
        }
        return;
    }

    if (state !== 'playing') return;
    levelTime += dt;

    player.hurtTimer = Math.max(0, player.hurtTimer - dt);
    player.bumpTimer = Math.max(0, player.bumpTimer - dt);
    player.skidTimer = Math.max(0, player.skidTimer - dt);
    player.invuln = Math.max(0, player.invuln - dt);

    let dir = 0;
    if (keysMap.left) dir -= 1;
    if (keysMap.right) dir += 1;
    const wasMovingRight = player.vx > 40, wasMovingLeft = player.vx < -40;
    if (dir !== 0) player.facing = dir;

    if (player.onGround && dir === 0 && (wasMovingRight || wasMovingLeft) && player.skidTimer <= 0) {
        player.skidTimer = 0.22;
    }
    player.vx = dir * MOVE_SPEED;

    const isFlying = !player.onGround && keysMap.up && balloonFuel > 0;
    if (isFlying) {
        player.vy += FLY_GRAVITY * dt;
        player.vy -= FLY_THRUST * dt;
        player.vy = Math.max(FLY_MAX_UP, Math.min(FLY_MAX_DOWN, player.vy));
        balloonFuel = Math.max(0, balloonFuel - dt);
    } else {
        player.vy += GRAVITY * dt;
        if (player.vy > TERMINAL_VY) player.vy = TERMINAL_VY;
    }

    const prevBottom = player.y;
    const prevX = player.x;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = Math.max(10, Math.min(worldWidth - 10, player.x));

    for (const p of platforms) {
        if (p.moveX) p.x = p.baseX + Math.sin(levelTime * p.speed) * p.moveX;
        if (p.moveY) p.y = p.baseY + Math.sin(levelTime * p.speed) * p.moveY;
        if (p.falling) {
            p.fallTimer -= dt;
            if (p.fallTimer <= 0) p.y += 400 * dt;
        }
    }

    for (const b of birds) {
        const prevBx = b.x;
        if (b.moveX) b.x = b.baseX + Math.sin(levelTime * b.speed) * b.moveX;
        if (b.moveY) b.y = b.baseY + Math.cos(levelTime * b.speed) * b.moveY;
        if (b.x - prevBx > 0.01) b.facing = 1;
        else if (b.x - prevBx < -0.01) b.facing = -1;

        b.frameTimer += dt;
        if (b.frameTimer >= 0.08) {
            b.frameTimer = 0;
            b.frame = (b.frame + 1) % BIRD_FLAP_FRAMES.length;
        }
    }

    player.onGround = false;
    let standingOnPlatform = null;
    const top = player.y - player.h;
    const left = player.x - player.w / 2 + 4, right = player.x + player.w / 2 - 4;
    const vyDist = Math.max(15, Math.abs(player.vy * dt) * 1.5);
    
    for (const p of platforms) {
        if (p.y > H + 100) continue; 
        
        const withinX = right > p.x && left < p.x + p.w;
        if (!withinX) continue;
        if (player.vy >= 0 && prevBottom <= p.y + vyDist && player.y >= p.y) {
            player.y = p.y;
            player.vy = 0;
            player.onGround = true;
            player.jumps = 0;
            standingOnPlatform = p;
            
            if (p.moveX) {
                const diffX = p.x - (p.baseX + Math.sin((levelTime - dt) * p.speed) * p.moveX);
                player.x += diffX;
            }
        }
        else if (player.vy < 0 && (prevBottom - player.h) >= p.y + p.h - vyDist && top <= p.y + p.h) {
            player.y = p.y + p.h + player.h;
            player.vy = 0;
            player.bumpTimer = 0.25;
        }
    }
    
    if (standingOnPlatform && standingOnPlatform.fallable && !standingOnPlatform.falling) {
        standingOnPlatform.falling = true;
        standingOnPlatform.fallTimer = 0.8;
    }

    if (!player.onGround) {
        const seg = groundAt(player.x);
        if (seg && player.vy >= 0 && player.y >= GROUND_Y) {
            player.y = GROUND_Y;
            player.vy = 0;
            player.onGround = true;
            player.jumps = 0;
            checkpointX = Math.max(checkpointX, seg.x1 + 30);
        }
    }

    for (const sw of switches) {
        if (player.onGround && player.x > sw.x - 10 && player.x < sw.x + 30 && Math.abs(player.y - (sw.y + 10)) <= 10) {
            sw.active = true;
        }
    }

    for (const d of doors) {
        d.open = false;
        if (d.requires) {
            const reqSwitch = switches.find(s => s.id === d.requires);
            if (reqSwitch && reqSwitch.active) d.open = true;
        }
        if (d.requiresKey) {
            if (inventory.includes(d.requiresKey)) {
                if (Math.abs(player.x - (d.x + d.w/2)) < 60) {
                    d.open = true;
                }
            }
        }
        
        if (!d.open) {
            if (right > d.x && left < d.x + d.w && player.y > d.y && top < d.y + d.h) {
                if (prevX < d.x) player.x = d.x - player.w / 2 + 4;
                else player.x = d.x + d.w + player.w / 2 - 4;
            }
        }
    }

    for (const k of keysObj) {
        if (k.taken) continue;
        if (Math.abs(player.x - k.x) < 20 && Math.abs(player.y - player.h/2 - k.y) < 20) {
            k.taken = true;
            inventory.push(k.id);
            score += 50;
        }
    }

    if (!player.onGround && player.y > H + 80) {
        die();
        return;
    }

    if (player.invuln <= 0) {
        for (const o of obstacles) {
            let ox = o.x, oy = o.y;
            if (o.parent !== undefined) {
                const par = platforms[o.parent];
                ox += par.x - par.baseX;
                oy += par.y - par.baseY;
            }
            
            if (right > ox + 4 && left < ox + o.w - 4 && player.y > oy + 4 && top < oy + o.h - 4) {
                die();
                return;
            }
        }

        const BIRD_SIZE = 16 * BIRD_SCALE;
        for (const b of birds) {
            const bx = b.x - BIRD_SIZE / 2, by = b.y - BIRD_SIZE / 2;
            if (right > bx + 6 && left < bx + BIRD_SIZE - 6 && top < by + BIRD_SIZE - 6 && player.y > by + 6) {
                die();
                return;
            }
        }
    }

    for (const c of collectibles) {
        if (c.taken) continue;
        const dx = Math.abs(player.x - c.x), dy = Math.abs((player.y - player.h / 2) - c.y);
        if (dx < 26 && dy < 26) {
            c.taken = true;
            if (c.type === 'heart') { score += 10; SoundFX.playCoin(); }
            else if (c.type === 'life') { lives += 1; SoundFX.playLife(); }
            else if (c.type === 'balloon') { balloonFuel = Math.min(balloonFuel + 4, 8); SoundFX.playBalloon(); }
        }
    }

    if (player.x >= goalX) { 
        if (currentLevelIndex < LEVELS.length - 1) {
            endGame(true, false); 
        } else {
            endGame(true, true); 
        }
        return; 
    }

    cameraX = Math.max(0, Math.min(worldWidth - W, player.x - W / 2));

    if (player.hurtTimer > 0) setAnim('hurt');
    else if (player.bumpTimer > 0) setAnim('bump');
    else if (isFlying) setAnim('flying');
    else if (!player.onGround) setAnim(player.vy < 0 ? 'jump' : 'drop');
    else if (player.skidTimer > 0) setAnim('skid');
    else if (dir !== 0) setAnim('run');
    else setAnim('stand');

    const speed = player.anim === 'run' ? 0.09 : player.anim === 'flying' ? 0.12 : 0.14;
    player.frameTimer += dt;
    if (player.frameTimer >= speed) {
        player.frameTimer = 0;
        const frames = images[character][player.anim];
        player.frame = (player.frame + 1) % frames.length;
    }
}

function die() {
    if (state === 'dying') return;
    state = 'dying';
    player.vy = -500;
    player.vx = 0;
    setAnim('fall');
    lives -= 1;
    player.dyingTimer = 2.0; 
}

function endGame(won, gameFinished) {
    state = won ? 'win' : 'dead';
    
    if (won && !gameFinished) {
        endTitle.textContent = '¡Nivel completado!';
        endMsg.textContent = `Puntuación: ${score}. ¡Prepárate para el siguiente!`;
        nextLevelBtn.classList.remove('hidden');
        document.getElementById('restartBtn').classList.add('hidden');
    } else if (won && gameFinished) {
        endTitle.textContent = '¡Juego Terminado!';
        endMsg.textContent = `¡Felicidades! Has completado los 10 niveles. Puntuación final: ${score}`;
        nextLevelBtn.classList.add('hidden');
        document.getElementById('restartBtn').classList.remove('hidden');
        document.getElementById('restartBtn').textContent = 'Volver a jugar';
    } else {
        endTitle.textContent = '¡Game Over!';
        endMsg.textContent = `Te quedaste sin vidas. Puntuación: ${score}.`;
        nextLevelBtn.classList.add('hidden');
        document.getElementById('restartBtn').classList.remove('hidden');
        document.getElementById('restartBtn').textContent = 'Reintentar';
    }
    
    endOverlay.classList.remove('hidden');
}
