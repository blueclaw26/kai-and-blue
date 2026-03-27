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
    // マゼルン family properties
    if (data.swallowCapacity) {
      this.swallowCapacity = data.swallowCapacity;
      this.swallowedItems = [];
    }
  }

  Enemy.prototype = Object.create(Entity.prototype);
  Enemy.prototype.constructor = Enemy;

  // Override canMoveTo for wallpass enemies
  Enemy.prototype._canMoveToTileRaw = function(x, y, game) {
    if (x < 0 || x >= game.dungeon.width || y < 0 || y >= game.dungeon.height) return false;
    // Sanctuary tiles block all enemies
    if (game.isSanctuaryTile && game.isSanctuaryTile(x, y)) return false;
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

  Enemy.prototype.takeDamage = function(amount) {
    if (this._invincibleTurns && this._invincibleTurns > 0) {
      return false; // No damage while invincible
    }
    this.hp -= amount;
    // Break paralysis when hit
    if (this.paralyzed && this.paralyzed > 0) {
      this.paralyzed = 0;
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      return true;
    }
    return false;
  };

  Enemy.prototype.act = function(game) {
    if (this.dead) return;
    if (this.sleeping) {
      // Count down sleep turns for thrown sleep grass
      if (this._sleepTurns !== undefined && this._sleepTurns > 0) {
        this._sleepTurns--;
        if (this._sleepTurns <= 0) {
          this.sleeping = false;
        }
      }
      return;
    }
    // Invincible countdown
    if (this._invincibleTurns && this._invincibleTurns > 0) {
      this._invincibleTurns--;
    }
    this._turnCount++;

    // Decoy countdown
    if (this.isDecoy) {
      if (this._decoyTurns !== undefined) {
        this._decoyTurns--;
        if (this._decoyTurns <= 0) {
          this.dead = true;
          if (game.ui) game.ui.addMessage('身代わりが消えた', 'system');
          return;
        }
      }
      return; // Decoys don't act
    }

    // Immune to status effects (shopkeeper when hostile)
    if (this.immuneToStatus) {
      this.paralyzed = 0;
      this.slowed = 0;
      this.confused = 0;
    }

    // Paralyzed: can't act
    if (this.paralyzed && this.paralyzed > 0) {
      this.paralyzed--;
      return;
    }

    // Slowed: acts every other turn
    if (this.slowed && this.slowed > 0) {
      this.slowed--;
      if (this._turnCount % 2 === 0) return; // skip every other turn
    }

    if (this.confused > 0) {
      this.confused--;
      this._moveRandom(game);
      return;
    }

    var player = game.player;
    var dx = player.x - this.x;
    var dy = player.y - this.y;
    var dist = Math.abs(dx) + Math.abs(dy);

    // --- Special abilities (skip if sealed) ---

    // Skull Dragon: floor-wide fire every 3 turns
    if (this.special === 'floorfire' && !this.sealed) {
      if (this._turnCount % 3 === 0) {
        // Fire resist incense negates fire damage
        if (game.activeIncense && game.activeIncense.effect === 'fire_resist') {
          game.ui.addMessage('どこからか炎が飛んできた！ お香の効果で炎を無効化した！', 'system');
          return;
        }
        var fireDmg = 20;
        // Check for dragon_resist seal on shield
        var hasDragonResist = (player.shield && player.shield.seals && player.shield.seals.indexOf('dragon_resist') !== -1) ||
                              (player.shield && player.shield.special === 'dragon_resist');
        if (hasDragonResist) {
          fireDmg = Math.floor(fireDmg * 0.5);
          game.ui.addMessage('どこからか炎が飛んできた！ [竜]印が炎を防いだ！ ' + fireDmg + 'ダメージ', 'enemy_special');
        } else {
          game.ui.addMessage('どこからか炎が飛んできた！ ' + fireDmg + 'ダメージ！', 'enemy_special');
        }
        player.hp -= fireDmg;
        if (player.hp <= 0) {
          player.hp = 0;
          game.gameOver = true;
          game.ui.addMessage('倒れてしまった... ' + game.floorNum + 'Fで力尽きた', 'damage');
          game.ui.showGameOver(game.floorNum, player.level);
        }
        return;
      }
    }

    // Dragon: fire breath if player in straight line and within 8 tiles, no wall blocking
    if (this.special === 'firebreath' && !this.sealed && dist <= 8) {
      if ((dx === 0 || dy === 0) && this._hasLineOfSight(game, this.x, this.y, player.x, player.y)) {
        var fireDmg = 15 + Math.floor(Math.random() * 6); // 15-20
        // Fire resist incense negates fire damage
        if (game.activeIncense && game.activeIncense.effect === 'fire_resist') {
          game.ui.addMessage('ドラゴンが火を吐いた！ お香の効果で炎を無効化した！', 'system');
          return;
        }
        var hasDragonResistBreath = (player.shield && player.shield.seals && player.shield.seals.indexOf('dragon_resist') !== -1) ||
                                    (player.shield && player.shield.special === 'dragon_resist');
        if (hasDragonResistBreath) {
          fireDmg = Math.floor(fireDmg * 0.5);
          game.ui.addMessage('ドラゴンが火を吐いた！ [竜]印が炎を防いだ！ ' + fireDmg + 'ダメージ', 'enemy_special');
        } else {
          game.ui.addMessage('ドラゴンが火を吐いた！ ' + fireDmg + 'ダメージ！', 'enemy_special');
        }
        player.hp -= fireDmg;
        if (player.hp <= 0) {
          player.hp = 0;
          game.gameOver = true;
          game.ui.addMessage('倒れてしまった... ' + game.floorNum + 'Fで力尽きた', 'damage');
          game.ui.showGameOver(game.floorNum, player.level);
        }
        return;
      }
    }

    // Arrow shot (boy_cart, child_tank): shoots arrow in straight line
    if (this.special === 'arrow_shot' && !this.sealed && dist <= 5) {
      if ((dx === 0 || dy === 0) && this._hasLineOfSight(game, this.x, this.y, player.x, player.y)) {
        // Evasion incense: arrow misses and drops on the ground
        if (game.activeIncense && game.activeIncense.effect === 'evasion') {
          var arrowKey = this.enemyId === 'child_tank' ? 'arrow_iron' : 'arrow_wood';
          var droppedArrow = new Item(player.x, player.y, arrowKey);
          droppedArrow.count = 1;
          game.items.push(droppedArrow);
          game.ui.addMessage('お香の効果で矢が逸れた！ 足元に落ちた', 'system');
          Sound.play('arrow');
          return;
        }
        var arrowDmg = this.enemyId === 'child_tank' ? 6 : 3;
        game.ui.addMessage(this.name + 'が矢を放った！ ' + arrowDmg + 'ダメージ', 'enemy_special');
        if (!player.godMode) player.hp -= arrowDmg;
        Sound.play('arrow');
        if (player.hp <= 0) {
          player.hp = 0;
          game.gameOver = true;
          Sound.play('gameover');
          game.ui.addMessage('倒れてしまった... ' + game.floorNum + 'Fで力尽きた', 'damage');
          game.ui.showGameOver(game.floorNum, player.level);
        }
        return;
      }
    }

    // Bomb shot (oyaji_tank): shoots bomb for 20 fixed damage
    if (this.special === 'bomb_shot' && !this.sealed && dist <= 5) {
      if ((dx === 0 || dy === 0) && this._hasLineOfSight(game, this.x, this.y, player.x, player.y)) {
        // Fire resist incense negates explosion damage
        if (game.activeIncense && game.activeIncense.effect === 'fire_resist') {
          game.ui.addMessage('オヤジ戦車は大砲を撃った！ お香の効果で爆風を無効化した！', 'system');
          return;
        }
        var bombDmg = 20;
        var hasBlastRes = (player.shield && player.shield.seals && player.shield.seals.indexOf('blast_resist') !== -1) ||
                          (player.shield && player.shield.special === 'blast_resist');
        if (hasBlastRes) {
          bombDmg = Math.floor(bombDmg * 0.5);
          game.ui.addMessage('オヤジ戦車は大砲を撃った！ [爆]印が爆風を防いだ！ ' + bombDmg + 'ダメージ', 'enemy_special');
        } else {
          game.ui.addMessage('オヤジ戦車は大砲を撃った！ ' + bombDmg + 'ダメージ！', 'enemy_special');
        }
        if (!player.godMode) player.hp -= bombDmg;
        // Destroy items on ground near player
        for (var bi = game.items.length - 1; bi >= 0; bi--) {
          var bItem = game.items[bi];
          if (Math.abs(bItem.x - player.x) <= 1 && Math.abs(bItem.y - player.y) <= 1) {
            game.ui.addMessage(bItem.getDisplayName() + 'が爆発で消滅した', 'system');
            if (game.shopItems) game.shopItems.delete(bItem);
            game.items.splice(bi, 1);
          }
        }
        if (player.hp <= 0) {
          player.hp = 0;
          game.gameOver = true;
          Sound.play('gameover');
          game.ui.addMessage('倒れてしまった... ' + game.floorNum + 'Fで力尽きた', 'damage');
          game.ui.showGameOver(game.floorNum, player.level);
        }
        return;
      }
    }

    // Obake Daikon: throws poison from 3 tiles
    if (this.special === 'poison_throw' && !this.sealed && dist <= 3) {
      if (this._inSameRoom(game)) {
        game.ui.addMessage('おばけ大根が毒草を投げてきた！ ちからが下がった', 'enemy_special');
        player.strength = Math.max(0, (player.strength || 8) - 1);
        player._recalcStats();
        return;
      }
    }

    // Confuse throw (dizzy_radish, chaos_radish): throws confusion grass
    if (this.special === 'confuse_throw' && !this.sealed && dist <= 3) {
      if (this._inSameRoom(game)) {
        game.ui.addMessage('混乱草を投げつけられた！', 'enemy_special');
        player.addStatusEffect('confused', 10, game.ui);
        return;
      }
    }

    // Magic (mage family tier 1-2): ranged magic attack
    if (this.special === 'magic' && !this.sealed && dist <= 5) {
      var inSameRoom = this._inSameRoom(game);
      if (inSameRoom) {
        if (Math.random() < 0.5) {
          player.addStatusEffect('confused', 5, game.ui);
          game.ui.addMessage(this.name + 'が杖を振った！ 混乱になった', 'enemy_special');
        } else {
          player.addStatusEffect('slowed', 5, game.ui);
          game.ui.addMessage(this.name + 'が杖を振った！ 鈍足になった', 'enemy_special');
        }
        return;
      }
    }

    // Magic strong (skull_master): stronger magic effects
    if (this.special === 'magic_strong' && !this.sealed && dist <= 5) {
      var inSameRoom2 = this._inSameRoom(game);
      if (inSameRoom2) {
        var magicRoll = Math.random();
        if (magicRoll < 0.25) {
          // Level drain -3
          for (var ld = 0; ld < 3; ld++) {
            if (player.level > 1) {
              player.level--;
              player.maxHp = Math.max(5, player.maxHp - 3);
              player.hp = Math.min(player.hp, player.maxHp);
              player.baseAttack = Math.max(1, player.baseAttack - 1);
            }
          }
          player._recalcStats();
          game.ui.addMessage(this.name + 'が杖を振った！ レベルが3下がった！', 'enemy_special');
        } else if (magicRoll < 0.5) {
          // Sleep 10 turns
          if (game.activeIncense && game.activeIncense.effect === 'sleep_resist') {
            game.ui.addMessage(this.name + 'が杖を振った！ ...しかしお香の効果で眠らなかった！', 'system');
          } else {
            player.sleepTurns = 10;
            game.ui.addMessage(this.name + 'が杖を振った！ 深い眠りに落ちた！', 'enemy_special');
          }
        } else if (magicRoll < 0.75) {
          // Confuse 10 turns
          player.addStatusEffect('confused', 10, game.ui);
          game.ui.addMessage(this.name + 'が杖を振った！ 混乱になった！', 'enemy_special');
        } else {
          // 40 fixed damage
          var magicDmg = 40;
          if (!player.godMode && !player.hasStatusEffect('invincible')) player.hp -= magicDmg;
          game.ui.addMessage(this.name + 'が杖を振った！ ' + magicDmg + 'ダメージ！', 'enemy_special');
          if (player.hp <= 0) {
            player.hp = 0;
            game.gameOver = true;
            Sound.play('gameover');
            game.ui.addMessage('倒れてしまった... ' + game.floorNum + 'Fで力尽きた', 'damage');
            game.ui.showGameOver(game.floorNum, player.level);
          }
        }
        return;
      }
    }

    // Adjacent: attack (with special modifiers)
    if (dist === 1) {
      // Gamara fleeing: try to run away instead of attacking
      if (this._fleeing) {
        this._moveAwayFromPlayer(game);
        return;
      }
      game.enemyAttack(this);
      return;
    }

    // Fleeing enemies move away
    if (this._fleeing) {
      this._moveAwayFromPlayer(game);
      return;
    }

    // Player invisible: enemies wander randomly
    if (game.playerInvisible && game.playerInvisible > 0 && dist > 1) {
      if (Math.random() < 0.5) this._moveRandom(game);
      return;
    }

    // Decoy targeting: prefer moving toward decoys
    var decoyTarget = this._findDecoyTarget(game);
    if (decoyTarget) {
      var ddx = decoyTarget.x - this.x;
      var ddy = decoyTarget.y - this.y;
      var ddist = Math.abs(ddx) + Math.abs(ddy);
      if (ddist === 1) {
        // Attack decoy
        decoyTarget.takeDamage(999);
        if (decoyTarget.hp <= 0) {
          decoyTarget.dead = true;
          if (game.ui) game.ui.addMessage('身代わりが攻撃を受けて消えた！', 'system');
        }
        return;
      }
      // Move toward decoy using simple Manhattan
      var dStepX = ddx === 0 ? 0 : (ddx > 0 ? 1 : -1);
      var dStepY = ddy === 0 ? 0 : (ddy > 0 ? 1 : -1);
      var dMoves = [];
      if (Math.abs(ddx) >= Math.abs(ddy)) {
        if (dStepX !== 0) dMoves.push([dStepX, 0]);
        if (dStepY !== 0) dMoves.push([0, dStepY]);
      } else {
        if (dStepY !== 0) dMoves.push([0, dStepY]);
        if (dStepX !== 0) dMoves.push([dStepX, 0]);
      }
      for (var dm = 0; dm < dMoves.length; dm++) {
        var dnx = this.x + dMoves[dm][0];
        var dny = this.y + dMoves[dm][1];
        if (this._canMoveToTileRaw(dnx, dny, game) && !(dnx === game.player.x && dny === game.player.y)) {
          this.moveTo(dnx, dny);
          return;
        }
      }
    }

    // Movement AI: BFS toward player if visible, else wander
    var canSee = this._canSeePlayer(game);

    if (canSee) {
      this._moveTowardPlayerBFS(game);
    } else {
      // Wander: wanderChance to move, else stay still
      if (Math.random() < B('enemies.wanderChance', 0.5)) {
        this._moveRandom(game);
      }
    }
  };

  // Find nearest decoy to target
  Enemy.prototype._findDecoyTarget = function(game) {
    var nearest = null;
    var nearestDist = 999;
    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (!e.dead && e.isDecoy) {
        var d = Math.abs(e.x - this.x) + Math.abs(e.y - this.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = e;
        }
      }
    }
    return nearest;
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
    // Blind enemies incense: vision reduced to 1 tile
    if (game.activeIncense && game.activeIncense.effect === 'blind_enemies') {
      var bdx = Math.abs(game.player.x - this.x);
      var bdy = Math.abs(game.player.y - this.y);
      return (bdx <= 1 && bdy <= 1);
    }
    // Same room check
    if (this._inSameRoom(game)) return true;
    // Within visionRange tiles with line of sight
    var dx = Math.abs(game.player.x - this.x);
    var dy = Math.abs(game.player.y - this.y);
    if (dx + dy <= B('enemies.visionRange', 6)) return true;
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
    var dirs = [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
    var steps = 0;
    var maxSteps = 30;
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
    // Try diagonal first (most direct path), then cardinal
    if (stepX !== 0 && stepY !== 0) moves.push([stepX, stepY]);
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

  // Move away from player (flee AI)
  Enemy.prototype._moveAwayFromPlayer = function(game) {
    var player = game.player;
    var bestDist = -1;
    var bestMove = null;
    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (var d = 0; d < dirs.length; d++) {
      var nx = this.x + dirs[d][0];
      var ny = this.y + dirs[d][1];
      if (!this._canMoveToTile(nx, ny, game)) continue;
      if (nx === player.x && ny === player.y) continue;
      var dist = Math.abs(nx - player.x) + Math.abs(ny - player.y);
      if (dist > bestDist) {
        bestDist = dist;
        bestMove = { x: nx, y: ny };
      }
    }
    if (bestMove) {
      this.moveTo(bestMove.x, bestMove.y);
    } else {
      this._moveRandom(game);
    }
  };

  Enemy.prototype._canMoveToTile = function(x, y, game) {
    if (!this.canMoveTo(x, y, game.dungeon)) return false;
    // Sanctuary tiles block enemies
    if (game.isSanctuaryTile && game.isSanctuaryTile(x, y)) return false;
    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (e !== this && !e.dead && e.x === x && e.y === y) return false;
    }
    return true;
  };

  // Pick an enemy from FLOOR_TABLE weighted for given floor
  function pickEnemyForFloor(floorNum, extinctEnemies) {
    var table = FLOOR_TABLE.enemies;
    var eligible = [];
    var totalWeight = 0;

    for (var i = 0; i < table.length; i++) {
      var entry = table[i];
      if (floorNum >= entry[0] && floorNum <= entry[1]) {
        // Skip extinct enemies
        if (extinctEnemies && extinctEnemies.has(entry[2])) continue;
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
  Enemy.spawnForFloor = function(dungeon, floorNum, playerStartRoom, extinctEnemies) {
    var enemies = [];

    // Determine enemy count from BALANCE spawn table
    var spawnTable = B('enemies.spawnTable', [[1,5,3,5],[6,15,4,6],[16,30,5,7],[31,50,6,9],[51,75,7,10],[76,99,8,12]]);
    var minCount = 3, maxCount = 5;
    for (var si = 0; si < spawnTable.length; si++) {
      if (floorNum >= spawnTable[si][0] && floorNum <= spawnTable[si][1]) {
        minCount = spawnTable[si][2];
        maxCount = spawnTable[si][3];
        break;
      }
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
    // For single-room floors (big room), use the only room but avoid player position
    if (availableRooms.length === 0 && dungeon.rooms.length > 0) {
      availableRooms = dungeon.rooms.slice(0);
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

      var enemyId = pickEnemyForFloor(floorNum, extinctEnemies);
      var template = ENEMY_DATA[enemyId];
      if (!template) continue;

      var enemy = new Enemy(ex, ey, template, enemyId);

      // Stat scaling
      var floorsAbove = floorNum - template.minFloor;
      if (floorsAbove > 0) {
        var scaleInterval = B('enemies.statScaleInterval', 5);
        var scaleBonus = B('enemies.statScaleBonus', 0.1);
        var scaleTiers = Math.floor(floorsAbove / scaleInterval);
        if (scaleTiers > 0) {
          var bonus = 1 + scaleTiers * scaleBonus;
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

    var enemyId = pickEnemyForFloor(floorNum, game.extinctEnemies);
    var template = ENEMY_DATA[enemyId];
    if (!template) return null;

    var enemy = new Enemy(ex, ey, template, enemyId);

    var floorsAbove = floorNum - template.minFloor;
    if (floorsAbove > 0) {
      var scaleInterval = B('enemies.statScaleInterval', 5);
      var scaleBonus = B('enemies.statScaleBonus', 0.1);
      var scaleTiers = Math.floor(floorsAbove / scaleInterval);
      if (scaleTiers > 0) {
        var bonus = 1 + scaleTiers * scaleBonus;
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
