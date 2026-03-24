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

    // Type-specific properties
    if (data.attack !== undefined) this.attack = data.attack;
    if (data.defense !== undefined) this.defense = data.defense;
    if (data.slots !== undefined) this.slots = data.slots;
    if (data.effect !== undefined) this.effect = data.effect;
    if (data.value !== undefined) this.value = data.value;
    if (data.satiety !== undefined) this.satiety = data.satiety;
  }

  Item.prototype.getDisplayName = function() {
    var name = this.name;
    if (this.type === 'weapon' && this.attack !== undefined) {
      name += ' (攻撃+' + this.attack + ')';
    } else if (this.type === 'shield' && this.defense !== undefined) {
      name += ' (防御+' + this.defense + ')';
    }
    return name;
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
      case 'weapon':
      case 'shield':
        ui.addMessage('装備するには[E]キーを使おう');
        return false;
      default:
        ui.addMessage('このアイテムは使えない');
        return false;
    }
  };

  Item.prototype._useGrass = function(game, player) {
    var ui = game.ui;
    switch (this.effect) {
      case 'heal':
        var healed = Math.min(this.value, player.maxHp - player.hp);
        player.hp = Math.min(player.hp + this.value, player.maxHp);
        ui.addMessage(this.name + 'を飲んだ。HPが' + healed + '回復した');
        return true;
      case 'strength':
        player.baseAttack = (player.baseAttack || player.attack) + this.value;
        ui.addMessage(this.name + 'を飲んだ。ちからが' + this.value + '上がった');
        player._recalcStats();
        return true;
      case 'cure_poison':
        ui.addMessage(this.name + 'を飲んだ。体が軽くなった');
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
        // Reveal entire floor
        var dungeon = game.dungeon;
        for (var y = 0; y < dungeon.height; y++) {
          for (var x = 0; x < dungeon.width; x++) {
            if (dungeon.grid[y][x] !== Dungeon.TILE.WALL) {
              game.explored.add(x + ',' + y);
            }
          }
        }
        ui.addMessage(this.name + 'を読んだ。フロアの全体が明るくなった');
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
          ui.addMessage(this.name + 'を読んだ。周囲のモンスターが混乱した');
        } else {
          ui.addMessage(this.name + 'を読んだ。しかし何も起きなかった');
        }
        return true;
      case 'powerup':
        player.powerupTurns = (player.powerupTurns || 0) + 20;
        ui.addMessage(this.name + 'を読んだ。攻撃力が上がった');
        return true;
      case 'identify':
        ui.addMessage(this.name + 'を読んだ。持ち物を識別した');
        return true;
      default:
        ui.addMessage(this.name + 'を読んだ');
        return true;
    }
  };

  Item.prototype._useFood = function(game, player) {
    var ui = game.ui;
    player.satiety = Math.min((player.satiety || 100) + this.satiety, 200);
    ui.addMessage(this.name + 'を食べた（満腹度+' + this.satiety + '）');
    return true;
  };

  // Spawn items for a floor
  Item.spawnForFloor = function(dungeon, floorNum, playerStartRoom) {
    var items = [];
    var count = 3 + Math.floor(Math.random() * 6); // 3-8

    // Get eligible items and build weighted list
    var eligible = [];
    var totalWeight = 0;
    for (var key in ITEM_DATA) {
      var data = ITEM_DATA[key];
      if (floorNum >= (data.minFloor || 1)) {
        eligible.push({ key: key, weight: data.weight || 5 });
        totalWeight += (data.weight || 5);
      }
    }

    if (eligible.length === 0) return items;

    // Get rooms excluding player start
    var pCenter = {
      x: Math.floor(playerStartRoom.x + playerStartRoom.w / 2),
      y: Math.floor(playerStartRoom.y + playerStartRoom.h / 2)
    };

    for (var i = 0; i < count; i++) {
      // Pick random room
      var room = dungeon.rooms[Math.floor(Math.random() * dungeon.rooms.length)];

      // Random position in room
      var ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      var iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

      // Don't place on stairs or player start
      if (dungeon.grid[iy] && dungeon.grid[iy][ix] === Dungeon.TILE.STAIRS_DOWN) continue;
      if (ix === pCenter.x && iy === pCenter.y) continue;

      // Check no item already there
      var occupied = false;
      for (var j = 0; j < items.length; j++) {
        if (items[j].x === ix && items[j].y === iy) { occupied = true; break; }
      }
      if (occupied) continue;

      // Weighted random selection
      var roll = Math.random() * totalWeight;
      var cumulative = 0;
      var selectedKey = eligible[0].key;
      for (var k = 0; k < eligible.length; k++) {
        cumulative += eligible[k].weight;
        if (roll < cumulative) {
          selectedKey = eligible[k].key;
          break;
        }
      }

      items.push(new Item(ix, iy, selectedKey));
    }

    return items;
  };

  return Item;
})();
