(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function convertStringToPattern(string) {
    return string
        .split('\n')
        .filter((line) => line.length !== 0)
        .map((line) => line.split('').map((v) => v === '.' ? false : true));
}


function injectPattern(grid, pattern, atX, atY) {
    for(let y = 0; y < pattern.length; y++) {
        for(let x = 0; x < pattern[0].length; x++) {
            if(grid[y + atY] && grid[y + atY][x + atX] !== undefined) {
            grid[y + atY][x + atX] = pattern[y][x];
            }
        }
    }
    return grid;
}

module.exports = {
    convertStringToPattern,
    injectPattern
};

},{}],2:[function(require,module,exports){
const pentadecathlon = `
...o....o...
.oo.oooo.oo.
...o....o...
`;
const tumbler = `
.......
.oo.oo.
.oo.oo.
..o.o..
o.o.o.o
o.o.o.o
oo...oo
`;
const gliderGun = `
........................................
.........................o..............
.......................o.o..............
.............oo......oo............oo...
............o...o....oo............oo...
.oo........o.....o...oo.................
.oo........o...o.oo....o.o..............
...........o.....o.......o..............
............o...o.......................
.............oo.........................
`;

module.exports = {
    pentadecathlon,
    tumbler,
    gliderGun
};

},{}],3:[function(require,module,exports){
function drawGrid(ctx, w, h, cellSize = 20) {
    ctx.fillStyle = '#2e3440';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#4c566a';
    ctx.lineWidth = '1';
    for(let x = 0; x < w; x += cellSize) {
        for(let y = 0; y < h; y += cellSize) {
            ctx.beginPath();
            ctx.rect(x, y, cellSize, cellSize);
            ctx.stroke();
        }
    }
}

function drawAliveCells(grid, ctx) {
    ctx.fillStyle = '#bf616a';
    for(let y = 0; y < grid.length; y++) {
        for(let x = 0; x < grid[0].length; x++) {
            if(grid[y][x]) {
                const tempY = (y * 20) + 1;
                const tempX = (x * 20) + 1;
                ctx.fillRect(tempX, tempY, 18, 18);
            }
        }
    }
}

module.exports = {
    drawAliveCells,
    drawGrid
};

},{}],4:[function(require,module,exports){
const { nextState } = require('../simulation');
const { 
    pentadecathlon,
    tumbler,
    gliderGun
} = require('./patterns');
const {
    convertStringToPattern,
    injectPattern
} = require('./pattern-methods');
const {
    drawGrid,
    drawAliveCells
} = require('./render');

const controlButton = document.querySelector('#control');
const canvas = document.querySelector('#simulation-canvas');
const genCount = document.querySelector('#gen-count');
const ctx = canvas.getContext('2d');

const formattedPentadecathlon = convertStringToPattern(pentadecathlon);
const formattedTumbler = convertStringToPattern(tumbler);
const formattedGliderGun = convertStringToPattern(gliderGun);

const eventHandler = {
    tempCounter: 0,
    isPlaying: false,
    gridY: -1,
    gridX: -1
};

const initialState = {
    generation: 0,
    w: window.innerWidth,
    h: window.innerHeight,
    grid: startingPatterns(createEmptyGrid(window.innerWidth, window.innerHeight))
};

function createEmptyGrid(w, h, size = 20) {
    return Array.from(
        { length: Math.ceil(h / size) },
        (_) => Array.from(
            { length: Math.ceil(w / size) }, 
            (__) => false
        )
    );
}

function toggleSimulationStatus() {
    eventHandler.isPlaying = !eventHandler.isPlaying;
    controlButton.src = eventHandler.isPlaying
        ? 'stop2.png'
        : 'play2.png';
}

function toggleCell(event) {
    const { clientX, clientY } = event;
    eventHandler.gridY = Math.floor(clientY / 20);
    eventHandler.gridX = Math.floor(clientX / 20);
}

function updateWorld(gameOfLife) {
    const { gridX, gridY } = eventHandler;
    if(gridY > 0 && gridX > 0) {
        gameOfLife.grid[gridY][gridX] = !gameOfLife.grid[gridY][gridX];
        eventHandler.gridX = -1;
        eventHandler.gridY = -1;
    }
    return gameOfLife;
}

function startingPatterns(grid) {
    return [
        { 
            pattern: formattedPentadecathlon,
            x: 23,
            y: 31
        },
        {
            pattern: formattedTumbler,
            x: 4,
            y: 18
        },
        {
            pattern: formattedGliderGun,
            x: 2,
            y: 2
        }
    ]
        .reduce((newGrid, { pattern, x, y }) => injectPattern(newGrid, pattern, x, y), grid);
}



function simulationLoop(state) {
    const { w, h, grid } = state; 
    canvas.setAttribute('width', w);
    canvas.setAttribute('height', h);
    drawGrid(ctx, w, h);
    drawAliveCells(state.grid, ctx, w, h);
    if(eventHandler.isPlaying) {
        if(eventHandler.tempCounter % 4 === 0) {
            state.grid = nextState(grid);
            state.generation++;
            genCount.innerHTML = state.generation.toString();
        } 
    eventHandler.tempCounter++;
    } else {
        state.generation = 0;
        genCount.innerHTML = state.generation.toString();
        state = updateWorld(state);
    }
    requestAnimationFrame(() => simulationLoop(state));
};
requestAnimationFrame(() => simulationLoop(initialState));

controlButton.addEventListener('click', toggleSimulationStatus)
canvas.addEventListener('click', toggleCell)

},{"../simulation":6,"./pattern-methods":1,"./patterns":2,"./render":3}],5:[function(require,module,exports){
/*
 * Starting from north we move clockwise, allowing vertical, 
 * horisontal and diagonal movements. Used for declarative reasons. 
 */
const POSSIBLE_DIRECTIONS = {
    north:     [  0, -1 ],
    northEast: [  1, -1 ],
    east:      [  1,  0 ],
    southEast: [  1,  1 ],
    south:     [  0,  1 ],
    southWest: [ -1,  1 ],
    west:      [ -1,  0 ],
    northWest: [ -1, -1 ]
};
const dirs = Object.values(POSSIBLE_DIRECTIONS);

function isInRange(w, h, x, y) {
    return x >= 0 &&
        x < w &&
        y >= 0 &&
        y < h;
}

const height = (grid) => grid.length;
const width = (grid) => grid[0].length;

function isNeighbourAlive(grid, x, y) {
    return isInRange(
            width(grid), 
            height(grid), 
            x, 
            y
        ) && 
        grid[y][x];
}

function neighboursAlive(world, x, y) {
    return dirs.reduce(
        (aliveNeighbours, [ diffX, diffY ]) => isNeighbourAlive(
                world, 
                x + diffX, 
                y + diffY
            )
                ? aliveNeighbours + 1 
                : aliveNeighbours
        , 0
    );
}

module.exports = {
    isNeighbourAlive,
    neighboursAlive
};

},{}],6:[function(require,module,exports){
const { neighboursAlive } = require('./neighbours-alive');
const ALIVE = true;
const DEAD = false;
const SPECIAL_STATES = [
    {
        ssState: DEAD,
        ssNeighboursAlive: 3,
    },
    {
        ssState: ALIVE,
        ssNeighboursAlive: 2,
    },
    {
        ssState: ALIVE,
        ssNeighboursAlive: 3,
    }
];

// If not a special state return false (and false is the same as DEAD)
function nextCellState(state, neighboursAlive) {
    return SPECIAL_STATES.some(
        ({ ssState, ssNeighboursAlive }) => ssState === state && 
            ssNeighboursAlive === neighboursAlive
    );
}

function nextState(grid) {
    return grid.map(
        (row, y) => row.map(
            (cell, x) => nextCellState(cell, neighboursAlive(grid, x, y))
        )
    );
}

module.exports = {
    nextState
};

},{"./neighbours-alive":5}]},{},[4]);
