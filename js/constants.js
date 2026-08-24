const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const W = canvas.width;
const H = canvas.height;
const GROUND_Y = H - 50;

// Physics constants
const GRAVITY = 1400;
const JUMP_VELOCITY = -520;
const MOVE_SPEED = 220;
const FLY_GRAVITY = GRAVITY * 0.25;
const FLY_THRUST = 900;
const FLY_MAX_UP = -180;
const FLY_MAX_DOWN = 220;
const TERMINAL_VY = 800;
