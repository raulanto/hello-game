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

function loadImg(name) {
    const img = new Image();
    img.src = `sprites/${name}`;
    return img;
}

const pickupImgs = {
    heartSmall: loadImg('pickup_heart_small.png'),
    heartMedium: loadImg('pickup_heart_medium.png'),
    heartLarge: loadImg('pickup_heart_large.png'),
    balloon: [loadImg('pickup_balloon_1.png'), loadImg('pickup_balloon_2.png'), loadImg('pickup_balloon_3.png')],
    key: loadImg('pickup_heart_small.png') // using small heart as placeholder for key for now if no key image
};

// Dynamic key image
const keyCanvas = document.createElement('canvas');
keyCanvas.width = 16; keyCanvas.height = 16;
const kctx = keyCanvas.getContext('2d');
kctx.fillStyle = '#ffd700';
kctx.fillRect(4, 4, 8, 8);
kctx.fillRect(10, 8, 4, 4);
pickupImgs.key = new Image();
pickupImgs.key.src = keyCanvas.toDataURL();

// Tiles
function loadTile(idx) {
    const img = new Image();
    img.src = `sprites/Tiles/tile_${String(idx).padStart(4, '0')}.png`;
    return img;
}
const TILE = 18;
const groundTopImgs = [0, 1, 2, 3].map(loadTile);
const groundFillImgs = [32, 33, 34, 35].map(loadTile);
const platformTopImgs = [4, 5, 6, 7].map(loadTile);
const fallableTopImgs = [26, 27, 28].map(loadTile);

// Birds
const BIRD_COLORS = ['sparrow', 'bluejay', 'dove', 'cardinal', 'crow', 'owl'];
const BIRD_FLAP_FRAMES = [2, 3, 4, 5, 6, 7];
const BIRD_SCALE = 2.4;
const birdImgs = {};
BIRD_COLORS.forEach(color => {
    birdImgs[color] = [];
    for (let i = 0; i < 10; i++) birdImgs[color].push(loadImg(`birds/${color}_${i}.png`));
});
