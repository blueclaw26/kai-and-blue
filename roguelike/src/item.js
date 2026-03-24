// Item class
var Item = (function() {
  'use strict';

  function Item(x, y, dataKey) {
    var data = ITEM_DATA[dataKey];
    this.x = x;
    this.y = y;
    this.dataKey = dataKey;
    this.type = data.type;
    this.name = data.name;
    this.char = data.char;
    this.color = data.color;
    this.identified = true;
    this.cursed = false;

    if (data.attack !== undefined) this.attack = data.attack;
    if (data.defense !== undefined) this.defense = data.defense;
    if (data.slots !== undefined) this.slots = data.slots;
    if (data.effect !== undefined) this.effect = data.effect;
    if (data.value !== undefined) this.value = data.value;
    if (data.satiety !== undefined) this.satiety = data.satiety;
    if (data.uses !== undefined) this.uses = data.uses;
    if (data.special !== undefined) this.special = data.special;

    // Upgrade value for weapons/shields
    this.plus = 0;
  }

  Item.prototype.getDisplayName = function() {
    var name = this.name;
    // Show +N for weapons/shields
    if ((this.type === 'weapon' || this.type === 'shield') && this.plus !== 0) {
      name += (this.plus > 0 ? '+' : '') + this.plus;
    }
    if (this.type === 'weapon' && this.attack !== undefined) {
      var totalAtk = this.attack + this.plus;
      name += ' (攻撃+' + totalAtk + ')';
    } else if (this.type === 'shield' && this.defense !== undefined) {
      var totalDef = this.defense + this.plus;
      name += ' (防御+' + totalDef + ')';
    } else if (this.type === 'staff') {
      name += '[' + this.uses + ']';
    }
    return name;
  };

  // Get effective attack value (base + plus)
  Item.prototype.getEffectiveAttack = function() {
    return (this.attack || 0) + (this.plus || 0);
  };

  // Get effective defense value (base + plus)
  Item.prototype.getEffectiveDefense = function() {
    return (this.defense || 0) + (this.plus || 0);
  };

  Item.prototype.use = function(game, player) {
    var ui = game.ui;

    switch (this.type) {
      case 'grass':
        return this._useGrass(game, player);
      case 'scroll':
        return this._useScroll(game, player);
      case 'food':
        return this._useFood(game, player);
      case 'staff':
        return this._useStaff(game, player);
      case 'weapon':
      case 'shield':
        ui.addMessage('装備するには[E]キーを使おう', 'system');
        return false;
      default:
        ui.addMessage('このアイテムは使えない', 'system');
        return false;
    }
  };

  Item.prototype._useGrass = function(game, player) {
    var ui = game.ui;
    switch (this.effect) {
      case 'heal':
        var healed = Math.min(this.value, player.maxHp - player.hp);
        player.hp = Math.min(player.hp + this.value, player.maxHp);
        ui.addMessage(this.name + 'を飲んだ。HPが' + healed + '回復した', 'heal');
        return true;
      case 'strength':
        player.baseAttack = (player.baseAttack || player.attack) + this.value;
        ui.addMessage(this.name + 'を飲んだ。ちからが' + this.value + '上がった', 'heal');
        player._recalcStats();
        return true;
      case 'cure_poison':
        ui.addMessage(this.name + 'を飲んだ。体が軽くなった', 'heal');
        return true;
      default:
        ui.addMessage(this.name + 'を飲んだ');
        return true;
    }
  };

  Item.prototype._useScroll = function(game, player) {
    var ui = game.ui;
    switch (this.effect) {
      case 'reveal_map':
        var dungeon = game.dungeon;
        for (var y = 0; y < dungeon.height; y++) {
          for (var x = 0; x < dungeon.width; x++) {
            if (dungeon.grid[y][x] !== Dungeon.TILE.WALL) {
              game.explored.add(x + ',' + y);
            }
          }
        }
        // Also reveal all traps on the floor
        if (game.traps) {
          for (var i = 0; i < game.traps.length; i++) {
            game.traps[i].visible = true;
          }
        }
        ui.addMessage(this.name + 'を読んだ。フロアの全体が明るくなった', 'system');
        return true;
      case 'confuse_enemies':
        var confused = 0;
        var visible = Renderer.computeFOV(player.x, player.y, game.dungeon);
        for (var i = 0; i < game.enemies.length; i++) {
          var e = game.enemies[i];
          if (!e.dead && visible[e.x + ',' + e.y]) {
            e.confused = 10;
            confused++;
          }
        }
        if (confused > 0) {
          ui.addMessage(this.name + 'を読んだ。周囲のモンスターが混乱した', 'attack');
        } else {
          ui.addMessage(this.name + 'を読んだ。しかし何も起きなかった', 'system');
        }
        return true;
      case 'powerup':
        // Upgrade equipped weapon or shield +1
        if (player.weapon) {
          player.weapon.plus = (player.weapon.plus || 0) + 1;
          player._recalcStats();
          ui.addMessage(this.name + 'を読んだ。' + player.weapon.name + 'が強化された！', 'heal');
        } else if (player.shield) {
          player.shield.plus = (player.shield.plus || 0) + 1;
          player._recalcStats();
          ui.addMessage(this.name + 'を読んだ。' + player.shield.name + 'が強化された！', 'heal');
        } else {
          player.powerupTurns = (player.powerupTurns || 0) + 20;
          ui.addMessage(this.name + 'を読んだ。攻撃力が上がった', 'heal');
        }
        return true;
      case 'identify':
        ui.addMessage(this.name + 'を読んだ。持ち物を識別した', 'system');
        return true;
      case 'weapon_upgrade':
        if (player.weapon) {
          player.weapon.plus = (player.weapon.plus || 0) + 1;
          player._recalcStats();
          ui.addMessage(this.name + 'を読んだ。' + player.weapon.name + 'の攻撃力が上がった！(+' + player.weapon.plus + ')', 'heal');
        } else {
          ui.addMessage(this.name + 'を読んだ。しかし武器を装備していない', 'system');
        }
        return true;
      case 'shield_upgrade':
        if (player.shield) {
          player.shield.plus = (player.shield.plus || 0) + 1;
          player._recalcStats();
          ui.addMessage(this.name + 'を読んだ。' + player.shield.name + 'の防御力が上がった！(+' + player.shield.plus + ')', 'heal');
        } else {
          ui.addMessage(this.name + 'を読んだ。しかし盾を装備していない', 'system');
        }
        return true;
      default:
        ui.addMessage(this.name + 'を読んだ');
        return true;
    }
  };

  Item.prototype._useFood = function(game, player) {
    var ui = game.ui;

    // Rotten onigiri gives bad effects
    if (this.cursed) {
      player.satiety = Math.max(0, player.satiety - 20);
      player.hp = Math.max(1, player.hp - 10);
      player.addStatusEffect('confused', 5, ui);
      ui.addMessage('腐ったおにぎりを食べた！ 気分が悪い...', 'damage');
      return true;
    }

    var maxSat = player.maxSatiety || 100;
    var oldSatiety = player.satiety;
    player.satiety = Math.min(player.satiety + this.satiety, maxSat);
    var restored = Math.floor(player.satiety - oldSatiety);
    ui.addMessage(this.name + 'を食べた（満腹度+' + restored + '）', 'heal');
    // Reset hungry warning
    if (player.satiety > 10) {
      player._hungryWarned = false;
    }
    return true;
  };

  Item.prototype._useStaff = function(game, player) {
    var ui = game.ui;

    if (this.uses <= 0) {
      ui.addMessage('杖は使い切った', 'system');
      return false;
    }

    // Enter direction selection mode - don't consume yet
    // The actual use happens in the direction callback
    var self = this;
    ui.addMessage('どの方向に振る？（方向キーで選択、Escでキャンセル）', 'system');
    game.directionMode = {
      item: self,
      callback: function(dx, dy) {
        game.useStaff(self, dx, dy);
      }
    };
    return false; // Don't consume turn yet - direction mode handles it
  };

  // Pick an item from FLOOR_TABLE weighted for given floor
  function pickItemForFloor(floorNum) {
    var table = FLOOR_TABLE.items;
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
      return 'herb'; // fallback
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

  // Spawn items for a floor using FLOOR_TABLE
  Item.spawnForFloor = function(dungeon, floorNum, playerStartRoom) {
    var items = [];
    var count = 3 + Math.floor(Math.random() * 6); // 3-8

    var pCenter = {
      x: Math.floor(playerStartRoom.x + playerStartRoom.w / 2),
      y: Math.floor(playerStartRoom.y + playerStartRoom.h / 2)
    };

    for (var i = 0; i < count; i++) {
      var room = dungeon.rooms[Math.floor(Math.random() * dungeon.rooms.length)];
      var ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      var iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

      if (dungeon.grid[iy] && dungeon.grid[iy][ix] === Dungeon.TILE.STAIRS_DOWN) continue;
      if (ix === pCenter.x && iy === pCenter.y) continue;

      var occupied = false;
      for (var j = 0; j < items.length; j++) {
        if (items[j].x === ix && items[j].y === iy) { occupied = true; break; }
      }
      if (occupied) continue;

      var selectedKey = pickItemForFloor(floorNum);
      items.push(new Item(ix, iy, selectedKey));
    }

    return items;
  };

  return Item;
})();
