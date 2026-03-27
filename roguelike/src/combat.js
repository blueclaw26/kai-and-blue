// Combat System - extracted from game.js
// Adds combat-related methods to Game.prototype
(function() {
  'use strict';

  // --- Player attack with weapon specials ---
  Game.prototype.playerAttack = function(enemy) {
    var player = this.player;
    var dmgVar = B('combat.damageVariance', 3);
    var rawDmg = player.attack - enemy.defense + Math.floor(Math.random() * dmgVar) - 1;
    var damage = Math.max(B('combat.minDamage', 1), rawDmg);

    // Apply seal effects from equipped weapon
    if (player.weapon) {
      var seals = player.weapon.seals || [];
      var sealMultiplier = 1;
      var sealMessages = [];
      var typeEffMult = B('combat.typeEffectMultiplier', 1.5);

      for (var si = 0; si < seals.length; si++) {
        switch (seals[si]) {
          case 'dragon':
            if (DRAGON_TYPE_ENEMIES[enemy.enemyId]) {
              sealMultiplier *= typeEffMult;
              sealMessages.push('竜特効！');
            }
            break;
          case 'ghost':
            if (GHOST_TYPE_ENEMIES[enemy.enemyId]) {
              sealMultiplier *= typeEffMult;
              sealMessages.push('仏特効！');
            }
            break;
          case 'drain':
            if (enemy.special) {
              sealMultiplier *= typeEffMult;
              sealMessages.push('吸特効！');
            }
            break;
          case 'crit':
            if (Math.random() < B('combat.critChance', 0.25)) {
              sealMultiplier *= 1.5;
              sealMessages.push('会心の一撃！');
            }
            break;
        }
      }

      // Legacy special property support (for items without seals)
      if (seals.length === 0 && player.weapon.special) {
        switch (player.weapon.special) {
          case 'drain':
            if (enemy.special) sealMultiplier = 1.5;
            break;
          case 'ghost':
            if (GHOST_TYPE_ENEMIES[enemy.enemyId]) sealMultiplier = 1.5;
            break;
          case 'dragon':
            if (DRAGON_TYPE_ENEMIES[enemy.enemyId]) sealMultiplier = 1.5;
            break;
        }
        if (sealMultiplier > 1) sealMessages.push('特効！');
      }

      if (sealMultiplier > 1) {
        damage = Math.floor(damage * sealMultiplier);
        for (var mi = 0; mi < sealMessages.length; mi++) {
          this.ui.addMessage(sealMessages[mi], 'attack');
        }
      }
    }

    var died = enemy.takeDamage(damage);

    // Check for crit seal
    var isCrit = false;
    if (player.weapon && player.weapon.seals) {
      for (var ci = 0; ci < player.weapon.seals.length; ci++) {
        if (player.weapon.seals[ci] === 'crit' && sealMultiplier > 1) {
          isCrit = true;
          break;
        }
      }
    }

    Sound.play('attack');
    this.ui.addMessage(enemy.name + 'に ' + damage + ' ダメージを与えた！', 'attack');
    // UI effects: damage popup and flash
    this.addFloatingText(enemy.x, enemy.y, '-' + damage, '#ef5350');
    this.flashTiles.push({ x: enemy.x, y: enemy.y });

    // Combat animations: white flash on enemy
    this.animations.push({ type: 'white_flash', x: enemy.x, y: enemy.y, frame: 0, maxFrames: 4, data: {} });

    // Critical hit effects
    if (isCrit) {
      this.shakeFrames = 8;
      this.animations.push({ type: 'critical_text', x: enemy.x, y: enemy.y, frame: 0, maxFrames: 20, data: {} });
    }

    if (died) {
      this.player.enemiesKilled++;
      Sound.play('kill');
      this.ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得', 'attack');
      this.player.gainExp(enemy.exp, this.ui);

      // Death animation: fade + particles
      this.animations.push({ type: 'death_fade', x: enemy.x, y: enemy.y, frame: 0, maxFrames: 8, data: {} });
      var particles = [];
      for (var pi = 0; pi < 6; pi++) {
        particles.push({
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          r: 200 + Math.floor(Math.random() * 55),
          g: 200 + Math.floor(Math.random() * 55),
          b: 200 + Math.floor(Math.random() * 55)
        });
      }
      this.animations.push({ type: 'particles', x: enemy.x, y: enemy.y, frame: 0, maxFrames: 10, data: { particles: particles } });

      // マゼルン family: drop swallowed items (with synthesis)
      if (enemy.swallowedItems && enemy.swallowedItems.length > 0) {
        this._dropMazerunItems(enemy, ui);
      }

      // Possess: on death, level up a nearby enemy
      if (enemy.special === 'possess') {
        var nearestEnemy = null;
        var nearestDist = 999;
        for (var pi2 = 0; pi2 < this.enemies.length; pi2++) {
          var candidate = this.enemies[pi2];
          if (candidate !== enemy && !candidate.dead && !candidate.isShopkeeper && !candidate.isDecoy) {
            var pdist = Math.abs(candidate.x - enemy.x) + Math.abs(candidate.y - enemy.y);
            if (pdist < nearestDist) {
              nearestDist = pdist;
              nearestEnemy = candidate;
            }
          }
        }
        if (nearestEnemy && nearestDist <= 10) {
          this._enemyLevelUp(nearestEnemy, this.ui);
          this.ui.addMessage('ぼうれい武者の怨念が' + nearestEnemy.name + 'に乗り移った！', 'enemy_special');
        }
      }

      // Drop loot when enemy dies
      if (!enemy.isShopkeeper) {
        var shouldDrop = enemy.guaranteedDrop || (ENEMY_DATA[enemy.enemyId] && ENEMY_DATA[enemy.enemyId].guaranteedDrop);
        var dropRoll = Math.random();
        var enemyDropRate = B('items.enemyDropRate', 0.15);
        var goldDropRate = B('items.goldDropRate', 0.15);
        if (shouldDrop || dropRoll < enemyDropRate) {
          // guaranteed or enemyDropRate% chance: drop something
          if (!shouldDrop && Math.random() < goldDropRate) {
            // ~2% overall: drop gold
            var goldAmount = Math.floor(10 + Math.random() * (20 + this.floorNum * 10));
            var goldItem = this._createGoldItem(enemy.x, enemy.y, goldAmount);
            this.items.push(goldItem);
          } else {
            // guaranteed drop or ~13% overall: drop a random item
            var droppedKey = this._pickItemForFloor(this.floorNum);
            var droppedItem = new Item(enemy.x, enemy.y, droppedKey);
            this.items.push(droppedItem);
          }
        }
        // 85% chance: drop nothing (unless guaranteedDrop)
      }
    }
  };

  Game.prototype.enemyAttack = function(enemy) {
    var player = this.player;

    player.wakeUp(this.ui);

    // Nigiri special
    if (enemy.special === 'onigiri' && !enemy.sealed && Math.random() < 0.1) {
      var nonEquipped = [];
      for (var i = 0; i < player.inventory.length; i++) {
        var it = player.inventory[i];
        if (it !== player.weapon && it !== player.shield) {
          nonEquipped.push(i);
        }
      }
      if (nonEquipped.length > 0) {
        var targetIdx = nonEquipped[Math.floor(Math.random() * nonEquipped.length)];
        var targetItem = player.inventory[targetIdx];
        var oldName = targetItem.getDisplayName();
        var onigiri = new Item(0, 0, 'onigiri');
        player.inventory[targetIdx] = onigiri;
        this.ui.addMessage('にぎり見習いに' + oldName + 'をおにぎりにされた！', 'enemy_special');
        return;
      }
    }

    // Critical hit check
    var isCritical = false;
    if (enemy.special === 'critical' && Math.random() < 0.25) {
      isCritical = true;
    }

    var rawDmg = enemy.attack - player.defense + Math.floor(Math.random() * B('combat.damageVariance', 3)) - 1;
    var damage = Math.max(B('combat.minDamage', 1), rawDmg);

    if (isCritical) {
      damage *= 2;
      this.ui.addMessage(enemy.name + 'の痛恨の一撃！ ' + damage + 'ダメージ！', 'enemy_special');
    } else {
      this.ui.addMessage(enemy.name + 'の攻撃！ ' + damage + 'ダメージを受けた', 'damage');
    }

    // Apply shield seal effects
    if (player.shield && player.shield.seals) {
      var shieldSeals = player.shield.seals;
      for (var ssi = 0; ssi < shieldSeals.length; ssi++) {
        if (shieldSeals[ssi] === 'counter' && !enemy.dead) {
          var counterDmg = Math.max(1, Math.floor(damage * B('combat.counterReflect', 0.3)));
          var counterDied = enemy.takeDamage(counterDmg);
          this.ui.addMessage('[返]印の反撃！ ' + enemy.name + 'に' + counterDmg + 'ダメージ', 'attack');
          if (counterDied) {
            player.enemiesKilled++;
            if (enemy.swallowedItems && enemy.swallowedItems.length > 0) {
              this._dropMazerunItems(enemy, this.ui);
            }
            this.ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得', 'attack');
            player.gainExp(enemy.exp, this.ui);
          }
        }
      }
    }

    if (player.godMode || player.hasStatusEffect('invincible')) damage = 0;
    // Protect incense: 50% damage reduction
    if (damage > 0 && this.activeIncense && this.activeIncense.effect === 'protect') {
      damage = Math.max(1, Math.floor(damage * 0.5));
    }
    if (damage > 0) {
      Sound.play('damage');
      this.addFloatingText(player.x, player.y, '-' + damage, '#ef5350');
      // Red tint animation on player
      this.animations.push({ type: 'red_tint', x: player.x, y: player.y, frame: 0, maxFrames: 4, data: {} });
      // Screen shake on heavy damage or critical
      if (isCritical) {
        this.shakeFrames = 8;
      } else if (damage > 10) {
        this.shakeFrames = 5;
      } else {
        this.shakeFrames = 2;
      }
    }
    player.hp -= damage;

    // --- Enemy specials on attack ---

    // Gamara: steal gold
    if (enemy.special === 'steal_gold' && !enemy.sealed && !player.godMode && damage > 0) {
      var stealAmount = Math.min(player.gold, 10 + Math.floor(Math.random() * 41));
      if (stealAmount > 0) {
        player.gold -= stealAmount;
        this.ui.addMessage('ガマラに' + stealAmount + 'ギタンを盗まれた！', 'enemy_special');
        enemy._fleeing = true; // flag for flee AI
      }
    }

    // Nusutto-todo: steal item
    if (enemy.special === 'steal_item' && !enemy.sealed && !player.godMode) {
      var nonEquipped2 = [];
      for (var si = 0; si < player.inventory.length; si++) {
        var sItem = player.inventory[si];
        if (sItem !== player.weapon && sItem !== player.shield && sItem !== player.bracelet) {
          nonEquipped2.push(si);
        }
      }
      if (nonEquipped2.length > 0 && Math.random() < 0.5) {
        var stolenIdx = nonEquipped2[Math.floor(Math.random() * nonEquipped2.length)];
        var stolenItem = player.inventory[stolenIdx];
        player.inventory.splice(stolenIdx, 1);
        this.ui.addMessage('ぬすっトドに' + stolenItem.getDisplayName() + 'を盗まれた！', 'enemy_special');
        // Warp away
        var warpRoom = this.dungeon.rooms[Math.floor(Math.random() * this.dungeon.rooms.length)];
        var wx = warpRoom.x + 1 + Math.floor(Math.random() * (warpRoom.w - 2));
        var wy = warpRoom.y + 1 + Math.floor(Math.random() * (warpRoom.h - 2));
        enemy.moveTo(wx, wy);
        this.ui.addMessage('ぬすっトドはどこかへ消えた！', 'enemy_special');
      }
    }

    // Kengo: disarm
    if (enemy.special === 'disarm' && !enemy.sealed && !player.godMode && Math.random() < 0.2) {
      if (player.weapon && Math.random() < 0.5) {
        var disarmedItem = player.weapon;
        player.weapon = null;
        player._recalcStats();
        player.removeFromInventory(disarmedItem);
        // Place behind player
        var behindX = player.x - (enemy.x - player.x);
        var behindY = player.y - (enemy.y - player.y);
        if (behindX >= 0 && behindX < this.dungeon.width && behindY >= 0 && behindY < this.dungeon.height &&
            this.dungeon.grid[behindY][behindX] !== Dungeon.TILE.WALL) {
          disarmedItem.x = behindX;
          disarmedItem.y = behindY;
        } else {
          disarmedItem.x = player.x;
          disarmedItem.y = player.y;
        }
        this.items.push(disarmedItem);
        this.ui.addMessage('ケンゴウに武器を弾き飛ばされた！', 'enemy_special');
      } else if (player.shield) {
        var disarmedShield = player.shield;
        player.shield = null;
        player._recalcStats();
        player.removeFromInventory(disarmedShield);
        var behindX2 = player.x - (enemy.x - player.x);
        var behindY2 = player.y - (enemy.y - player.y);
        if (behindX2 >= 0 && behindX2 < this.dungeon.width && behindY2 >= 0 && behindY2 < this.dungeon.height &&
            this.dungeon.grid[behindY2][behindX2] !== Dungeon.TILE.WALL) {
          disarmedShield.x = behindX2;
          disarmedShield.y = behindY2;
        } else {
          disarmedShield.x = player.x;
          disarmedShield.y = player.y;
        }
        this.items.push(disarmedShield);
        this.ui.addMessage('ケンゴウに盾を弾き飛ばされた！', 'enemy_special');
      }
    }

    // Poison sting (scorpion): reduce strength
    if (enemy.special === 'poison_sting' && !enemy.sealed && !player.godMode && Math.random() < 0.5) {
      player.strength = Math.max(0, (player.strength || 8) - 1);
      player._recalcStats();
      this.ui.addMessage('ちからが1下がった！', 'enemy_special');
    }

    // Max strength down (scorpion tier 2+): reduce max strength
    if (enemy.special === 'max_strength_down' && !enemy.sealed && !player.godMode && Math.random() < 0.5) {
      player.maxStrength = Math.max(1, (player.maxStrength || 8) - 1);
      player.strength = Math.min(player.strength || 8, player.maxStrength);
      player._recalcStats();
      this.ui.addMessage('ちからの最大値が1下がった！', 'enemy_special');
    }

    // Drain fullness (polygon): reduce max satiety
    if (enemy.special === 'drain_fullness' && !enemy.sealed && !player.godMode && Math.random() < 0.5) {
      player.maxSatiety = Math.max(10, (player.maxSatiety || 100) - 5);
      player.satiety = Math.min(player.satiety, player.maxSatiety);
      this.ui.addMessage('最大満腹度が5下がった！', 'enemy_special');
    }

    // Drain fullness strong (polygon tier 2): reduce max satiety by 7
    if (enemy.special === 'drain_fullness_strong' && !enemy.sealed && !player.godMode && Math.random() < 0.5) {
      player.maxSatiety = Math.max(10, (player.maxSatiety || 100) - 7);
      player.satiety = Math.min(player.satiety, player.maxSatiety);
      this.ui.addMessage('最大満腹度が7下がった！', 'enemy_special');
    }

    // Curse item (higher-rank slime family): curse a random inventory item
    if (enemy.special === 'curse_item' && !enemy.sealed && !player.godMode && Math.random() < 0.3) {
      var curseable = [];
      for (var ci = 0; ci < player.inventory.length; ci++) {
        if (!player.inventory[ci].cursed) {
          curseable.push(ci);
        }
      }
      if (curseable.length > 0) {
        var curseIdx = curseable[Math.floor(Math.random() * curseable.length)];
        var cursedItem = player.inventory[curseIdx];
        cursedItem.cursed = true;
        this.ui.addMessage(cursedItem.getDisplayName() + 'が呪われた！', 'enemy_special');
      }
    }

    // Erase seal (chidoro): erase a random seal from equipped weapon or shield
    if (enemy.special === 'erase_seal' && !enemy.sealed && !player.godMode && Math.random() < 0.2) {
      var sealTargets = [];
      if (player.weapon && player.weapon.seals && player.weapon.seals.length > 0) {
        sealTargets.push({ item: player.weapon, type: 'weapon' });
      }
      if (player.shield && player.shield.seals && player.shield.seals.length > 0) {
        sealTargets.push({ item: player.shield, type: 'shield' });
      }
      if (sealTargets.length > 0) {
        var target = sealTargets[Math.floor(Math.random() * sealTargets.length)];
        var sealIdx = Math.floor(Math.random() * target.item.seals.length);
        var erasedSeal = target.item.seals[sealIdx];
        var sealName = SEAL_DATA[erasedSeal] ? SEAL_DATA[erasedSeal].name : erasedSeal;
        target.item.seals.splice(sealIdx, 1);
        player._recalcStats();
        this.ui.addMessage('[' + sealName + ']の印が消された！', 'enemy_special');
      }
    }

    // Midoro: rust equipment
    if (enemy.special === 'rust_equipment' && !enemy.sealed && !player.godMode && player.shield) {
      var rustShield2 = player.shield;
      var hasRustProofMidoro = rustShield2.seals && rustShield2.seals.indexOf('rust_proof') !== -1;
      if (hasRustProofMidoro) {
        this.ui.addMessage('ミドロの攻撃！ しかし[金]印が盾を守った！', 'system');
      } else {
        if (rustShield2.plus > 0) {
          rustShield2.plus--;
        } else {
          rustShield2.defense = Math.max(0, rustShield2.defense - 1);
        }
        player._recalcStats();
        this.ui.addMessage('ミドロの攻撃で盾が錆びた！ 防御力が下がった', 'enemy_special');
      }
    }

    // Counter shield (legacy special property check)
    if (player.shield && player.shield.special === 'counter' && !enemy.dead) {
      var counterDmg2 = Math.max(1, Math.floor(damage * B('combat.counterReflect', 0.3)));
      var died = enemy.takeDamage(counterDmg2);
      this.ui.addMessage('バトルカウンターの反撃！ ' + enemy.name + 'に' + counterDmg2 + 'ダメージ', 'attack');
      if (died) {
        player.enemiesKilled++;
        if (enemy.swallowedItems && enemy.swallowedItems.length > 0) {
          this._dropMazerunItems(enemy, this.ui);
        }
        this.ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得', 'attack');
        player.gainExp(enemy.exp, this.ui);
      }
    }

    if (player.hp <= 0) {
      this._checkPlayerDeath();
    }
  };

  // --- Monster family promotion/demotion using FAMILY_MAP ---

  // Helper: find next/prev in family
  function _findFamilyNeighbor(enemyId, direction) {
    var data = ENEMY_DATA[enemyId];
    if (!data || !data.family) return null;
    var familyList = FAMILY_MAP[data.family];
    if (!familyList) return null;
    var idx = familyList.indexOf(enemyId);
    if (idx === -1) return null;
    var targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= familyList.length) return null;
    return familyList[targetIdx];
  }

  // Apply family data to an enemy (preserving position, swallowed items, etc.)
  function _applyEnemyData(enemy, newId) {
    var data = ENEMY_DATA[newId];
    if (!data) return;
    enemy.enemyId = newId;
    enemy.name = data.name;
    enemy.char = data.char;
    enemy.color = data.color;
    enemy.maxHp = data.hp;
    enemy.hp = data.hp;
    enemy.attack = data.attack;
    enemy.defense = data.defense;
    enemy.exp = data.exp;
    enemy.special = data.special;
    if (data.swallowCapacity) {
      enemy.swallowCapacity = data.swallowCapacity;
      if (!enemy.swallowedItems) enemy.swallowedItems = [];
    }
    if (data.guaranteedDrop) {
      enemy.guaranteedDrop = true;
    }
  }

  // Level up an enemy (family promotion or stat boost)
  Game.prototype._enemyLevelUp = function(enemy, ui) {
    var nextId = _findFamilyNeighbor(enemy.enemyId, 1);
    if (nextId && ENEMY_DATA[nextId]) {
      _applyEnemyData(enemy, nextId);
    } else {
      // No family promotion: stats x1.5, add 強化 prefix
      enemy.maxHp = Math.floor(enemy.maxHp * 1.5);
      enemy.hp = enemy.maxHp;
      enemy.attack = Math.floor(enemy.attack * 1.5);
      enemy.defense = Math.floor(enemy.defense * 1.5);
      enemy.exp = Math.floor(enemy.exp * 1.5);
      if (enemy.name.indexOf('強化') === -1) {
        enemy.name = '強化' + enemy.name;
      }
    }
  };

  // Level down an enemy (family demotion or stat reduction)
  Game.prototype._enemyLevelDown = function(enemy, ui) {
    var prevId = _findFamilyNeighbor(enemy.enemyId, -1);
    if (prevId && ENEMY_DATA[prevId]) {
      var data = ENEMY_DATA[prevId];
      _applyEnemyData(enemy, prevId);
      enemy.hp = Math.min(enemy.hp, data.hp); // don't heal on demotion
    } else {
      // No family demotion: stats x0.5, add 弱化 prefix
      enemy.maxHp = Math.max(1, Math.floor(enemy.maxHp * 0.5));
      enemy.hp = Math.min(enemy.hp, enemy.maxHp);
      enemy.attack = Math.max(1, Math.floor(enemy.attack * 0.5));
      enemy.defense = Math.max(0, Math.floor(enemy.defense * 0.5));
      enemy.exp = Math.max(1, Math.floor(enemy.exp * 0.5));
      if (enemy.name.indexOf('弱化') === -1) {
        enemy.name = '弱化' + enemy.name;
      }
    }
  };

  // --- マゼルン synthesis: drop swallowed items on death ---
  Game.prototype._dropMazerunItems = function(enemy, ui) {
    var items = enemy.swallowedItems;
    if (!items || items.length === 0) return;

    // Separate items by type
    var weapons = [];
    var shields = [];
    var grasses = [];
    var others = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type === 'weapon') weapons.push(items[i]);
      else if (items[i].type === 'shield') shields.push(items[i]);
      else if (items[i].type === 'grass') grasses.push(items[i]);
      else others.push(items[i]);
    }

    // Synthesize weapons (reuse 合成の壺 logic)
    if (weapons.length >= 2) {
      var baseW = weapons[0];
      for (var w = 1; w < weapons.length; w++) {
        var srcW = weapons[w];
        baseW.plus = (baseW.plus || 0) + (srcW.plus || 0);
        baseW.modifier = (baseW.modifier || 0) + (srcW.modifier || 0);
        baseW.attack = (baseW.attack || 0) + (srcW.modifier || 0);
        if (!baseW.seals) baseW.seals = [];
        var maxWSeals = baseW.slots || 3;
        if (srcW.seals) {
          for (var si = 0; si < srcW.seals.length; si++) {
            if (baseW.seals.length >= maxWSeals) break;
            if (baseW.seals.indexOf(srcW.seals[si]) === -1) {
              baseW.seals.push(srcW.seals[si]);
            }
          }
        }
      }
      ui.addMessage('合成成功！ ' + baseW.getDisplayName(), 'heal');
      // Only the base weapon drops
      weapons = [baseW];
    }

    // Apply grass seals to weapon if weapon exists
    if (weapons.length >= 1 && grasses.length > 0) {
      var targetW = weapons[0];
      if (!targetW.seals) targetW.seals = [];
      var maxSlots = targetW.slots || 3;
      for (var gi = 0; gi < grasses.length; gi++) {
        var grassSeal = this._getGrassSeal(grasses[gi]);
        if (grassSeal && targetW.seals.length < maxSlots && targetW.seals.indexOf(grassSeal) === -1) {
          targetW.seals.push(grassSeal);
          ui.addMessage(grasses[gi].name + 'の印が合成された！', 'heal');
        }
      }
      grasses = []; // consumed
    }

    // Synthesize shields
    if (shields.length >= 2) {
      var baseS = shields[0];
      for (var s = 1; s < shields.length; s++) {
        var srcS = shields[s];
        baseS.plus = (baseS.plus || 0) + (srcS.plus || 0);
        baseS.modifier = (baseS.modifier || 0) + (srcS.modifier || 0);
        baseS.defense = (baseS.defense || 0) + (srcS.modifier || 0);
        if (!baseS.seals) baseS.seals = [];
        var maxSSeals = baseS.slots || 3;
        if (srcS.seals) {
          for (var ssi = 0; ssi < srcS.seals.length; ssi++) {
            if (baseS.seals.length >= maxSSeals) break;
            if (baseS.seals.indexOf(srcS.seals[ssi]) === -1) {
              baseS.seals.push(srcS.seals[ssi]);
            }
          }
        }
      }
      ui.addMessage('合成成功！ ' + baseS.getDisplayName(), 'heal');
      shields = [baseS];
    }

    // Drop all remaining items on the floor
    var allDrops = weapons.concat(shields).concat(grasses).concat(others);
    for (var d = 0; d < allDrops.length; d++) {
      var dropItem = allDrops[d];
      dropItem.x = enemy.x;
      dropItem.y = enemy.y;
      this.items.push(dropItem);
      ui.addMessage(enemy.name + 'の胃袋から' + dropItem.getDisplayName() + 'が出てきた！', 'pickup');
    }
  };

  // Get seal key from grass item for synthesis
  Game.prototype._getGrassSeal = function(grass) {
    // Map grass effects to seal keys (same as 合成の壺 would)
    var grassSealMap = {
      'heal': 'heal_seal',       // 薬草 → 回
      'cure_poison': 'poison_resist', // 毒消し草
      'fire_breath': 'dragon',   // ドラゴン草 → 竜
      'sleep_self': null,
      'confuse_self': null,
      'warp': null,
      'sight': null,
      'levelup': null,
      'leveldown': null,
      'invincible': null,
      'strength': null
    };
    return grassSealMap[grass.effect] || null;
  };

  // --- Gitan Throw (ギタン投げ) ---
  Game.prototype.throwGold = function(dx, dy) {
    var player = this.player;
    var ui = this.ui;

    var amount = Math.min(player.gold, 999);
    if (amount <= 0) {
      ui.addMessage('ギタンを持っていない', 'system');
      return false;
    }

    // Trace line in direction
    var x = player.x + dx;
    var y = player.y + dy;
    while (x >= 0 && x < this.dungeon.width && y >= 0 && y < this.dungeon.height) {
      if (this.dungeon.grid[y][x] === Dungeon.TILE.WALL) break;
      var enemy = this.getEnemyAt(x, y);
      if (enemy) {
        // 10% miss rate
        if (Math.random() < 0.1) {
          player.gold -= amount;
          ui.addMessage(amount + 'ギタンを投げたが外れた！', 'system');
          return true;
        }
        // Hit!
        var damage = amount;
        var died = enemy.takeDamage(damage);
        player.gold -= amount;
        ui.addMessage(amount + 'ギタンを投げた！' + enemy.name + 'に' + damage + 'ダメージ！', 'damage');
        this.addFloatingText(x, y, '-' + damage, '#ffd700');
        Sound.play('hit');
        if (died) {
          player.enemiesKilled++;
          Sound.play('kill');
          ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得', 'attack');
          player.gainExp(enemy.exp, ui);
        }
        return true;
      }
      x += dx;
      y += dy;
    }
    // Missed (hit wall or out of bounds)
    player.gold -= amount;
    ui.addMessage(amount + 'ギタンを投げたが壁に当たった...', 'system');
    return true;
  };

  // --- Arrow shooting ---
  Game.prototype.shootArrow = function(item, dx, dy) {
    var player = this.player;
    var ui = this.ui;
    var self = this;

    // Decrement arrow count
    item.count = (item.count || 1) - 1;
    if (item.count <= 0) {
      player.removeFromInventory(item);
    }

    Sound.play('arrow');

    // Trace arrow path
    var arrowPath = [];
    var x = player.x + dx;
    var y = player.y + dy;
    var hitEnemy = null;

    while (x >= 0 && x < this.dungeon.width && y >= 0 && y < this.dungeon.height) {
      if (this.dungeon.grid[y][x] === Dungeon.TILE.WALL) break;
      var enemy = this.getEnemyAt(x, y);
      if (enemy) {
        hitEnemy = enemy;
        arrowPath.push({ x: x, y: y });
        break;
      }
      arrowPath.push({ x: x, y: y });
      x += dx;
      y += dy;
    }

    // Animate then apply
    var arrowItem = { char: ')', color: item.color || '#a1887f' };
    this._animateThrow(arrowItem, arrowPath, function() {
      if (hitEnemy) {
        var arrowDmg = Math.max(1, (item.damage || 3) - Math.floor(hitEnemy.defense / 2));
        var died = hitEnemy.takeDamage(arrowDmg);
        ui.addMessage(item.name + 'が' + hitEnemy.name + 'に命中！ ' + arrowDmg + 'ダメージ', 'attack');
        if (died) {
          Sound.play('kill');
          player.enemiesKilled++;
          if (hitEnemy.swallowedItems && hitEnemy.swallowedItems.length > 0) {
            self._dropMazerunItems(hitEnemy, ui);
          }
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
      } else {
        // Miss: 50% chance arrow lands on the ground
        var lastPos = arrowPath.length > 0 ? arrowPath[arrowPath.length - 1] : null;
        if (lastPos && Math.random() < 0.5) {
          var droppedArrow = new Item(lastPos.x, lastPos.y, item.dataKey);
          droppedArrow.count = 1;
          self.items.push(droppedArrow);
          ui.addMessage(item.name + 'は外れて地面に落ちた', 'system');
        } else {
          ui.addMessage(item.name + 'は外れた', 'system');
        }
      }
    });

    return true;
  };

  // --- Throw mechanic ---
  Game.prototype.throwItem = function(item, dx, dy) {
    var player = this.player;
    var ui = this.ui;
    var self = this;

    if (player.weapon === item) {
      player.weapon = null;
      player._recalcStats();
    }
    if (player.shield === item) {
      player.shield = null;
      player._recalcStats();
    }
    if (player.bracelet === item) {
      player.bracelet = null;
      player._recalcStats();
    }
    player.removeFromInventory(item);

    // Collect throw path for animation
    var throwPath = [];
    var x = player.x + dx;
    var y = player.y + dy;
    var hitEnemy = null;

    while (x >= 0 && x < this.dungeon.width && y >= 0 && y < this.dungeon.height) {
      if (this.dungeon.grid[y][x] === Dungeon.TILE.WALL) break;

      var enemy = this.getEnemyAt(x, y);
      if (enemy) {
        hitEnemy = enemy;
        throwPath.push({ x: x, y: y });
        break;
      }
      throwPath.push({ x: x, y: y });
      x += dx;
      y += dy;
    }

    // Animate throw then apply effect
    this._animateThrow(item, throwPath, function() {
      self._applyThrowEffect(item, hitEnemy, ui, player);
    });

    return true;
  };

  // Throw animation: item char moves tile by tile
  Game.prototype._animateThrow = function(item, path, callback) {
    if (path.length === 0) {
      callback();
      return;
    }

    var self = this;
    var renderer = window._renderer;
    var idx = 0;

    // Create a temporary overlay element for the thrown item
    var canvas = document.getElementById('game-canvas');
    var overlay = document.createElement('canvas');
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(overlay);
    var octx = overlay.getContext('2d');
    octx.font = 'bold 16px monospace';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';

    var TILE_SIZE = 24;
    var viewW = renderer.viewW;
    var viewH = renderer.viewH;
    var player = this.player;
    var dungeon = this.dungeon;
    var camX = player.x - Math.floor(viewW / 2);
    var camY = player.y - Math.floor(viewH / 2);
    camX = Math.max(0, Math.min(camX, dungeon.width - viewW));
    camY = Math.max(0, Math.min(camY, dungeon.height - viewH));

    function step() {
      if (idx >= path.length) {
        overlay.remove();
        callback();
        return;
      }
      octx.clearRect(0, 0, overlay.width, overlay.height);
      var p = path[idx];
      var sx = (p.x - camX) * TILE_SIZE + TILE_SIZE / 2;
      var sy = (p.y - camY) * TILE_SIZE + TILE_SIZE / 2;
      octx.fillStyle = item.color || '#fff';
      octx.fillText(item.char, sx, sy);
      idx++;
      setTimeout(step, 50);
    }
    step();
  };

  // Apply throw effect after animation
  Game.prototype._applyThrowEffect = function(item, hitEnemy, ui, player) {
    if (hitEnemy) {
      // --- マゼルン family: swallow items instead of taking damage ---
      if (hitEnemy.special === 'swallow' && !hitEnemy.sealed) {
        if (!hitEnemy.swallowedItems) hitEnemy.swallowedItems = [];
        var capacity = hitEnemy.swallowCapacity || (ENEMY_DATA[hitEnemy.enemyId] && ENEMY_DATA[hitEnemy.enemyId].swallowCapacity) || 2;
        if (hitEnemy.swallowedItems.length < capacity) {
          hitEnemy.swallowedItems.push(item);
          ui.addMessage(hitEnemy.name + 'は' + item.getDisplayName() + 'を飲み込んだ！', 'enemy_special');
          return;
        }
        // At capacity: fall through to normal damage
      }

      // --- Grass thrown at enemy: apply effect ---
      if (item.type === 'grass') {
        switch (item.effect) {
          case 'heal':
            hitEnemy.hp = Math.min(hitEnemy.hp + (item.value || 25), hitEnemy.maxHp);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'のHPが回復した', 'attack');
            return;
          case 'strength':
            hitEnemy.attack += (item.value || 1);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'の攻撃力が上がった！', 'enemy_special');
            return;
          case 'cure_poison':
            var dmg = (hitEnemy.special === 'wallpass') ? 30 : 5;
            var died = hitEnemy.takeDamage(dmg);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に' + dmg + 'ダメージ', 'attack');
            if (died) {
              player.enemiesKilled++;
              ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
              player.gainExp(hitEnemy.exp, ui);
            }
            return;
          case 'sleep_self':
            if (!hitEnemy.immuneToStatus) {
              hitEnemy.sleeping = true;
              hitEnemy._sleepTurns = 5;
              ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'は眠ってしまった！', 'attack');
            } else {
              ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'には効かなかった', 'system');
            }
            return;
          case 'confuse_self':
            if (!hitEnemy.immuneToStatus) {
              hitEnemy.confused = 10;
              ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'は混乱した！', 'attack');
            } else {
              ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'には効かなかった', 'system');
            }
            return;
          case 'warp':
            var warpRooms = this.dungeon.rooms;
            var wr = warpRooms[Math.floor(Math.random() * warpRooms.length)];
            var ewx = wr.x + 1 + Math.floor(Math.random() * Math.max(1, wr.w - 2));
            var ewy = wr.y + 1 + Math.floor(Math.random() * Math.max(1, wr.h - 2));
            hitEnemy.moveTo(ewx, ewy);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'はどこかにワープした！', 'attack');
            return;
          case 'levelup':
            this._enemyLevelUp(hitEnemy, ui);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'のレベルが上がった！', 'enemy_special');
            return;
          case 'leveldown':
            this._enemyLevelDown(hitEnemy, ui);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'のレベルが下がった！', 'attack');
            return;
          case 'invincible':
            if (!hitEnemy.immuneToStatus) {
              hitEnemy._invincibleTurns = 10;
              ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'が無敵になった！', 'enemy_special');
            } else {
              ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'には効かなかった', 'system');
            }
            return;
          case 'fire_breath':
            var fbDied = hitEnemy.takeDamage(2);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に2ダメージ', 'attack');
            if (fbDied) {
              player.enemiesKilled++;
              ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
              player.gainExp(hitEnemy.exp, ui);
            }
            return;
          case 'sight':
            var sgDied = hitEnemy.takeDamage(2);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に2ダメージ', 'attack');
            if (sgDied) {
              player.enemiesKilled++;
              ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
              player.gainExp(hitEnemy.exp, ui);
            }
            return;
        }
      }

      // --- Pot thrown: pot breaks ---
      if (item.type === 'pot') {
        ui.addMessage(item.getDisplayName() + 'を投げた。壺が割れた！', 'attack');
        if (item.effect === 'heal') {
          var healAmount = 100;
          player.hp = Math.min(player.hp + healAmount, player.maxHp);
          ui.addMessage('回復の壺の効果でHPが回復した！', 'heal');
        }
        if (item.contents && item.contents.length > 0) {
          for (var ci = 0; ci < item.contents.length; ci++) {
            var content = item.contents[ci];
            content.x = hitEnemy.x;
            content.y = hitEnemy.y;
            this.items.push(content);
          }
          ui.addMessage('壺の中身が散らばった', 'system');
        }
        var potDied = hitEnemy.takeDamage(2);
        if (potDied) {
          player.enemiesKilled++;
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
        return;
      }

      // --- Gold thrown: damage = amount / 10 ---
      if (item.isGold || item.type === 'gold') {
        var goldDmg = Math.max(1, Math.floor((item.goldAmount || 0) / 10));
        var goldDied = hitEnemy.takeDamage(goldDmg);
        ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に' + goldDmg + 'ダメージ', 'attack');
        if (goldDied) {
          player.enemiesKilled++;
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
        return;
      }

      // --- Default: 2 damage ---
      var damage = 2;
      var died2 = hitEnemy.takeDamage(damage);
      ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に' + damage + 'ダメージ', 'attack');
      if (died2) {
        player.enemiesKilled++;
        ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
        player.gainExp(hitEnemy.exp, ui);
      }
    } else {
      // Pot thrown at nothing: still breaks
      if (item.type === 'pot') {
        ui.addMessage(item.getDisplayName() + 'を投げた。壺が割れた！', 'system');
        if (item.effect === 'heal') {
          var healAmt = 100;
          player.hp = Math.min(player.hp + healAmt, player.maxHp);
          ui.addMessage('回復の壺の効果でHPが回復した！', 'heal');
        }
      } else {
        ui.addMessage(item.getDisplayName() + 'を投げた。何にも当たらなかった', 'system');
      }
    }
  };

  // --- Staff use ---
  Game.prototype.useStaff = function(item, dx, dy) {
    var player = this.player;
    var ui = this.ui;

    if (item.uses <= 0) {
      ui.addMessage('杖は使い切った', 'system');
      return false;
    }

    item.uses--;

    // Tunnel staff
    if (item.effect === 'tunnel') {
      var dugCount = 0;
      var tx = player.x + dx;
      var ty = player.y + dy;
      for (var i = 0; i < 10; i++) {
        if (tx < 1 || tx >= this.dungeon.width - 1 || ty < 1 || ty >= this.dungeon.height - 1) break;
        if (this.dungeon.grid[ty][tx] === Dungeon.TILE.WALL) {
          this.dungeon.grid[ty][tx] = Dungeon.TILE.CORRIDOR;
          dugCount++;
        }
        tx += dx;
        ty += dy;
      }
      if (dugCount > 0) {
        ui.addMessage('トンネルの杖を振った！壁が崩れた！', 'system');
      } else {
        ui.addMessage('杖を振ったが何も起きなかった', 'system');
      }
      if (item.uses === 0) {
        ui.addMessage(item.getDisplayName() + 'は使い切った', 'system');
      }
      return true;
    }

    // Find target
    var x = player.x + dx;
    var y = player.y + dy;
    var hitEnemy = null;

    while (x >= 0 && x < this.dungeon.width && y >= 0 && y < this.dungeon.height) {
      if (this.dungeon.grid[y][x] === Dungeon.TILE.WALL) break;
      var enemy = this.getEnemyAt(x, y);
      if (enemy) {
        hitEnemy = enemy;
        break;
      }
      x += dx;
      y += dy;
    }

    if (!hitEnemy) {
      // Self-targeting effects when staff hits nothing
      if (item.effect === 'heal_target') {
        var healed = Math.min(30, player.maxHp - player.hp);
        player.hp = Math.min(player.hp + 30, player.maxHp);
        ui.addMessage('回復の杖を自分に当てた！ HPが' + healed + '回復した', 'heal');
        this.addFloatingText(player.x, player.y, '+' + healed, '#66bb6a');
        if (item.uses === 0) ui.addMessage(item.getDisplayName() + 'は使い切った', 'system');
        return true;
      }
      if (item.effect === 'invisible') {
        this.playerInvisible = 20;
        ui.addMessage('透明になった！ 敵から見つからない！', 'heal');
        if (item.uses === 0) ui.addMessage(item.getDisplayName() + 'は使い切った', 'system');
        return true;
      }
      if (item.effect === 'decoy') {
        // Spawn decoy in front of player
        var decoyFx = player.x + dx;
        var decoyFy = player.y + dy;
        if (decoyFx >= 0 && decoyFx < this.dungeon.width && decoyFy >= 0 && decoyFy < this.dungeon.height &&
            this.dungeon.grid[decoyFy][decoyFx] !== Dungeon.TILE.WALL) {
          var decoyData2 = { char: '@', color: '#ffb74d', name: '身代わり', hp: 1, attack: 0, defense: 0, exp: 0 };
          var decoyEnemy2 = new Enemy(decoyFx, decoyFy, decoyData2, 'decoy');
          decoyEnemy2.isDecoy = true;
          decoyEnemy2._decoyTurns = 15;
          this.enemies.push(decoyEnemy2);
          ui.addMessage('身代わりの杖を振った！ 身代わりが現れた！', 'attack');
        } else {
          ui.addMessage('杖を振ったが何も起きなかった', 'system');
        }
        if (item.uses === 0) ui.addMessage(item.getDisplayName() + 'は使い切った', 'system');
        return true;
      }
      ui.addMessage('杖を振ったが何も当たらなかった', 'system');
      if (item.uses === 0) {
        ui.addMessage(item.getDisplayName() + 'は使い切った', 'system');
      }
      return true;
    }

    switch (item.effect) {
      case 'knockback':
        var pushed = 0;
        var ex = hitEnemy.x;
        var ey = hitEnemy.y;
        for (var ki = 0; ki < 5; ki++) {
          var nx = ex + dx;
          var ny = ey + dy;
          if (nx < 0 || nx >= this.dungeon.width || ny < 0 || ny >= this.dungeon.height) break;
          if (this.dungeon.grid[ny][nx] === Dungeon.TILE.WALL) {
            hitEnemy.takeDamage(5);
            ui.addMessage(hitEnemy.name + 'は壁に叩きつけられた！ 5ダメージ', 'attack');
            break;
          }
          if (this.getEnemyAt(nx, ny)) break;
          ex = nx;
          ey = ny;
          pushed++;
        }
        hitEnemy.moveTo(ex, ey);
        ui.addMessage(hitEnemy.name + 'を吹き飛ばした！', 'attack');
        if (hitEnemy.hp <= 0) {
          hitEnemy.dead = true;
          player.enemiesKilled++;
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
        break;

      case 'swap':
        var oldPx = player.x;
        var oldPy = player.y;
        player.moveTo(hitEnemy.x, hitEnemy.y);
        hitEnemy.moveTo(oldPx, oldPy);
        ui.addMessage(hitEnemy.name + 'と場所を入れ替えた！', 'attack');
        this.inShop = this.isInShop(player.x, player.y);
        this.checkSwapTheft(hitEnemy);
        break;

      case 'paralyze':
        if (hitEnemy.immuneToStatus) {
          ui.addMessage(hitEnemy.name + 'には効かなかった！', 'system');
        } else {
          hitEnemy.paralyzed = 10;
          ui.addMessage(hitEnemy.name + 'は金縛りになった！', 'attack');
        }
        break;

      case 'slow':
        if (hitEnemy.immuneToStatus) {
          ui.addMessage(hitEnemy.name + 'には効かなかった！', 'system');
        } else {
          hitEnemy.slowed = 15;
          ui.addMessage(hitEnemy.name + 'の足が鈍くなった！', 'attack');
        }
        break;

      case 'lightning':
        var lDied = hitEnemy.takeDamage(20);
        ui.addMessage('いかずちが' + hitEnemy.name + 'を直撃！ 20ダメージ', 'attack');
        if (lDied) {
          player.enemiesKilled++;
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
        break;

      case 'heal_target':
        hitEnemy.hp = Math.min(hitEnemy.hp + 30, hitEnemy.maxHp);
        ui.addMessage(hitEnemy.name + 'のHPが30回復した！', 'heal');
        this.addFloatingText(hitEnemy.x, hitEnemy.y, '+30', '#66bb6a');
        break;

      case 'decoy':
        // Spawn a decoy entity at the target location
        var decoyX = hitEnemy.x;
        var decoyY = hitEnemy.y;
        // Push the hit enemy away one tile if possible
        var pushX = decoyX + dx;
        var pushY = decoyY + dy;
        if (pushX >= 0 && pushX < this.dungeon.width && pushY >= 0 && pushY < this.dungeon.height &&
            this.dungeon.grid[pushY][pushX] !== Dungeon.TILE.WALL && !this.getEnemyAt(pushX, pushY)) {
          hitEnemy.moveTo(pushX, pushY);
        }
        // Create decoy as a special enemy
        var decoyData = { char: '@', color: '#ffb74d', name: '身代わり', hp: 1, attack: 0, defense: 0, exp: 0 };
        var decoyEnemy = new Enemy(decoyX, decoyY, decoyData, 'decoy');
        decoyEnemy.isDecoy = true;
        decoyEnemy._decoyTurns = 15;
        this.enemies.push(decoyEnemy);
        ui.addMessage('身代わりの杖を振った！ 身代わりが現れた！', 'attack');
        break;

      case 'seal':
        if (hitEnemy.immuneToStatus) {
          ui.addMessage(hitEnemy.name + 'には効かなかった！', 'system');
        } else {
          hitEnemy.sealed = true;
          ui.addMessage(hitEnemy.name + 'の特殊能力を封印した！', 'attack');
        }
        break;

      case 'invisible':
        if (hitEnemy.immuneToStatus) {
          ui.addMessage(hitEnemy.name + 'には効かなかった！', 'system');
        } else {
          hitEnemy.invisible = true;
          ui.addMessage(hitEnemy.name + 'が透明になった！ 見えない！', 'enemy_special');
        }
        break;
    }

    if (item.uses === 0) {
      ui.addMessage(item.getDisplayName() + 'は使い切った', 'system');
    }

    return true;
  };

  // --- Trap triggering ---
  Game.prototype.checkPlayerTrap = function() {
    var trap = this.getTrapAt(this.player.x, this.player.y);
    if (!trap) return;

    trap.visible = true;

    // Float bracelet: don't trigger traps
    if (this.player.bracelet && this.player.bracelet.effect === 'float') {
      this.ui.addMessage('浮遊の腕輪の効果で罠を回避した！', 'system');
      return;
    }

    Sound.play('trap');
    this.triggerTrap(trap, this.player);
  };

  Game.prototype.checkEnemyTrap = function(enemy) {
    // Enemies walk over traps without triggering them (Shiren-style)
    return;
  };

  Game.prototype.triggerTrap = function(trap, player) {
    var ui = this.ui;

    switch (trap.effect) {
      case 'explosion':
        var blastDmg = B('traps.landmineDamage', 20);
        // Fire resist incense negates explosion damage
        if (this.activeIncense && this.activeIncense.effect === 'fire_resist') {
          ui.addMessage('地雷が爆発した！ お香の効果で爆風を無効化した！', 'system');
          blastDmg = 0;
        } else {
          var hasBlastResist = (player.shield && player.shield.seals && player.shield.seals.indexOf('blast_resist') !== -1) ||
                               (player.shield && player.shield.special === 'blast_resist');
          if (hasBlastResist) {
            blastDmg = Math.floor(blastDmg * 0.5);
            ui.addMessage('地雷が爆発した！ [爆]印が爆風を防いだ！ ' + blastDmg + 'ダメージ', 'damage');
          } else {
            ui.addMessage('地雷が爆発した！ ' + blastDmg + 'ダメージ', 'damage');
          }
        }
        if (!player.godMode) player.hp -= blastDmg;
        for (var i = 0; i < this.enemies.length; i++) {
          var e = this.enemies[i];
          if (!e.dead && Math.abs(e.x - trap.x) <= 1 && Math.abs(e.y - trap.y) <= 1) {
            var eDied = e.takeDamage(15);
            ui.addMessage(e.name + 'に15ダメージ！', 'attack');
            if (eDied) {
              player.enemiesKilled++;
              ui.addMessage(e.name + 'を倒した！ 経験値' + e.exp + '獲得', 'attack');
              player.gainExp(e.exp, ui);
            }
          }
        }
        for (var j = this.items.length - 1; j >= 0; j--) {
          var it = this.items[j];
          if (Math.abs(it.x - trap.x) <= 1 && Math.abs(it.y - trap.y) <= 1) {
            ui.addMessage(it.getDisplayName() + 'が爆発で消滅した', 'system');
            this.shopItems.delete(it);
            this.items.splice(j, 1);
          }
        }
        trap.consumed = true;
        this._checkPlayerDeath();
        break;

      case 'pitfall':
        ui.addMessage('落とし穴に落ちた！', 'damage');
        if (!player.godMode) player.hp -= B('traps.pitfallDamage', 5);
        if (this._checkPlayerDeath()) break;
        if (this.floorNum >= 99) {
          this.victory = true;
          ui.addMessage('最果ての間を踏破した！ あなたは真の風来人だ！', 'levelup');
          ui.showVictory(player);
        } else {
          this.floorNum++;
          this.newFloor();
          ui.addMessage(this.floorNum + 'Fに落ちた', 'system');
        }
        break;

      case 'poison':
        ui.addMessage('毒矢が飛んできた！ ちからが下がった', 'damage');
        if (!player.godMode) player.hp -= B('traps.poisonArrowDamage', 5);
        player.strength = Math.max(0, (player.strength || 8) - 1);
        player._recalcStats();
        this._checkPlayerDeath();
        break;

      case 'sleep':
        if (this.activeIncense && this.activeIncense.effect === 'sleep_resist') {
          ui.addMessage('睡眠ガスを吸い込んだ！ ...しかしお香の効果で眠らなかった！', 'system');
        } else {
          ui.addMessage('睡眠ガスを吸い込んだ！', 'damage');
          player.sleepTurns = B('traps.sleepTurns', 5);
        }
        break;

      case 'confuse':
        ui.addMessage('目が回った！', 'damage');
        player.addStatusEffect('confused', B('traps.confuseTurns', 10), ui);
        break;

      case 'hunger':
        ui.addMessage('デロデロの罠！ 満腹度が下がった', 'damage');
        player.satiety = Math.max(0, player.satiety - B('traps.hungerDrain', 30));
        for (var k = 0; k < player.inventory.length; k++) {
          var inv = player.inventory[k];
          if (inv.type === 'food' && (inv.dataKey === 'onigiri' || inv.dataKey === 'big_onigiri')) {
            inv.cursed = true;
            inv.name = '腐った' + inv.name;
            inv.color = '#4a6741';
            ui.addMessage(inv.name + 'が腐ってしまった！', 'damage');
          }
        }
        break;

      case 'trip':
        ui.addMessage('転んで持ち物を落としてしまった！', 'damage');
        var droppable = [];
        for (var m = 0; m < player.inventory.length; m++) {
          var tripItem = player.inventory[m];
          if (tripItem !== player.weapon && tripItem !== player.shield) {
            droppable.push(tripItem);
          }
        }
        if (droppable.length > 0) {
          var dropped = droppable[Math.floor(Math.random() * droppable.length)];
          player.removeFromInventory(dropped);
          dropped.x = player.x;
          dropped.y = player.y;
          this.items.push(dropped);
          ui.addMessage(dropped.getDisplayName() + 'を落とした', 'system');
        }
        break;

      case 'rust':
        if (player.shield) {
          var shield = player.shield;
          var hasRustProof = shield.seals && shield.seals.indexOf('rust_proof') !== -1;
          if (hasRustProof) {
            ui.addMessage('サビの罠を踏んだ！ しかし[金]印が盾を守った！', 'system');
          } else {
            if (shield.plus > 0) {
              shield.plus--;
            } else {
              shield.defense = Math.max(0, shield.defense - 1);
            }
            player._recalcStats();
            ui.addMessage('盾が錆びた！ 防御力が1下がった', 'damage');
          }
        } else {
          ui.addMessage('サビの罠を踏んだ！ しかし盾を装備していない', 'system');
        }
        break;

      case 'arrow_wood':
      case 'arrow_iron':
        var isIron = trap.effect === 'arrow_iron';
        var arrowName = isIron ? '鉄の矢' : '木の矢';
        var arrowDmg = isIron ? B('traps.arrowIronDamage', 7) : B('traps.arrowWoodDamage', 3);
        var arrowDataKey = isIron ? 'arrow_iron' : 'arrow_wood';
        ui.addMessage(arrowName + 'が飛んできた！ ' + arrowDmg + 'ダメージ', 'damage');
        if (!player.godMode) player.hp -= arrowDmg;
        Sound.play('arrow');
        var droppedArrow = new Item(player.x, player.y, arrowDataKey);
        droppedArrow.count = 1;
        this.items.push(droppedArrow);
        ui.addMessage('足元に' + arrowName + 'が落ちた', 'system');
        this._checkPlayerDeath();
        break;
    }
  };

  Game.prototype.triggerTrapOnEnemy = function(trap, enemy) {
    var ui = this.ui;

    switch (trap.effect) {
      case 'explosion':
        ui.addMessage(enemy.name + 'が地雷を踏んだ！', 'attack');
        var eDied = enemy.takeDamage(20);
        if (eDied) {
          this.player.enemiesKilled++;
          ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得', 'attack');
          this.player.gainExp(enemy.exp, ui);
        }
        var px = this.player.x;
        var py = this.player.y;
        if (Math.abs(px - trap.x) <= 1 && Math.abs(py - trap.y) <= 1) {
          var blastDmg = 15;
          if (this.player.shield && this.player.shield.special === 'blast_resist') {
            blastDmg = Math.floor(blastDmg * 0.5);
          }
          if (!this.player.godMode) this.player.hp -= blastDmg;
          ui.addMessage('爆風で' + blastDmg + 'ダメージを受けた！', 'damage');
          this._checkPlayerDeath();
        }
        trap.consumed = true;
        break;

      case 'pitfall':
        ui.addMessage(enemy.name + 'が落とし穴に落ちた！', 'attack');
        enemy.dead = true;
        break;
    }
  };

})();
