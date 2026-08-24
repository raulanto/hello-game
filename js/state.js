let state = 'menu'; // menu | playing | dying | dead | win
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
