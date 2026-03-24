// Enemy class - extends Entity
var Enemy = (function() {
  'use strict';

  function Enemy(x, y, data, enemyId) {
    Entity.call(this, x, y, data.char, data.color, data.name);
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.attack = data.attack;
    this.defense = data.defense;
    this.exp = data.exp;
    this.speed = 1;
    this.dead = false;
    this.confused = 0;
    this.special = data.special || null;
    this.enemyId = enemyId || null;
    this._turnCount = 0; // for skull_mage floor-fire timing
  }

  Enemy.prototype = Object.create(Entity.prototype);
  Enemy.prototype.constructor = Enemy;

  Enemy.prototype.takeDamage = function(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      return true;
    }
    return false;
  };

  // Override canMoveTo for wallpass enemies
  Enemy.prototype._canMoveToTileRaw = function(x, y, game) {
    if (x < 0 || x >= game.dungeon.width || y < 0 || y >= game.dungeon.height) return false;
    // Wallpass enemies can move through walls
    if (this.special === 'wallpass') {
      // Can move anywhere that isn't out of bounds
      // But check for other enemies
      for (var i = 0; i < game.enemies.length; i++) {
        var e = game.enemies[i];
        if (e !== this && !e.dead && e.x === x && e.y === y) return false;
      }
      return true;
    }
    return this._canMoveToTile(x, y, game);
  };

  Enemy.prototype.act = function(game) {
    if (this.dead) return;
    this._turnCount++;

    if (this.confused > 0) {
      this.confused--;
      this._moveRandom(game);
      return;
    }

    var player = game.player;
    var dx = player.x - this.x;
    var dy = player.y - this.y;
    var dist = Math.abs(dx) + Math.abs(dy);

    // --- Special abilities ---

    // Skull Dragon: floor-wide fire every 3 turns
    if (this.special === 'floorfire') {
      if (this._turnCount % 3 === 0) {
        var fireDmg = 20;
        player.hp -= fireDmg;
        game.ui.addMessage('どこからか炎が飛んできた！ ' + fireDmg + 'ダメージ！');
        if (player.hp <= 0) {
          player.hp = 0;
          game.gameOver = true;
          game.ui.addMessage('倒れてしまった... ' + game.floorNum + 'Fで力尽きた');
          game.ui.showGameOver(game.floorNum, player.level);
        }
        return;
      }
    }

    // Dragon: fire breath if player in straight line and within 8 tiles, no wall blocking
    if (this.special === 'firebreath' && dist <= 8) {
      if ((dx === 0 || dy === 0) && this._hasLineOfSight(game, this.x, this.y, player.x, player.y)) {
        var fireDmg = 15 + Math.floor(Math.random() * 6); // 15-20
        player.hp -= fireDmg;
        game.ui.addMessage('ドラゴンが火を吐いた！ ' + fireDmg + 'ダメージ！');
        if (player.hp <= 0) {
          player.hp = 0;
          game.gameOver = true;
          game.ui.addMessage('倒れてしまった... ' + game.floorNum + 'Fで力尽きた');
          game.ui.showGameOver(game.floorNum, player.level);
        }
        return;
      }
    }

    // Pa-ou (polygon): ranged magic attack
    if (this.special === 'magic' && dist <= 5) {
      var inSameRoom = this._inSameRoom(game);
      if (inSameRoom) {
        // Cast spell instead of moving
        if (Math.random() < 0.5) {
          player.addStatusEffect('confused', 5, game.ui);
          game.ui.addMessage('パ王が杖を振った！ 混乱になった');
        } else {
          player.addStatusEffect('slowed', 5, game.ui);
          game.ui.addMessage('パ王が杖を振った！ 鈍足になった');
        }
        return;
      }
    }

    // Adjacent: attack (with special modifiers)
    if (dist === 1) {
      game.enemyAttack(this);
      return;
    }

    // Movement AI: BFS toward player if visible, else wander
    var canSee = this._canSeePlayer(game);

    if (canSee) {
      this._moveTowardPlayerBFS(game);
    } else {
      // Wander: 50% stay still, 50% random move
      if (Math.random() < 0.5) {
        this._moveRandom(game);
      }
    }
  };

  // Check if enemy is in the same room as the player
  Enemy.prototype._inSameRoom = function(game) {
    var rooms = game.dungeon.rooms;
    for (var i = 0; i < rooms.length; i++) {
      var r = rooms[i];
      var enemyIn = this.x >= r.x && this.x < r.x + r.w && this.y >= r.y && this.y < r.y + r.h;
      var playerIn = game.player.x >= r.x && game.player.x < r.x + r.w &&
                     game.player.y >= r.y && game.player.y < r.y + r.h;
      if (enemyIn && playerIn) return true;
    }
    return false;
  };

  // Check line of sight (for dragon fire breath - straight line only)
  Enemy.prototype._hasLineOfSight = function(game, x0, y0, x1, y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
    var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
    var x = x0 + stepX;
    var y = y0 + stepY;
    while (x !== x1 || y !== y1) {
      if (game.dungeon.grid[y][x] === Dungeon.TILE.WALL) return false;
      x += stepX;
      y += stepY;
    }
    return true;
  };

  // Can this enemy see the player? (same room or within FOV range)
  Enemy.prototype._canSeePlayer = function(game) {
    // Same room check
    if (this._inSameRoom(game)) return true;
    // Within 6 tiles with line of sight
    var dx = Math.abs(game.player.x - this.x);
    var dy = Math.abs(game.player.y - this.y);
    if (dx + dy <= 6) return true;
    return false;
  };

  // BFS pathfinding toward player (up to 20 tiles search)
  Enemy.prototype._moveTowardPlayerBFS = function(game) {
    var player = game.player;
    var target = { x: player.x, y: player.y };
    var start = { x: this.x, y: this.y };

    // BFS
    var queue = [{ x: start.x, y: start.y, firstStep: null }];
    var visited = {};
    visited[start.x + ',' + start.y] = true;
    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    var steps = 0;
    var maxSteps = 20;
    var bestMove = null;

    while (queue.length > 0 && steps < maxSteps) {
      var current = queue.shift();
      steps++;

      for (var d = 0; d < dirs.length; d++) {
        var nx = current.x + dirs[d][0];
        var ny = current.y + dirs[d][1];
        var key = nx + ',' + ny;

        if (visited[key]) continue;
        visited[key] = true;

        var firstStep = current.firstStep || { x: nx, y: ny };

        // Reached player
        if (nx === target.x && ny === target.y) {
          bestMove = firstStep;
          queue = []; // break out
          break;
        }

        // Check if walkable (use wallpass-aware check)
        var canWalk;
        if (this.special === 'wallpass') {
          canWalk = nx >= 0 && nx < game.dungeon.width && ny >= 0 && ny < game.dungeon.height;
        } else {
          canWalk = nx >= 0 && nx < game.dungeon.width && ny >= 0 && ny < game.dungeon.height &&
                    game.dungeon.grid[ny][nx] !== Dungeon.TILE.WALL;
        }

        if (canWalk) {
          // Don't path through other enemies (except target)
          var blocked = false;
          for (var e = 0; e < game.enemies.length; e++) {
            var enemy = game.enemies[e];
            if (enemy !== this && !enemy.dead && enemy.x === nx && enemy.y === ny) {
              blocked = true;
              break;
            }
          }
          if (!blocked) {
            queue.push({ x: nx, y: ny, firstStep: firstStep });
          }
        }
      }
    }

    if (bestMove) {
      // Check if the first step is the player (attack)
      if (bestMove.x === player.x && bestMove.y === player.y) {
        game.enemyAttack(this);
        return;
      }
      // Validate move
      if (this._canMoveToTileRaw(bestMove.x, bestMove.y, game)) {
        this.moveTo(bestMove.x, bestMove.y);
        return;
      }
    }

    // Fallback: Manhattan distance approach
    this._moveTowardPlayerManhattan(game);
  };

  // Fallback: simple Manhattan distance movement
  Enemy.prototype._moveTowardPlayerManhattan = function(game) {
    var player = game.player;
    var dx = player.x - this.x;
    var dy = player.y - this.y;

    var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
    var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

    var moves = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (stepX !== 0) moves.push([stepX, 0]);
      if (stepY !== 0) moves.push([0, stepY]);
    } else {
      if (stepY !== 0) moves.push([0, stepY]);
      if (stepX !== 0) moves.push([stepX, 0]);
    }

    for (var i = 0; i < moves.length; i++) {
      var nx = this.x + moves[i][0];
      var ny = this.y + moves[i][1];

      if (this._canMoveToTileRaw(nx, ny, game)) {
        if (nx === player.x && ny === player.y) {
          game.enemyAttack(this);
          return;
        }
        this.moveTo(nx, ny);
        return;
      }
    }
  };

  Enemy.prototype._isNearPlayer = function(game, range) {
    var dx = Math.abs(game.player.x - this.x);
    var dy = Math.abs(game.player.y - this.y);
    return (dx + dy) <= range;
  };

  // Keep old moveTowardPlayer as fallback reference
  Enemy.prototype.moveTowardPlayer = function(game) {
    this._moveTowardPlayerManhattan(game);
  };

  Enemy.prototype._moveRandom = function(game) {
    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (var i = dirs.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = dirs[i]; dirs[i] = dirs[j]; dirs[j] = tmp;
    }
    for (var k = 0; k < dirs.length; k++) {
      var nx = this.x + dirs[k][0];
      var ny = this.y + dirs[k][1];
      // For wallpass enemies wandering, prefer floor tiles
      if (this.special === 'wallpass') {
        if (this._canMoveToTileRaw(nx, ny, game) && !(nx === game.player.x && ny === game.player.y)) {
          // Prefer floor over wall when wandering
          var tile = game.dungeon.grid[ny][nx];
          if (tile !== Dungeon.TILE.WALL || Math.random() < 0.3) {
            this.moveTo(nx, ny);
            return;
          }
        }
      } else {
        if (this._canMoveToTile(nx, ny, game) && !(nx === game.player.x && ny === game.player.y)) {
          this.moveTo(nx, ny);
          return;
        }
      }
    }
  };

  Enemy.prototype._canMoveToTile = function(x, y, game) {
    if (!this.canMoveTo(x, y, game.dungeon)) return false;
    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (e !== this && !e.dead && e.x === x && e.y === y) return false;
    }
    return true;
  };

  // Pick an enemy from FLOOR_TABLE weighted for given floor
  function pickEnemyForFloor(floorNum) {
    var table = FLOOR_TABLE.enemies;
    var eligible = [];
    var totalWeight = 0;

    for (var i = 0; i < table.length; i++) {
      var entry = table[i];
      if (floorNum >= entry[0] && floorNum <= entry[1]) {
        eligible.push({ id: entry[2], weight: entry[3] });
        totalWeight += entry[3];
      }
    }

    if (eligible.length === 0) {
      return 'mamel';
    }

    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < eligible.length; j++) {
      cumulative += eligible[j].weight;
      if (roll < cumulative) {
        return eligible[j].id;
      }
    }
    return eligible[eligible.length - 1].id;
  }

  // Spawn enemies for a floor using FLOOR_TABLE
  Enemy.spawnForFloor = function(dungeon, floorNum, playerStartRoom) {
    var enemies = [];

    var minCount, maxCount;
    if (floorNum <= 5) {
      minCount = 3; maxCount = 6;
    } else if (floorNum <= 10) {
      minCount = 5; maxCount = 8;
    } else {
      minCount = 6; maxCount = 10;
    }
    var count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

    var availableRooms = [];
    var pCenter = {
      x: Math.floor(playerStartRoom.x + playerStartRoom.w / 2),
      y: Math.floor(playerStartRoom.y + playerStartRoom.h / 2)
    };
    for (var r = 0; r < dungeon.rooms.length; r++) {
      var room = dungeon.rooms[r];
      var rc = {
        x: Math.floor(room.x + room.w / 2),
        y: Math.floor(room.y + room.h / 2)
      };
      if (rc.x !== pCenter.x || rc.y !== pCenter.y) {
        availableRooms.push(room);
      }
    }

    if (availableRooms.length === 0) {
      availableRooms = dungeon.rooms.slice(1);
    }

    for (var i = 0; i < count; i++) {
      var room = availableRooms[Math.floor(Math.random() * availableRooms.length)];
      var ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      var ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

      if (dungeon.grid[ey] && dungeon.grid[ey][ex] === Dungeon.TILE.STAIRS_DOWN) continue;

      var occupied = false;
      for (var j = 0; j < enemies.length; j++) {
        if (enemies[j].x === ex && enemies[j].y === ey) { occupied = true; break; }
      }
      if (occupied) continue;

      var enemyId = pickEnemyForFloor(floorNum);
      var template = ENEMY_DATA[enemyId];
      if (!template) continue;

      var enemy = new Enemy(ex, ey, template, enemyId);

      // Stat scaling
      var floorsAbove = floorNum - template.minFloor;
      if (floorsAbove > 0) {
        var scaleTiers = Math.floor(floorsAbove / 5);
        if (scaleTiers > 0) {
          var bonus = 1 + scaleTiers * 0.1;
          enemy.hp = Math.floor(enemy.hp * bonus);
          enemy.maxHp = enemy.hp;
          enemy.attack = Math.floor(enemy.attack * bonus);
          enemy.defense = Math.floor(enemy.defense * bonus);
        }
      }

      enemies.push(enemy);
    }

    return enemies;
  };

  // Spawn a single enemy in a room the player is NOT in (for turn-based spawning)
  Enemy.spawnOneEnemy = function(game) {
    var dungeon = game.dungeon;
    var player = game.player;
    var floorNum = game.floorNum;

    // Find rooms player is NOT in
    var availableRooms = [];
    for (var r = 0; r < dungeon.rooms.length; r++) {
      var room = dungeon.rooms[r];
      var playerIn = player.x >= room.x && player.x < room.x + room.w &&
                     player.y >= room.y && player.y < room.y + room.h;
      if (!playerIn) {
        availableRooms.push(room);
      }
    }

    if (availableRooms.length === 0) return null;

    var room = availableRooms[Math.floor(Math.random() * availableRooms.length)];
    var ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
    var ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

    if (dungeon.grid[ey] && dungeon.grid[ey][ex] === Dungeon.TILE.STAIRS_DOWN) return null;

    // Check no overlap with player or existing enemies
    if (ex === player.x && ey === player.y) return null;
    for (var j = 0; j < game.enemies.length; j++) {
      if (!game.enemies[j].dead && game.enemies[j].x === ex && game.enemies[j].y === ey) return null;
    }

    var enemyId = pickEnemyForFloor(floorNum);
    var template = ENEMY_DATA[enemyId];
    if (!template) return null;

    var enemy = new Enemy(ex, ey, template, enemyId);

    var floorsAbove = floorNum - template.minFloor;
    if (floorsAbove > 0) {
      var scaleTiers = Math.floor(floorsAbove / 5);
      if (scaleTiers > 0) {
        var bonus = 1 + scaleTiers * 0.1;
        enemy.hp = Math.floor(enemy.hp * bonus);
        enemy.maxHp = enemy.hp;
        enemy.attack = Math.floor(enemy.attack * bonus);
        enemy.defense = Math.floor(enemy.defense * bonus);
      }
    }

    return enemy;
  };

  return Enemy;
})();
