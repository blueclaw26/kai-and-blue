// Item Data Definitions
var ITEM_DATA = {
  // Weapons
  wooden_sword: { type: 'weapon', name: '木刀', char: '/', color: '#a1887f', attack: 3, slots: 3, minFloor: 1, weight: 10 },
  katana: { type: 'weapon', name: 'カタナ', char: '/', color: '#b0bec5', attack: 5, slots: 4, minFloor: 3, weight: 5 },
  bronze_sword: { type: 'weapon', name: '青銅の太刀', char: '/', color: '#cd7f32', attack: 4, slots: 3, minFloor: 2, weight: 5 },
  dotanuki: { type: 'weapon', name: 'どうたぬき', char: '/', color: '#cfd8dc', attack: 8, slots: 5, minFloor: 6, weight: 3 },
  kabura: { type: 'weapon', name: 'カブラステギ', char: '/', color: '#ff7043', attack: 15, slots: 8, minFloor: 12, weight: 1 },
  drain_sword: { type: 'weapon', name: 'ドレインバスター', char: '/', color: '#ce93d8', attack: 6, slots: 4, minFloor: 5, weight: 2, special: 'drain' },
  ghost_sickle: { type: 'weapon', name: '成仏のカマ', char: '/', color: '#81d4fa', attack: 5, slots: 4, minFloor: 3, weight: 3, special: 'ghost' },
  dragon_sword: { type: 'weapon', name: 'ドラゴンキラー', char: '/', color: '#e53935', attack: 10, slots: 5, minFloor: 8, weight: 2, special: 'dragon' },

  // Shields
  wooden_shield: { type: 'shield', name: '木甲の盾', char: '[', color: '#a1887f', defense: 2, slots: 3, minFloor: 1, weight: 10 },
  iron_shield: { type: 'shield', name: '鉄甲の盾', char: '[', color: '#78909c', defense: 4, slots: 4, minFloor: 3, weight: 5 },
  leather_shield: { type: 'shield', name: '皮甲の盾', char: '[', color: '#8d6e63', defense: 3, slots: 3, minFloor: 2, weight: 5 },
  heavy_shield: { type: 'shield', name: '鉄の盾+1', char: '[', color: '#607d8b', defense: 6, slots: 5, minFloor: 5, weight: 3 },
  dragon_shield: { type: 'shield', name: 'ドラゴンシールド', char: '[', color: '#e53935', defense: 5, slots: 4, minFloor: 7, weight: 2, special: 'dragon_resist' },
  blast_shield: { type: 'shield', name: '爆発よけの盾', char: '[', color: '#ff9800', defense: 4, slots: 3, minFloor: 6, weight: 2, special: 'blast_resist' },
  counter_shield: { type: 'shield', name: 'バトルカウンター', char: '[', color: '#9c27b0', defense: 3, slots: 3, minFloor: 5, weight: 2, special: 'counter' },

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
  scroll_weapon_up: { type: 'scroll', name: '天の恵みの巻物', char: '?', color: '#ffab40', effect: 'weapon_upgrade', minFloor: 4, weight: 3 },
  scroll_shield_up: { type: 'scroll', name: '地の恵みの巻物', char: '?', color: '#a5d6a7', effect: 'shield_upgrade', minFloor: 4, weight: 3 },

  // Food
  onigiri: { type: 'food', name: 'おにぎり', char: '%', color: '#fff176', satiety: 50, minFloor: 1, weight: 12 },
  big_onigiri: { type: 'food', name: '大きいおにぎり', char: '%', color: '#ffd54f', satiety: 100, minFloor: 3, weight: 5 },

  // Staves - directional magic, limited uses
  staff_knockback: { type: 'staff', name: 'ふきとばしの杖', char: '/', color: '#26c6da', effect: 'knockback', uses: 5, minFloor: 1 },
  staff_swap: { type: 'staff', name: '場所替えの杖', char: '/', color: '#ab47bc', effect: 'swap', uses: 3, minFloor: 3 },
  staff_paralyze: { type: 'staff', name: 'かなしばりの杖', char: '/', color: '#ffa726', effect: 'paralyze', uses: 4, minFloor: 2 },
  staff_slow: { type: 'staff', name: '鈍足の杖', char: '/', color: '#78909c', effect: 'slow', uses: 5, minFloor: 1 },
  staff_lightning: { type: 'staff', name: 'いかずちの杖', char: '/', color: '#ffeb3b', effect: 'lightning', uses: 3, minFloor: 5 },
  staff_tunnel: { type: 'staff', name: 'トンネルの杖', char: '/', color: '#795548', effect: 'tunnel', uses: 4, minFloor: 3 }
};
