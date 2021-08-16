/////////////////////////////////////////////////////////////////////////////
//
// Developed by Claes-Magnus Bernson, 2018
// cmbernson@gmail.com
//
/////////////////////////////////////////////////////////////////////////////
// enemies
class Enemy {
	constructor(type, spriteCounter, numberOfSprites, x, y, pattern, patternPrototype, hp, speed, walkCounter, status, loadStatus) {
		this.type = type;
		this.spriteCounter = spriteCounter;
		this.numberOfSprites = numberOfSprites;
		this.x = x;
		this.y = y;
		this.pattern = pattern;
		this.patternPrototype = patternPrototype;
		this.hp = hp;
		this.speed = speed;
		this.walkCounter = walkCounter;
		this.status = status;
		this.loadStatus = loadStatus;
	}
}

// objects
class Heart {
	constructor(x, y, status) {
		this.x = x;
		this.y = y;
		this.status = status;
	}
}

class Shield {
	constructor(x, y, status) {
		this.x = x;
		this.y = y;
		this.status = status;
	}
}

class Door {
	constructor(x, y, status) {
		this.x = x;
		this.y = y;
		this.status = status;
	}
}

class SmokeBox {
	constructor(x, y, status) {
		this.x = x;
		this.y = y;
		this.status = status;
	}
}

class Missile {
	constructor(x, y, rX, rY, direction, status, missilespeed = 15) {
		this.missileX = x;
		this.missileY = y;
		this.relX = rX;
		this.relY = rY;
		this.direction = direction;
		this.status = status;
		this.missilespeed = missilespeed;
	}
}

class ExplosiveBox {
	constructor(x, y, status) {
		this.x = x;
		this.y = y;
		this.status = status;
	}
}
// occurrences
class SmokeCloud {
	constructor(x, y, status, counter, repeater) {
		this.x = x;
		this.y = y;
		this.status = status;
		this.counter = counter;
		this.repeater = repeater;
	}
}

class Explosion {
	constructor(x, y, status, counter) {
		this.x = x;
		this.y = y;
		this.status = status;
		this.counter = counter;
	}
}

class LargeExplosion {
	constructor(x, y, status, counter, repeater) {
		this.x = x;
		this.y = y;
		this.status = status;
		this.counter = counter;
		this.repeater = repeater;
	}
}

/////////////////////////////////////////////////////////// globals:

let gState = {
	isGameActive: false,
	plr: {
		x: 50,
		y: 50,
		dir: "down",
		spriteCount: 0,
		speed: 4,
		hp: 5,
		isGunLoaded: true,
		ammo: 125,
		tankSize: 44,
		shielded: {
			status: false,
			counter: 0,
			repeater: 50
		}
	},
	enemies: [],
	occurrences: {
		explosions: [],
		largeExplosions: [],
		smoke: []
	},
	objects: {
		shields: [],
		smokeBoxes: [],
		doors: [],
		explosiveBoxes: [],
		hearts: [],
		missiles: [],
	},
	gameMap: null,
};

const tankGame = document.querySelector("#game");
const gameCtx = tankGame.getContext("2d");
let gunstatus = document.querySelector("#gunstatus");
let contextGunstatus = gunstatus.getContext('2d');
let graphics;
const fps = 60;
let keyboardAction = null;

window.requestAnimationFrame = function() {
	return window.requestAnimationFrame ||
		function(f) {
			window.setTimeout(f, 1000 / 60);
		}
}();

function limitLoop(fn, fps = 60) {

	let then = Date.now();
	let interval = 1000 / fps;

	return (function loop(time) {
		requestAnimationFrame(loop);

		let now = Date.now();
		let delta = now - then;

		if (delta > interval) {
			then = now - (delta % interval);
			fn(frames);
		}
	}(0));
}

/////////////////////////////////////////////////////////// functions:
{
	graphics = initGraphics();
	gState.gameMap = initMap();
	initObjects();
	initEnemies();
	gameUI();
	displayHP();
	drawPrimaryStateOfGun();
	gState.isGameActive = true;
	document.addEventListener('keydown', (event) => keyboardAction = event.key);
	limitLoop(drawGraphics, fps);
}


function drawGraphics() {

	if (gState.isGameActive) {
		tankMovement();
		drawMap(graphics.tilesImg);
		drawTank(graphics.plrTankImg);
		enemyMovements();
		drawMissiles();
		drawExplosions();
		drawLargeExplosions();
		drawShield();
		drawSmoke();
		checkImpact();
	}

}

function drawMap(tilesImage) {

	gameCtx.fillStyle = "#000000";
	gameCtx.fillRect(0, 0, 750, 750);

	let minX = Math.floor(gState.plr.x / 50) - 7;
	let minY = Math.floor(gState.plr.y / 50) - 7;
	let diffX = gState.plr.x - Math.floor(gState.plr.x / 50) * 50;
	let diffY = gState.plr.y - Math.floor(gState.plr.y / 50) * 50;
	let tempArrayY = minY;
	let tempArrayX = null;

	for (let y = 0; y < 16; y++) {
		let tempArrayX = minX;
		for (let x = 0; x < 16; x++) {
			if (tempArrayY >= 0) {
				let currentY = (y * 50) - diffY;
				let currentX = (x * 50) - diffX;
				let currentTile = gState.gameMap[tempArrayY][tempArrayX];
				if (!currentTile) currentTile = "9";
				gameCtx.drawImage(tilesImage[currentTile], currentX, currentY);
			}
			tempArrayX++;
		}
		tempArrayY++;
	}
}

function drawTank(plrTankImg) {
	gState.plr.spriteCount > 7 ? gState.plr.spriteCount = 0 : gState.plr.spriteCount;
	gameCtx.drawImage(plrTankImg[gState.plr.dir][gState.plr.spriteCount], 350, 350);
}

function drawMissiles() {

	let bomb = new Image();
	gState.objects.missiles.map((missile, i) => {

		if (missile.status === "active") {
			if (missile.direction === "up") {
				missile.missileY -= missile.missilespeed;
				bomb.src = "images/sfx/bomb-up.png";
			} else if (missile.direction === "right") {
				missile.missileX += missile.missilespeed;
				bomb.src = "images/sfx/bomb-right.png";
			} else if (missile.direction === "down") {
				missile.missileY += missile.missilespeed;
				bomb.src = "images/sfx/bomb-down.png";
			} else if (missile.direction === "left") {
				missile.missileX -= missile.missilespeed;
				bomb.src = "images/sfx/bomb-left.png";
			}
		}

		if (missile.missileX >= gState.plr.x - 600 && missile.missileX <= gState.plr.x + 650 && missile.missileY >= gState.plr.y - 600 && missile.missileY <= gState.plr.y + 650) {

			if (missile.missileX <= gState.plr.x && missile.missileY <= gState.plr.y) {
				missile.relX = 350 - Math.abs(gState.plr.x - missile.missileX);
				missile.relY = 350 - Math.abs(gState.plr.y - missile.missileY);
			}
			if (missile.missileX >= gState.plr.x && missile.missileY <= gState.plr.y) {
				missile.relX = 350 + Math.abs(gState.plr.x - missile.missileX);
				missile.relY = 350 - Math.abs(gState.plr.y - missile.missileY);
			}
			if (missile.missileX <= gState.plr.x && missile.missileY >= gState.plr.y) {
				missile.relX = 350 - Math.abs(gState.plr.x - missile.missileX);
				missile.relY = 350 + Math.abs(gState.plr.y - missile.missileY);
			}
			if (missile.missileX >= gState.plr.x && missile.missileY >= gState.plr.y) {
				missile.relX = 350 + Math.abs(gState.plr.x - missile.missileX);
				missile.relY = 350 + Math.abs(gState.plr.y - missile.missileY);
			}
			gameCtx.drawImage(bomb, missile.relX, missile.relY);
			gState.objects.missiles[i] = missile;
		}
	});
}

function drawExplosions() {

	for (let explosion of gState.occurrences.explosions) {
		if (explosion.status === "active") {
			let explosionX, explosionY;
			if (explosion.x >= gState.plr.x - 600 && explosion.x <= gState.plr.x + 650 && explosion.y >= gState.plr.y - 600 && explosion.y <= gState.plr.y + 650) {
				if (explosion.x <= gState.plr.x && explosion.y <= gState.plr.y) {
					explosionX = 350 - Math.abs(gState.plr.x - explosion.x);
					explosionY = 350 - Math.abs(gState.plr.y - explosion.y);
				}
				if (explosion.x >= gState.plr.x && explosion.y <= gState.plr.y) {
					explosionX = 350 + Math.abs(gState.plr.x - explosion.x);
					explosionY = 350 - Math.abs(gState.plr.y - explosion.y);
				}
				if (explosion.x <= gState.plr.x && explosion.y >= gState.plr.y) {
					explosionX = 350 - Math.abs(gState.plr.x - explosion.x);
					explosionY = 350 + Math.abs(gState.plr.y - explosion.y);
				}
				if (explosion.x >= gState.plr.x && explosion.y >= gState.plr.y) {
					explosionX = 350 + Math.abs(gState.plr.x - explosion.x);
					explosionY = 350 + Math.abs(gState.plr.y - explosion.y);
				}

				if (explosion.counter < 6) {
					gameCtx.drawImage(graphics.occurrencesImg.explosion[explosion.counter], explosionX - 64, explosionY - 64);
					explosion.counter++;
				} else {
					explosion.status = "non-active";
				}
			}
		}
	}
}

function drawSmoke() {
	for (let smoke of gState.occurrences.smoke) {
		if (smoke.status === "active") {
			let x, y;
			if (smoke.x > gState.plr.x - 600 && smoke.x < gState.plr.x + 650 && smoke.y > gState.plr.y - 650 && smoke.y < gState.plr.y + 650) {
				if (smoke.x < gState.plr.x && smoke.y < gState.plr.y) {
					x = 350 - Math.abs(gState.plr.x - smoke.x);
					y = 350 - Math.abs(gState.plr.y - smoke.y);
				}
				if (smoke.x > gState.plr.x && smoke.y < gState.plr.y) {
					x = 350 + Math.abs(gState.plr.x - smoke.x);
					y = 350 - Math.abs(gState.plr.y - smoke.y);
				}
				if (smoke.x < gState.plr.x && smoke.y > gState.plr.y) {
					x = 350 - Math.abs(gState.plr.x - smoke.x);
					y = 350 + Math.abs(gState.plr.y - smoke.y);
				}
				if (smoke.x > gState.plr.x && smoke.y > gState.plr.y) {
					x = 350 + Math.abs(gState.plr.x - smoke.x);
					y = 350 + Math.abs(gState.plr.y - smoke.y);
				}
				if (smoke.repeater > 0) {
					if (smoke.counter > 45) {
						smoke.counter = 0;
						gState.occurrences.smoke[i].repeater--;
					}
					gameCtx.drawImage(graphics.occurrencesImg.smoke[smoke.counter], x, y);
					smoke.counter++;
				} else {
					smoke.status = "non-active";
				}
			}
		}
	}
}

function drawLargeExplosions() {
	for (let lExplosion of gState.occurrences.largeExplosions) {
		if (lExplosion.status === "active") {
			let x, y;
			if (lExplosion.x > gState.plr.x - 400 && lExplosion.x < gState.plr.x + 450 && lExplosion.y > gState.plr.y - 400 && lExplosion.y < gState.plr.y + 450) {
				if (lExplosion.x < gState.plr.x && lExplosion.y < gState.plr.y) {
					x = 350 - Math.abs(gState.plr.x - lExplosion.x);
					y = 350 - Math.abs(gState.plr.y - lExplosion.y);
				}
				if (lExplosion.x > gState.plr.x && lExplosion.y < gState.plr.y) {
					x = 350 + Math.abs(gState.plr.x - lExplosion.x);
					y = 350 - Math.abs(gState.plr.y - lExplosion.y);
				}
				if (lExplosion.x < gState.plr.x && lExplosion.y > gState.plr.y) {
					x = 350 - Math.abs(gState.plr.x - lExplosion.x);
					y = 350 + Math.abs(gState.plr.y - lExplosion.y);
				}
				if (lExplosion.x > gState.plr.x && lExplosion.y > gState.plr.y) {
					x = 350 + Math.abs(gState.plr.x - lExplosion.x);
					y = 350 + Math.abs(gState.plr.y - lExplosion.y);
				}

				if (lExplosion.repeater > 0) {
					if (lExplosion.counter > 14) {
						lExplosion.counter = 0;
						return lExplosion.repeater--;
					}
					gameCtx.drawImage(graphics.occurrencesImg.largeExplosion[lExplosion.counter], x, y);
					lExplosion.counter++;
				} else {
					lExplosion.status = "non-active";
				}
			}
		}
	}
}

function drawShield() {

	if (gState.plr.shielded.status === true) {
		let x = 350 - 53;
		let y = 350 - 53;
		if (gState.plr.shielded.repeater > 0) {
			if (gState.plr.shielded.counter > 10) {
				gState.plr.shielded.counter = 0;
				gState.plr.shielded.repeater--;
			}
			gameCtx.drawImage(graphics.occurrencesImg.shield[gState.plr.shielded.counter], x, y);
			gState.plr.shielded.counter++;
		} else {
			gState.plr.shielded.status = false;
		}
	}
}

function checkImpact() {

	for (let potentialHit = 0; potentialHit < gState.objects.missiles.length; potentialHit++) {
		let possibleImpactX = Math.floor(gState.objects.missiles[potentialHit].missileX / 50);
		let possibleImpactY = Math.floor(gState.objects.missiles[potentialHit].missileY / 50);

		if (gState.objects.missiles[potentialHit].status === "active") {

			if (gState.gameMap[possibleImpactY][possibleImpactX] > 3 || gState.gameMap[possibleImpactY][possibleImpactX] === "E") {
				gState.objects.missiles[potentialHit].status = "non-active";
				gState.occurrences.explosions[gState.occurrences.explosions.length] = new Explosion(gState.objects.missiles[potentialHit].missileX, gState.objects.missiles[potentialHit].missileY, "active", 0);

				if (gState.gameMap[possibleImpactY][possibleImpactX] === "4" || gState.gameMap[possibleImpactY][possibleImpactX] === "7" || gState.gameMap[possibleImpactY][possibleImpactX] === "8") {
					gState.objects.doors.forEach((door, i) => {
						if (gState.objects.doors[i].x === possibleImpactX && gState.objects.doors[i].y === possibleImpactY) {
							gState.objects.doors[i].status++;
							if (gState.objects.doors[i].status === 2) gState.gameMap[possibleImpactY][possibleImpactX] = "7";
							else if (gState.objects.doors[i].status === 3) gState.gameMap[possibleImpactY][possibleImpactX] = "8";
							else if (gState.objects.doors[i].status > 3) gState.gameMap[possibleImpactY][possibleImpactX] = "0";
						}
					});
				} else if (gState.gameMap[possibleImpactY][possibleImpactX] === "6") {
					gState.objects.smokeBoxes.map((smokeBox, i) => {
						if (smokeBox.x === possibleImpactX && smokeBox.y === possibleImpactY) {
							smokeBox.status++;
							if (gState.objects.doors[i].status === 2) gState.gameMap[possibleImpactY][possibleImpactX] = "Z";
							if (gState.objects.doors[i].status > 2) gState.gameMap[possibleImpactY][possibleImpactX] = "0";
							gState.gameMap[possibleImpactY][possibleImpactX] = "0";
							gState.occurrences.smoke[gState.occurrences.smoke.length] = new SmokeCloud(((smokeBox.x * 50) - 384), ((smokeBox.y * 50) - 384), "active", 0, 50);
						}
					});
				} else if (gState.gameMap[possibleImpactY][possibleImpactX] === "E") {
					gState.objects.explosiveBoxes.map((explosiveBox) => {
						if (explosiveBox.x === possibleImpactX && explosiveBox.y === possibleImpactY) {
							explosiveBox.status++;
							if (explosiveBox.status > 2) {
								gState.gameMap[possibleImpactY][possibleImpactX] = "0";
								gState.occurrences.largeExplosions[gState.occurrences.largeExplosions.length] = new LargeExplosion(((explosiveBox.x * 50) - 100), ((explosiveBox.y * 50) - 100), "active", 0, 3);
							}
						}
					});
				}
			} else if ((gState.objects.missiles[potentialHit].missileX >= gState.plr.x && gState.objects.missiles[potentialHit].missileX <= gState.plr.x + gState.plr.tankSize) &&
				(gState.objects.missiles[potentialHit].missileY >= gState.plr.y && gState.objects.missiles[potentialHit].missileY <= gState.plr.y + gState.plr.tankSize)) {
				gState.objects.missiles[potentialHit].status = "non-active";
				gState.occurrences.largeExplosions[gState.occurrences.largeExplosions.length] = new LargeExplosion((gState.plr.x - 100), (gState.plr.y - 100), "active", 0, 2);
				let explosion = new Audio("sounds/explosionHIT.mp3");
				explosion.play();
				if (gState.plr.shielded.status !== true) {
					gState.plr.hp--;
					if (gState.plr.hp < 1) {
						gState.isGameActive = false;
						gameOver();
					}
				}
				displayHP();
			}

			for (let i in gState.enemies) {
				if (gState.enemies[i].status === true) {
					if ((gState.objects.missiles[potentialHit].missileX >= gState.enemies[i].x && gState.objects.missiles[potentialHit].missileX <= gState.enemies[i].x + 50) && (gState.objects.missiles[potentialHit].missileY >= gState.enemies[i].y && gState.objects.missiles[potentialHit].missileY <= gState.enemies[i].y + 50)) {
						let explosion = new Audio("sounds/explosionHIT.mp3");
						explosion.play();
						gState.objects.missiles[potentialHit].status = "non-active";
						gState.occurrences.explosions[gState.occurrences.explosions.length] = new Explosion(gState.objects.missiles[potentialHit].missileX, gState.objects.missiles[potentialHit].missileY, "active", 0);
						if (gState.enemies[i].hp - 1 === 0) gState.enemies[i].status = false;
						else gState.enemies[i].hp--;
					}
				}
			}
		}
	}
}

function tankMovement() {
	if (gState.isGameActive) {
		switch (keyboardAction) {
			case "s":
			case "S":
				if (gState.plr.isGunLoaded && gState.plr.ammo > 0) {
					fireGun();
				}
				break;
			case "ArrowDown":
				gState.plr.dir = "down";
				gState.plr.spriteCount++;
				checkMovePossibility("down");
				break;
			case "ArrowUp":
				gState.plr.dir = "up";
				gState.plr.spriteCount++;
				checkMovePossibility("up");
				break;
			case "ArrowRight":
				gState.plr.dir = "right";
				gState.plr.spriteCount++;
				checkMovePossibility("right");
				break;
			case "ArrowLeft":
				gState.plr.dir = "left";
				gState.plr.spriteCount++;
				checkMovePossibility("left");
				break;
		}
		keyboardAction = null;
	}
}

function checkMovePossibility(direction) {

	let tankX1, tankY1, tankX2, tankY2;

	if (direction === "up") {
		tankX1 = Math.floor(gState.plr.x / 50);
		tankX2 = Math.floor((gState.plr.x + gState.plr.tankSize) / 50);
		tankY1 = Math.floor((gState.plr.y - gState.plr.speed) / 50);
		if (gState.gameMap[tankY1][tankX1] < 4 && gState.gameMap[tankY1][tankX2] < 4 || gState.gameMap[tankY1][tankX2] === "C") {
			gState.plr.y -= gState.plr.speed;
			isItAnObject({
				loc1val: gState.gameMap[tankY1][tankX1],
				loc1x: tankX1,
				loc1y: tankY2
			}, {
				loc2val: gState.gameMap[tankY1][tankX2],
				loc2x: tankX2,
				loc2y: tankY1
			});
		}
	} else if (direction === "right") {
		tankY1 = Math.floor((gState.plr.y + 6) / 50);
		tankX2 = Math.floor((gState.plr.x + gState.plr.tankSize + gState.plr.speed) / 50);
		tankY2 = Math.floor((gState.plr.y - 6 + gState.plr.tankSize) / 50);
		if (gState.gameMap[tankY1][tankX2] < 4 && gState.gameMap[tankY2][tankX2] < 4) {
			gState.plr.x += gState.plr.speed;
			isItAnObject({
				loc1val: gState.gameMap[tankY1][tankX2],
				loc1x: tankX2,
				loc1y: tankY1
			}, {
				loc2val: gState.gameMap[tankY2][tankX2],
				loc2x: tankX2,
				loc2y: tankY2
			});
		}
	} else if (direction === "down") {
		tankX1 = Math.floor(gState.plr.x / 50);
		tankX2 = Math.floor((gState.plr.x + gState.plr.tankSize) / 50);
		tankY2 = Math.floor((gState.plr.y + gState.plr.tankSize + gState.plr.speed) / 50);
		if (gState.gameMap[tankY2][tankX1] < 4 && gState.gameMap[tankY2][tankX2] < 4) {
			gState.plr.y += gState.plr.speed;
			isItAnObject({
				loc1val: gState.gameMap[tankY2][tankX1],
				loc1x: tankX1,
				loc1y: tankY2
			}, {
				loc2val: gState.gameMap[tankY2][tankX2],
				loc2x: tankX2,
				loc2y: tankY2
			});
		}
	} else if (direction === "left") {
		tankX1 = Math.floor((gState.plr.x - gState.plr.speed) / 50);
		tankY1 = Math.floor((gState.plr.y + 6) / 50);
		tankY2 = Math.floor((gState.plr.y - 6 + gState.plr.tankSize) / 50);
		if (gState.gameMap[tankY1][tankX1] < 4 && gState.gameMap[tankY2][tankX1] < 4) {
			gState.plr.x -= gState.plr.speed;
			isItAnObject({
				loc1val: gState.gameMap[tankY1][tankX1],
				loc1x: tankX1,
				loc1y: tankY1
			}, {
				loc2val: gState.gameMap[tankY2][tankX1],
				loc2x: tankX1,
				loc2y: tankY2
			});
		}
	}
}

function isItAnObject(loc1, loc2) {

	const {
		loc1val,
		loc1x,
		loc1y
	} = loc1;
	const {
		loc2val,
		loc2x,
		loc2y
	} = loc2;

	if (loc1val === "2" || loc2val === "2") {
		let i = gState.objects.hearts.findIndex((heart) => {
			if ((heart.y === loc1y && heart.x === loc1x) || (heart.y === loc2y && heart.x === loc2x)) {
				return heart;
			}
		});
		if (i !== -1) {
			gState.objects.hearts[i].status = "non-active";
			gState.gameMap[gState.objects.hearts[i].y][gState.objects.hearts[i].x] = "0";
			if (gState.plr.hp < 5) {
				gState.plr.hp++;
				displayHP();
			}
		}
	}
	if (loc1val === "3" || loc2val === "3") {
		let j = gState.objects.shields.findIndex((shield) => {
			if ((shield.y === loc1y && shield.x === loc1x) || (shield.y === loc2y && shield.x === loc2x)) {
				return shield;
			}
		});
		if (j !== -1) {
			gState.objects.shields[j].status = "non-active";
			gState.gameMap[gState.objects.shields[j].y][gState.objects.shields[j].x] = "0";
			gState.plr.shielded = {
				status: true,
				counter: 0,
				repeater: 100
			};
		}
	}
	if (loc1val === "C" || loc2val === "C") {
		playerWins();
	}
}

function initMap() {
	let rawGameMap = rawGameMapData();
	let rows = rawGameMap.trim().split("\n");
	let map = rows.map((cell) => {
		return cell.split("");
	});
	return map;
}

function initObjects() {

	gState.gameMap.map((row, i) => {
		return row.map((value, j) => {
			if (gState.gameMap[i][j] === "4") {
				gState.objects.doors[gState.objects.doors.length] = new Door(j, i, 1);
			} else if (gState.gameMap[i][j] === "E") {
				gState.objects.explosiveBoxes[gState.objects.explosiveBoxes.length] = new ExplosiveBox(j, i, 1);
			} else if (gState.gameMap[i][j] === "3") {
				gState.objects.shields[gState.objects.shields.length] = new Shield(j, i, 1);
			} else if (gState.gameMap[i][j] === "2") {
				gState.objects.hearts[gState.objects.hearts.length] = new Heart(j, i, 1);
			} else if (gState.gameMap[i][j] === "6") {
				gState.objects.smokeBoxes[gState.objects.smokeBoxes.length] = new SmokeBox(j, i, 1);
			}
		});
	});
}

function resetGame() {
	gState = null;
	gState = {
		isGameActive: false,
		plr: {
			x: 50,
			y: 50,
			dir: "down",
			spriteCount: 0,
			speed: 4,
			hp: 5,
			isGunLoaded: true,
			ammo: 125,
			tankSize: 44,
			shielded: {
				status: false,
				counter: 0,
				repeater: 50
			}
		},
		enemies: [],
		occurrences: {
			explosions: [],
			largeExplosions: [],
			smoke: []
		},
		objects: {
			shields: [],
			smokeBoxes: [],
			doors: [],
			explosiveBoxes: [],
			hearts: [],
			missiles: [],
		},
		gameMap: null,
	};
	gState.gameMap = initMap();
	initEnemies();
	initObjects();

	gState.isGameActive = true;
	displayHP();
	drawPrimaryStateOfGun();
	drawGraphics();

}

function enemyMovements() {

	for (let id in gState.enemies) {
		if (gState.enemies[id].status) {

			if (gState.enemies[id].loadStatus > 0) gState.enemies[id].loadStatus--;

			if (gState.enemies[id].pattern[0] === "up") {
				if (gState.enemies[id].loadStatus === 0) {
					enemyFire(id, "up");
				}
				gState.enemies[id].spriteCounter++;
				gState.enemies[id].y -= gState.enemies[id].speed;
				if (gState.enemies[id].y % 50 === 0 && gState.enemies[id].x % 50 === 0) {
					gState.enemies[id].pattern.shift();
				}
			} else if (gState.enemies[id].pattern[0] === "down") {
				if (gState.enemies[id].loadStatus === 0) {
					enemyFire(id, "down");
				}
				gState.enemies[id].y += gState.enemies[id].speed;
				gState.enemies[id].spriteCounter++;
				if (gState.enemies[id].y % 50 === 0 && gState.enemies[id].x % 50 === 0) {
					gState.enemies[id].pattern.shift();
				}
			} else if (gState.enemies[id].pattern[0] === "right") {
				if (gState.enemies[id].loadStatus === 0) {
					enemyFire(id, "right");
				}
				gState.enemies[id].x += gState.enemies[id].speed;
				gState.enemies[id].spriteCounter++;
				if (gState.enemies[id].x % 50 === 0 && gState.enemies[id].x % 50 === 0) {
					gState.enemies[id].pattern.shift();
				}
			} else if (gState.enemies[id].pattern[0] === "left") {
				if (gState.enemies[id].loadStatus === 0) {
					enemyFire(id, "left");
				}
				gState.enemies[id].x -= gState.enemies[id].speed;
				gState.enemies[id].spriteCounter++;
				if (gState.enemies[id].y % 50 === 0 && gState.enemies[id].x % 50 === 0) {
					gState.enemies[id].pattern.shift();
				}
			}

			if (gState.enemies[id].x < gState.plr.x + 50 && gState.enemies[id].x + 50 > gState.plr.x && gState.enemies[id].y < gState.plr.y + 50 && gState.enemies[id].y + 50 > gState.plr.y) {
				let playerIsHit = new Audio("sounds/PowerDown4.mp3");
				playerIsHit.play();
				gState.plr.hp = 0;
				displayHP();
				gState.isGameActive = false;
				gameOver();
			}

			if (gState.enemies[id].pattern.length === 0 && (gState.enemies[id].type === "monster2" || gState.enemies[id].type === "monster")) {
				gState.enemies[id].pattern = gState.enemies[id].patternPrototype.map(i => i);
			}

			if ((gState.enemies[id].type === "monster4" || gState.enemies[id].type === "monster5" || gState.enemies[id].type === "tank") && gState.enemies[id].x % 50 === 0 && gState.enemies[id].y % 50 === 0) {
				if (gState.enemies[id].loadStatus === 0) {
					enemyFire(id, gState.enemies[id].pattern[0]);
				}

				let playerCordX = Math.floor(gState.plr.x / 50);
				let playerCordY = Math.floor(gState.plr.y / 50);
				let fiX = Math.floor(gState.enemies[id].x / 50);
				let fiY = Math.floor(gState.enemies[id].y / 50);

				gState.enemies[id].pattern = [];
				gState.enemies[id].pattern = shortestPath({
					x: fiX,
					y: fiY
				}, {
					x: playerCordX,
					y: playerCordY
				});
			}
			if ((gState.enemies[id].type === "monster4" || gState.enemies[id].type === "monster5" || gState.enemies[id].type === "tank") && parseInt(gState.enemies[id].walkCounter / gState.enemies[id].speed > 0)) gState.enemies[id].walkCounter++;
			if ((gState.enemies[id].type === "monster4" || gState.enemies[id].type === "monster5" || gState.enemies[id].type === "tank") && parseInt(gState.enemies[id].walkCounter / gState.enemies[id].speed === 200)) gState.enemies[id].walkCounter = 1;
			drawEnemyMovement(id);
		}
	}
}

function drawEnemyMovement(id) {
	let fiRelX, fiRelY;
	if (gState.enemies[id].x >= gState.plr.x - 600 && gState.enemies[id].x <= gState.plr.x + 650 && gState.enemies[id].y >= gState.plr.y - 600 && gState.enemies[id].y <= gState.plr.y + 650) {

		if (gState.enemies[id].spriteCounter > gState.enemies[id].numberOfSprites) {
			gState.enemies[id].spriteCounter = 0;
		}
		if (gState.enemies[id].x <= gState.plr.x && gState.enemies[id].y <= gState.plr.y) {
			fiRelX = 350 - Math.abs(gState.plr.x - gState.enemies[id].x);
			fiRelY = 350 - Math.abs(gState.plr.y - gState.enemies[id].y);
		}
		if (gState.enemies[id].x >= gState.plr.x && gState.enemies[id].y <= gState.plr.y) {
			fiRelX = 350 + Math.abs(gState.plr.x - gState.enemies[id].x);
			fiRelY = 350 - Math.abs(gState.plr.y - gState.enemies[id].y);
		}
		if (gState.enemies[id].x <= gState.plr.x && gState.enemies[id].y >= gState.plr.y) {
			fiRelX = 350 - Math.abs(gState.plr.x - gState.enemies[id].x);
			fiRelY = 350 + Math.abs(gState.plr.y - gState.enemies[id].y);
		}
		if (gState.enemies[id].x >= gState.plr.x && gState.enemies[id].y >= gState.plr.y) {
			fiRelX = 350 + Math.abs(gState.plr.x - gState.enemies[id].x);
			fiRelY = 350 + Math.abs(gState.plr.y - gState.enemies[id].y);
		}

		if (gState.enemies[id].pattern[0] === "down" || gState.enemies[id].pattern[0] === "up" || gState.enemies[id].pattern[0] === "right" || gState.enemies[id].pattern[0] === "left") {
			let tempType = gState.enemies[id].type,
				dir = gState.enemies[id].pattern[0],
				sCount = gState.enemies[id].spriteCounter;
			gameCtx.drawImage(graphics.enemyImg[tempType][dir][sCount], fiRelX, fiRelY);
		} else {
			gameCtx.drawImage(graphics.enemyImg[gState.enemies[id].type]["down"]["0"], fiRelX, fiRelY);
		}
	}
}

function boxWithInstructions(heading, ...paragraphs) {

	gameCtx.moveTo(0, 0);
	gameCtx.beginPath();
	gameCtx.rect(125, 125, 500, 500);
	gameCtx.fillStyle = 'rgba(51,0,0,0.8)';
	gameCtx.fill();
	gameCtx.lineWidth = 3;
	gameCtx.strokeStyle = 'rgba(32,32,32,0.8)';
	gameCtx.stroke();

	gameCtx.font = '45px OstrichSansMedium';
	gameCtx.fillStyle = 'rgba(245,245,245,0.8)';
	gameCtx.textAlign = "center";
	gameCtx.fillText(heading, 375, 200);

	let paragraphY = 300;

	for (let paragraph of paragraphs) {
		gameCtx.font = '30px OstrichSansMedium';
		gameCtx.fillStyle = 'rgba(245,245,245,0.8)';
		gameCtx.textAlign = "center";
		gameCtx.fillText(paragraph, 375, paragraphY);
		paragraphY += 50;
	}

	gameCtx.font = '25px OstrichSansMedium';
	gameCtx.fillStyle = 'rgba(245,245,245,0.8)';
	gameCtx.textAlign = "center";
	gameCtx.fillText("THIS SCREEN WILL SOON DISAPPEAR", 375, 575);
}

function gameOver() {

	let death = new Image();
	death.src = "images/sfx/death.png";
	death.onload = () => {
		gameCtx.drawImage(death, 0, 0);
	};

	gameCtx.moveTo(0, 0);
	gameCtx.beginPath();
	gameCtx.rect(0, 0, 750, 750);
	gameCtx.fillStyle = 'rgba(51,0,0,0.3)';
	gameCtx.fill();
	gameCtx.lineWidth = 3;
	gameCtx.strokeStyle = 'rgba(32,32,32,0.8)';
	gameCtx.stroke();

	gameCtx.font = '135px OstrichSansMedium';
	gameCtx.fillStyle = 'rgba(245,245,245,0.8)';
	gameCtx.textAlign = "center";
	gameCtx.fillText("GAME OVER", 375, 200);
}

function playerWins() {

	let success = new Image();
	success.src = "images/sfx/success.png";
	success.onload = () => {
		gameCtx.drawImage(success, 0, 0);
	};

	gameCtx.moveTo(0, 0);
	gameCtx.beginPath();
	gameCtx.rect(0, 0, 750, 750);
	gameCtx.fillStyle = 'rgba(51,0,0,0.3)';
	gameCtx.fill();
	gameCtx.lineWidth = 3;
	gameCtx.strokeStyle = 'rgba(32,32,32,0.8)';
	gameCtx.stroke();

	gameCtx.font = '135px OstrichSansMedium';
	gameCtx.fillStyle = 'rgba(245,245,245,0.8)';
	gameCtx.textAlign = "center";
	gameCtx.fillText("MISSION SUCCEEDED", 375, 200);

	gameCtx.font = '55px OstrichSansMedium';
	gameCtx.fillStyle = 'rgba(245,245,245,0.8)';
	gameCtx.textAlign = "center";
	gameCtx.fillText("CONGRATULATIONS, YOU'VE COMPLETED LEVEL 1.", 375, 500);
}

function shortestPath(startCoordinates, endCoordinates) {

	let grid = [];
	grid = gState.gameMap.map((el) => [...el]);

	let location = {
		y: startCoordinates.y,
		x: startCoordinates.x,
		path: [],
		status: 'start'
	};

	grid[endCoordinates.y][endCoordinates.x] = "666";

	let queue = [location];

	while (queue.length > 0) {
		let currentLocation = queue.shift();
		let newLocation;

		newLocation = checkDirection(currentLocation, 'up', grid);
		if (newLocation.status === 'Goal') {
			return newLocation.path;
		} else if (newLocation.status === 'Valid') {
			queue.push(newLocation);
		}

		newLocation = checkDirection(currentLocation, 'right', grid);
		if (newLocation.status === 'Goal') {
			return newLocation.path;
		} else if (newLocation.status === 'Valid') {
			queue.push(newLocation);
		}

		newLocation = checkDirection(currentLocation, 'down', grid);
		if (newLocation.status === 'Goal') {
			return newLocation.path;
		} else if (newLocation.status === 'Valid') {
			queue.push(newLocation);
		}

		newLocation = checkDirection(currentLocation, 'left', grid);
		if (newLocation.status === 'Goal') {
			return newLocation.path;
		} else if (newLocation.status === 'Valid') {
			queue.push(newLocation);
		}
	}
	return false;
}

function statusAtLocation(location, grid) {
	let gridSize = grid.length;
	let tempY = location.y;
	let tempX = location.x;

	if (location.x < 0 ||
		location.x >= gridSize ||
		location.y < 0 ||
		location.y >= gridSize) {
		return 'Invalid';
	} else if (grid[tempY][tempX] === "666") {
		return 'Goal';
	} else if (grid[tempY][tempX] !== "0") { // > 3 || !Number.isInteger(grid[tempY][tempX])
		return 'Blocked';
	} else {
		return 'Valid';
	}
}

function checkDirection(currentLocation, direction, grid) {
	let newPath = currentLocation.path.slice();
	newPath.push(direction);

	let tempY = currentLocation.y;
	let tempX = currentLocation.x;

	if (direction === 'up') {
		tempY -= 1;
	} else if (direction === 'right') {
		tempX += 1;
	} else if (direction === 'down') {
		tempY += 1;
	} else if (direction === 'left') {
		tempX -= 1;
	}

	let newLocation = {
		y: tempY,
		x: tempX,
		path: newPath,
		status: 'Unknown'
	};
	newLocation.status = statusAtLocation(newLocation, grid);

	if (newLocation.status === 'Valid') {
		grid[newLocation.y][newLocation.x] = 'Visited';
	}
	return newLocation;
}

function enemyFire(i, direction) {

	let fiRelX, fiRelY;
	if (gState.enemies[i].x < gState.plr.x && gState.enemies[i].y < gState.plr.y) {
		fiRelX = 350 - Math.abs(gState.plr.x - gState.enemies[i].x);
		fiRelY = 350 - Math.abs(gState.plr.y - gState.enemies[i].y);
	}
	if (gState.enemies[i].x > gState.plr.x && gState.enemies[i].y < gState.plr.y) {
		fiRelX = 350 + Math.abs(gState.plr.x - gState.enemies[i].x);
		fiRelY = 350 - Math.abs(gState.plr.y - gState.enemies[i].y);
	}
	if (gState.enemies[i].x < gState.plr.x && gState.enemies[i].y > gState.plr.y) {
		fiRelX = 350 - Math.abs(gState.plr.x - gState.enemies[i].x);
		fiRelY = 350 + Math.abs(gState.plr.y - gState.enemies[i].y);
	}
	if (gState.enemies[i].x > gState.plr.x && gState.enemies[i].y > gState.plr.y) {
		fiRelX = 350 + Math.abs(gState.plr.x - gState.enemies[i].x);
		fiRelY = 350 + Math.abs(gState.plr.y - gState.enemies[i].y);
	}

	switch (direction) {
		case "up":
			if ((gState.enemies[i].x - 15 < gState.plr.x + 50 && gState.enemies[i].x + 65 > gState.plr.x + 50) && (gState.enemies[i].y - 250 < gState.plr.y + 50 && gState.enemies[i].y > gState.plr.y)) {
				gState.enemies[i].loadStatus = 75;
				gState.objects.missiles[gState.objects.missiles.length] = new Missile(gState.enemies[i].x + 21, gState.enemies[i].y, fiRelX + 21, fiRelY, direction, "active");
			}
			break;
		case "down":
			if ((gState.enemies[i].x - 15 < gState.plr.x + 50 && gState.enemies[i].x + 65 > gState.plr.x) && (gState.enemies[i].y + 50 < gState.plr.y + 50 && gState.enemies[i].y + 300 > gState.plr.y)) {
				gState.enemies[i].loadStatus = 75;
				gState.objects.missiles[gState.objects.missiles.length] = new Missile(gState.enemies[i].x + 21, gState.enemies[i].y + 50, fiRelX + 21, fiRelY + 50, direction, "active");
			}
			break;
		case "right":
			if ((gState.enemies[i].x + 50 < gState.plr.x + 50 && gState.enemies[i].x + 300 > gState.plr.x) && (gState.enemies[i].y - 15 < gState.plr.y + 50 && gState.enemies[i].y + 65 > gState.plr.y)) {
				gState.enemies[i].loadStatus = 75;
				gState.objects.missiles[gState.objects.missiles.length] = new Missile(gState.enemies[i].x + 50, gState.enemies[i].y + 21, fiRelX + 50, fiRelY + 21, direction, "active");
			}
			break;
		case "left":
			if ((gState.enemies[i].x - 250 < gState.plr.x + 50 && gState.enemies[i].x > gState.plr.x) && (gState.enemies[i].y - 15 < gState.plr.y + 50 && gState.enemies[i].y + 65 > gState.plr.y)) {
				gState.enemies[i].loadStatus = 75;
				gState.objects.missiles[gState.objects.missiles.length] = new Missile(gState.enemies[i].x, gState.enemies[i].y + 21, fiRelX, fiRelY + 21, direction, "active");
			}
			break;
	}
}

function initGraphics() {

	let gameGraphics = imageData();

	// tiles (map)

	let tilesSrc = gameGraphics.tilesSrc;
	let tilesImg = {};

	Object.keys(tilesSrc).map((tile, i) => {
		tilesImg[tile] = new Image();
		return tilesImg[tile].src = tilesSrc[tile];
	});

	// player graphics (tank)

	let plrTankSrc = gameGraphics.plrTankSrc;
	let plrTankImg = {
		left: {},
		right: {},
		up: {},
		down: {}
	};

	Object.keys(plrTankSrc).map((direction) => {
		plrTankSrc[direction].map((sprite, i) => {
			Object.assign(plrTankImg[direction], {
				[i]: new Image()
			});
			return plrTankImg[direction][i].src = `images/player/${sprite}`;
		});
	});

	// enemy graphics
	let enemyImg = {
		monster: {
			left: [],
			right: [],
			up: [],
			down: []
		},
		monster2: {
			left: [],
			right: [],
			up: [],
			down: []
		},
		monster4: {
			left: [],
			right: [],
			up: [],
			down: []
		},
		monster5: {
			left: [],
			right: [],
			up: [],
			down: []
		},
		tank: {
			left: [],
			right: [],
			up: [],
			down: []
		}
	};
	let enemySrc = gameGraphics.enemySrc;

	Object.keys(enemySrc).forEach((enemy) => {
		Object.keys(enemySrc[enemy]).forEach((dir) => {
			Object.entries(enemySrc[enemy][dir]).forEach((sprite) => {
				enemyImg[enemy][dir][sprite[0]] = new Image();
				enemyImg[enemy][dir][sprite[0]].src = `images/monsters/${sprite[1]}`;
			});
		});
	});

	// occurrences graphics

	let occurencesSrc = gameGraphics.occurrences;
	let occurrencesImg = {
		shield: {},
		smoke: {},
		explosion: {},
		largeExplosion: {}
	}

	Object.keys(occurencesSrc).map((type) => {
		occurencesSrc[type].map((sprite, i) => {
			Object.assign(occurrencesImg[type], {
				[i]: new Image()
			});
			return occurrencesImg[type][i].src = `images/sfx/${sprite}`;
		});
	});


	return {
		plrTankImg,
		tilesImg,
		enemyImg,
		occurrencesImg
	};
}

function gameUI() {
	let reloadBtn = document.querySelector("#reload");
	reloadBtn.addEventListener("click", () => {
		resetGame();
	});
	let fullScreen = false;
	let elem = document.querySelector("#wrapper");
	let fullscreenBtn = document.querySelector("#fullscreen");
	fullscreenBtn.addEventListener("click", () => {
		if (!fullScreen) {

			if (elem.requestFullscreen) {
				elem.requestFullscreen();
			} else if (elem.msRequestFullscreen) {
				elem.msRequestFullscreen();
			} else if (elem.mozRequestFullScreen) {
				elem.mozRequestFullScreen();
			} else if (elem.webkitRequestFullscreen) {
				elem.webkitRequestFullscreen();
			}
			fullScreen = true;

		} else if (fullScreen) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
			fullScreen = false;
		}
	});
}

function fireGun() {

	let x, y, relX, relY, status, direction;

	if (gState.plr.dir === "up") {
		x = gState.plr.x + 21;
		y = gState.plr.y;
		relX = 350 + 21;
		relY = 350;
		status = "active";
		direction = "up";
	} else if (gState.plr.dir === "right") {
		x = gState.plr.x + 50;
		y = gState.plr.y + 21;
		relX = 350 + 50;
		relY = 350 + 21;
		status = "active";
		direction = "right";
	} else if (gState.plr.dir === "down") {
		x = gState.plr.x + 21;
		y = gState.plr.y + 50;
		relX = 350 + 21;
		relY = 350 + 50;
		status = "active";
		direction = "down";
	} else if (gState.plr.dir === "left") {
		x = gState.plr.x;
		y = gState.plr.y + 21;
		relX = 350;
		relY = 350 + 21;
		status = "active";
		direction = "left";
	}

	let gunshot = new Audio("sounds/9.mp3");
	gunshot.play();

	gState.objects.missiles[gState.objects.missiles.length] = new Missile(x, y, relX, relY, direction, status);
	gState.plr.isGunLoaded = false;
	gState.plr.ammo--;
	document.querySelector("#guns-and-ammo").innerHTML = gState.plr.ammo.toString();
	loadGun();
}

function loadGun() {
	contextGunstatus.fillStyle = "red";
	contextGunstatus.fillRect(0, 0, 125, 30);

	let start = 0;
	let stop = 125;
	let progress = setInterval(frame, 7);

	function frame() {
		if (start >= stop) {
			clearInterval(progress);
			gState.plr.isGunLoaded = true;
		} else {
			start++;
			contextGunstatus.fillStyle = "green";
			contextGunstatus.fillRect(0, 0, start, 30);
		}
	}
}

function displayHP() {
	let tempHP = "";
	gState.plr.hp > 0 ? tempHP = "♥".repeat(gState.plr.hp) : tempHP = "DEAD";
	document.querySelector("#hp").innerHTML = tempHP;
}


function drawShield() {

	if (gState.plr.shielded.status === true) {
		let x = 350 - 53;
		let y = 350 - 53;
		if (gState.plr.shielded.repeater > 0) {
			if (gState.plr.shielded.counter > 10) {
				gState.plr.shielded.counter = 0;
				gState.plr.shielded.repeater--;
			}
			gameCtx.drawImage(graphics.occurrencesImg.shield[gState.plr.shielded.counter], x, y);
			gState.plr.shielded.counter++;
		} else {
			gState.plr.shielded.status = false;
		}
	}
}

function drawPrimaryStateOfGun() {
	contextGunstatus.fillStyle = "green";
	contextGunstatus.fillRect(0, 0, 125, 30);
}

function createFiPattern(...moves) {
	let tempAddMoves = [];
	for (let move of moves) {
		for (let i = 0; i < move.moves; i++) {
			tempAddMoves.push(move.direction);
		}
	}
	return tempAddMoves;
}

////////////////////////////////
function imageData() {
	return {
		tilesSrc: {
			0: "images/tiles/tile-0.png",
			2: "images/tiles/tile-2.png",
			3: "images/tiles/tile-3.png",
			4: "images/tiles/tile-4.png",
			5: "images/tiles/tile-5.png",
			6: "images/tiles/tile-6.png",
			7: "images/tiles/tile-7.png",
			8: "images/tiles/tile-8.png",
			9: "images/tiles/tile-9.png",
			S: "images/tiles/tile-S.png",
			A: "images/tiles/tile-A.png",
			C: "images/tiles/tile-C.png",
			B: "images/tiles/tile-C.png",
			E: "images/tiles/tile-E.png",
			Z: "images/tiles/tile-Z.png"
		},
		plrTankSrc: {
			left: ["tank-left0.png", "tank-left1.png", "tank-left2.png", "tank-left3.png", "tank-left4.png", "tank-left5.png", "tank-left6.png", "tank-left7.png"],
			right: ["tank-right0.png", "tank-right1.png", "tank-right2.png", "tank-right3.png", "tank-right4.png", "tank-right5.png", "tank-right6.png",
				"tank-right7.png"
			],
			up: ["tank-up0.png", "tank-up1.png", "tank-up2.png", "tank-up3.png", "tank-up4.png", "tank-up5.png", "tank-up6.png", "tank-up7.png"],
			down: ["tank-down0.png", "tank-down1.png", "tank-down2.png", "tank-down3.png", "tank-down4.png", "tank-down5.png", "tank-down6.png", "tank-down7.png"]
		},
		enemySrc: {
			monster: {
				left: ["monster-left-0.png", "monster-left-1.png", "monster-left-2.png", "monster-left-3.png", "monster-left-4.png", "monster-left-5.png",
					"monster-left-6.png", "monster-left-7.png", "monster-left-8.png", "monster-left-9.png", "monster-left-10.png", "monster-left-11.png",
					"monster-left-12.png"
				],
				right: ["monster-right-0.png", "monster-right-1.png", "monster-right-2.png", "monster-right-3.png", "monster-right-4.png", "monster-right-5.png",
					"monster-right-6.png", "monster-right-7.png", "monster-right-8.png", "monster-right-9.png", "monster-right-10.png", "monster-right-11.png",
					"monster-right-12.png"
				],
			},
			monster2: {
				left: ["monster2-left-0.png", "monster2-left-1.png", "monster2-left-2.png"],
				right: ["monster2-right-0.png", "monster2-right-1.png", "monster2-right-2.png"],
				up: ["monster2-up-0.png", "monster2-up-1.png", "monster2-up-2.png"],
				down: ["monster2-down-0.png", "monster2-down-1.png", "monster2-down-2.png"]
			},
			monster4: {
				left: ["monster4-left-0.png", "monster4-left-1.png", "monster4-left-2.png", "monster4-left-3.png"],
				right: ["monster4-right-0.png", "monster4-right-1.png", "monster4-right-2.png", "monster4-right-3.png"],
				up: ["monster4-up-0.png", "monster4-up-1.png", "monster4-up-2.png", "monster4-up-3.png"],
				down: ["monster4-down-0.png", "monster4-down-1.png", "monster4-down-2.png", "monster4-down-3.png"]
			},
			monster5: {
				left: ["monster5-left-0.png", "monster5-left-1.png", "monster5-left-2.png"],
				right: ["monster5-right-0.png", "monster5-right-1.png", "monster5-right-2.png"],
				up: ["monster5-up-0.png", "monster5-up-1.png", "monster5-up-2.png"],
				down: ["monster5-down-0.png", "monster5-down-1.png", "monster5-down-2.png"]
			},
			tank: {
				left: ["tank-left-0.png", "tank-left-1.png", "tank-left-2.png", "tank-left-3.png", "tank-left-4.png", "tank-left-5.png", "tank-left-6.png",
					"tank-left-7.png"
				],
				right: ["tank-right-0.png", "tank-right-1.png", "tank-right-2.png", "tank-right-3.png", "tank-right-4.png", "tank-right-5.png", "tank-right-6.png",
					"tank-right-7.png"
				],
				up: ["tank-up-0.png", "tank-up-1.png", "tank-up-2.png", "tank-up-3.png", "tank-up-4.png", "tank-up-5.png", "tank-up-6.png", "tank-up-7.png"],
				down: ["tank-down-0.png", "tank-down-1.png", "tank-down-2.png", "tank-down-3.png", "tank-down-4.png", "tank-down-5.png", "tank-down-6.png",
					"tank-down-7.png"
				]
			}
		},
		occurrences: {
			explosion: ["explosions-0.gif", "explosions-1.gif", "explosions-2.gif", "explosions-3.gif", "explosions-4.gif", "explosions-5.gif"],
			largeExplosion: ["large_explosion-0.png", "large_explosion-1.png", "large_explosion-2.png", "large_explosion-3.png", "large_explosion-4.png",
				"large_explosion-5.png", "large_explosion-6.png", "large_explosion-7.png", "large_explosion-8.png", "large_explosion-9.png", "large_explosion-10.png",
				"large_explosion-11.png", "large_explosion-12.png", "large_explosion-13.png", "large_explosion-14.png"
			],
			smoke: ["smokey-0.png", "smokey-1.png", "smokey-2.png", "smokey-3.png", "smokey-4.png", "smokey-5.png", "smokey-6.png", "smokey-7.png", "smokey-8.png",
				"smokey-9.png", "smokey-10.png", "smokey-11.png", "smokey-12.png",
				"smokey-13.png", "smokey-14.png", "smokey-15.png", "smokey-16.png", "smokey-17.png", "smokey-18.png", "smokey-19.png", "smokey-20.png", "smokey-21.png",
				"smokey-22.png", "smokey-23.png", "smokey-24.png", "smokey-25.png", "smokey-26.png", "smokey-27.png", "smokey-28.png", "smokey-29.png", "smokey-30.png",
				"smokey-31.png", "smokey-32.png", "smokey-33.png", "smokey-34.png", "smokey-35.png",
				"smokey-36.png", "smokey-37.png", "smokey-38.png", "smokey-39.png", "smokey-40.png", "smokey-41.png", "smokey-42.png", "smokey-43.png", "smokey-44.png",
				"smokey-45.png"
			],
			shield: ["shield-0.png", "shield-1.png", "shield-2.png", "shield-3.png", "shield-4.png", "shield-5.png", "shield-6.png", "shield-7.png", "shield-8.png",
				"shield-9.png", "shield-10.png"
			]
		}
	};
}

function rawGameMapData() {
	return `555555555599999555555555555555555555555555559999999
S00500030599999500400006000000005000000000559999999
500500000599955500400006000000005000000000055999999
500000000599950000400006660005555000000000025555999
500000000555550000400000000004025000000000000005555
500500000040000005550000000004005000000000000000005
500000000060000005955550000005000000000000000000005
500000000040000005550040000005000000000050000000005
500500000050000000000040000005000005555550000000005
500000000050000000000040000005000005950000000000005
500000000050000600000040555665000005550000000000005
50E000000555000600000555500005555000000000000000005
555000000595550000000004000005200000000000000000005
995250000599950000000004000005000000000000000000005
555555555599955555555555555555555555505555555544555
500550000555555000000000000500505002555040000000005
500550000500004000000000000500000000004040000000005
500000000500004000000000000500000000004050000000035
500000000500555500000020000500000060005550000000555
500000000550599555500000000000000060055955555555599
500000000000559999500000000000000060059999999999999
500000000000059995500000005555000000059999999999999
555550000000059955000005555995000005559999999999999
522050000000055550000005999995500000599999999999999
50005000000000040000000599999950000E555599999999999
555455500000000400000005999995500000000599999995555
500050500000000500000005599555000000000555599995205
500350000000000555000000559500000000000000595555205
545550000000000424000000055500000000000000555005545
5050005555000005550055E0000000000000000000000005005
505000500500000400005000000000050005000000000005005
505555500550055555505005000000555055500000000000005
505005000050059999555555050000555055500005000000005
500005000050059999999530050000555555500005000000005
500005000E55559955555550055566555555566555550000005
500555000000055950559955550000055555000005000000E05
500000000000005550599999500000055555000005000005505
500000000000000000599989500000005550000000000005505
500000055500000000599599500000000500000000005000005
500000000500500000555559500000000400000000005000005
500000000555500000000005500000000400000000555550005
50000000000400000505550E000000500500000000005000005
500050000004000005050505000000555555500000005000005
555050000005000005550505000000000000500000000055505
525050050005000005050005555000000000500000000005505
505055055555005555055505005550000000550000000000005
5E5005550005445005000005000000055500040000020000005
500000000000000005000505000000059550040000000000005
500000000000030004000505000000059955040000000000005
500000000000000005455545000500059995540000000000005
500000000000005555050000000000059999550000000005505
500555000000005950050000000000059999955005445545505
545500000000005955000000000000059999995505000500005
500500000200005995000005000000059999999555000500005
500500000000005995550005550000055555555500000500005
555500000000205995950000055550000000300550000500005
500555000000005995955550050000000000000055500500055
500005000000005999950050050000000000000000000500059
555504000000005999950055550000055000000000000400559
999555000000555999950040040000005000000020000500599
5C5555000000005999953240040000005550000000005555599
500005000055505999954040040500005060000000005999999
555555555559555999950050050500005250000000005999999
999999999999999999955555555555555555555555555999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999999`;
}

// type, spriteCounter, numberOfSprites, x, y, pattern, patternPrototype, hp, speed, walkCounter, status

function initEnemies() {
	gState.enemies[0] = new Enemy(
		"monster2", 0, 2, 9 * 50, 5 * 50,
		createFiPattern({
			direction: "down",
			moves: 2
		}, {
			direction: "up",
			moves: 2
		}),
		createFiPattern({
			direction: "down",
			moves: 2
		}, {
			direction: "up",
			moves: 2
		}),
		1, 1, 0, true, 0);

	gState.enemies[1] = new Enemy(
		"monster2", 0, 2, 250, 500,
		createFiPattern({
			direction: "up",
			moves: 2
		}, {
			direction: "down",
			moves: 2
		}),
		createFiPattern({
			direction: "up",
			moves: 2
		}, {
			direction: "down",
			moves: 2
		}),
		1, 1, 0, true, 0);

	gState.enemies[2] = new Enemy(
		"monster2", 0, 2, 800, 600,
		createFiPattern({
			direction: "right",
			moves: 5
		}, {
			direction: "left",
			moves: 5
		}),
		createFiPattern({
			direction: "right",
			moves: 3
		}, {
			direction: "left",
			moves: 3
		}),
		1, 1, 0, true, 0);

	gState.enemies[3] = new Enemy(
		"monster2", 0, 2, 1250, 600,
		createFiPattern({
			direction: "right",
			moves: 3
		}, {
			direction: "left",
			moves: 3
		}),
		createFiPattern({
			direction: "right",
			moves: 3
		}, {
			direction: "left",
			moves: 3
		}),
		1, 2, 0, true, 0);

	gState.enemies[4] = new Enemy(
		"monster2", 0, 2, 1200, 250,
		createFiPattern({
			direction: "right",
			moves: 3
		}, {
			direction: "left",
			moves: 3
		}),
		createFiPattern({
			direction: "right",
			moves: 3
		}, {
			direction: "left",
			moves: 3
		}),
		1, 2, 0, true, 0);

	gState.enemies[5] = new Enemy(
		"tank", 0, 7, 1950, 750,
		createFiPattern({
			direction: "down",
			moves: 2
		}, {
			direction: "up",
			moves: 2
		}),
		createFiPattern({
			direction: "down",
			moves: 2
		}, {
			direction: "up",
			moves: 2
		}),
		2, 2, 0, true, 0);

	gState.enemies[6] = new Enemy(
		"monster2", 0, 2, 1100, 600,
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		1, 2, 0, true, 0);

	gState.enemies[7] = new Enemy(
		"monster2", 0, 2, 1400, 200,
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		1, 2, 0, true, 0);

	gState.enemies[8] = new Enemy(
		"monster4", 0, 3, 650, 600,
		createFiPattern({
			direction: "up",
			moves: 2
		}, {
			direction: "down",
			moves: 2
		}),
		createFiPattern({
			direction: "up",
			moves: 2
		}, {
			direction: "down",
			moves: 2
		}),
		1, 1, 0, true, 0);

	gState.enemies[9] = new Enemy(
		"monster5", 0, 2, 14 * 50, 4 * 50,
		createFiPattern({
			direction: "down",
			moves: 3
		}, {
			direction: "up",
			moves: 3
		}),
		createFiPattern({
			direction: "down",
			moves: 3
		}, {
			direction: "up",
			moves: 3
		}),
		1, 1, 0, true, 0);

	gState.enemies[10] = new Enemy(
		"tank", 0, 7, 1700, 700,
		createFiPattern({
			direction: "up",
			moves: 2
		}, {
			direction: "down",
			moves: 2
		}),
		createFiPattern({
			direction: "up",
			moves: 2
		}, {
			direction: "down",
			moves: 2
		}),
		2, 2, 0, true, 0);

	gState.enemies[11] = new Enemy(
		"monster2", 0, 2, 36 * 50, 26 * 50,
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[12] = new Enemy(
		"monster2", 0, 2, 36 * 50, 27 * 50,
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		2, 1, 0, true, 0);

	gState.enemies[13] = new Enemy(
		"monster5", 0, 2, 24 * 50, 16 * 50,
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		2, 1, 0, true, 0);

	gState.enemies[14] = new Enemy(
		"monster4", 0, 2, 29 * 50, 31 * 50,
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[15] = new Enemy(
		"monster5", 0, 2, 19 * 50, 2 * 50,
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[16] = new Enemy(
		"monster5", 0, 2, 22 * 50, 2 * 50,
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[17] = new Enemy(
		"monster5", 0, 2, 73 * 50, 26 * 50,
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[18] = new Enemy(
		"monster5", 0, 2, 48 * 50, 46 * 50,
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[19] = new Enemy(
		"monster5", 0, 2, 48 * 50, 55 * 50,
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		createFiPattern({
			direction: "down",
			moves: 1
		}, {
			direction: "up",
			moves: 1
		}),
		2, 1, 0, true, 0);

	gState.enemies[20] = new Enemy(
		"monster5", 0, 2, 22 * 50, 32 * 50,
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[21] = new Enemy(
		"monster5", 0, 2, 22 * 50, 42 * 50,
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		createFiPattern({
			direction: "left",
			moves: 1
		}, {
			direction: "right",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[22] = new Enemy(
		"monster2", 0, 2, 33 * 50, 29 * 50,
		createFiPattern({
			direction: "up",
			moves: 1
		}, {
			direction: "down",
			moves: 1
		}),
		createFiPattern({
			direction: "up",
			moves: 1
		}, {
			direction: "down",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[23] = new Enemy(
		"monster2", 0, 2, 31 * 50, 27 * 50,
		createFiPattern({
			direction: "up",
			moves: 1
		}, {
			direction: "down",
			moves: 1
		}),
		createFiPattern({
			direction: "up",
			moves: 1
		}, {
			direction: "down",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[24] = new Enemy(
		"monster", 0, 12, 25 * 50, 8 * 50,
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		2, 1, 0, true, 0);

	gState.enemies[25] = new Enemy(
		"monster", 0, 12, 24 * 50, 45 * 50,
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		2, 1, 0, true, 0);

	gState.enemies[26] = new Enemy(
		"tank", 0, 7, 24 * 50, 65 * 50,
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[27] = new Enemy(
		"monster5", 0, 2, 34 * 50, 65 * 50,
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[28] = new Enemy(
		"monster4", 0, 3, 34 * 50, 70 * 50,
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[29] = new Enemy(
		"monster4", 0, 3, 44 * 50, 73 * 50,
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[30] = new Enemy(
		"monster5", 0, 2, 14 * 50, 63 * 50,
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[31] = new Enemy(
		"monster5", 0, 2, 6 * 50, 53 * 50,
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		2, 2, 0, true, 0);

	gState.enemies[32] = new Enemy(
		"tank", 0, 7, 7 * 50, 58 * 50,
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		1, 2, 0, true, 0);

	gState.enemies[33] = new Enemy(
		"monster4", 0, 3, 20 * 50, 55 * 50,
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		createFiPattern({
			direction: "right",
			moves: 1
		}, {
			direction: "left",
			moves: 1
		}),
		2, 1, 0, true, 0);

	gState.enemies[34] = new Enemy(
		"monster", 0, 12, 46 * 50, 56 * 50,
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		2, 2, 0, true, 0);

	gState.enemies[35] = new Enemy(
		"monster", 0, 12, 41 * 50, 58 * 50,
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		2, 2, 0, true, 0);

	gState.enemies[36] = new Enemy(
		"monster", 0, 12, 44 * 50, 57 * 50,
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		2, 2, 0, true, 0);

	gState.enemies[37] = new Enemy(
		"monster", 0, 12, 6 * 50, 58 * 50,
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		2, 2, 0, true, 0);

	gState.enemies[38] = new Enemy(
		"monster", 0, 12, 3 * 50, 49 * 50,
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		2, 2, 0, true, 0);

	gState.enemies[39] = new Enemy(
		"monster", 0, 12, 2 * 50, 48 * 50,
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		createFiPattern({
			direction: "right",
			moves: 2
		}, {
			direction: "left",
			moves: 2
		}),
		2, 2, 0, true, 0);
}
