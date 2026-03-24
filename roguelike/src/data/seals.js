// Seal (印) Data Definitions - Shiren 2 style synthesis system
var SEAL_DATA = {
  // Weapon seals
  dragon:   { name: '竜', desc: 'ドラゴン系に1.5倍ダメージ', type: 'weapon', source: 'dragon_sword' },
  ghost:    { name: '仏', desc: 'ゴースト系に1.5倍ダメージ', type: 'weapon', source: 'ghost_sickle' },
  drain:    { name: '吸', desc: '特殊能力持ちに1.5倍ダメージ', type: 'weapon', source: 'drain_sword' },
  crit:     { name: '会', desc: '会心の一撃が出やすい(25%)', type: 'weapon', source: null },
  triple:   { name: '三', desc: '3方向同時攻撃', type: 'weapon', source: null },

  // Shield seals
  dragon_resist: { name: '竜', desc: '炎ダメージ50%減', type: 'shield', source: 'dragon_shield' },
  blast_resist:  { name: '爆', desc: '爆発ダメージ50%減', type: 'shield', source: 'blast_shield' },
  counter:       { name: '返', desc: '被ダメージの30%を反射', type: 'shield', source: 'counter_shield' },
  hunger:        { name: '腹', desc: '満腹度の減少が半分になる', type: 'shield', source: null },
  rust_proof:    { name: '金', desc: 'サビ・腐食無効', type: 'shield', source: null }
};

// Map item dataKey → seal key (which seal does this item grant when synthesized)
var ITEM_SEAL_MAP = {
  // Weapons → weapon seals
  dragon_sword: 'dragon',
  ghost_sickle: 'ghost',
  drain_sword:  'drain',

  // Shields → shield seals
  dragon_shield:  'dragon_resist',
  blast_shield:   'blast_resist',
  counter_shield: 'counter'
};

// Helper: get the seal key an item would contribute in synthesis
function getSealForItem(item) {
  if (!item || !item.dataKey) return null;
  return ITEM_SEAL_MAP[item.dataKey] || null;
}

// Helper: get seal display string from seals array (e.g. "竜仏吸")
function getSealsDisplay(seals) {
  if (!seals || seals.length === 0) return '';
  var chars = [];
  for (var i = 0; i < seals.length; i++) {
    var sealData = SEAL_DATA[seals[i]];
    if (sealData) chars.push(sealData.name);
  }
  return chars.join('');
}

// Dragon-type enemy IDs (for 竜 seal)
var DRAGON_TYPE_ENEMIES = {
  dragon: true,
  skull_mage: true,
  mega_dragon: true,
  hell_dragon: true
};

// Ghost-type enemy IDs (for 仏 seal)
var GHOST_TYPE_ENEMIES = {
  midnighthat: true,
  phantom: true,
  death_reaper: true
};
