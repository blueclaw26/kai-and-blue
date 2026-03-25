// Item Data Definitions
var ITEM_DATA = {
  // Weapons
  wooden_sword: { type: 'weapon', name: '木刀', char: '/', color: '#a1887f', attack: 3, slots: 3, minFloor: 1, weight: 10, price: 500 },
  katana: { type: 'weapon', name: 'カタナ', char: '/', color: '#b0bec5', attack: 5, slots: 4, minFloor: 3, weight: 5, price: 1200 },
  bronze_sword: { type: 'weapon', name: '青銅の太刀', char: '/', color: '#cd7f32', attack: 4, slots: 3, minFloor: 2, weight: 5, price: 800 },
  dotanuki: { type: 'weapon', name: 'どうたぬき', char: '/', color: '#cfd8dc', attack: 8, slots: 5, minFloor: 6, weight: 3, price: 3000 },
  kabura: { type: 'weapon', name: 'カブラステギ', char: '/', color: '#ff7043', attack: 15, slots: 8, minFloor: 12, weight: 1, price: 10000 },
  drain_sword: { type: 'weapon', name: 'ドレインバスター', char: '/', color: '#ce93d8', attack: 6, slots: 4, minFloor: 5, weight: 2, price: 2000 },
  ghost_sickle: { type: 'weapon', name: '成仏のカマ', char: '/', color: '#81d4fa', attack: 5, slots: 4, minFloor: 3, weight: 3, price: 1500 },
  club: { type: 'weapon', name: 'こん棒', char: '/', color: '#a1887f', attack: 2, slots: 7, minFloor: 1, weight: 4, price: 100 },
  dragon_sword: { type: 'weapon', name: 'ドラゴンキラー', char: '/', color: '#e53935', attack: 10, slots: 5, minFloor: 8, weight: 2, price: 5000 },

  // Shields
  wooden_shield: { type: 'shield', name: '木甲の盾', char: '[', color: '#a1887f', defense: 2, slots: 3, minFloor: 1, weight: 10, price: 400 },
  iron_shield: { type: 'shield', name: '鉄甲の盾', char: '[', color: '#78909c', defense: 4, slots: 4, minFloor: 3, weight: 5, price: 1000 },
  leather_shield: { type: 'shield', name: '皮甲の盾', char: '[', color: '#8d6e63', defense: 3, slots: 3, minFloor: 2, weight: 5, price: 700 },
  heavy_shield: { type: 'shield', name: '鉄の盾+1', char: '[', color: '#607d8b', defense: 6, slots: 5, minFloor: 5, weight: 3, price: 2500 },
  dragon_shield: { type: 'shield', name: 'ドラゴンシールド', char: '[', color: '#e53935', defense: 5, slots: 4, minFloor: 7, weight: 2, price: 4000 },
  blast_shield: { type: 'shield', name: '爆発よけの盾', char: '[', color: '#ff9800', defense: 4, slots: 3, minFloor: 6, weight: 2, price: 3000 },
  counter_shield: { type: 'shield', name: 'バトルカウンター', char: '[', color: '#9c27b0', defense: 3, slots: 3, minFloor: 5, weight: 2, price: 2500 },
  palm_shield: { type: 'shield', name: '正面戦士の盾', char: '[', color: '#bcaaa4', defense: 2, slots: 6, minFloor: 1, weight: 4, price: 100 },

  // Grass (potions)
  herb: { type: 'grass', name: '薬草', char: '!', color: '#66bb6a', effect: 'heal', value: 25, minFloor: 1, weight: 15, price: 100 },
  otogiriso: { type: 'grass', name: 'オトギリソウ', char: '!', color: '#43a047', effect: 'heal', value: 50, minFloor: 2, weight: 8, price: 200 },
  power_grass: { type: 'grass', name: 'ちからの種', char: '!', color: '#ef5350', effect: 'strength', value: 1, minFloor: 2, weight: 5, price: 500 },
  poison_grass: { type: 'grass', name: '毒消し草', char: '!', color: '#7e57c2', effect: 'cure_poison', value: 0, minFloor: 1, weight: 8, price: 150 },
  grass_sleep: { type: 'grass', name: '睡眠草', char: '!', color: '#5c6bc0', effect: 'sleep_self', value: 5, minFloor: 3, weight: 3, price: 100 },
  grass_confusion: { type: 'grass', name: '混乱草', char: '!', color: '#ff8a65', effect: 'confuse_self', value: 10, minFloor: 3, weight: 3, price: 100 },
  grass_warp: { type: 'grass', name: 'ワープ草', char: '!', color: '#ba68c8', effect: 'warp', value: 0, minFloor: 2, weight: 4, price: 100 },
  grass_sight: { type: 'grass', name: '目薬草', char: '!', color: '#4dd0e1', effect: 'sight', value: 0, minFloor: 4, weight: 3, price: 200 },
  grass_happy: { type: 'grass', name: 'しあわせ草', char: '!', color: '#ffd54f', effect: 'levelup', value: 0, minFloor: 8, weight: 1, price: 500 },
  grass_unlucky: { type: 'grass', name: '不幸の種', char: '!', color: '#757575', effect: 'leveldown', value: 0, minFloor: 5, weight: 2, price: 100 },
  grass_invincible: { type: 'grass', name: '無敵草', char: '!', color: '#ffd700', effect: 'invincible', value: 20, minFloor: 15, weight: 1, price: 1000 },
  grass_dragon: { type: 'grass', name: 'ドラゴン草', char: '!', color: '#f44336', effect: 'fire_breath', value: 40, minFloor: 10, weight: 1, price: 500 },

  // Scrolls
  scroll_identify: { type: 'scroll', name: '識別の巻物', char: '?', color: '#42a5f5', effect: 'identify', minFloor: 1, weight: 8, price: 300 },
  scroll_confusion: { type: 'scroll', name: '混乱の巻物', char: '?', color: '#ffa726', effect: 'confuse_enemies', minFloor: 2, weight: 5, price: 500 },
  scroll_powerup: { type: 'scroll', name: 'パワーアップの巻物', char: '?', color: '#ec407a', effect: 'powerup', minFloor: 3, weight: 4, price: 800 },
  scroll_map: { type: 'scroll', name: 'あかりの巻物', char: '?', color: '#ffee58', effect: 'reveal_map', minFloor: 1, weight: 6, price: 400 },
  scroll_weapon_up: { type: 'scroll', name: '天の恵みの巻物', char: '?', color: '#ffab40', effect: 'weapon_upgrade', minFloor: 4, weight: 3, price: 1000 },
  scroll_shield_up: { type: 'scroll', name: '地の恵みの巻物', char: '?', color: '#a5d6a7', effect: 'shield_upgrade', minFloor: 4, weight: 3, price: 1000 },
  scroll_sanctuary: { type: 'scroll', name: '聖域の巻物', char: '?', color: '#e1bee7', effect: 'sanctuary', minFloor: 6, weight: 1, price: 3000 },
  scroll_extinction: { type: 'scroll', name: 'ねだやしの巻物', char: '?', color: '#f44336', effect: 'extinction', minFloor: 10, weight: 0, price: 5000 },
  scroll_blank: { type: 'scroll', name: '白紙の巻物', char: '?', color: '#fafafa', effect: 'blank', minFloor: 15, weight: 1, price: 5000 },
  scroll_great_hall: { type: 'scroll', name: '大部屋の巻物', char: '?', color: '#ff9800', effect: 'great_hall', minFloor: 5, weight: 2, price: 2000 },
  scroll_escape: { type: 'scroll', name: '脱出の巻物', char: '?', color: '#4caf50', effect: 'escape', minFloor: 1, weight: 2, price: 1000 },

  // Food
  onigiri: { type: 'food', name: 'おにぎり', char: '%', color: '#fff176', satiety: 50, minFloor: 1, weight: 12, price: 100 },
  big_onigiri: { type: 'food', name: '大きいおにぎり', char: '%', color: '#ffd54f', satiety: 100, minFloor: 3, weight: 5, price: 200 },

  // Staves - directional magic, limited uses
  staff_knockback: { type: 'staff', name: 'ふきとばしの杖', char: '/', color: '#26c6da', effect: 'knockback', uses: 5, minFloor: 1, price: 600 },
  staff_swap: { type: 'staff', name: '場所替えの杖', char: '/', color: '#ab47bc', effect: 'swap', uses: 3, minFloor: 3, price: 800 },
  staff_paralyze: { type: 'staff', name: 'かなしばりの杖', char: '/', color: '#ffa726', effect: 'paralyze', uses: 4, minFloor: 2, price: 700 },
  staff_slow: { type: 'staff', name: '鈍足の杖', char: '/', color: '#78909c', effect: 'slow', uses: 5, minFloor: 1, price: 500 },
  staff_lightning: { type: 'staff', name: 'いかずちの杖', char: '/', color: '#ffeb3b', effect: 'lightning', uses: 3, minFloor: 5, price: 1500 },
  staff_tunnel: { type: 'staff', name: 'トンネルの杖', char: '/', color: '#795548', effect: 'tunnel', uses: 4, minFloor: 3, price: 700 },
  staff_heal: { type: 'staff', name: '回復の杖', char: '/', color: '#66bb6a', effect: 'heal_target', uses: 4, minFloor: 3, weight: 3, price: 300 },
  staff_clone: { type: 'staff', name: '身代わりの杖', char: '/', color: '#ffb74d', effect: 'decoy', uses: 2, minFloor: 8, weight: 1, price: 500 },
  staff_seal: { type: 'staff', name: '封印の杖', char: '/', color: '#78909c', effect: 'seal', uses: 4, minFloor: 5, weight: 2, price: 300 },
  staff_invisible: { type: 'staff', name: '透明の杖', char: '/', color: '#e0e0e0', effect: 'invisible', uses: 3, minFloor: 7, weight: 1, price: 400 },

  // Pots (壺)
  pot_storage: { type: 'pot', name: '保存の壺', char: '{', color: '#78909c', capacity: 5, effect: 'storage', minFloor: 1, weight: 4, price: 600 },
  pot_synthesis: { type: 'pot', name: '合成の壺', char: '{', color: '#e8a44a', capacity: 3, effect: 'synthesis', minFloor: 5, weight: 2, price: 3000 },
  pot_identify: { type: 'pot', name: '識別の壺', char: '{', color: '#42a5f5', capacity: 3, effect: 'identify', minFloor: 3, weight: 3, price: 1500 },
  pot_heal: { type: 'pot', name: '回復の壺', char: '{', color: '#66bb6a', capacity: 3, effect: 'heal', minFloor: 5, weight: 2, price: 2000 },
  pot_useless: { type: 'pot', name: 'ただの壺', char: '{', color: '#bdbdbd', capacity: 4, effect: 'none', minFloor: 1, weight: 3, price: 200 },

  // Bracelets (腕輪)
  bracelet_see: { type: 'bracelet', name: '透視の腕輪', char: '=', color: '#42a5f5', effect: 'see_all', minFloor: 8, weight: 1, price: 5000 },
  bracelet_scout: { type: 'bracelet', name: 'よくみえの腕輪', char: '=', color: '#66bb6a', effect: 'see_traps', minFloor: 5, weight: 2, price: 3000 },
  bracelet_float: { type: 'bracelet', name: '浮遊の腕輪', char: '=', color: '#ce93d8', effect: 'float', minFloor: 7, weight: 1, price: 4000 },
  bracelet_strength: { type: 'bracelet', name: '力の腕輪', char: '=', color: '#ef5350', effect: 'strength_boost', minFloor: 5, weight: 2, price: 3500 },
  bracelet_hunger: { type: 'bracelet', name: 'ハラヘリの腕輪', char: '=', color: '#ffa726', effect: 'hunger', minFloor: 1, weight: 3, price: 500 },
  bracelet_regen: { type: 'bracelet', name: '回復の腕輪', char: '=', color: '#4caf50', effect: 'regen', minFloor: 6, weight: 1, price: 4000 },

  // Arrows (矢)
  arrow_wood: { type: 'arrow', name: '木の矢', char: ')', color: '#a1887f', damage: 3, minFloor: 1, weight: 6, price: 50 },
  arrow_iron: { type: 'arrow', name: '鉄の矢', char: ')', color: '#78909c', damage: 7, minFloor: 4, weight: 4, price: 100 },
  arrow_silver: { type: 'arrow', name: '銀の矢', char: ')', color: '#e0e0e0', damage: 12, minFloor: 8, weight: 2, price: 200 }
};

// Unidentified name pools - shuffled per run
var UNIDENTIFIED_NAMES = {
  grass: ['青い草', '赤い草', '黄色い草', '緑の草', '紫の草', '白い草', '黒い草', '橙の草', '金色の草', '銀の草', '茶色い草', '灰色の草'],
  scroll: ['漢字の巻物', 'ひらがなの巻物', 'カタカナの巻物', '記号の巻物', '右上がりの巻物', '左下がりの巻物', '太字の巻物', '細字の巻物', '丸文字の巻物', '達筆の巻物', '暗号の巻物', '古代文字の巻物'],
  staff: ['短い杖', '長い杖', '太い杖', '細い杖', '赤い杖', '青い杖', '白い杖', '黒い杖', '金の杖', '銀の杖'],
  pot: ['丸い壺', '四角い壺', '細長い壺', '平たい壺', '光る壺', '古びた壺']
};

// Identification globals — initialized per run in initIdentification()
window.IDENTIFIED_TYPES = new Set();
window.FAKE_NAME_MAP = {};

function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function initIdentification() {
  window.IDENTIFIED_TYPES = new Set();
  window.FAKE_NAME_MAP = {};

  // Group item keys by category
  var groups = { grass: [], scroll: [], staff: [] };
  for (var key in ITEM_DATA) {
    var d = ITEM_DATA[key];
    if (groups[d.type]) {
      groups[d.type].push(key);
    }
  }

  // Shuffle fake names and assign
  for (var cat in groups) {
    var shuffled = shuffleArray(UNIDENTIFIED_NAMES[cat]);
    var keys = groups[cat];
    for (var i = 0; i < keys.length; i++) {
      window.FAKE_NAME_MAP[keys[i]] = shuffled[i % shuffled.length];
    }
  }
}