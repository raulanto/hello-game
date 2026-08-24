function drawBackground() {
    ctx.fillStyle = '#cdeeff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 6; i++) {
        const cx = ((i * 260 - cameraX * 0.3) % (W + 200) - 100) | 0; 
        cloud(cx, 40 + (i % 3) * 30, 30);
    }
}
function cloud(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.8, y + 6, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x - r * 0.8, y + 8, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
}

function drawGround() {
    for (const seg of groundSegments) {
        const x1 = seg.x1 - cameraX, x2 = seg.x2 - cameraX;
        if (x2 < 0 || x1 > W) continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x1, GROUND_Y, x2 - x1, H - GROUND_Y);
        ctx.clip();
        const startCol = Math.floor(seg.x1 / TILE);
        const endCol = Math.ceil(seg.x2 / TILE);
        for (let col = startCol; col < endCol; col++) {
            const tx = col * TILE - cameraX;
            if (tx + TILE < 0 || tx > W) continue;
            const topImg = groundTopImgs[((col % groundTopImgs.length) + groundTopImgs.length) % groundTopImgs.length];
            if (topImg.complete) ctx.drawImage(topImg, tx, GROUND_Y, TILE, TILE);
            let row = 0;
            for (let ty = GROUND_Y + TILE; ty < H; ty += TILE, row++) {
                const fillImg = groundFillImgs[((col + row) % groundFillImgs.length + groundFillImgs.length) % groundFillImgs.length];
                if (fillImg.complete) ctx.drawImage(fillImg, tx, ty, TILE, TILE);
            }
        }
        ctx.restore();
    }
}

function drawPlatforms() {
    for (const p of platforms) {
        const x = p.x - cameraX;
        if (x + p.w < 0 || x > W || p.y > H) continue;

        let shakeX = 0;
        if (p.falling && p.fallTimer > 0) {
            shakeX = (Math.random() - 0.5) * 4;
        }

        const topImgs = p.fallable ? fallableTopImgs : platformTopImgs;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + shakeX, p.y, p.w, p.h);
        ctx.clip();
        const startCol = Math.floor(p.x / TILE);
        const endCol = Math.ceil((p.x + p.w) / TILE);
        for (let col = startCol; col < endCol; col++) {
            const tx = col * TILE - cameraX + shakeX;
            let row = 0;
            for (let ty = p.y; ty < p.y + p.h; ty += TILE, row++) {
                const img = topImgs[((col + row) % topImgs.length + topImgs.length) % topImgs.length];
                if (img.complete) ctx.drawImage(img, tx, ty, TILE, TILE);
            }
        }
        ctx.restore();
    }
}

function drawPuzzles() {
    for (const sw of switches) {
        const x = sw.x - cameraX;
        if (x < -20 || x > W) continue;
        ctx.fillStyle = sw.active ? '#4caf50' : '#f44336';
        const h = sw.active ? 4 : 10;
        ctx.fillRect(x, sw.y + 10 - h, 20, h);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x, sw.y + 10 - h, 20, h);
    }
    
    for (const d of doors) {
        const x = d.x - cameraX;
        if (x + d.w < 0 || x > W) continue;
        
        if (d.open) {
            ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
            ctx.fillRect(x, d.y, d.w, d.h);
        } else {
            ctx.fillStyle = d.requiresKey ? '#ffb74d' : '#9c27b0';
            ctx.fillRect(x, d.y, d.w, d.h);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(x, d.y, d.w, d.h);
        }
    }
    
    for (const k of keysObj) {
        if (k.taken) continue;
        const x = k.x - cameraX;
        if (x < -20 || x > W) continue;
        const bob = Math.sin(levelTime * 3) * 4;
        ctx.drawImage(pickupImgs.key, x - 12, k.y - 12 + bob, 24, 24);
    }
}

function drawObstacles() {
    for (const o of obstacles) {
        let ox = o.x, oy = o.y;
        if (o.parent !== undefined) {
            const par = platforms[o.parent];
            ox += par.x - par.baseX;
            oy += par.y - par.baseY;
        }
        const x = ox - cameraX;
        if (x + o.w < 0 || x > W) continue;
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(x, oy + o.h);
        ctx.lineTo(x + o.w / 2, oy);
        ctx.lineTo(x + o.w, oy + o.h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.stroke();
    }
}

function drawBirds() {
    for (const b of birds) {
        const x = b.x - cameraX;
        if (x < -30 || x > W + 30) continue;
        const frames = birdImgs[b.color];
        const img = frames[BIRD_FLAP_FRAMES[b.frame]];
        if (!(img && img.complete && img.naturalWidth)) continue;
        const size = 16 * BIRD_SCALE;
        ctx.save();
        ctx.translate(x, b.y);
        if (b.facing > 0) ctx.scale(-1, 1);
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
    }
}

function drawCollectibles(t) {
    for (const c of collectibles) {
        if (c.taken) continue;
        const x = c.x - cameraX;
        if (x < -30 || x > W + 30) continue;
        const bob = Math.sin(t / 300 + c.x) * 4;
        let img;
        if (c.type === 'heart') img = pickupImgs.heartMedium;
        else if (c.type === 'life') img = pickupImgs.heartLarge;
        else img = pickupImgs.balloon[Math.floor(t / 200) % 3];
        if (img.complete && img.naturalWidth) {
            const s = c.type === 'life' ? 2.6 : 2.2;
            const w = img.naturalWidth * s, h = img.naturalHeight * s;
            ctx.drawImage(img, x - w / 2, c.y - h / 2 + bob, w, h);
        }
    }
}

function drawFlag() {
    const x = goalX - cameraX;
    if (x < -40 || x > W + 40) return;
    ctx.fillStyle = '#999';
    ctx.fillRect(x, GROUND_Y - 130, 6, 130);
    ctx.fillStyle = '#ff5c7a';
    ctx.beginPath();
    ctx.moveTo(x + 6, GROUND_Y - 130);
    ctx.lineTo(x + 46, GROUND_Y - 115);
    ctx.lineTo(x + 6, GROUND_Y - 100);
    ctx.closePath();
    ctx.fill();
}

function drawBalloonAccessory(sx, topY, playerH) {
    const frames = pickupImgs.balloon;
    const img = frames[Math.floor(levelTime * 6) % frames.length];
    if (!(img && img.complete && img.naturalWidth)) return;

    // The sprite already has its own little string stub baked in, ending
    // near the bottom of the image — we only add one clean line below that
    // tying both stubs together and running down to the hand.
    const s = 1.9;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    const bob = Math.sin(levelTime * 4) * 2.5;
    const cx = sx;
    const stubY = topY - h * 0.15 + bob; // bottom tip of the balloon strings
    const by = stubY - h;
    const gap = w * 0.62;

    const anchorX = sx + (player.facing > 0 ? -playerH * 0.22 : playerH * 0.22);
    const anchorY = topY + playerH * 0.62;

    ctx.save();
    ctx.strokeStyle = 'rgba(90,65,45,0.9)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx - gap / 2, stubY - 1);
    ctx.lineTo(cx + gap / 2, stubY - 1);
    ctx.moveTo(cx, stubY - 1);
    ctx.lineTo(anchorX, anchorY);
    ctx.stroke();

    ctx.drawImage(img, cx - gap / 2 - w / 2, by, w, h);
    ctx.drawImage(img, cx + gap / 2 - w / 2, by, w, h);
    ctx.restore();
}

function drawPlayer() {
    const frames = images[character][player.anim];
    const img = frames[Math.min(player.frame, frames.length - 1)];
    if (!(img && img.complete && img.naturalWidth)) return;
    if (player.invuln > 0 && Math.floor(player.invuln * 20) % 2 === 0) return;

    const scale = 3.4;
    const w = (img.naturalWidth * scale) | 0;
    const h = (img.naturalHeight * scale) | 0;
    const sx = (player.x - cameraX) | 0;
    const sy = (player.y) | 0;
    ctx.save();
    ctx.translate(sx, sy - h);
    if (player.facing > 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, 0, w, h);
    ctx.restore();

    if (balloonFuel > 0) drawBalloonAccessory(sx, sy - h, h);
}

function drawHUD() {
    for (let i = 0; i < lives; i++) {
        if (pickupImgs.heartSmall.complete) ctx.drawImage(pickupImgs.heartSmall, 12 + i * 26, 10, 22, 20);
    }
    ctx.fillStyle = '#ff5c7a';
    ctx.font = 'bold 20px Quicksand, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Score: ' + score, W - 12, 30);

    if (balloonFuel > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(12, 38, 100, 10);
        ctx.fillStyle = '#ff8fa3';
        ctx.fillRect(12, 38, Math.min(100, balloonFuel / 8 * 100), 10);
        ctx.strokeStyle = '#c94';
        ctx.strokeRect(12, 38, 100, 10);
    }
    
    for (let i = 0; i < inventory.length; i++) {
        ctx.drawImage(pickupImgs.key, W - 30 - i * 30, 45, 20, 20);
    }
}

function draw(t) {
    drawBackground();
    drawGround();
    drawPuzzles();
    drawPlatforms();
    drawFlag();
    drawObstacles();
    drawBirds();
    drawCollectibles(t);
    if (state === 'playing' || state === 'dead' || state === 'win' || state === 'dying') drawPlayer();
    drawHUD();
    
    if (state === 'dying' && lives > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 42px Quicksand, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff5c7a';
        ctx.shadowBlur = 10;
        ctx.fillText('¡Empezar de nuevo!', W / 2, H / 2);
        ctx.shadowBlur = 0; 
    }
}
