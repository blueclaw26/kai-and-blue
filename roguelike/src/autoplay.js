// Auto-Play AI for testing and debugging
var AutoPlayer = (function() {
  'use strict';

  function AutoPlayer(game, turnManager, ui, renderer) {
    this.game = game;
    this.turnManager = turnManager;
    this.ui = ui;
    this.renderer = renderer;
    this.running = false;
    this.speed = 50; // ms per turn
    this.stats = { turns: 0, kills: 0, itemsUsed: 0 };
    this._timerId = null;
  }

  AutoPlayer.prototype.start = function(speed) {
    if (this.running) return;
    this.running = true;
    this.speed = speed || 50;
    this.stats = { turns: 0, kills: 0, itemsUsed: 0 };
    this.ui.addMessage('DEBUG: 自動プレイ開始 (' + this.speed + 'ms/turn)', 'debug');
    this._loop();
  };

  AutoPlayer.prototype.stop = function() {
    this.running = false;
    if (this._timerId) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
    this.ui.addMessage('DEBUG: 自動プレイ停止', 'debug');
  };

  AutoPlayer.prototype.step = function() {
    if (this.game.gameOver || this.game.victory) return;
    this.decide();
    this.stats.turns++;
    this.renderer.render(this.game);
    this.ui.updateStatus(this.game);
  };

  AutoPlayer.prototype._loop = function() {
    if (!this.running) return;

    this.decide();
    this.stats.turns++;
    this.renderer.render(this.game);
    this.ui.updateStatus(this.game);

    if (this.game.gameOver || this.game.victory || this.stats.turns > 10000) {
      this.running = false;
      this._timerId = null;
      this._reportResults();
      return;
    }

    var self = this;
    this._timerId = setTimeout(function() { self._loop(); }, this.speed);
  };

  AutoPlayer.prototype._reportResults = function() {
    var p = this.game.player;
    var result = {
      result: this.game.victory ? 'CLEAR!' : 'GAME OVER',
      turns: this.stats.turns,
      floor: this.game.floorNum,
      level: p.level,
      hp: p.hp + '/' + p.maxHp,
      attack: p.attack,
      defense: p.defense,
      weapon: p.weapon ? p.weapon.name + '+' + (p.weapon.plus || 0) : 'なし',
      shield: p.shield ? p.shield.name + '+' + (p.shield.plus || 0) : 'なし',
      gold: p.gold,
      inventory: p.inventory.length
    };
    console.log('=== AUTO-PLAY RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    this.ui.addMessage('--- AUTO-PLAY: ' + result.result + ' ---', 'debug');
    this.ui.addMessage('Turns:' + result.turns + ' Floor:' + result.floor + ' Lv:' + result.level, 'debug');
  };

  // ===== AI Decision Making =====

  AutoPlayer.prototype.decide = function() {
    var game = this.game;
    var player = game.player;

    // Priority 1: If dead or won, stop
    if (game.gameOver || game.victory) {
      this.stop();
      return;
    }

    // Priority 2: If sell confirmation, decline
    if (game.sellConfirmMode) {
      game.confirmSell(false);
      this.turnManager.processTurn(function() { return false; });
      return;
    }

    // Priority 3: If direction mode, cancel
    if (game.directionMode) {
      game.directionMode = null;
      return;
    }

    // Priority 4: Close inventory if open
    if (game.inventoryOpen) {
      game.inventoryOpen = false;
      game.identifyMode = false;
      game.ui.hideInventory();
      return;
    }

    // Priority 5: If sleeping/paralyzed, just wait
    if (player.sleepTurns > 0) {
      this._doWait();
      return;
    }

    // Priority 6: Heal if HP < 40%
    if (player.hp < player.maxHp * 0.4) {
      if (this._useHealItem()) return;
    }

    // Priority 7: Eat if satiety < 30
    if (player.satiety < 30) {
      if (this._useFood()) return;
    }

    // Priority 8: Equip best weapon/shield (doesn't consume turn by itself, just sets up)
    this._equipBest();

    // Priority 9: If adjacent enemy, attack it
    var adjEnemy = this._getAdjacentEnemy();
    if (adjEnemy) {
      this._moveToward(adjEnemy.x, adjEnemy.y);
      return;
    }

    // Priority 10: If nearby visible enemy, move toward it
    var nearEnemy = this._getNearestVisibleEnemy();
    if (nearEnemy) {
      this._moveToward(nearEnemy.x, nearEnemy.y);
      return;
    }

    // Priority 11: Pick up items on current tile
    var itemHere = game.getItemAt(player.x, player.y);
    if (itemHere && !itemHere.shopItem && player.inventory.length < 20) {
      var g = game;
      this.turnManager.processTurn(function() {
        return g.pickUpItem();
      });
      return;
    }

    // Priority 12: If on stairs, descend
    if (game.dungeon.grid[player.y][player.x] === 3) { // STAIRS_DOWN
      this._doDescend();
      return;
    }

    // Priority 13: Navigate to stairs (if known)
    var stairsPath = this._findPathToStairs();
    if (stairsPath && stairsPath.length > 0) {
      var step = stairsPath[0];
      this._moveTo(step[0], step[1]);
      return;
    }

    // Priority 14: Explore (move toward unexplored area)
    if (this._explore()) return;

    // Fallback: random move
    this._randomMove();
  };

  // ===== Actions (go through TurnManager) =====

  AutoPlayer.prototype._doWait = function() {
    this.turnManager.processTurn(function() { return true; });
  };

  AutoPlayer.prototype._doDescend = function() {
    var game = this.game;
    this.turnManager.processTurn(function() {
      return game.descend();
    });
  };

  AutoPlayer.prototype._moveDir = function(dx, dy) {
    var game = this.game;
    this.turnManager.processTurn(function() {
      return game.movePlayer(dx, dy);
    });
  };

  AutoPlayer.prototype._moveTo = function(tx, ty) {
    var p = this.game.player;
    var dx = tx - p.x;
    var dy = ty - p.y;
    // Clamp to -1..1
    dx = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    dy = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
    this._moveDir(dx, dy);
  };

  AutoPlayer.prototype._moveToward = function(tx, ty) {
    var p = this.game.player;
    var dx = tx - p.x;
    var dy = ty - p.y;

    // If adjacent, move directly
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      this._moveDir(dx, dy);
      return;
    }

    // Try direct direction first
    var sdx = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    var sdy = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
    var nx = p.x + sdx;
    var ny = p.y + sdy;
    var grid = this.game.dungeon.grid;
    if (ny >= 0 && ny < this.game.dungeon.height && nx >= 0 && nx < this.game.dungeon.width && grid[ny][nx] !== 0) {
      this._moveDir(sdx, sdy);
      return;
    }

    // Direct path blocked, use BFS
    var path = this._bfs(p.x, p.y, tx, ty);
    if (path && path.length > 0) {
      this._moveTo(path[0][0], path[0][1]);
      return;
    }

    // Can't reach, try just x or just y direction
    if (sdx !== 0) {
      var nxx = p.x + sdx;
      if (nxx >= 0 && nxx < this.game.dungeon.width && grid[p.y][nxx] !== 0) {
        this._moveDir(sdx, 0);
        return;
      }
    }
    if (sdy !== 0) {
      var nyy = p.y + sdy;
      if (nyy >= 0 && nyy < this.game.dungeon.height && grid[nyy][p.x] !== 0) {
        this._moveDir(0, sdy);
        return;
      }
    }

    // Totally stuck, random move
    this._randomMove();
  };

  AutoPlayer.prototype._useItem = function(item) {
    var game = this.game;
    this.stats.itemsUsed++;
    this.turnManager.processTurn(function() {
      return game.useItem(item);
    });
  };

  // ===== AI Helpers =====

  AutoPlayer.prototype._getAdjacentEnemy = function() {
    var p = this.game.player;
    var closest = null;
    var closestHp = Infinity;
    for (var i = 0; i < this.game.enemies.length; i++) {
      var e = this.game.enemies[i];
      if (e.dead) continue;
      if (e.isShopkeeper) continue;
      var adx = Math.abs(e.x - p.x);
      var ady = Math.abs(e.y - p.y);
      if (adx <= 1 && ady <= 1 && (adx + ady > 0)) {
        if (e.hp < closestHp) {
          closest = e;
          closestHp = e.hp;
        }
      }
    }
    return closest;
  };

  AutoPlayer.prototype._getNearestVisibleEnemy = function() {
    var p = this.game.player;
    var closest = null;
    var closestDist = Infinity;
    for (var i = 0; i < this.game.enemies.length; i++) {
      var e = this.game.enemies[i];
      if (e.dead) continue;
      if (e.isShopkeeper) continue;
      var dist = Math.abs(e.x - p.x) + Math.abs(e.y - p.y);
      // Only consider enemies within FOV range (~6 tiles)
      if (dist <= 8 && dist < closestDist) {
        closest = e;
        closestDist = dist;
      }
    }
    return closest;
  };

  AutoPlayer.prototype._findPathToStairs = function() {
    var game = this.game;
    var dungeon = game.dungeon;
    var grid = dungeon.grid;
    var stairs = dungeon.stairs;
    var p = game.player;

    // Check if stairs position is explored (known)
    var stairsKey = stairs.x + ',' + stairs.y;
    if (!game.explored[stairs.y][stairs.x]) return null;

    // BFS from player to stairs
    return this._bfs(p.x, p.y, stairs.x, stairs.y);
  };

  AutoPlayer.prototype._bfs = function(sx, sy, tx, ty) {
    var dungeon = this.game.dungeon;
    var grid = dungeon.grid;
    var w = dungeon.width;
    var h = dungeon.height;

    var visited = {};
    var queue = [[sx, sy, []]];
    visited[sx + ',' + sy] = true;

    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];

    while (queue.length > 0) {
      var cur = queue.shift();
      var cx = cur[0], cy = cur[1], path = cur[2];

      if (cx === tx && cy === ty) return path;

      for (var d = 0; d < dirs.length; d++) {
        var nx = cx + dirs[d][0];
        var ny = cy + dirs[d][1];
        var key = nx + ',' + ny;

        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        if (visited[key]) continue;
        if (grid[ny][nx] === 0) continue; // WALL

        // Don't path through enemies (except the target)
        if (!(nx === tx && ny === ty)) {
          var hasEnemy = false;
          for (var i = 0; i < this.game.enemies.length; i++) {
            var e = this.game.enemies[i];
            if (!e.dead && e.x === nx && e.y === ny) {
              hasEnemy = true;
              break;
            }
          }
          if (hasEnemy) continue;
        }

        visited[key] = true;
        var newPath = path.concat([[nx, ny]]);
        queue.push([nx, ny, newPath]);
      }
    }
    return null;
  };

  AutoPlayer.prototype._explore = function() {
    var game = this.game;
    var p = game.player;
    var dungeon = game.dungeon;
    var grid = dungeon.grid;
    var explored = game.explored;

    // Find nearest unexplored walkable tile adjacent to an explored tile
    var bestTarget = null;
    var bestDist = Infinity;

    for (var y = 0; y < dungeon.height; y++) {
      for (var x = 0; x < dungeon.width; x++) {
        if (grid[y][x] === 0) continue; // WALL
        if (explored[y][x]) continue;

        // Check if adjacent to explored
        var adjacentExplored = false;
        var adjDirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (var d = 0; d < adjDirs.length; d++) {
          var ax = x + adjDirs[d][0];
          var ay = y + adjDirs[d][1];
          if (ay >= 0 && ay < dungeon.height && ax >= 0 && ax < dungeon.width && explored[ay][ax]) {
            adjacentExplored = true;
            break;
          }
        }
        if (!adjacentExplored) continue;

        var dist = Math.abs(x - p.x) + Math.abs(y - p.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestTarget = [x, y];
        }
      }
    }

    if (bestTarget) {
      var path = this._bfs(p.x, p.y, bestTarget[0], bestTarget[1]);
      if (path && path.length > 0) {
        this._moveTo(path[0][0], path[0][1]);
        return true;
      }
    }
    return false;
  };

  AutoPlayer.prototype._randomMove = function() {
    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];
    var p = this.game.player;
    var grid = this.game.dungeon.grid;

    // Shuffle dirs
    for (var i = dirs.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = dirs[i]; dirs[i] = dirs[j]; dirs[j] = tmp;
    }

    for (var d = 0; d < dirs.length; d++) {
      var nx = p.x + dirs[d][0];
      var ny = p.y + dirs[d][1];
      if (nx >= 0 && nx < this.game.dungeon.width && ny >= 0 && ny < this.game.dungeon.height) {
        if (grid[ny][nx] !== 0) {
          this._moveDir(dirs[d][0], dirs[d][1]);
          return;
        }
      }
    }
    // Stuck, just wait
    this._doWait();
  };

  AutoPlayer.prototype._useHealItem = function() {
    var player = this.game.player;
    // Look for healing grass
    var bestHeal = null;
    var bestVal = 0;
    for (var i = 0; i < player.inventory.length; i++) {
      var item = player.inventory[i];
      if (item.type === 'grass' && item.effect === 'heal') {
        var val = item.value || 25;
        if (val > bestVal) {
          bestHeal = item;
          bestVal = val;
        }
      }
    }
    if (bestHeal) {
      this._useItem(bestHeal);
      return true;
    }
    return false;
  };

  AutoPlayer.prototype._useFood = function() {
    var player = this.game.player;
    for (var i = 0; i < player.inventory.length; i++) {
      var item = player.inventory[i];
      if (item.type === 'food' && !item.cursed) {
        this._useItem(item);
        return true;
      }
    }
    return false;
  };

  AutoPlayer.prototype._equipBest = function() {
    var player = this.game.player;
    var ui = this.game.ui;

    // Find best weapon
    var bestWeapon = null;
    var bestAtk = player.weapon ? (player.weapon.attack || 0) + (player.weapon.plus || 0) : -1;
    for (var i = 0; i < player.inventory.length; i++) {
      var item = player.inventory[i];
      if (item.type === 'weapon' && item !== player.weapon) {
        var atk = (item.attack || 0) + (item.plus || 0);
        if (atk > bestAtk) {
          bestWeapon = item;
          bestAtk = atk;
        }
      }
    }
    if (bestWeapon) {
      // Equip uses a turn in the real game
      var w = bestWeapon;
      this.turnManager.processTurn(function() {
        return player.equip(w, ui);
      });
      return; // Don't also equip shield in same decide() call
    }

    // Find best shield
    var bestShield = null;
    var bestDef = player.shield ? (player.shield.defense || 0) + (player.shield.plus || 0) : -1;
    for (var j = 0; j < player.inventory.length; j++) {
      var item2 = player.inventory[j];
      if (item2.type === 'shield' && item2 !== player.shield) {
        var def = (item2.defense || 0) + (item2.plus || 0);
        if (def > bestDef) {
          bestShield = item2;
          bestDef = def;
        }
      }
    }
    if (bestShield) {
      var s = bestShield;
      this.turnManager.processTurn(function() {
        return player.equip(s, ui);
      });
    }
  };

  return AutoPlayer;
})();
