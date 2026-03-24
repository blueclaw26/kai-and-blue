// Item Data Definitions
var ITEM_DATA = {
  // Weapons
  wooden_sword: { type: 'weapon', name: '木刀', char: '/', color: '#a1887f', attack: 3, slots: 3, minFloor: 1, weight: 10 },
  katana: { type: 'weapon', name: 'カタナ', char: '/', color: '#b0bec5', attack: 5, slots: 4, minFloor: 3, weight: 5 },

  // Shields
  wooden_shield: { type: 'shield', name: '木甲の盾', char: '[', color: '#a1887f', defense: 2, slots: 3, minFloor: 1, weight: 10 },
  iron_shield: { type: 'shield', name: '鉄甲の盾', char: '[', color: '#78909c', defense: 4, slots: 4, minFloor: 3, weight: 5 },

  // Grass (potions)
  herb: { type: 'grass', name: '薬草', char: '!', color: '#66bb6a', effect: 'heal', value: 25, minFloor: 1, weight: 15 },
  otogiriso: { type: 'grass', name: 'オトギリソウ', char: '!', color: '#43a047', effect: 'heal', value: 50, minFloor: 2, weight: 8 },
  power_grass: { type: 'grass', name: 'ちからの種', char: '!', color: '#ef5350', effect: 'strength', value: 1, minFloor: 2, weight: 5 },
  poison_grass: { type: 'grass', name: '毒消し草', char: '!', color: '#7e57c2', effect: 'cure_poison', value: 0, minFloor: 1, weight: 8 },

  // Scrolls
  scroll_identify: { type: 'scroll', name: '識別の巻物', char: '?', color: '#42a5f5', effect: 'identify', minFloor: 1, weight: 8 },
  scroll_confusion: { type: 'scroll', name: '混乱の巻物', char: '?', color: '#ffa726', effect: 'confuse_enemies', minFloor: 2, weight: 5 },
  scroll_powerup: { type: 'scroll', name: 'パワーアップの巻物', char: '?', color: '#ec407a', effect: 'powerup', minFloor: 3, weight: 4 },
  scroll_map: { type: 'scroll', name: 'あかりの巻物', char: '?', color: '#ffee58', effect: 'reveal_map', minFloor: 1, weight: 6 },

  // Food
  onigiri: { type: 'food', name: 'おにぎり', char: '%', color: '#fff176', satiety: 50, minFloor: 1, weight: 12 },
  big_onigiri: { type: 'food', name: '大きいおにぎり', char: '%', color: '#ffd54f', satiety: 100, minFloor: 3, weight: 5 }
};
