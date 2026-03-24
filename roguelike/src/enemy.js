// Enemy class - extends Entity
var Enemy = (function() {
  'use strict';

  function Enemy(x, y, data) {
    Entity.call(this, x, y, data.char, data.color, data.name);
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.attack = data.attack;
    this.defense = data.defense;
    this.exp = data.exp;
    this.speed = 1;
    this.dead = false;
    this.confused = 0;
  }

  Enemy.prototype = Object.create(Entity.prototype);
  Enemy.prototype.constructor = Enemy;

  Enemy.prototype.takeDamage = function(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      return true; // died
    }
    return false;
  };

  Enemy.prototype.act = function(game) {
    if (this.dead) return;

    // Handle confusion
    if (this.confused > 0) {
      this.confused--;
      this._moveRandom(game);
      return;
    }

    var player = game.player;
    var dx = player.x - this.x;
    var dy = player.y - this.y;
    var dist = Math.abs(dx) + Math.abs(dy);

    // Adjacent to player? Attack!
    if (dist === 1 || (Math.abs(dx) === 1 && Math.abs(dy) === 1 && dist === 2)) {
      // Only attack if truly adjacent (4-dir for simplicity)
      if (dist === 1) {
        game.enemyAttack(this);
        return;
      }
    }

    // Check if in player's FOV or same room
    var inRange = this._isNearPlayer(game, 10);

    if (inRange) {
      this.moveTowardPlayer(game);
    } else {
      // Random movement 25% chance
      if (Math.random() < 0.25) {
        this._moveRandom(game);
      }
    }
  };

  Enemy.prototype._isNearPlayer = function(game, range) {
    var dx = Math.abs(game.player.x - this.x);
    var dy = Math.abs(game.player.y - this.y);
    return (dx + dy) <= range;
  };

  Enemy.prototype.moveTowardPlayer = function(game) {
    var player = game.player;
    var dx = player.x - this.x;
    var dy = player.y - this.y;

    // Determine preferred direction
    var stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
    var stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

    // Try moves in priority order
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

      if (this._canMoveToTile(nx, ny, game)) {
        // Check if target is player
        if (nx === player.x && ny === player.y) {
          game.enemyAttack(this);
          return;
        }
        this.moveTo(nx, ny);
        return;
      }
    }
  };

  Enemy.prototype._moveRandom = function(game) {
    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    // Shuffle
    for (var i = dirs.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = dirs[i]; dirs[i] = dirs[j]; dirs[j] = tmp;
    }
    for (var k = 0; k < dirs.length; k++) {
      var nx = this.x + dirs[k][0];
      var ny = this.y + dirs[k][1];
      if (this._canMoveToTile(nx, ny, game) && !(nx === game.player.x && ny === game.player.y)) {
        this.moveTo(nx, ny);
        return;
      }
    }
  };

  Enemy.prototype._canMoveToTile = function(x, y, game) {
    if (!this.canMoveTo(x, y, game.dungeon)) return false;
    // Check other enemies
    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (e !== this && !e.dead && e.x === x && e.y === y) return false;
    }
    return true;
  };

  // Spawn enemies for a floor
  Enemy.spawnForFloor = function(dungeon, floorNum, playerStartRoom) {
    var enemies = [];
    var count = 3 + Math.floor(Math.random() * 4); // 3-6

    // Get eligible enemy types for this floor
    var eligible = [];
    for (var key in ENEMY_DATA) {
      var data = ENEMY_DATA[key];
      if (floorNum >= data.minFloor && floorNum <= data.maxFloor) {
        eligible.push(data);
      }
    }
    if (eligible.length === 0) {
      // Fallback: use mamel
      eligible.push(ENEMY_DATA.mamel);
    }

    // Get rooms excluding player's starting room
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

      // Make sure not on stairs
      if (dungeon.grid[ey] && dungeon.grid[ey][ex] === Dungeon.TILE.STAIRS_DOWN) continue;

      // Check no enemy already there
      var occupied = false;
      for (var j = 0; j < enemies.length; j++) {
        if (enemies[j].x === ex && enemies[j].y === ey) { occupied = true; break; }
      }
      if (occupied) continue;

      var template = eligible[Math.floor(Math.random() * eligible.length)];
      enemies.push(new Enemy(ex, ey, template));
    }

    return enemies;
  };

  return Enemy;
})();
