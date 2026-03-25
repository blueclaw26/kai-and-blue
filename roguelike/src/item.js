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
    this.cursed = false;

    // Pot properties
    if (data.capacity !== undefined) {
      this.capacity = data.capacity;
      this.contents = [];
    }

    // Arrow count
    if (this.type === 'arrow') {
      this.count = 3 + Math.floor(Math.random() * 5); // 3-7 arrows per pickup
      if (data.damage !== undefined) this.damage = data.damage;
    }

    // Identification: weapons, shields, food, bracelets, arrows, and 脱出の巻物 are always identified
    if (this.type === 'weapon' || this.type === 'shield' || this.type === 'food' || this.type === 'bracelet' || this.type === 'arrow' || dataKey === 'scroll_escape') {
      this.identified = true;
    } else {
      // Check global identification table
      this.identified = window.IDENTIFIED_TYPES.has(dataKey);
    }

    if (data.attack !== undefined) this.attack = data.attack;
    if (data.defense !== undefined) this.defense = data.defense;
    if (data.slots !== undefined) this.slots = data.slots;
    if (data.effect !== undefined) this.effect = data.effect;
    if (data.value !== undefined) this.value = data.value;
    if (data.satiety !== undefined) this.satiety = data.satiety;
    if (data.uses !== undefined) this.uses = data.uses;
    if (data.special !== undefined) this.special = data.special;
    if (data.price !== undefined) this.price = data.price;

    // Seal system: weapons and shields have seal slots
    if (this.type === 'weapon' || this.type === 'shield') {
      this.seals = [];
      // Items that are "source" items for seals start with their innate seal
      var innateSeal = getSealForItem(this);
      if (innateSeal) {
        this.seals.push(innateSeal);
      }
    }

    // Upgrade value for weapons/shields
    this.plus = 0;

    // Shop tracking
    this.shopItem = false; // true if this item is merchandise in a shop
  }

  // Identify this item and register its type globally
  Item.prototype.identify = function() {
    this.identified = true;
    window.IDENTIFIED_TYPES.add(this.dataKey);
  };

  Item.prototype.getDisplayName = function() {
    var name;
    if (!this.identified && window.FAKE_NAME_MAP[this.dataKey]) {
      name = window.FAKE_NAME_MAP[this.dataKey];
    } else {
      name = this.name;
    }

    // Pot display
    if (this.type === 'pot') {
      var remaining = this.capacity - (this.contents ? this.contents.length : 0);
      name += '[' + remaining + ']';
      if (this.contents && this.contents.length > 0 && this.identified) {
        var contentNames = [];
        for (var ci = 0; ci < this.contents.length; ci++) {
          contentNames.push(this.contents[ci].getDisplayName());
        }
        name += '{' + contentNames.join(', ') + '}';
      }
      return name;
    }

    // Arrow display with count
    if (this.type === 'arrow') {
      return name + ' x' + (this.count || 1);
    }

    // Bracelet display
    if (this.type === 'bracelet') {
      return name;
    }

    // Show +N for weapons/shields
    if ((this.type === 'weapon' || this.type === 'shield') && this.plus !== 0) {
      name += (this.plus > 0 ? '+' : '') + this.plus;
    }
    // Show seals as kanji after name
    if ((this.type === 'weapon' || this.type === 'shield') && this.seals && this.seals.length > 0) {
      name += ' [' + getSealsDisplay(this.seals) + ']';
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

  // Get the real name (for identification reveal)
  Item.prototype.getRealDisplayName = function() {
    var name = this.name;
    if (this.type === 'pot') {
      var remaining = this.capacity - (this.contents ? this.contents.length : 0);
      name += '[' + remaining + ']';
      if (this.contents && this.contents.length > 0) {
        var contentNames = [];
        for (var ci = 0; ci < this.contents.length; ci++) {
          contentNames.push(this.contents[ci].getDisplayName());
        }
        name += '{' + contentNames.join(', ') + '}';
      }
      return name;
    }
    if ((this.type === 'weapon' || this.type === 'shield') && this.plus !== 0) {
      name += (this.plus > 0 ? '+' : '') + this.plus;
    }
    // Show seals
    if ((this.type === 'weapon' || this.type === 'shield') && this.seals && this.seals.length > 0) {
      name += ' [' + getSealsDisplay(this.seals) + ']';
    }
    if (this.type === 'weapon' && this.attack !== undefined) {
      name += ' (攻撃+' + (this.attack + this.plus) + ')';
    } else if (this.type === 'shield' && this.defense !== undefined) {
      name += ' (防御+' + (this.defense + this.plus) + ')';
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

  // Get buy price
  Item.prototype.getBuyPrice = function() {
    return this.price || 100;
  };

  // Get sell price (50% of buy)
  Item.prototype.getSellPrice = function() {
    return Math.floor(this.getBuyPrice() / 2);
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
      case 'arrow':
        return this._useArrow(game, player);
      case 'pot':
        ui.addMessage('壺に入れるには持ち物画面で[p]、取り出すには[o]を使おう', 'system');
        return false;
      case 'bracelet':
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
    // Using grass identifies it
    if (!this.identified) {
      var fakeName = this.getDisplayName();
      this.identify();
      ui.addMessage('それは' + this.name + 'だった！', 'pickup');
    }
    switch (this.effect) {
      case 'heal':
        var healed = Math.min(this.value, player.maxHp - player.hp);
        player.hp = Math.min(player.hp + this.value, player.maxHp);
        Sound.play('heal');
        ui.addMessage(this.name + 'を飲んだ。HPが' + healed + '回復した', 'heal');
        if (window._game) window._game.addFloatingText(player.x, player.y, '+' + healed, '#66bb6a');
        return true;
      case 'strength':
        player.baseAttack = (player.baseAttack || player.attack) + this.value;
        ui.addMessage(this.name + 'を飲んだ。ちからが' + this.value + '上がった', 'heal');
        player._recalcStats();
        return true;
      case 'cure_poison':
        ui.addMessage(this.name + 'を飲んだ。体が軽くなった', 'heal');
        return true;
      case 'sleep_self':
        player.sleepTurns = this.value || 5;
        ui.addMessage(this.name + 'を飲んだ。眠くなった...', 'damage');
        return true;
      case 'confuse_self':
        player.addStatusEffect('confused', this.value || 10, ui);
        ui.addMessage(this.name + 'を飲んだ。目が回る...', 'damage');
        return true;
      case 'warp':
        var rooms = game.dungeon.rooms;
        var warpRoom = rooms[Math.floor(Math.random() * rooms.length)];
        var wx = warpRoom.x + 1 + Math.floor(Math.random() * Math.max(1, warpRoom.w - 2));
        var wy = warpRoom.y + 1 + Math.floor(Math.random() * Math.max(1, warpRoom.h - 2));
        player.moveTo(wx, wy);
        ui.addMessage(this.name + 'を飲んだ。どこかにワープした！', 'system');
        return true;
      case 'sight':
        game.sightBoost = 50;
        ui.addMessage(this.name + 'を飲んだ。フロアの敵が見えるようになった！', 'heal');
        return true;
      case 'levelup':
        player.level++;
        player.maxHp += 3;
        player.hp = Math.min(player.hp + 3, player.maxHp);
        player.baseAttack += 1;
        player._recalcStats();
        Sound.play('levelup');
        ui.addMessage(this.name + 'を飲んだ。レベルが上がった！ Lv.' + player.level, 'levelup');
        if (window._game) window._game.addFloatingText(player.x, player.y, 'Lv UP!', '#e8a44a');
        return true;
      case 'leveldown':
        if (player.level > 1) {
          player.level--;
          player.maxHp = Math.max(10, player.maxHp - 3);
          player.hp = Math.min(player.hp, player.maxHp);
          player.baseAttack = Math.max(1, player.baseAttack - 1);
          player._recalcStats();
        }
        ui.addMessage(this.name + 'を飲んだ。レベルが下がった... Lv.' + player.level, 'damage');
        return true;
      case 'invincible':
        player.addStatusEffect('invincible', this.value || 20, ui);
        ui.addMessage(this.name + 'を飲んだ。体が黄金に輝いている！', 'heal');
        return true;
      case 'fire_breath':
        var fireDmg = this.value || 40;
        // Determine direction: use player's last move direction or default forward
        var fdx = player._lastDx || 0;
        var fdy = player._lastDy || 1;
        if (fdx === 0 && fdy === 0) fdy = 1;
        var fx = player.x + fdx;
        var fy = player.y + fdy;
        var hitCount = 0;
        while (fx >= 0 && fx < game.dungeon.width && fy >= 0 && fy < game.dungeon.height) {
          if (game.dungeon.grid[fy][fx] === Dungeon.TILE.WALL) break;
          var fireTarget = game.getEnemyAt(fx, fy);
          if (fireTarget) {
            var died = fireTarget.takeDamage(fireDmg);
            game.addFloatingText(fx, fy, '-' + fireDmg, '#f44336');
            hitCount++;
            if (died) {
              player.enemiesKilled++;
              ui.addMessage(fireTarget.name + 'を倒した！ 経験値' + fireTarget.exp + '獲得', 'attack');
              player.gainExp(fireTarget.exp, ui);
            }
          }
          fx += fdx;
          fy += fdy;
        }
        if (hitCount > 0) {
          ui.addMessage(this.name + 'を飲んだ。炎を吐いた！ ' + hitCount + '体に命中！', 'attack');
        } else {
          ui.addMessage(this.name + 'を飲んだ。炎を吐いたが何にも当たらなかった', 'system');
        }
        return true;
      default:
        ui.addMessage(this.name + 'を飲んだ');
        return true;
    }
  };

  Item.prototype._useScroll = function(game, player) {
    var ui = game.ui;
    // Shiren-style: effect fires first, THEN scroll is identified
    var wasIdentified = this.identified;
    var scrollName = this.name; // real name for messages after identification

    Sound.play('scroll');
    // Show generic "read a scroll" message if unidentified
    if (!wasIdentified) {
      ui.addMessage('巻物を読んだ...', 'system');
    }

    switch (this.effect) {
      case 'reveal_map':
        var dungeon = game.dungeon;
        for (var y = 0; y < dungeon.height; y++) {
          for (var x = 0; x < dungeon.width; x++) {
            if (dungeon.grid[y][x] !== Dungeon.TILE.WALL) {
              game.explored[y][x] = true;
            }
          }
        }
        // Set mapRevealed flag: shows all tiles, enemies, items (but NOT traps)
        game.mapRevealed = true;
        ui.addMessage('フロアの全体が明るくなった！', 'system');
        break;
      case 'confuse_enemies':
        var confused = 0;
        var visible = Renderer.computeFOV(player.x, player.y, game.dungeon);
        for (var i = 0; i < game.enemies.length; i++) {
          var e = game.enemies[i];
          if (!e.dead && visible[e.x + ',' + e.y] && !e.immuneToStatus) {
            e.confused = 10;
            confused++;
          }
        }
        if (confused > 0) {
          ui.addMessage('周囲のモンスターが混乱した！', 'attack');
        } else {
          ui.addMessage('しかし何も起きなかった', 'system');
        }
        break;
      case 'powerup':
        if (player.weapon) {
          player.weapon.plus = (player.weapon.plus || 0) + 1;
          player._recalcStats();
          ui.addMessage(player.weapon.name + 'が強化された！', 'heal');
        } else if (player.shield) {
          player.shield.plus = (player.shield.plus || 0) + 1;
          player._recalcStats();
          ui.addMessage(player.shield.name + 'が強化された！', 'heal');
        } else {
          player.powerupTurns = (player.powerupTurns || 0) + 20;
          ui.addMessage('攻撃力が上がった！', 'heal');
        }
        break;
      case 'identify':
        // Check if there are unidentified items in inventory
        var hasUnidentified = false;
        for (var i = 0; i < player.inventory.length; i++) {
          if (!player.inventory[i].identified) {
            hasUnidentified = true;
            break;
          }
        }
        // Identify the scroll itself now (before prompting)
        if (!wasIdentified) {
          this.identify();
          ui.addMessage('それは' + scrollName + 'だった！', 'pickup');
        }
        if (!hasUnidentified) {
          ui.addMessage('しかし未識別のアイテムがない', 'system');
          return true;
        }
        ui.addMessage('どのアイテムを識別する？', 'system');
        game.identifyMode = true;
        game.inventoryOpen = true;
        game.inventorySelection = 0;
        ui.renderInventory(game);
        return true;
      case 'weapon_upgrade':
        if (player.weapon) {
          player.weapon.plus = (player.weapon.plus || 0) + 1;
          player._recalcStats();
          ui.addMessage(player.weapon.name + 'の攻撃力が上がった！(+' + player.weapon.plus + ')', 'heal');
        } else {
          ui.addMessage('しかし武器を装備していない', 'system');
        }
        break;
      case 'shield_upgrade':
        if (player.shield) {
          player.shield.plus = (player.shield.plus || 0) + 1;
          player._recalcStats();
          ui.addMessage(player.shield.name + 'の防御力が上がった！(+' + player.shield.plus + ')', 'heal');
        } else {
          ui.addMessage('しかし盾を装備していない', 'system');
        }
        break;

      case 'sanctuary':
        // Place a sanctuary tile at player position
        game.sanctuaryTiles.add(player.x + ',' + player.y);
        ui.addMessage('聖域の巻物を読んだ！ この場所にモンスターは入れない', 'heal');
        break;

      case 'extinction':
        // Identify the scroll itself now (before prompting)
        if (!wasIdentified) {
          this.identify();
          ui.addMessage('それは' + scrollName + 'だった！', 'pickup');
        }
        // Find visible enemy types
        var visibleTypes = {};
        for (var ei = 0; ei < game.enemies.length; ei++) {
          var ve = game.enemies[ei];
          if (!ve.dead && game.visible[ve.y][ve.x] && ve.enemyId && !ve.isShopkeeper) {
            visibleTypes[ve.enemyId] = ve.name;
          }
        }
        var candidates = [];
        for (var eid in visibleTypes) {
          candidates.push({ id: eid, name: visibleTypes[eid] });
        }
        if (candidates.length === 0) {
          ui.addMessage('しかし対象となるモンスターが見えない', 'system');
          return true;
        }
        // Enter extinction selection mode
        game.extinctionMode = true;
        game.extinctionCandidates = candidates;
        game.extinctionSelection = 0;
        game.inventoryOpen = true;
        ui.addMessage('どのモンスターをねだやしにする？', 'system');
        ui.renderExtinctionSelect(game);
        return true;

      case 'great_hall':
        // Convert current floor to big room
        Dungeon.convertToBigRoom(game.dungeon);
        // Reveal everything
        for (var ghy = 0; ghy < game.dungeon.height; ghy++) {
          for (var ghx = 0; ghx < game.dungeon.width; ghx++) {
            game.explored[ghy][ghx] = true;
          }
        }
        game.mapRevealed = true;
        ui.addMessage('大部屋の巻物を読んだ！ フロアの壁が崩れた！', 'heal');
        break;

      case 'escape':
        if (game.floorNum >= 10) {
          game.victory = true;
          Sound.play('victory');
          ui.addMessage('脱出の巻物でダンジョンから脱出した！', 'levelup');
          ui.showVictory(player);
        } else {
          ui.addMessage('ダンジョンから脱出した...', 'system');
          game.gameOver = true;
          ui.addMessage(game.floorNum + 'Fで冒険を諦めた', 'damage');
          ui.showGameOver(game.floorNum, player.level);
        }
        break;

      default:
        if (wasIdentified) {
          ui.addMessage(scrollName + 'を読んだ', 'system');
        }
        break;
    }

    // Now identify the scroll (after effect) — Shiren style
    if (!wasIdentified && this.effect !== 'identify' && this.effect !== 'extinction') {
      this.identify();
      ui.addMessage('それは' + scrollName + 'だった！', 'pickup');
    }
    return true;
  };

  Item.prototype._useFood = function(game, player) {
    var ui = game.ui;

    // Rotten onigiri gives bad effects
    if (this.cursed) {
      ui.addMessage('うっ...腐ったおにぎりだった！', 'damage');
      if (!player.godMode) player.hp = Math.max(1, player.hp - 5);
      player.addStatusEffect('confused', 10, ui);
      var maxSat = player.maxSatiety || 100;
      player.satiety = Math.min(player.satiety + 20, maxSat);
      ui.addMessage('満腹度が少し回復した（+20）', 'system');
      game.addFloatingText(player.x, player.y, '-5', '#ef5350');
      return true;
    }

    var maxSat = player.maxSatiety || 100;
    var oldSatiety = player.satiety;
    player.satiety = Math.min(player.satiety + this.satiety, maxSat);
    var restored = Math.floor(player.satiety - oldSatiety);
    ui.addMessage('おにぎりを食べた。美味しい！（満腹度+' + restored + '）', 'heal');
    // Reset hungry warnings
    if (player.satiety > 10) {
      player._hungryWarned = false;
    }
    if (player.satiety > 30) {
      player._hunger30Warned = false;
    }
    if (player.satiety > 50) {
      player._hunger50Warned = false;
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
    var self = this;
    ui.addMessage('どの方向に振る？（方向キーで選択、Escでキャンセル）', 'system');
    game.directionMode = {
      item: self,
      callback: function(dx, dy) {
        // Using staff identifies it
        if (!self.identified) {
          self.identify();
          ui.addMessage('それは' + self.name + 'だった！', 'pickup');
        }
        game.useStaff(self, dx, dy);
      }
    };
    return false; // Don't consume turn yet - direction mode handles it
  };

  Item.prototype._useArrow = function(game, player) {
    var ui = game.ui;
    var self = this;

    if (!this.count || this.count <= 0) {
      ui.addMessage('矢がない', 'system');
      return false;
    }

    ui.addMessage('どの方向に撃つ？（方向キーで選択、Escでキャンセル）', 'system');
    game.directionMode = {
      item: self,
      callback: function(dx, dy) {
        game.shootArrow(self, dx, dy);
      }
    };
    return false; // direction mode handles turn consumption
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
      if (dungeon.grid[iy] && (dungeon.grid[iy][ix] === Dungeon.TILE.WATER || dungeon.grid[iy][ix] === Dungeon.TILE.LAVA)) continue;
      if (ix === pCenter.x && iy === pCenter.y) continue;

      var occupied = false;
      for (var j = 0; j < items.length; j++) {
        if (items[j].x === ix && items[j].y === iy) { occupied = true; break; }
      }
      if (occupied) continue;

      var selectedKey = pickItemForFloor(floorNum);
      var item = new Item(ix, iy, selectedKey);

      // Floor-based identification chance
      if (!item.identified) {
        if (floorNum <= 3) {
          // 70% chance identified on early floors
          if (Math.random() < 0.7) {
            item.identified = true;
          }
        } else {
          // 20% chance identified on deeper floors
          if (Math.random() < 0.2) {
            item.identified = true;
          }
        }
      }

      items.push(item);
    }

    return items;
  };

  return Item;
})();