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
