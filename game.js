const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("coin-count");
const livesEl = document.getElementById("lives-count");
const stageEl = document.getElementById("stage-text");
const statusEl = document.getElementById("status-text");

const GROUND_Y = 470;
const GRAVITY = 0.55;
const MOVE_SPEED = 4.2;
const JUMP_SPEED = -12.5;
const FRICTION = 0.82;
const BASE_PLAYER_WIDTH = 36;
const BASE_PLAYER_HEIGHT = 56;
const POWERED_PLAYER_WIDTH = 42;
const POWERED_PLAYER_HEIGHT = 76;

const POINTS = {
  coin: 100,
  bonusBlockCoin: 150,
  stompEnemy: 200,
  mushroom: 500,
  extraMushroom: 200,
  finishStage: 1000,
  finishGame: 2000
};

const keys = new Set();

function createStageOne() {
  return {
    name: "1",
    worldWidth: 3200,
    platforms: [
      { x: 0, y: GROUND_Y, width: 3200, height: 70, type: "ground" },
      { x: 260, y: 370, width: 110, height: 22, type: "brick" },
      { x: 430, y: 320, width: 120, height: 22, type: "brick" },
      { x: 650, y: 280, width: 120, height: 22, type: "brick" },
      { x: 860, y: 360, width: 150, height: 22, type: "brick" },
      { x: 1130, y: 300, width: 130, height: 22, type: "brick" },
      { x: 1360, y: 248, width: 120, height: 22, type: "brick" },
      { x: 1610, y: 332, width: 130, height: 22, type: "brick" },
      { x: 1850, y: 286, width: 110, height: 22, type: "brick" },
      { x: 2060, y: 246, width: 160, height: 22, type: "brick" },
      { x: 2330, y: 348, width: 150, height: 22, type: "brick" },
      { x: 2580, y: 300, width: 170, height: 22, type: "brick" }
    ],
    blocks: [
      { x: 320, y: 250, width: 34, height: 34, type: "question", used: false, contains: "mushroom" },
      { x: 1185, y: 190, width: 34, height: 34, type: "question", used: false, contains: "mushroom" },
      { x: 2145, y: 150, width: 34, height: 34, type: "question", used: false, contains: "coin" }
    ],
    gaps: [
      { x: 540, width: 80 },
      { x: 1490, width: 95 },
      { x: 2830, width: 90 }
    ],
    coins: [
      { x: 292, y: 330, collected: false },
      { x: 334, y: 330, collected: false },
      { x: 460, y: 280, collected: false },
      { x: 510, y: 280, collected: false },
      { x: 680, y: 240, collected: false },
      { x: 730, y: 240, collected: false },
      { x: 900, y: 320, collected: false },
      { x: 970, y: 320, collected: false },
      { x: 1160, y: 260, collected: false },
      { x: 1220, y: 260, collected: false },
      { x: 1390, y: 208, collected: false },
      { x: 1440, y: 208, collected: false },
      { x: 1650, y: 292, collected: false },
      { x: 1700, y: 292, collected: false },
      { x: 1880, y: 246, collected: false },
      { x: 2100, y: 206, collected: false },
      { x: 2170, y: 206, collected: false },
      { x: 2370, y: 308, collected: false },
      { x: 2440, y: 308, collected: false },
      { x: 2620, y: 260, collected: false },
      { x: 2685, y: 260, collected: false }
    ],
    enemies: [
      { x: 760, y: GROUND_Y - 34, width: 34, height: 34, minX: 690, maxX: 980, dir: 1, speed: 1.35 },
      { x: 1270, y: GROUND_Y - 34, width: 34, height: 34, minX: 1070, maxX: 1410, dir: -1, speed: 1.45 },
      { x: 1980, y: GROUND_Y - 34, width: 34, height: 34, minX: 1830, maxX: 2250, dir: 1, speed: 1.85 },
      { x: 2740, y: GROUND_Y - 34, width: 34, height: 34, minX: 2520, maxX: 2810, dir: -1, speed: 1.55 }
    ],
    mushrooms: [],
    flag: { x: 3030, y: 170, width: 18, height: 300 }
  };
}

function createStageTwo() {
  return {
    name: "2",
    worldWidth: 3800,
    platforms: [
      { x: 0, y: GROUND_Y, width: 3800, height: 70, type: "ground" },
      { x: 220, y: 380, width: 100, height: 22, type: "brick" },
      { x: 390, y: 320, width: 90, height: 22, type: "brick" },
      { x: 560, y: 265, width: 80, height: 22, type: "brick" },
      { x: 760, y: 230, width: 90, height: 22, type: "brick" },
      { x: 930, y: 318, width: 86, height: 22, type: "brick" },
      { x: 1095, y: 268, width: 82, height: 22, type: "brick" },
      { x: 1275, y: 218, width: 82, height: 22, type: "brick" },
      { x: 1490, y: 360, width: 110, height: 22, type: "brick" },
      { x: 1685, y: 310, width: 100, height: 22, type: "brick" },
      { x: 1875, y: 250, width: 90, height: 22, type: "brick" },
      { x: 2080, y: 205, width: 90, height: 22, type: "brick" },
      { x: 2310, y: 340, width: 120, height: 22, type: "brick" },
      { x: 2485, y: 285, width: 90, height: 22, type: "brick" },
      { x: 2675, y: 240, width: 90, height: 22, type: "brick" },
      { x: 2870, y: 200, width: 88, height: 22, type: "brick" },
      { x: 3085, y: 345, width: 120, height: 22, type: "brick" },
      { x: 3290, y: 285, width: 100, height: 22, type: "brick" }
    ],
    blocks: [
      { x: 600, y: 170, width: 34, height: 34, type: "question", used: false, contains: "mushroom" },
      { x: 1730, y: 220, width: 34, height: 34, type: "question", used: false, contains: "coin" },
      { x: 2710, y: 170, width: 34, height: 34, type: "question", used: false, contains: "mushroom" },
      { x: 3340, y: 215, width: 34, height: 34, type: "question", used: false, contains: "coin" }
    ],
    gaps: [
      { x: 470, width: 130 },
      { x: 880, width: 115 },
      { x: 1395, width: 135 },
      { x: 2210, width: 150 },
      { x: 2985, width: 125 },
      { x: 3525, width: 120 }
    ],
    coins: [
      { x: 240, y: 340, collected: false },
      { x: 430, y: 280, collected: false },
      { x: 590, y: 225, collected: false },
      { x: 790, y: 190, collected: false },
      { x: 955, y: 278, collected: false },
      { x: 1120, y: 228, collected: false },
      { x: 1300, y: 178, collected: false },
      { x: 1518, y: 320, collected: false },
      { x: 1710, y: 270, collected: false },
      { x: 1900, y: 210, collected: false },
      { x: 2105, y: 165, collected: false },
      { x: 2340, y: 300, collected: false },
      { x: 2510, y: 245, collected: false },
      { x: 2700, y: 200, collected: false },
      { x: 2895, y: 160, collected: false },
      { x: 3120, y: 305, collected: false },
      { x: 3330, y: 245, collected: false }
    ],
    enemies: [
      { x: 340, y: GROUND_Y - 34, width: 34, height: 34, minX: 40, maxX: 450, dir: 1, speed: 1.55 },
      { x: 715, y: GROUND_Y - 34, width: 34, height: 34, minX: 615, maxX: 870, dir: -1, speed: 1.95 },
      { x: 1185, y: GROUND_Y - 34, width: 34, height: 34, minX: 1010, maxX: 1390, dir: 1, speed: 2.05 },
      { x: 1805, y: GROUND_Y - 34, width: 34, height: 34, minX: 1570, maxX: 2200, dir: -1, speed: 2.2 },
      { x: 2580, y: GROUND_Y - 34, width: 34, height: 34, minX: 2380, maxX: 2980, dir: 1, speed: 2.25 },
      { x: 3420, y: GROUND_Y - 34, width: 34, height: 34, minX: 3110, maxX: 3510, dir: -1, speed: 2.4 }
    ],
    mushrooms: [],
    flag: { x: 3630, y: 150, width: 18, height: 320 }
  };
}

const stages = [createStageOne, createStageTwo];

function createPlayer() {
  return {
    x: 90,
    y: GROUND_Y - BASE_PLAYER_HEIGHT,
    width: BASE_PLAYER_WIDTH,
    height: BASE_PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    onGround: false,
    lives: 3,
    score: 0,
    invulnerableTimer: 0,
    powered: false,
    win: false
  };
}

let player = createPlayer();
let stageIndex = 0;
let level = stages[stageIndex]();
let cameraX = 0;
let messageTimer = 0;
let restartTimer = 0;
let transitionTimer = 0;

function getSolidPlatforms() {
  return [...level.platforms, ...level.blocks];
}

function setPlayerPower(powered) {
  const nextWidth = powered ? POWERED_PLAYER_WIDTH : BASE_PLAYER_WIDTH;
  const nextHeight = powered ? POWERED_PLAYER_HEIGHT : BASE_PLAYER_HEIGHT;
  const footY = player.y + player.height;

  player.powered = powered;
  player.width = nextWidth;
  player.height = nextHeight;
  player.y = footY - player.height;
}

function addScore(points) {
  player.score += points;
  syncHud();
}

function spawnMushroom(block) {
  level.mushrooms.push({
    x: block.x + (block.width - 30) * 0.5,
    y: block.y - 30,
    width: 30,
    height: 30,
    vx: 1.7,
    vy: 0,
    active: true
  });
}

function loadStage(index, keepStats = true) {
  const prevStats = {
    lives: player.lives,
    score: player.score,
    powered: player.powered
  };

  stageIndex = index;
  level = stages[stageIndex]();
  cameraX = 0;
  restartTimer = 0;
  transitionTimer = 0;
  messageTimer = 0;

  player.x = 90;
  player.y = GROUND_Y - BASE_PLAYER_HEIGHT;
  player.width = BASE_PLAYER_WIDTH;
  player.height = BASE_PLAYER_HEIGHT;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.invulnerableTimer = 0;
  player.win = false;
  player.powered = false;

  if (!keepStats) {
    player.lives = 3;
    player.score = 0;
  } else {
    player.lives = prevStats.lives;
    player.score = prevStats.score;
    if (prevStats.powered) {
      setPlayerPower(true);
    }
  }

  statusEl.textContent = stageIndex === 0 ? "Running" : `Stage ${level.name}`;
  syncHud();
}

function restartGame() {
  player = createPlayer();
  loadStage(0, false);
}

function resetStageAfterHit() {
  const savedLives = player.lives;
  const savedScore = player.score;
  loadStage(stageIndex, false);
  player.lives = savedLives;
  player.score = savedScore;
  player.invulnerableTimer = 120;
  syncHud();
}

function respawn() {
  player.lives -= 1;
  syncHud();

  if (player.lives <= 0) {
    player.lives = 0;
    player.vx = 0;
    player.vy = 0;
    statusEl.textContent = "Game Over";
    messageTimer = 220;
    restartTimer = 220;
    syncHud();
    return;
  }

  resetStageAfterHit();
  statusEl.textContent = "Ouch!";
  messageTimer = 90;
}

function syncHud() {
  scoreEl.textContent = player.score;
  livesEl.textContent = player.lives;
  stageEl.textContent = level.name;
}

function isSolidGroundAt(x) {
  if (x < 0 || x > level.worldWidth) {
    return false;
  }

  for (const gap of level.gaps) {
    if (x >= gap.x && x <= gap.x + gap.width) {
      return false;
    }
  }

  return true;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function resolveHorizontalCollisions(prevX) {
  for (const platform of getSolidPlatforms()) {
    if (platform.type === "ground") {
      continue;
    }

    const overlapsVertically =
      player.y + player.height > platform.y &&
      player.y < platform.y + platform.height;

    if (!overlapsVertically) {
      continue;
    }

    const movedIntoRightSide =
      player.vx > 0 &&
      prevX + player.width <= platform.x &&
      player.x + player.width > platform.x;

    const movedIntoLeftSide =
      player.vx < 0 &&
      prevX >= platform.x + platform.width &&
      player.x < platform.x + platform.width;

    if (movedIntoRightSide) {
      player.x = platform.x - player.width;
      player.vx = 0;
    } else if (movedIntoLeftSide) {
      player.x = platform.x + platform.width;
      player.vx = 0;
    }
  }
}

function resolveVerticalCollisions(prevY) {
  player.onGround = false;

  if (player.vy >= 0 && isSolidGroundAt(player.x + player.width * 0.5) && player.y + player.height >= GROUND_Y) {
    player.y = GROUND_Y - player.height;
    player.vy = 0;
    player.onGround = true;
  }

  for (const platform of getSolidPlatforms()) {
    if (platform.type === "ground") {
      continue;
    }

    const overlapsHorizontally =
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width;

    if (!overlapsHorizontally) {
      continue;
    }

    const fallingThroughTop =
      player.vy >= 0 &&
      prevY + player.height <= platform.y &&
      player.y + player.height >= platform.y;

    const jumpingIntoBottom =
      player.vy < 0 &&
      prevY >= platform.y + platform.height &&
      player.y <= platform.y + platform.height;

    if (fallingThroughTop) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.onGround = true;
    } else if (jumpingIntoBottom) {
      player.y = platform.y + platform.height;
      player.vy = 0;
      if (platform.type === "question" && !platform.used) {
        platform.used = true;
        if (platform.contains === "mushroom") {
          spawnMushroom(platform);
          statusEl.textContent = "Power-Up!";
          messageTimer = Math.max(messageTimer, 90);
        } else if (platform.contains === "coin") {
          addScore(POINTS.bonusBlockCoin);
        }
      }
    }
  }
}

function updatePlayer() {
  if (player.lives <= 0 || player.win || transitionTimer > 0) {
    return;
  }

  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const jump = keys.has("w") || keys.has(" ") || keys.has("arrowup");

  if (left) {
    player.vx -= MOVE_SPEED * 0.25;
  }
  if (right) {
    player.vx += MOVE_SPEED * 0.25;
  }
  if (!left && !right) {
    player.vx *= FRICTION;
  }

  player.vx = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, player.vx));

  if (jump && player.onGround) {
    player.vy = JUMP_SPEED;
    player.onGround = false;
  }

  const prevX = player.x;
  player.vy += GRAVITY;
  player.x += player.vx;
  player.x = Math.max(0, Math.min(level.worldWidth - player.width, player.x));
  resolveHorizontalCollisions(prevX);

  const prevY = player.y;
  player.y += player.vy;
  resolveVerticalCollisions(prevY);

  if (player.y > canvas.height + 160) {
    respawn();
  }

  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer -= 1;
  }

  if (
    player.x + player.width > level.flag.x &&
    player.y + player.height > level.flag.y
  ) {
    if (stageIndex < stages.length - 1) {
      addScore(POINTS.finishStage);
      transitionTimer = 150;
      statusEl.textContent = "Stage Clear";
    } else {
      addScore(POINTS.finishGame);
      player.win = true;
      statusEl.textContent = "You Win";
    }
  }
}

function updateCoins() {
  for (const coin of level.coins) {
    if (coin.collected) {
      continue;
    }

    const coinBox = { x: coin.x - 12, y: coin.y - 12, width: 24, height: 24 };
    if (rectsOverlap(player, coinBox)) {
      coin.collected = true;
      addScore(POINTS.coin);
    }
  }
}

function updateEnemies() {
  if (player.lives <= 0 || player.win || transitionTimer > 0) {
    return;
  }

  for (const enemy of level.enemies) {
    enemy.x += enemy.speed * enemy.dir;
    if (enemy.x < enemy.minX || enemy.x + enemy.width > enemy.maxX) {
      enemy.dir *= -1;
    }

    if (!rectsOverlap(player, enemy)) {
      continue;
    }

    const stomped = player.vy > 2 && player.y + player.height - enemy.y < 20;
    if (stomped) {
      player.vy = -8;
      enemy.x = enemy.minX;
      enemy.dir *= -1;
      addScore(POINTS.stompEnemy);
    } else if (player.invulnerableTimer <= 0) {
      if (player.powered) {
        setPlayerPower(false);
        player.invulnerableTimer = 120;
        statusEl.textContent = "Shrunk";
        messageTimer = 90;
      } else {
        respawn();
      }
    }
  }
}

function updateMushrooms() {
  if (player.lives <= 0 || transitionTimer > 0) {
    return;
  }

  for (const mushroom of level.mushrooms) {
    if (!mushroom.active) {
      continue;
    }

    const prevX = mushroom.x;
    mushroom.x += mushroom.vx;

    for (const platform of getSolidPlatforms()) {
      if (platform.type === "ground") {
        continue;
      }

      const overlapsVertically =
        mushroom.y + mushroom.height > platform.y &&
        mushroom.y < platform.y + platform.height;

      if (!overlapsVertically) {
        continue;
      }

      if (mushroom.vx > 0 && prevX + mushroom.width <= platform.x && mushroom.x + mushroom.width > platform.x) {
        mushroom.x = platform.x - mushroom.width;
        mushroom.vx *= -1;
      } else if (mushroom.vx < 0 && prevX >= platform.x + platform.width && mushroom.x < platform.x + platform.width) {
        mushroom.x = platform.x + platform.width;
        mushroom.vx *= -1;
      }
    }

    const prevY = mushroom.y;
    mushroom.vy += GRAVITY * 0.9;
    mushroom.y += mushroom.vy;

    if (
      mushroom.vy >= 0 &&
      isSolidGroundAt(mushroom.x + mushroom.width * 0.5) &&
      mushroom.y + mushroom.height >= GROUND_Y
    ) {
      mushroom.y = GROUND_Y - mushroom.height;
      mushroom.vy = 0;
    }

    for (const platform of getSolidPlatforms()) {
      if (platform.type === "ground") {
        continue;
      }

      const overlapsHorizontally =
        mushroom.x + mushroom.width > platform.x &&
        mushroom.x < platform.x + platform.width;

      if (!overlapsHorizontally) {
        continue;
      }

      const fallingOnTop =
        mushroom.vy >= 0 &&
        prevY + mushroom.height <= platform.y &&
        mushroom.y + mushroom.height >= platform.y;

      const hittingBottom =
        mushroom.vy < 0 &&
        prevY >= platform.y + platform.height &&
        mushroom.y <= platform.y + platform.height;

      if (fallingOnTop) {
        mushroom.y = platform.y - mushroom.height;
        mushroom.vy = 0;
      } else if (hittingBottom) {
        mushroom.y = platform.y + platform.height;
        mushroom.vy = 0;
      }
    }

    if (rectsOverlap(player, mushroom)) {
      mushroom.active = false;
      if (!player.powered) {
        setPlayerPower(true);
        player.invulnerableTimer = 30;
        statusEl.textContent = "Super";
        messageTimer = 120;
        addScore(POINTS.mushroom);
      } else {
        addScore(POINTS.extraMushroom);
      }
    }

    if (mushroom.y > canvas.height + 160) {
      mushroom.active = false;
    }
  }
}

function updateCamera() {
  const target = player.x - canvas.width * 0.35;
  cameraX += (target - cameraX) * 0.08;
  cameraX = Math.max(0, Math.min(level.worldWidth - canvas.width, cameraX));
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = stageIndex === 0 ? "#8cd8ff" : "#6889d1";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const hillSets =
    stageIndex === 0
      ? [
          { color: "#9ddc73", baseY: 390, bumps: [90, 310, 580, 810] },
          { color: "#75bf55", baseY: 430, bumps: [170, 460, 720, 920] }
        ]
      : [
          { color: "#7a9169", baseY: 380, bumps: [80, 280, 520, 780, 1010] },
          { color: "#556c48", baseY: 430, bumps: [150, 420, 690, 890, 1120] }
        ];

  for (const set of hillSets) {
    ctx.fillStyle = set.color;
    for (const x of set.bumps) {
      ctx.beginPath();
      ctx.arc(x - cameraX * 0.2, set.baseY, 110, Math.PI, 0);
      ctx.fill();
    }
  }

  ctx.fillStyle = stageIndex === 0 ? "rgba(255,255,255,0.92)" : "rgba(240,244,255,0.7)";
  for (let i = 0; i < 6; i += 1) {
    const x = ((i * 210) - cameraX * 0.12) % (canvas.width + 180);
    const wrappedX = x < -120 ? x + canvas.width + 200 : x;
    drawCloud(wrappedX, 88 + (i % 2) * 48);
  }
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.arc(x + 26, y - 12, 20, 0, Math.PI * 2);
  ctx.arc(x + 52, y, 24, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms() {
  for (const platform of level.platforms) {
    const x = platform.x - cameraX;
    if (x + platform.width < -40 || x > canvas.width + 40) {
      continue;
    }

    if (platform.type === "ground") {
      ctx.fillStyle = stageIndex === 0 ? "#53a53c" : "#49663d";
      ctx.fillRect(x, platform.y - 10, platform.width, 14);
      ctx.fillStyle = stageIndex === 0 ? "#8e592b" : "#5b4330";
      ctx.fillRect(x, platform.y, platform.width, platform.height);
      continue;
    }

    ctx.fillStyle = stageIndex === 0 ? "#c96532" : "#8b4f39";
    ctx.fillRect(x, platform.y, platform.width, platform.height);
    ctx.strokeStyle = stageIndex === 0 ? "#8b3c1c" : "#523026";
    ctx.lineWidth = 2;
    for (let brickX = x; brickX < x + platform.width; brickX += 30) {
      ctx.strokeRect(brickX, platform.y, 30, platform.height);
    }
  }
}

function drawBlocks() {
  for (const block of level.blocks) {
    const x = block.x - cameraX;
    if (x + block.width < -40 || x > canvas.width + 40) {
      continue;
    }

    ctx.fillStyle = block.used ? "#8c7251" : stageIndex === 0 ? "#f0c348" : "#d0a035";
    ctx.fillRect(x, block.y, block.width, block.height);
    ctx.strokeStyle = block.used ? "#64523a" : "#866014";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, block.y, block.width, block.height);

    if (!block.used) {
      ctx.fillStyle = "#fff5d6";
      ctx.font = "bold 24px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("?", x + block.width / 2, block.y + 25);
    }
  }
}

function drawGaps() {
  ctx.fillStyle = stageIndex === 0 ? "#2a4f89" : "#1d274c";
  for (const gap of level.gaps) {
    ctx.fillRect(gap.x - cameraX, GROUND_Y, gap.width, canvas.height - GROUND_Y);
  }
}

function drawCoins() {
  for (const coin of level.coins) {
    if (coin.collected) {
      continue;
    }

    const pulse = Math.sin((performance.now() + coin.x) * 0.008) * 2;
    const x = coin.x - cameraX;
    const y = coin.y + pulse;

    ctx.fillStyle = "#ffd447";
    ctx.beginPath();
    ctx.ellipse(x, y, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c77922";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawMushrooms() {
  for (const mushroom of level.mushrooms) {
    if (!mushroom.active) {
      continue;
    }

    const x = mushroom.x - cameraX;
    const y = mushroom.y;

    ctx.fillStyle = "#da4933";
    ctx.beginPath();
    ctx.arc(x + 15, y + 12, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#fff2e0";
    ctx.fillRect(x + 4, y + 12, 22, 16);
    ctx.fillStyle = "#fff7f4";
    ctx.beginPath();
    ctx.arc(x + 9, y + 10, 3, 0, Math.PI * 2);
    ctx.arc(x + 21, y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1c1c";
    ctx.fillRect(x + 8, y + 18, 3, 5);
    ctx.fillRect(x + 19, y + 18, 3, 5);
  }
}

function drawEnemies() {
  for (const enemy of level.enemies) {
    const x = enemy.x - cameraX;
    const y = enemy.y;

    ctx.fillStyle = stageIndex === 0 ? "#8b5528" : "#6d3325";
    ctx.fillRect(x, y + 8, enemy.width, enemy.height - 8);
    ctx.fillStyle = "#f3ddb0";
    ctx.fillRect(x + 4, y, enemy.width - 8, 12);
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(x + 7, y + 16, 6, 6);
    ctx.fillRect(x + 21, y + 16, 6, 6);
  }
}

function drawFlag() {
  const x = level.flag.x - cameraX;
  ctx.fillStyle = "#f6f2ea";
  ctx.fillRect(x, level.flag.y, level.flag.width, level.flag.height);

  ctx.fillStyle = stageIndex === 0 ? "#ff5f5f" : "#ffd447";
  ctx.beginPath();
  ctx.moveTo(x + level.flag.width, level.flag.y + 20);
  ctx.lineTo(x + level.flag.width + 68, level.flag.y + 42);
  ctx.lineTo(x + level.flag.width, level.flag.y + 64);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  const flash = player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 8) % 2 === 0;
  if (flash) {
    return;
  }

  const x = player.x - cameraX;
  const y = player.y;

  if (player.powered) {
    ctx.fillStyle = "#cc3f2c";
    ctx.fillRect(x + 7, y, 28, 16);
    ctx.fillStyle = "#f1c58e";
    ctx.fillRect(x + 9, y + 16, 24, 22);
    ctx.fillStyle = "#1d5fbf";
    ctx.fillRect(x + 7, y + 38, 28, 30);
    ctx.fillStyle = "#5f2f13";
    ctx.fillRect(x + 6, y + 71, 11, 3);
    ctx.fillRect(x + 25, y + 71, 11, 3);
  } else {
    ctx.fillStyle = "#cc3f2c";
    ctx.fillRect(x + 6, y, 24, 14);
    ctx.fillStyle = "#f1c58e";
    ctx.fillRect(x + 8, y + 14, 20, 18);
    ctx.fillStyle = "#1d5fbf";
    ctx.fillRect(x + 5, y + 32, 26, 24);
    ctx.fillStyle = "#5f2f13";
    ctx.fillRect(x + 4, y + 53, 10, 3);
    ctx.fillRect(x + 22, y + 53, 10, 3);
  }
}

function drawOverlay() {
  if (player.lives > 0 && !player.win && messageTimer <= 0 && transitionTimer <= 0 && restartTimer <= 0) {
    return;
  }

  ctx.fillStyle = "rgba(11, 25, 39, 0.4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#fff5d6";
  ctx.textAlign = "center";
  ctx.font = "bold 42px Trebuchet MS";

  if (player.win) {
    ctx.fillText("You Beat Both Stages!", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "22px Trebuchet MS";
    ctx.fillText("Press R to restart the adventure", canvas.width / 2, canvas.height / 2 + 34);
    return;
  }

  if (restartTimer > 0 && player.lives <= 0) {
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "22px Trebuchet MS";
    ctx.fillText("Restarting from Stage 1...", canvas.width / 2, canvas.height / 2 + 34);
    return;
  }

  if (transitionTimer > 0) {
    ctx.fillText("Stage Clear!", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "22px Trebuchet MS";
    ctx.fillText("Get ready for Stage 2", canvas.width / 2, canvas.height / 2 + 34);
    return;
  }

  ctx.fillText("Watch out!", canvas.width / 2, canvas.height / 2);
}

function updateTimers() {
  if (messageTimer > 0) {
    messageTimer -= 1;
    if (messageTimer === 0 && player.lives > 0 && !player.win && transitionTimer <= 0) {
      statusEl.textContent = "Running";
    }
  }

  if (restartTimer > 0) {
    restartTimer -= 1;
    if (restartTimer === 0) {
      restartGame();
    }
  }

  if (transitionTimer > 0) {
    transitionTimer -= 1;
    if (transitionTimer === 0) {
      loadStage(stageIndex + 1, true);
    }
  }
}

function loop() {
  updatePlayer();
  updateCoins();
  updateEnemies();
  updateMushrooms();
  updateCamera();

  drawBackground();
  drawPlatforms();
  drawBlocks();
  drawGaps();
  drawCoins();
  drawMushrooms();
  drawEnemies();
  drawFlag();
  drawPlayer();
  drawOverlay();

  updateTimers();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);

  if ([" ", "arrowup", "arrowleft", "arrowright"].includes(key)) {
    event.preventDefault();
  }

  if (key === "r") {
    restartGame();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

restartGame();
loop();
