// Game State Management - Central Coordinator
// Combat methods in combat.js, Shop methods in shop.js, Inventory methods in inventory.js
var Game = (function() {
  'use strict';

  var MAX_FLOOR = B('dungeon.maxFloor', 99);
  var MAX_ENEMIES_PER_FLOOR = B('enemies.maxPerFloor', 15);

  function Game() {
    this.dungeon = null;
    this.player = null;
    this.enemies = [];
    this.items = [];
    this.traps = [];
    this.floorNum = 1;
    this.explored = [];
    this.ui = null;
    this.gameOver = false;
    this.victory = false;
    this.inventoryOpen = false;
    this.inventorySelection = 0;
    this.directionMode = null;
    this.identifyMode = false;
    // Shop state
    this.shopRoom = null;
    this.shopkeeperHostile = false;
    this.shopItems = new Set();
    this.shopDebt = 0;
    this.inShop = false;
    this.sellConfirmMode = null;
    // Map/visibility
    this.mapRevealed = false;
    this.visible = null;
    // Dash
    this.dashDirection = null;
    this.dashing = false;
    // Pot modes
    this.potPutMode = null;
    this.potTakeMode = null;
    // Throw animation
    this.throwAnimating = false;
    // Monster house
    this.monsterHouseRoom = null;
    this.monsterHouseTriggered = false;
    // Sanctuary
    this.sanctuaryTiles = new Set();
    // Extinction
    this.extinctEnemies = new Set();
    this.encounteredEnemies = {}; // { enemyId: name } — tracks all enemy types seen this run
    this.extinctionMode = false;
    this.extinctionCandidates = [];
    this.extinctionSelection = 0;
    // Blank scroll mode
    this.blankScrollMode = false;
    this.blankScrollCandidates = [];
    this.blankScrollSelection = 0;
    // Dungeon NPCs
    this.dungeonNPCs = [];
    // Merchant/blacksmith modes
    this.merchantMode = null;
    this.merchantSelection = 0;
    this.blacksmithMode = null;
    this.blacksmithSelection = 0;
    // UI effects
    this.floatingTexts = [];
    this.shakeFrames = 0;
    this.flashTiles = [];
    this.screenFlashFrames = 0;
    this.screenFlashColor = 'rgba(255,0,0,0.3)';
    // Combat animations
    this.animations = []; // { type, x, y, frame, maxFrames, data }
    // Sight boost (from 目薬草)
    this.sightBoost = 0;
    // Player invisible (from 透明の杖)
    this.playerInvisible = 0;
    // Auto-explore
    this.autoExploring = false;
    // Scene
    this.scene = 'village';
    // Village storage
    this.storage = [];
    this._loadStorage();
    // Village state
    this.villageMap = null;
    this.villageNpcs = [];
    this.villageDialogMode = null;
    this.storageMode = false;
    this.storageSelection = 0;
    this.storageAction = null;
    this.dungeonConfirm = false;
  }

  // === Storage persistence ===

  Game.prototype._loadStorage = function() {
    try {
      var raw = localStorage.getItem('roguelike_storage');
      if (raw) {
        var parsed = JSON.parse(raw);
        this.storage = [];
        if (!Array.isArray(parsed)) {
          console.warn('Invalid storage data format, resetting');
          localStorage.removeItem('roguelike_storage');
        } else {
          var count = Math.min(parsed.length, 20); // max 20 items
          for (var i = 0; i < count; i++) {
            var saved = parsed[i];
            if (!saved || typeof saved !== 'object') continue;
            if (typeof saved.dataKey !== 'string' || !ITEM_DATA[saved.dataKey]) continue; // unknown item type
            var item = new Item(0, 0, saved.dataKey);
            // Clamp and validate numeric values
            if (saved.plus !== undefined) item.plus = Math.max(-99, Math.min(99, parseInt(saved.plus) || 0));
            if (saved.modifier !== undefined) item.modifier = Math.max(0, Math.min(99, parseInt(saved.modifier) || 0));
            if (saved.seals && Array.isArray(saved.seals)) {
              item.seals = saved.seals.filter(function(s) { return typeof s === 'string' && s.length < 30; });
            }
            if (saved.identified) item.identified = true;
            if (saved.count !== undefined) item.count = Math.max(1, Math.min(99, parseInt(saved.count) || 1));
            if (saved.uses !== undefined) item.uses = Math.max(0, Math.min(99, parseInt(saved.uses) || 0));
            this.storage.push(item);
          }
        }
      }
    } catch(e) {
      console.warn('Invalid storage data, resetting');
      localStorage.removeItem('roguelike_storage');
    }
    try {
      var idData = localStorage.getItem('roguelike_identified');
      if (idData) {
        var idArr = JSON.parse(idData);
        if (Array.isArray(idArr)) {
          for (var j = 0; j < idArr.length; j++) {
            if (typeof idArr[j] === 'string' && idArr[j].length < 50) {
              window.IDENTIFIED_TYPES.add(idArr[j]);
            }
          }
        } else {
          localStorage.removeItem('roguelike_identified');
        }
      }
    } catch(e) {
      console.warn('Invalid identified data, resetting');
      localStorage.removeItem('roguelike_identified');
    }
  };

  Game.prototype._saveStorage = function() {
    try {
      var data = [];
      for (var i = 0; i < this.storage.length; i++) {
        var item = this.storage[i];
        data.push({
          dataKey: item.dataKey,
          plus: item.plus || 0,
          modifier: item.modifier || 0,
          seals: item.seals || [],
          identified: item.identified || false,
          count: item.count || 0,
          uses: item.uses !== undefined ? item.uses : undefined
        });
      }
      localStorage.setItem('roguelike_storage', JSON.stringify(data));
      var idArr = [];
      window.IDENTIFIED_TYPES.forEach(function(v) { idArr.push(v); });
      localStorage.setItem('roguelike_identified', JSON.stringify(idArr));
    } catch(e) { /* ignore */ }
  };

  // === UI Effects ===

  Game.prototype.addFloatingText = function(x, y, text, color) {
    this.floatingTexts.push({ x: x, y: y, text: text, color: color, frame: 0 });
  };

  Game.prototype.tickFloatingTexts = function() {
    for (var i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].frame++;
      if (this.floatingTexts[i].frame > 20) {
        this.floatingTexts.splice(i, 1);
      }
    }
  };

  // === Initialization ===

  Game.prototype.init = function(ui) {
    this.ui = ui;
    initIdentification();
    this.extinctEnemies = new Set();
    this.newFloor();
    ui.addMessage('最果ての間へ... 冒険が始まる', 'system');
  };

  Game.prototype.initVillage = function(ui) {
    this.ui = ui;
    initIdentification();
    this.scene = 'village';
    this._buildVillageMap();
    if (!this.player) {
      this.player = new Player(14, 13);
    } else {
      this.player.moveTo(14, 13);
    }
    ui.addMessage('拠点の村に戻った', 'system');
  };

  // === Village ===

  // Village tile constants
  var VT = {
    GRASS: 10,
    PATH: 11,
    WATER: 12,
    BRIDGE: 13,
    WALL: 14,
    FLOOR: 15,
    TREE: 16,
    FLOWER: 17,
    ENTRANCE: 5
  };
  Game.VILLAGE_TILE = VT;

  Game.prototype._buildVillageMap = function() {
    var W = 30, H = 20;
    var G = VT.GRASS, P = VT.PATH, Wa = VT.WATER, B = VT.BRIDGE, Wl = VT.WALL, F = VT.FLOOR, T = VT.TREE, Fl = VT.FLOWER, E = VT.ENTRANCE;
    // 30x20 Shiren 2 style Natane Village
    var layout = [
    //0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29
      [T, T, G, Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,G, T, T],  // 0: river top
      [T, G, G, Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,B, B, B, B, Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,Wa,G, G, T],  // 1: bridge
      [G, G, Fl,G, G, G, G, G, G, G, G, G, G, P, P, P, P, G, G, G, G, G, G, G, G, G, Fl,G, G, G],  // 2: north path
      [G, G, G, Wl,Wl,Wl,Wl,Wl,G, G, G, G, G, P, P, G, G, G, G, G, Wl,Wl,Wl,Wl,G, G, G, G, G, G],  // 3: blacksmith/info walls
      [G, G, G, Wl,F, F, F, Wl,G, G, G, G, G, P, P, G, G, G, G, G, Wl,F, F, Wl,G, G, G, G, G, G],  // 4: blacksmith/info interior
      [G, G, G, Wl,F, F, F, Wl,G, G, G, G, G, P, P, G, G, G, G, G, Wl,F, F, Wl,G, G, G, G, G, G],  // 5: blacksmith/info interior
      [G, G, G, Wl,Wl,F, Wl,Wl,G, G, G, G, G, P, P, G, G, G, G, G, Wl,F, Wl,Wl,G, G, G, G, G, G],  // 6: doorways
      [G, G, G, G, G, P, G, G, G, G, G, G, G, P, P, G, G, G, G, G, G, P, G, G, G, G, G, Fl,G, G],  // 7: paths
      [G, Wl,Wl,Wl,Wl,Wl,Wl,G, G, G, G, G, G, P, P, G, G, G, Wl,Wl,Wl,Wl,Wl,Wl,G, G, G, G, G, G],  // 8: storage/shop walls
      [G, Wl,F, F, F, F, Wl,G, G, G, G, G, G, P, P, G, G, G, Wl,F, F, F, F, Wl,G, G, G, G, T, G],  // 9: storage/shop interior
      [G, Wl,F, F, F, F, Wl,G, G, G, G, G, G, P, P, G, G, G, Wl,F, F, F, F, Wl,G, G, G, G, G, G],  // 10: storage/shop interior
      [G, Wl,Wl,Wl,F, Wl,Wl,G, G, G, G, G, P, P, P, P, G, G, Wl,Wl,Wl,F, Wl,Wl,G, G, G, G, G, G],  // 11: doorways
      [G, G, G, G, P, G, G, G, G, G, G, Fl,P, P, P, P, Fl,G, G, G, G, P, G, G, G, G, G, G, G, G],  // 12: center plaza
      [G, G, G, G, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, G, G, G, G, G, G, G, T],  // 13: main road
      [G, G, G, G, G, G, G, G, G, G, G, G, P, P, P, P, G, G, G, G, G, G, G, G, G, G, G, G, G, G],  // 14: south
      [G, T, G, Wl,Wl,Wl,Wl,Wl,G, G, G, G, P, P, P, P, G, G, G, Wl,Wl,Wl,Wl,Wl,G, G, G, T, G, G],  // 15: houses walls
      [G, G, G, Wl,F, F, F, Wl,G, G, G, G, P, P, P, P, G, G, G, Wl,F, F, F, Wl,G, G, G, G, G, G],  // 16: houses interior
      [G, G, G, Wl,Wl,F, Wl,Wl,G, G, G, G, P, E, E, P, G, G, G, Wl,Wl,F, Wl,Wl,G, G, G, G, G, G],  // 17: dungeon entrance
      [G, G, Fl,G, G, P, G, G, G, Fl,G, G, P, P, P, P, G, G, Fl,G, G, P, G, G, G, Fl,G, G, G, G],  // 18: south meadow
      [T, G, G, G, G, G, G, T, G, G, G, Wa,Wa,Wa,Wa,Wa,Wa,Wa,G, G, G, G, G, T, G, G, G, G, T, T],  // 19: stream + trees
    ];
    this.villageMap = { width: W, height: H, grid: layout };
    this.villageNpcs = [
      // Inside buildings
      { x: 5, y: 5, name: '鍛冶屋', char: '鍛', color: '#e07050', type: 'blacksmith',
        dialogue: '鍛えてやろうか？' },
      { x: 22, y: 5, name: '情報屋', char: '情', color: '#b388ff', type: 'info',
        dialogue: '' }, // random tips set on talk
      { x: 4, y: 10, name: '倉庫番', char: '倉', color: '#e8a44a', type: 'storage',
        dialogue: '預かり所へようこそ。アイテムを預けたり引き出したりできるよ。' },
      { x: 21, y: 10, name: '道具屋', char: '道', color: '#66bb6a', type: 'shop',
        dialogue: 'いらっしゃい！' },
      // Outdoor NPCs
      { x: 14, y: 12, name: '村長', char: '長', color: '#ffd54f', type: 'talk',
        dialogue: 'この村を頼んだぞ。気をつけて行ってこい。' },
      { x: 10, y: 7, name: '子供', char: '子', color: '#81d4fa', type: 'child',
        dialogue: '' }, // random fun dialogue
      { x: 16, y: 13, name: '猫', char: '猫', color: '#ffab91', type: 'cat',
        dialogue: 'にゃー' }
    ];
    // Village shop/blacksmith state
    this.villageShopMode = null;
    this.villageShopSelection = 0;
    this.villageBlacksmithMode = null;
    this.villageBlacksmithSelection = 0;
  };

  Game.prototype.villageMove = function(dx, dy) {
    var p = this.player;
    var nx = p.x + dx;
    var ny = p.y + dy;
    var map = this.villageMap;
    if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) return false;
    var tile = map.grid[ny][nx];
    // Blocking tiles: water, wall, tree
    if (tile === VT.WATER || tile === VT.WALL || tile === VT.TREE) return false;

    for (var i = 0; i < this.villageNpcs.length; i++) {
      var npc = this.villageNpcs[i];
      if (npc.x === nx && npc.y === ny) return false;
    }

    p.moveTo(nx, ny);

    if (tile === VT.ENTRANCE) {
      this.dungeonConfirm = true;
      this.ui.addMessage('最果ての間に挑みますか？ (y/n)', 'system');
    }
    return true;
  };

  Game.prototype.getAdjacentNpc = function() {
    var p = this.player;
    for (var i = 0; i < this.villageNpcs.length; i++) {
      var npc = this.villageNpcs[i];
      if (Math.abs(npc.x - p.x) <= 1 && Math.abs(npc.y - p.y) <= 1 && !(npc.x === p.x && npc.y === p.y)) {
        return npc;
      }
    }
    return null;
  };

  // Village info tips
  var VILLAGE_INFO_TIPS = [
    '合成の壺に同じ種類の武器を入れると合成できるぞ',
    'ドラゴンキラーはドラゴンに強いぞ',
    '店で泥棒するとえらい目に遭うぞ',
    '腹が減ると力が出ない。おにぎりを持っていけ',
    'モンスターハウスに出くわしたら逃げるのも手だ',
    '杖は敵に振ると効果があるぞ',
    '鍛冶屋で武器を鍛えれば攻撃力が上がるぞ',
    '盾も鍛えれば防御力が上がる。忘れるなよ',
    '巻物は読むと効果を発揮するぞ',
    '水路の上にレアなアイテムが落ちていることがあるぞ'
  ];

  // Village child dialogue
  var VILLAGE_CHILD_LINES = [
    'ねーねー、冒険者さん！ 強いモンスターいた？',
    'ボクも大きくなったら冒険者になるんだ！',
    '今日はいい天気だねー！',
    'お兄ちゃん、お腹空いてない？',
    'この前、変な巻物を拾ったんだ！ ...捨てちゃったけど',
    '村長のおじいちゃんって昔は冒険者だったんだって！'
  ];

  // Village shop stock definition
  var VILLAGE_SHOP_STOCK = [
    { key: 'onigiri', price: 100 },
    { key: 'herb', price: 200 },
    { key: 'scroll_map', price: 300 },
    { key: 'arrow_wood', price: 150, count: 5 }
  ];

  // Village shop interaction
  Game.prototype._villageShopInteract = function() {
    this.villageShopMode = true;
    this.villageShopSelection = 0;
    this._renderVillageShopUI();
  };

  Game.prototype._renderVillageShopUI = function() {
    var ui = this.ui;
    var box = ui.inventoryBox;
    var sel = this.villageShopSelection;
    var SLOT_LETTERS = 'abcdefghijklmnopqrst';

    var html = '<div style="color:#66bb6a;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">道具屋</div>';
    html += '<div style="color:#888;font-size:12px;margin-bottom:8px;">所持金: ' + this.player.gold + 'ギタン</div>';

    for (var i = 0; i < VILLAGE_SHOP_STOCK.length; i++) {
      var entry = VILLAGE_SHOP_STOCK[i];
      var data = ITEM_DATA[entry.key];
      if (!data) continue;
      var isSelected = (i === sel);
      var bgColor = isSelected ? '#1a2a3a' : 'transparent';
      var borderLeft = isSelected ? '3px solid #66bb6a' : '3px solid transparent';
      var displayName = data.name;
      if (entry.count) displayName += ' x' + entry.count;
      html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';">';
      html += '<span style="color:#888;">' + SLOT_LETTERS[i] + ')</span> ';
      html += '<span style="color:' + data.color + ';">' + data.char + '</span> ';
      html += '<span style="color:#e0e0e0;">' + escapeHtml(displayName) + '</span>';
      html += ' <span style="color:#ffd700;">' + entry.price + 'G</span>';
      html += '</div>';
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
    html += '[Enter/e]購入 [↑↓]選択 [ESC]閉じる';
    html += '</div>';

    box.innerHTML = html;
    ui.inventoryEl.style.display = 'flex';
  };

  // Village blacksmith interaction
  Game.prototype._villageBlacksmithInteract = function() {
    var ui = this.ui;
    var player = this.player;

    if (!player.weapon && !player.shield) {
      ui.addMessage('鍛冶屋「武器も盾も装備してないぞ。」', 'system');
      return;
    }

    this.villageBlacksmithMode = true;
    this.villageBlacksmithSelection = 0;
    this._renderVillageBlacksmithUI();
  };

  Game.prototype._renderVillageBlacksmithUI = function() {
    var ui = this.ui;
    var player = this.player;
    var box = ui.inventoryBox;
    var sel = this.villageBlacksmithSelection;

    var options = [];
    if (player.weapon) options.push({ label: '武器を鍛える: ' + player.weapon.getDisplayName(), target: 'weapon', item: player.weapon });
    if (player.shield) options.push({ label: '盾を鍛える: ' + player.shield.getDisplayName(), target: 'shield', item: player.shield });
    options.push({ label: 'やめる', target: 'cancel' });

    var html = '<div style="color:#e07050;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">鍛冶屋 - 強化 (500ギタン)</div>';
    html += '<div style="color:#888;font-size:12px;margin-bottom:8px;">所持金: ' + player.gold + 'ギタン</div>';

    for (var i = 0; i < options.length; i++) {
      var isSelected = (i === sel);
      var bgColor = isSelected ? '#1a2a3a' : 'transparent';
      var borderLeft = isSelected ? '3px solid #e07050' : '3px solid transparent';
      html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';">';
      html += '<span style="color:#e0e0e0;">' + escapeHtml(options[i].label) + '</span>';
      html += '</div>';
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
    html += '[Enter/e]選択 [↑↓]選択 [ESC]キャンセル';
    html += '</div>';

    box.innerHTML = html;
    ui.inventoryEl.style.display = 'flex';
  };

  Game.prototype.enterDungeon = function() {
    this.scene = 'dungeon';
    this.floorNum = 1;
    this.extinctEnemies = new Set();
    this.encounteredEnemies = {};
    this.player = new Player(0, 0);
    this.newFloor();
    this.ui.addMessage('最果ての間へ... 冒険が始まる', 'system');
  };

  Game.prototype.returnToVillage = function() {
    this.gameOver = false;
    this.victory = false;
    this.scene = 'village';
    this._buildVillageMap();
    this.player = new Player(14, 13);
    this.floatingTexts = [];
    this.shakeFrames = 0;
    this.flashTiles = [];
    this._saveStorage();
    this.ui.addMessage('村に戻った... 次こそは...', 'system');
  };

  // === Room/Visibility ===

  Game.prototype.getRoomAt = function(x, y) {
    if (!this.dungeon || !this.dungeon.rooms) return null;
    var rooms = this.dungeon.rooms;
    for (var i = 0; i < rooms.length; i++) {
      var r = rooms[i];
      if (x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2) return r;
    }
    return null;
  };

  Game.prototype.getPlayerRoom = function() {
    return this.getRoomAt(this.player.x, this.player.y);
  };

  Game.prototype.updateVisibility = function() {
    var player = this.player;
    var dungeon = this.dungeon;

    for (var vy = 0; vy < dungeon.height; vy++) {
      for (var vx = 0; vx < dungeon.width; vx++) {
        this.visible[vy][vx] = false;
      }
    }

    var room = this.getPlayerRoom();

    if (room) {
      for (var y = room.y1 - 1; y <= room.y2 + 1; y++) {
        for (var x = room.x1 - 1; x <= room.x2 + 1; x++) {
          if (dungeon.grid[y] && dungeon.grid[y][x] !== undefined) {
            this.visible[y][x] = true;
            this.explored[y][x] = true;
          }
        }
      }
    }

    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        var nx = player.x + dx, ny = player.y + dy;
        if (ny >= 0 && ny < dungeon.height && nx >= 0 && nx < dungeon.width) {
          this.visible[ny][nx] = true;
          this.explored[ny][nx] = true;
        }
      }
    }
  };

  Game.prototype.getVisibleTrapAt = function(x, y) {
    for (var i = 0; i < this.traps.length; i++) {
      var t = this.traps[i];
      if (!t.consumed && t.visible && t.x === x && t.y === y) return t;
    }
    return null;
  };

  // === Floor Generation ===

  Game.prototype.newFloor = function() {
    // Reset smooth camera on floor change
    if (window._renderer && window._renderer.resetCamera) {
      window._renderer.resetCamera();
    }
    this.dungeon = Dungeon.generateFloor(B('dungeon.width', 40), B('dungeon.height', 30), this.floorNum);
    this.explored = [];
    this.visible = [];
    for (var iy = 0; iy < this.dungeon.height; iy++) {
      this.explored[iy] = [];
      this.visible[iy] = [];
      for (var ix = 0; ix < this.dungeon.width; ix++) {
        this.explored[iy][ix] = false;
        this.visible[iy][ix] = false;
      }
    }
    this.shopRoom = null;
    this.shopkeeperHostile = false;
    this.shopItems = new Set();
    this.shopDebt = 0;
    this.inShop = false;
    this.sellConfirmMode = null;
    this.mapRevealed = false;
    this.monsterHouseRoom = null;
    this.monsterHouseTriggered = false;
    this.sanctuaryTiles = new Set();
    this.sightBoost = 0;
    this.playerInvisible = 0;
    this.autoExploring = false;

    if (!this.player) {
      this.player = new Player(this.dungeon.playerStart.x, this.dungeon.playerStart.y);
    } else {
      this.player.moveTo(this.dungeon.playerStart.x, this.dungeon.playerStart.y);
    }
    this.player.floor = this.floorNum;

    var startRoom = this.dungeon.rooms[0];
    this.enemies = Enemy.spawnForFloor(this.dungeon, this.floorNum, startRoom, this.extinctEnemies);
    this.items = Item.spawnForFloor(this.dungeon, this.floorNum, startRoom);
    this.traps = Trap.spawnForFloor(this.dungeon, this.floorNum, this.items);

    // Dungeon NPCs (merchant, blacksmith, fortune teller)
    this._generateDungeonNPCs(startRoom);

    if (this.dungeon.monsterHouseRoom) {
      this._generateMonsterHouse(this.dungeon.monsterHouseRoom);
    }

    // Treasure room (宝部屋): 5% chance from floor 5+
    this.treasureRoom = null;
    if (this.floorNum >= 5 && !this.dungeon.monsterHouseRoom && this.dungeon.rooms.length > 2 && Math.random() < 0.05) {
      this._generateTreasureRoom(startRoom);
    }

    // Item island: items on water tiles
    if (this.floorNum >= 3) {
      this._generateItemIslands();
    }

    if (this.dungeon.floorType === 'big_room') {
      this.ui.addMessage('大部屋だ！', 'enemy_special');
    } else if (this.dungeon.floorType === 'maze') {
      this.ui.addMessage('迷路フロアだ...', 'enemy_special');
    }

    // Zone-themed messages at key floors
    var zoneMessages = {
      1: '洞窟の入口に立つ... 冒険が始まる',
      11: '空気が湿ってきた... 地底湖が近い',
      26: '地面が熱い... 溶岩の気配がする',
      51: '急に冷え込んできた... 凍てつく世界',
      76: '闇が深い... ここは深淵',
      99: '最果ての間... 最後の試練が待ち受ける'
    };
    if (zoneMessages[this.floorNum]) {
      this.ui.addMessage(zoneMessages[this.floorNum], 'enemy_special');
    } else if (this.floorNum >= 75) {
      this.ui.addMessage('...空気が殺意に満ちている', 'damage');
    } else if (this.floorNum >= 50) {
      this.ui.addMessage('闇が深くなっていく...', 'enemy_special');
    } else if (this.floorNum >= 30) {
      this.ui.addMessage('ここからが本当の戦いだ...', 'system');
    }

    // Shop frequency: F2-10: 15%, F11-30: 20%, F31+: 15% (can tune later via BALANCE)
    var shopChance = this.floorNum <= 10 ? 0.15 : this.floorNum <= 30 ? 0.20 : 0.15;
    if (this.floorNum > 1 && this.dungeon.floorType === 'normal' && Math.random() < shopChance) {
      this._generateShop(startRoom);
    }
  };

  // === Monster House ===

  Game.prototype._generateMonsterHouse = function(room) {
    this.monsterHouseRoom = room;

    var mhEnemyCount = 8 + Math.floor(Math.random() * 8);
    var placed = 0;
    var attempts = 0;

    while (placed < mhEnemyCount && attempts < 100) {
      attempts++;
      var ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      var ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

      if (this.dungeon.grid[ey][ex] === Dungeon.TILE.STAIRS_DOWN) continue;

      var occupied = false;
      for (var j = 0; j < this.enemies.length; j++) {
        if (this.enemies[j].x === ex && this.enemies[j].y === ey) { occupied = true; break; }
      }
      if (occupied) continue;

      var enemyId = this._pickEnemyForFloor(this.floorNum);
      var template = ENEMY_DATA[enemyId];
      if (!template) continue;

      var enemy = new Enemy(ex, ey, template, enemyId);
      enemy.sleeping = true;
      this.enemies.push(enemy);
      placed++;
    }

    var mhItemCount = 5 + Math.floor(Math.random() * 6);
    var itemPlaced = 0;
    attempts = 0;

    while (itemPlaced < mhItemCount && attempts < 100) {
      attempts++;
      var ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      var iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

      if (this.dungeon.grid[iy][ix] === Dungeon.TILE.STAIRS_DOWN) continue;

      var itemOccupied = false;
      for (var k = 0; k < this.items.length; k++) {
        if (this.items[k].x === ix && this.items[k].y === iy) { itemOccupied = true; break; }
      }
      if (itemOccupied) continue;

      var selectedKey = this._pickItemForFloor(this.floorNum);
      var mhItem = new Item(ix, iy, selectedKey);
      this.items.push(mhItem);
      itemPlaced++;
    }
  };

  Game.prototype._pickEnemyForFloor = function(floorNum) {
    var table = FLOOR_TABLE.enemies;
    var eligible = [];
    var totalWeight = 0;
    var self = this;

    for (var i = 0; i < table.length; i++) {
      var entry = table[i];
      if (floorNum >= entry[0] && floorNum <= entry[1]) {
        if (self.extinctEnemies && self.extinctEnemies.has(entry[2])) continue;
        eligible.push({ id: entry[2], weight: entry[3] });
        totalWeight += entry[3];
      }
    }

    if (eligible.length === 0) return 'mamel';

    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < eligible.length; j++) {
      cumulative += eligible[j].weight;
      if (roll < cumulative) return eligible[j].id;
    }
    return eligible[eligible.length - 1].id;
  };

  Game.prototype.triggerMonsterHouse = function() {
    if (this.monsterHouseTriggered) return;
    this.monsterHouseTriggered = true;

    Sound.play('thief');
    var mhMessages = [
      'モンスターハウスだ！ 敵の大群！',
      'ここは...モンスターの巣窟だった！',
      '嫌な予感がする...モンスターが一斉に動き出した！'
    ];
    this.ui.addMessage(mhMessages[Math.floor(Math.random() * mhMessages.length)], 'damage');
    this.screenFlashFrames = 3;
    this.screenFlashColor = 'rgba(255,0,0,0.3)';
    if (typeof Sound !== 'undefined' && Sound.bgm) Sound.bgm.switchTrack('danger');

    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.dead && e.sleeping) {
        e.sleeping = false;
      }
    }
  };

  // === Treasure Room ===

  Game.prototype._generateTreasureRoom = function(playerStartRoom) {
    // Find a small room that isn't the start room
    var candidates = [];
    for (var i = 1; i < this.dungeon.rooms.length; i++) {
      var r = this.dungeon.rooms[i];
      if (r.w >= 4 && r.h >= 4) candidates.push(r);
    }
    if (candidates.length === 0) return;

    var room = candidates[Math.floor(Math.random() * candidates.length)];
    this.treasureRoom = room;

    // Spawn 5-8 high-value items inside
    var itemCount = 5 + Math.floor(Math.random() * 4);
    var treasureItems = [
      'kabura', 'dragon_sword', 'dragon_shield', 'grass_invincible',
      'grass_happy', 'scroll_extinction', 'bracelet_see', 'bracelet_float',
      'pot_synthesis', 'staff_clone', 'big_onigiri', 'otogiriso'
    ];

    for (var t = 0; t < itemCount; t++) {
      var tx = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
      var ty = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));
      if (this.dungeon.grid[ty][tx] === Dungeon.TILE.STAIRS_DOWN) continue;
      var occupied = false;
      for (var j = 0; j < this.items.length; j++) {
        if (this.items[j].x === tx && this.items[j].y === ty) { occupied = true; break; }
      }
      if (occupied) continue;

      var tKey = treasureItems[Math.floor(Math.random() * treasureItems.length)];
      if (!ITEM_DATA[tKey]) continue;
      var tItem = new Item(tx, ty, tKey);
      this.items.push(tItem);
    }

    // Spawn a strong guard enemy at the room entrance area
    var guardX = room.x;
    var guardY = room.y + Math.floor(room.h / 2);
    // Find a valid floor tile near the entrance
    var guardPlaced = false;
    for (var gdy = -1; gdy <= 1 && !guardPlaced; gdy++) {
      for (var gdx = -1; gdx <= 1 && !guardPlaced; gdx++) {
        var gx = guardX + gdx;
        var gy = guardY + gdy;
        if (gx >= 0 && gy >= 0 && gx < this.dungeon.width && gy < this.dungeon.height &&
            this.dungeon.grid[gy][gx] !== Dungeon.TILE.WALL) {
          var guardId = this.floorNum >= 30 ? 'mega_dragon' : this.floorNum >= 15 ? 'minotaur' : 'dragon';
          var guardTemplate = ENEMY_DATA[guardId];
          if (guardTemplate) {
            var guard = new Enemy(gx, gy, guardTemplate, guardId);
            guard.hp = Math.floor(guard.hp * 1.5);
            guard.maxHp = guard.hp;
            this.enemies.push(guard);
            guardPlaced = true;
          }
        }
      }
    }
  };

  // === Item Islands ===

  Game.prototype._generateItemIslands = function() {
    // Find water tiles and occasionally place rare items on them
    var waterTiles = [];
    for (var y = 1; y < this.dungeon.height - 1; y++) {
      for (var x = 1; x < this.dungeon.width - 1; x++) {
        if (this.dungeon.grid[y][x] === Dungeon.TILE.WATER) {
          waterTiles.push({ x: x, y: y });
        }
      }
    }
    if (waterTiles.length === 0) return;

    // 15% chance to place 1-2 items on water
    if (Math.random() > 0.15) return;

    var rareItems = ['grass_invincible', 'grass_happy', 'bracelet_see', 'bracelet_float',
                     'pot_synthesis', 'kabura', 'scroll_extinction'];
    var count = 1 + Math.floor(Math.random() * 2);

    for (var i = 0; i < count && i < waterTiles.length; i++) {
      var wt = waterTiles[Math.floor(Math.random() * waterTiles.length)];
      var occupied = false;
      for (var j = 0; j < this.items.length; j++) {
        if (this.items[j].x === wt.x && this.items[j].y === wt.y) { occupied = true; break; }
      }
      if (occupied) continue;

      var rKey = rareItems[Math.floor(Math.random() * rareItems.length)];
      if (!ITEM_DATA[rKey]) continue;
      var rItem = new Item(wt.x, wt.y, rKey);
      this.items.push(rItem);
    }
  };

  Game.prototype.isInMonsterHouse = function(x, y) {
    if (!this.monsterHouseRoom) return false;
    var r = this.monsterHouseRoom;
    return x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2;
  };

  Game.prototype.isSanctuaryTile = function(x, y) {
    return this.sanctuaryTiles.has(x + ',' + y);
  };

  // === Entity lookup helpers ===

  Game.prototype.getTrapAt = function(x, y) {
    for (var i = 0; i < this.traps.length; i++) {
      var t = this.traps[i];
      if (!t.consumed && t.x === x && t.y === y) return t;
    }
    return null;
  };

  Game.prototype.getEnemyAt = function(x, y) {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.dead && e.x === x && e.y === y) return e;
    }
    return null;
  };

  Game.prototype.getItemAt = function(x, y) {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].x === x && this.items[i].y === y) return this.items[i];
    }
    return null;
  };

  Game.prototype.removeItem = function(item) {
    var idx = this.items.indexOf(item);
    if (idx !== -1) this.items.splice(idx, 1);
    this.shopItems.delete(item);
  };

  // === Item/Gold helpers ===

  Game.prototype._pickItemForFloor = function(floorNum) {
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

    if (eligible.length === 0) return 'herb';

    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < eligible.length; j++) {
      cumulative += eligible[j].weight;
      if (roll < cumulative) return eligible[j].id;
    }
    return eligible[eligible.length - 1].id;
  };

  Game.prototype._createGoldItem = function(x, y, amount) {
    return {
      x: x,
      y: y,
      isGold: true,
      goldAmount: amount,
      char: '¥',
      color: '#ffd700',
      type: 'gold',
      name: amount + 'ギタン',
      getDisplayName: function() { return this.name; }
    };
  };

  // === Player Movement ===

  Game.prototype.movePlayer = function(dx, dy) {
    if (this.gameOver || this.victory) return false;

    var newX = this.player.x + dx;
    var newY = this.player.y + dy;

    var enemy = this.getEnemyAt(newX, newY);
    if (enemy) {
      if (enemy.sleeping && !this.monsterHouseTriggered) {
        this.triggerMonsterHouse();
      }
      if (enemy.isShopkeeper && !this.shopkeeperHostile) {
        this.ui.addMessage('店主を攻撃した！', 'attack');
        this.ui.addMessage('店主が激怒した！', 'enemy_special');
        this._triggerTheft();
      }
      this.playerAttack(enemy);
      return true;
    }

    // Block movement into dungeon NPCs
    if (this.getDungeonNPCAt && this.getDungeonNPCAt(newX, newY)) {
      return false;
    }

    var wasInShop = this.isInShop(this.player.x, this.player.y);

    if (this.player.canMoveTo(newX, newY, this.dungeon)) {
      this.player._lastDx = dx;
      this.player._lastDy = dy;
      this.player.moveTo(newX, newY);

      // Water tile: apply slowed status (2 turns)
      var steppedTile = this.dungeon.grid[newY][newX];
      if (steppedTile === Dungeon.TILE.WATER) {
        if (!(this.player.bracelet && this.player.bracelet.effect === 'float')) {
          if (!this.player.hasStatusEffect('slowed')) {
            this.player.addStatusEffect('slowed', 2, this.ui);
            this.ui.addMessage('水に足を取られた！', 'system');
          }
        }
      }
      // Lava tile: damage
      if (steppedTile === Dungeon.TILE.LAVA) {
        if (!(this.player.bracelet && this.player.bracelet.effect === 'float')) {
          if (!this.player.godMode && !this.player.hasStatusEffect('invincible')) {
            this.player.hp -= 5;
            this.ui.addMessage('溶岩で5ダメージ！', 'damage');
            this.addFloatingText(newX, newY, '-5', '#f44336');
            if (this._checkPlayerDeath()) return true;
          }
        }
      }

      var nowInShop = this.isInShop(newX, newY);
      if (nowInShop && !this.inShop && !this.shopkeeperHostile) {
        if (typeof Sound !== 'undefined' && Sound.bgm) Sound.bgm.switchTrack('shop');
      } else if (!nowInShop && this.inShop && !this.shopkeeperHostile) {
        if (typeof Sound !== 'undefined' && Sound.bgm) {
          Sound.bgm.switchTrack(this.floorNum >= 50 ? 'danger' : 'dungeon');
        }
      }
      this.inShop = nowInShop;

      this.checkPlayerTrap();
      // Stop auto-explore if trap was triggered
      if (this.getTrapAt(newX, newY) && this.autoExploring) {
        this.autoExploring = false;
      }

      if (!this.monsterHouseTriggered && this.isInMonsterHouse(newX, newY)) {
        this.triggerMonsterHouse();
      }

      if (wasInShop && !this.inShop && !this.shopkeeperHostile && this.shopDebt > 0) {
        this._triggerTheft();
      }

      // Auto-pickup items
      var item = this.getItemAt(newX, newY);
      if (item) {
        if (item.isGold) {
          this.player.gold += item.goldAmount;
          this.removeItem(item);
          this.ui.addMessage(item.goldAmount + 'ギタンを拾った', 'pickup');
        } else if (item.shopItem && !this.shopkeeperHostile) {
          this.ui.addMessage(item.getDisplayName() + 'がある（' + item.getBuyPrice() + 'ギタン / gで手に取る）', 'system');
        } else {
          if (this.player.inventory.length < 20) {
            var idx = this.items.indexOf(item);
            if (idx !== -1) {
              this.items.splice(idx, 1);
              this.shopItems.delete(item);
              this.player.inventory.push(item);
              this.ui.addMessage(item.getDisplayName() + 'を拾った', 'pickup');
            }
          } else {
            this.ui.addMessage('持ち物がいっぱいで' + item.getDisplayName() + 'を拾えない', 'system');
          }
        }
      }
      return true;
    }
    return false;
  };

  // === Death check ===

  Game.prototype._checkPlayerDeath = function() {
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.gameOver = true;
      Sound.play('gameover');
      if (typeof Sound !== 'undefined' && Sound.bgm) Sound.bgm.stop();
      var deathMsg;
      if (this.floorNum <= 10) {
        deathMsg = '序盤で倒れてしまった... まだ先は長い';
      } else if (this.floorNum <= 30) {
        deathMsg = '中層で力尽きた... あと少しだったのに';
      } else if (this.floorNum <= 60) {
        deathMsg = '深層で散った... 実力は確かだった';
      } else {
        deathMsg = '最果てを目前にして... 無念';
      }
      this.ui.addMessage(deathMsg, 'damage');
      this.ui.showGameOver(this.floorNum, this.player.level);
      return true;
    }
    return false;
  };

  // === Turn processing ===

  Game.prototype.processEnemyTurns = function() {
    if (this.gameOver || this.victory) return;

    this.player.tickBuffs();
    this.player.tickSleep(this.ui);

    // Sight boost countdown
    if (this.sightBoost > 0) {
      this.sightBoost--;
      if (this.sightBoost === 0) {
        this.ui.addMessage('目薬草の効果が切れた', 'system');
      }
    }

    // Invisible countdown
    if (this.playerInvisible > 0) {
      this.playerInvisible--;
      if (this.playerInvisible === 0) {
        this.ui.addMessage('透明の効果が切れた', 'system');
      }
    }

    for (var i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].dead) {
        if (this.enemies[i].sleeping) continue;
        if (this.enemies[i].isShopkeeper && !this.shopkeeperHostile) continue;

        var oldX = this.enemies[i].x;
        var oldY = this.enemies[i].y;
        this.enemies[i].act(this);
        if (!this.enemies[i].dead && (this.enemies[i].x !== oldX || this.enemies[i].y !== oldY)) {
          this.checkEnemyTrap(this.enemies[i]);
        }

        if (!this.enemies[i].dead && this.enemies[i].doubleSpeed && !this.gameOver) {
          var oldX2 = this.enemies[i].x;
          var oldY2 = this.enemies[i].y;
          this.enemies[i].act(this);
          if (!this.enemies[i].dead && (this.enemies[i].x !== oldX2 || this.enemies[i].y !== oldY2)) {
            this.checkEnemyTrap(this.enemies[i]);
          }
        }
      }
      if (this.gameOver) break;
    }

    this.enemies = this.enemies.filter(function(e) { return !e.dead; });
    this.traps = this.traps.filter(function(t) { return !t.consumed; });

    // Track encountered enemy types
    for (var ei = 0; ei < this.enemies.length; ei++) {
      var en = this.enemies[ei];
      if (!en.dead && en.enemyId && !en.isShopkeeper && !en.isDecoy &&
          this.visible && this.visible[en.y] && this.visible[en.y][en.x]) {
        this.encounteredEnemies[en.enemyId] = en.name;
      }
    }

    if (!this.gameOver && !this.victory) {
      var livingCount = this.livingEnemyCount();
      // Natural enemy spawn: every N turns (BALANCE turnSpawnInterval)
      // Legacy fallback: probabilistic per-turn spawn
      var spawnRate = this.floorNum <= 30 ? 0.02 : this.floorNum <= 60 ? 0.03 : 0.05;
      if (livingCount < MAX_ENEMIES_PER_FLOOR && Math.random() < spawnRate) {
        var newEnemy = Enemy.spawnOneEnemy(this);
        if (newEnemy) {
          this.enemies.push(newEnemy);
        }
      }
    }
  };

  // === Stairs / Descend ===

  Game.prototype.descend = function() {
    if (this.gameOver || this.victory) return false;
    var tile = this.dungeon.grid[this.player.y][this.player.x];
    if (tile === Dungeon.TILE.STAIRS_DOWN) {
      if (this.shopDebt > 0 && !this.shopkeeperHostile) {
        this._triggerTheft();
        return true;
      }
      if (this.floorNum >= MAX_FLOOR) {
        this.victory = true;
        if (typeof Sound !== 'undefined' && Sound.bgm) Sound.bgm.stop();
        Sound.play('victory');
        this.ui.addMessage('最果ての間を踏破した！ あなたは真の風来人だ！', 'levelup');
        this.ui.showVictory(this.player);
        return true;
      }
      this.floorNum++;
      this.newFloor();
      Sound.play('stairs');
      this.ui.addMessage('地下' + this.floorNum + 'の間に降り立った...', 'system');
      var canvas = document.getElementById('game-canvas');
      if (canvas) {
        canvas.style.transition = 'opacity 0.15s';
        canvas.style.opacity = '0';
        setTimeout(function() {
          canvas.style.opacity = '1';
          setTimeout(function() { canvas.style.transition = ''; }, 150);
        }, 150);
      }
      if (typeof Sound !== 'undefined' && Sound.bgm) {
        if (this.floorNum >= 50) {
          Sound.bgm.switchTrack('danger');
        } else {
          Sound.bgm.switchTrack('dungeon');
        }
      }
      return true;
    }
    return false;
  };

  Game.prototype.isOnStairs = function() {
    return this.dungeon.grid[this.player.y][this.player.x] === Dungeon.TILE.STAIRS_DOWN;
  };

  Game.prototype.livingEnemyCount = function() {
    var count = 0;
    for (var i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].dead) count++;
    }
    return count;
  };

  return Game;
})();
