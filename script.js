(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const W = canvas.width, H = canvas.height;
    const GROUND_Y = H - 50;

    // ---------- Assets ----------
    const FRAME_COUNTS = { stand:1, run:3, jump:1, drop:1, flying:3, pump:3, skid:1, bump:1, hurt:2, fall:4 };
    const CHARACTERS = ['kitty', 'mimmy'];
    const images = {};
    CHARACTERS.forEach(char => {
        images[char] = {};
        Object.keys(FRAME_COUNTS).forEach(anim => {
            const count = FRAME_COUNTS[anim];
            images[char][anim] = [];
            for (let i = 1; i <= count; i++) {
                const fname = count === 1 ? `${char}_${anim}.png` : `${char}_${anim}_${i}.png`;
                const img = new Image();
                img.src = `sprites/${fname}`;
                images[char][anim].push(img);
            }
        });
    });
    const pickupImgs = {
        heartSmall: loadImg('pickup_heart_small.png'),
        heartMedium: loadImg('pickup_heart_medium.png'),
        heartLarge: loadImg('pickup_heart_large.png'),
        balloon: [loadImg('pickup_balloon_1.png'), loadImg('pickup_balloon_2.png'), loadImg('pickup_balloon_3.png')],
        key: loadImg('pickup_heart_small.png') // using small heart as placeholder for key for now if no key image
    };
    // Let's create a dynamic key image just in case
    const keyCanvas = document.createElement('canvas');
    keyCanvas.width = 16; keyCanvas.height = 16;
    const kctx = keyCanvas.getContext('2d');
    kctx.fillStyle = '#ffd700';
    kctx.fillRect(4, 4, 8, 8);
    kctx.fillRect(10, 8, 4, 4);
    pickupImgs.key = new Image();
    pickupImgs.key.src = keyCanvas.toDataURL();

    function loadImg(name) {
        const img = new Image();
        img.src = `sprites/${name}`;
        return img;
    }

    // Tiles (pixel-platform cake/candy set, cropped into sprites/Tiles/tile_NNNN.png)
    function loadTile(idx) {
        const img = new Image();
        img.src = `sprites/Tiles/tile_${String(idx).padStart(4, '0')}.png`;
        return img;
    }
    const TILE = 18;
    const groundTopImgs = [0, 1, 2, 3].map(loadTile);      // chocolate frosting top
    const groundFillImgs = [32, 33, 34, 35].map(loadTile); // chocolate cake body
    const platformTopImgs = [4, 5, 6, 7].map(loadTile);    // pink frosting top
    const fallableTopImgs = [26, 27, 28].map(loadTile);    // caramel wafer (crumbling platforms)

    // Birds (Stardew Valley spritesheet, cropped into sprites/birds/<color>_<0-9>.png)
    const BIRD_COLORS = ['sparrow', 'bluejay', 'dove', 'cardinal', 'crow', 'owl'];
    const BIRD_FLAP_FRAMES = [2, 3, 4, 5, 6, 7];
    const BIRD_SCALE = 2.4;
    const birdImgs = {};
    BIRD_COLORS.forEach(color => {
        birdImgs[color] = [];
        for (let i = 0; i < 10; i++) birdImgs[color].push(loadImg(`birds/${color}_${i}.png`));
    });

    // ---------- Level data ----------
    const LEVELS = [
        // Level 1: Basics
        {
            ground: [{x1: 0, x2: 1200}],
            platforms: [{x: 400, y: GROUND_Y - 80, w: 100, h: 18}],
            obstacles: [],
            collectibles: [{x: 500, y: GROUND_Y - 30, type: 'heart'}],
            switches: [], doors: [], keys: []
        },
        // Level 2: Spikes and Precision
        {
            ground: [{x1: 0, x2: 400}, {x1: 500, x2: 900}, {x1: 1050, x2: 1500}],
            platforms: [{x: 350, y: GROUND_Y - 90, w: 100, h: 18}, {x: 850, y: GROUND_Y - 110, w: 100, h: 18}],
            obstacles: [{x: 600, w: 26, h: 22, y: GROUND_Y - 22}, {x: 750, w: 26, h: 22, y: GROUND_Y - 22}],
            collectibles: [{x: 700, y: GROUND_Y - 100, type: 'heart'}],
            switches: [], doors: [], keys: [],
            birds: [{x: 1200, y: GROUND_Y - 130, color: 'sparrow', moveX: 120, moveY: 40, speed: 1.4}]
        },
        // Level 3: Balloons
        {
            ground: [{x1: 0, x2: 300}, {x1: 1200, x2: 1500}],
            platforms: [{x: 400, y: GROUND_Y - 50, w: 60, h: 18}, {x: 850, y: GROUND_Y - 150, w: 60, h: 18}],
            obstacles: [],
            collectibles: [{x: 250, y: GROUND_Y - 100, type: 'balloon'}, {x: 800, y: GROUND_Y - 150, type: 'balloon'}],
            switches: [], doors: [], keys: []
        },
        // Level 4: Moving Platforms
        {
            ground: [{x1: 0, x2: 300}, {x1: 1500, x2: 1800}],
            platforms: [
                {x: 400, y: GROUND_Y - 80, w: 100, h: 18, moveX: 200, speed: 1.5},
                {x: 850, y: GROUND_Y - 120, w: 100, h: 18, moveY: 100, speed: 2},
                {x: 1200, y: GROUND_Y - 80, w: 100, h: 18, moveX: -150, speed: 1.2}
            ],
            obstacles: [], collectibles: [], switches: [], doors: [], keys: []
        },
        // Level 5: Switches & Doors
        {
            ground: [{x1: 0, x2: 1500}],
            platforms: [{x: 600, y: GROUND_Y - 120, w: 150, h: 18}],
            obstacles: [],
            collectibles: [],
            switches: [{id: 's1', x: 650, y: GROUND_Y - 120 - 10}],
            doors: [{id: 'd1', requires: 's1', x: 900, y: GROUND_Y - 150, w: 30, h: 150}],
            keys: []
        },
        // Level 6: Moving platforms + spikes
        {
            ground: [{x1: 0, x2: 400}, {x1: 1600, x2: 2000}],
            platforms: [
                {x: 500, y: GROUND_Y - 80, w: 150, h: 18, moveX: 150, speed: 1},
                {x: 950, y: GROUND_Y - 150, w: 100, h: 18, moveY: 100, speed: 1.5},
                {x: 1250, y: GROUND_Y - 80, w: 120, h: 18, moveX: 150, speed: 1.2}
            ],
            // Parent platform index for moving obstacles
            obstacles: [{x: 550, w: 26, h: 22, y: GROUND_Y - 80 - 22, parent: 0}],
            collectibles: [], switches: [], doors: [], keys: [],
            birds: [
                {x: 900, y: GROUND_Y - 200, color: 'bluejay', moveX: 150, moveY: 60, speed: 1.1},
                {x: 1450, y: GROUND_Y - 160, color: 'crow', moveX: 100, moveY: 80, speed: 1.6}
            ]
        },
        // Level 7: Keys & Locks
        {
            ground: [{x1: 0, x2: 1500}],
            platforms: [
                {x: 400, y: GROUND_Y - 100, w: 100, h: 18},
                {x: 200, y: GROUND_Y - 180, w: 100, h: 18}
            ],
            obstacles: [], collectibles: [], switches: [],
            doors: [{id: 'd1', requiresKey: 'k1', x: 800, y: GROUND_Y - 200, w: 30, h: 200}],
            keys: [{id: 'k1', x: 250, y: GROUND_Y - 210}]
        },
        // Level 8: Falling Platforms
        {
            ground: [{x1: 0, x2: 200}, {x1: 1500, x2: 1800}],
            platforms: [
                {x: 350, y: GROUND_Y - 50, w: 80, h: 18, fallable: true},
                {x: 600, y: GROUND_Y - 100, w: 80, h: 18, fallable: true},
                {x: 850, y: GROUND_Y - 150, w: 80, h: 18, fallable: true},
                {x: 1100, y: GROUND_Y - 100, w: 80, h: 18, fallable: true},
            ],
            obstacles: [], collectibles: [], switches: [], doors: [], keys: []
        },
        // Level 9: The Maze
        {
            ground: [{x1: 0, x2: 2200}],
            platforms: [
                {x: 300, y: GROUND_Y - 100, w: 200, h: 18},
                {x: 700, y: GROUND_Y - 200, w: 150, h: 18},
                {x: 1200, y: GROUND_Y - 100, w: 150, h: 18}
            ],
            obstacles: [{x: 400, w: 26, h: 22, y: GROUND_Y - 22}],
            collectibles: [{x: 350, y: GROUND_Y - 130, type: 'balloon'}],
            switches: [{id: 's1', x: 750, y: GROUND_Y - 200 - 10}],
            doors: [
                {id: 'd1', requires: 's1', x: 1000, y: GROUND_Y - 100, w: 30, h: 100},
                {id: 'd2', requiresKey: 'k1', x: 1500, y: GROUND_Y - 250, w: 30, h: 250}
            ],
            keys: [{id: 'k1', x: 1250, y: GROUND_Y - 130}],
            birds: [
                {x: 1800, y: GROUND_Y - 150, color: 'dove', moveX: 130, moveY: 70, speed: 1.2},
                {x: 2050, y: GROUND_Y - 220, color: 'owl', moveX: 90, moveY: 50, speed: 0.9}
            ]
        },
        // Level 10: Final Challenge
        {
            ground: [{x1: 0, x2: 200}, {x1: 2700, x2: 3200}],
            platforms: [
                {x: 350, y: GROUND_Y - 80, w: 100, h: 18, moveX: 100, speed: 2},
                {x: 750, y: GROUND_Y - 160, w: 100, h: 18, fallable: true},
                {x: 1000, y: GROUND_Y - 160, w: 100, h: 18},
                {x: 1300, y: GROUND_Y - 80, w: 100, h: 18, moveY: 150, speed: 2.5},
                {x: 1700, y: GROUND_Y - 200, w: 100, h: 18, fallable: true},
                {x: 2000, y: GROUND_Y - 100, w: 150, h: 18}
            ],
            obstacles: [
                {x: 1020, w: 26, h: 22, y: GROUND_Y - 160 - 22},
                {x: 2050, w: 26, h: 22, y: GROUND_Y - 100 - 22}
            ],
            collectibles: [
                {x: 350, y: GROUND_Y - 120, type: 'balloon'},
                {x: 1050, y: GROUND_Y - 240, type: 'balloon'},
                {x: 1750, y: GROUND_Y - 280, type: 'balloon'}
            ],
            switches: [{id: 's1', x: 2100, y: GROUND_Y - 100 - 10}],
            doors: [{id: 'd1', requires: 's1', x: 2400, y: GROUND_Y - 250, w: 30, h: 250}],
            keys: [],
            birds: [
                {x: 500, y: GROUND_Y - 180, color: 'cardinal', moveX: 140, moveY: 60, speed: 1.3},
                {x: 1400, y: GROUND_Y - 250, color: 'crow', moveX: 110, moveY: 90, speed: 1.7},
                {x: 2600, y: GROUND_Y - 200, color: 'owl', moveX: 100, moveY: 70, speed: 1.0}
            ]
        }
    ];

    // ---------- Physics constants ----------
    const GRAVITY = 1400;
    const JUMP_VELOCITY = -520;
    const MOVE_SPEED = 220;
    const FLY_GRAVITY = GRAVITY * 0.25;
    const FLY_THRUST = 900;
    const FLY_MAX_UP = -180;
    const FLY_MAX_DOWN = 220;
    const TERMINAL_VY = 800;

    // ---------- Game state ----------
    let state = 'menu'; // menu | playing | dead | win
    let character = 'kitty';
    let currentLevelIndex = 0;
    
    let groundSegments, platforms, obstacles, collectibles, switches, doors, keysObj, birds;
    let worldWidth, goalX, cameraX;
    
    let player, lives, score, balloonFuel, checkpointX;
    let inventory = [];
    let keysMap = { left: false, right: false, up: false };
    let lastTime = 0;
    let levelTime = 0;
    let scoreAtLevelStart = 0;

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

    // ---------- Input ----------
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

    // ---------- UI wiring ----------
    const startOverlay = document.getElementById('startOverlay');
    const endOverlay = document.getElementById('endOverlay');
    const endTitle = document.getElementById('endTitle');
    const endMsg = document.getElementById('endMsg');
    const nextLevelBtn = document.getElementById('nextLevelBtn');

    document.getElementById('charPick').addEventListener('click', e => {
        const btn = e.target.closest('button[data-char]');
        if (!btn) return;
        character = btn.dataset.char;
        document.querySelectorAll('#charPick button').forEach(b => b.classList.toggle('active', b === btn));
    });
    document.getElementById('startBtn').addEventListener('click', () => {
        const sel = document.getElementById('levelSelect');
        const startIdx = sel ? parseInt(sel.value) : 0;
        resetLevel(true, startIdx);
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

    // ---------- Update ----------
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
            // Animate fall frame
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

        // No fall timer here anymore, handled by die()

        // Horizontal movement
        let dir = 0;
        if (keysMap.left) dir -= 1;
        if (keysMap.right) dir += 1;
        const wasMovingRight = player.vx > 40, wasMovingLeft = player.vx < -40;
        if (dir !== 0) player.facing = dir;

        if (player.onGround && dir === 0 && (wasMovingRight || wasMovingLeft) && player.skidTimer <= 0) {
            player.skidTimer = 0.22;
        }
        player.vx = dir * MOVE_SPEED;

        // Vertical / flying
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

        // Update Puzzle Elements (Platforms)
        for (const p of platforms) {
            if (p.moveX) {
                p.x = p.baseX + Math.sin(levelTime * p.speed) * p.moveX;
            }
            if (p.moveY) {
                p.y = p.baseY + Math.sin(levelTime * p.speed) * p.moveY;
            }
            if (p.falling) {
                p.fallTimer -= dt;
                if (p.fallTimer <= 0) {
                    p.y += 400 * dt; // Fall down
                }
            }
        }

        // Update birds: elliptical patrol flight + flap animation
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

        // Platform collisions (top = land, bottom = bump head)
        player.onGround = false;
        let standingOnPlatform = null;
        const top = player.y - player.h;
        const left = player.x - player.w / 2 + 4, right = player.x + player.w / 2 - 4; // Tighter horizontal hitbox
        const vyDist = Math.max(15, Math.abs(player.vy * dt) * 1.5); // Prevent tunneling
        
        // Collide with platforms
        for (const p of platforms) {
            // If fallen far down, ignore
            if (p.y > H + 100) continue; 
            
            const withinX = right > p.x && left < p.x + p.w;
            if (!withinX) continue;
            // landing on top
            if (player.vy >= 0 && prevBottom <= p.y + vyDist && player.y >= p.y) {
                player.y = p.y;
                player.vy = 0;
                player.onGround = true;
                player.jumps = 0;
                standingOnPlatform = p;
                
                // If moving platform, carry player
                if (p.moveX) {
                    const diffX = p.x - (p.baseX + Math.sin((levelTime - dt) * p.speed) * p.moveX);
                    player.x += diffX;
                }
            }
            // bump head from below
            else if (player.vy < 0 && (prevBottom - player.h) >= p.y + p.h - vyDist && top <= p.y + p.h) {
                player.y = p.y + p.h + player.h;
                player.vy = 0;
                player.bumpTimer = 0.25;
            }
        }
        
        // Fallable platforms logic
        if (standingOnPlatform && standingOnPlatform.fallable && !standingOnPlatform.falling) {
            standingOnPlatform.falling = true;
            standingOnPlatform.fallTimer = 0.8; // 0.8s before falls
        }

        // Ground collision
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

        // Switches (Stay active once pressed)
        for (const sw of switches) {
            // check if player standing on it
            if (player.onGround && player.x > sw.x - 10 && player.x < sw.x + 30 && Math.abs(player.y - (sw.y + 10)) <= 10) {
                sw.active = true;
            }
        }

        // Doors & Door Collisions
        for (const d of doors) {
            d.open = false;
            if (d.requires) {
                const reqSwitch = switches.find(s => s.id === d.requires);
                if (reqSwitch && reqSwitch.active) d.open = true;
            }
            if (d.requiresKey) {
                if (inventory.includes(d.requiresKey)) {
                    // Check if player is near to open it
                    if (Math.abs(player.x - (d.x + d.w/2)) < 60) {
                        d.open = true;
                    }
                }
            }
            
            // Door collision (wall)
            if (!d.open) {
                if (right > d.x && left < d.x + d.w && player.y > d.y && top < d.y + d.h) {
                    // Pushed out
                    if (prevX < d.x) player.x = d.x - player.w / 2 + 4;
                    else player.x = d.x + d.w + player.w / 2 - 4;
                }
            }
        }

        // Keys
        for (const k of keysObj) {
            if (k.taken) continue;
            if (Math.abs(player.x - k.x) < 20 && Math.abs(player.y - player.h/2 - k.y) < 20) {
                k.taken = true;
                inventory.push(k.id);
                score += 50;
            }
        }

        // Fell into a pit
        if (!player.onGround && player.y > H + 80) {
            die();
            return;
        }

        // Obstacles
        if (player.invuln <= 0) {
            for (const o of obstacles) {
                let ox = o.x, oy = o.y;
                if (o.parent !== undefined) {
                    const par = platforms[o.parent];
                    ox += par.x - par.baseX;
                    oy += par.y - par.baseY;
                }
                
                // Tighter hitbox for fairer gameplay
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

        // Collectibles
        for (const c of collectibles) {
            if (c.taken) continue;
            const dx = Math.abs(player.x - c.x), dy = Math.abs((player.y - player.h / 2) - c.y);
            if (dx < 26 && dy < 26) {
                c.taken = true;
                if (c.type === 'heart') score += 10;
                else if (c.type === 'life') lives += 1;
                else if (c.type === 'balloon') balloonFuel = Math.min(balloonFuel + 4, 8);
            }
        }

        // Goal
        if (player.x >= goalX) { 
            if (currentLevelIndex < LEVELS.length - 1) {
                endGame(true, false); 
            } else {
                endGame(true, true); // Game finished!
            }
            return; 
        }

        // Camera
        cameraX = Math.max(0, Math.min(worldWidth - W, player.x - W / 2));

        // Animation state
        if (player.hurtTimer > 0) setAnim('hurt');
        else if (player.bumpTimer > 0) setAnim('bump');
        else if (isFlying) setAnim('flying');
        else if (!player.onGround) setAnim(player.vy < 0 ? 'jump' : 'drop');
        else if (player.skidTimer > 0) setAnim('skid');
        else if (dir !== 0) setAnim('run');
        else setAnim('stand');

        // Frame advance
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
        player.dyingTimer = 2.0; // 2 seconds delay
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

    // ---------- Draw ----------
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

            // If falling and vibrating
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
        // Switches
        for (const sw of switches) {
            const x = sw.x - cameraX;
            if (x < -20 || x > W) continue;
            ctx.fillStyle = sw.active ? '#4caf50' : '#f44336';
            const h = sw.active ? 4 : 10;
            // sw.y is defined as the top of the unpressed switch. Base is sw.y + 10
            ctx.fillRect(x, sw.y + 10 - h, 20, h);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x, sw.y + 10 - h, 20, h);
        }
        
        // Doors
        for (const d of doors) {
            const x = d.x - cameraX;
            if (x + d.w < 0 || x > W) continue;
            
            if (d.open) {
                // Draw faded/open door
                ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
                ctx.fillRect(x, d.y, d.w, d.h);
            } else {
                // Draw closed door
                ctx.fillStyle = d.requiresKey ? '#ffb74d' : '#9c27b0';
                ctx.fillRect(x, d.y, d.w, d.h);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(x, d.y, d.w, d.h);
            }
        }
        
        // Keys
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
            // Source art faces left; flip when flying right.
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
        
        // Draw Keys
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
            ctx.shadowBlur = 0; // reset
        }
    }

    // ---------- Loop ----------
    function loop(t) {
        const dt = Math.min(0.033, (t - lastTime) / 1000 || 0);
        lastTime = t;
        update(dt);
        draw(t);
        requestAnimationFrame(loop);
    }
    resetLevel(true);
    requestAnimationFrame(loop);
})();
