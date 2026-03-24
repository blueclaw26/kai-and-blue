// Floor Tables - defines what spawns on each floor
var FLOOR_TABLE = {
  enemies: [
    // [minFloor, maxFloor, enemyId, spawnWeight]
    [1, 5, 'mamel', 10],
    [1, 7, 'chintala', 8],
    [1, 6, 'toad', 6],
    [2, 8, 'boy_cart', 5],
    [3, 10, 'nigiri', 6],
    [3, 9, 'slug', 5],
    [4, 10, 'thief_pelican', 4],
    [5, 12, 'midnighthat', 7],
    [6, 14, 'kengo', 4],
    [7, 15, 'polygon', 6],
    [7, 15, 'curse_girl', 4],
    [10, 20, 'dragon', 4],
    [12, 20, 'skull_mage', 5],
    [15, 20, 'minotaur', 3]
  ],
  items: [
    // [minFloor, maxFloor, itemId, spawnWeight]
    [1, 20, 'herb', 10],
    [1, 20, 'onigiri', 8],
    [3, 20, 'otogiriso', 7],
    [1, 20, 'wooden_sword', 5],
    [1, 20, 'wooden_shield', 5],
    [2, 20, 'bronze_sword', 4],
    [2, 20, 'leather_shield', 4],
    [5, 20, 'katana', 3],
    [5, 20, 'iron_shield', 3],
    [6, 20, 'dotanuki', 2],
    [5, 20, 'heavy_shield', 2],
    [5, 20, 'drain_sword', 2],
    [3, 20, 'ghost_sickle', 2],
    [8, 20, 'dragon_sword', 1],
    [12, 20, 'kabura', 1],
    [7, 20, 'dragon_shield', 1],
    [6, 20, 'blast_shield', 2],
    [5, 20, 'counter_shield', 2],
    [1, 20, 'scroll_map', 5],
    [1, 20, 'scroll_confusion', 4],
    [3, 20, 'scroll_powerup', 3],
    [1, 20, 'scroll_identify', 5],
    [4, 20, 'scroll_weapon_up', 2],
    [4, 20, 'scroll_shield_up', 2],
    [1, 20, 'power_grass', 3],
    [3, 20, 'big_onigiri', 4],
    [1, 20, 'poison_grass', 3],
    // Staves
    [1, 20, 'staff_knockback', 3],
    [1, 20, 'staff_slow', 3],
    [2, 20, 'staff_paralyze', 3],
    [3, 20, 'staff_swap', 2],
    [3, 20, 'staff_tunnel', 2],
    [5, 20, 'staff_lightning', 2],
    // Pots
    [1, 20, 'pot_storage', 3],
    [5, 20, 'pot_synthesis', 1],
    [3, 20, 'pot_identify', 2],
    [5, 20, 'pot_heal', 2],
    [1, 20, 'pot_useless', 2],
    // Bracelets
    [8, 20, 'bracelet_see', 1],
    [5, 20, 'bracelet_scout', 2],
    [7, 20, 'bracelet_float', 1],
    [5, 20, 'bracelet_strength', 2],
    [1, 20, 'bracelet_hunger', 2],
    [6, 20, 'bracelet_regen', 1],
    // Arrows
    [1, 20, 'arrow_wood', 5],
    [4, 20, 'arrow_iron', 3],
    [8, 20, 'arrow_silver', 2],
    // New scrolls
    [6, 20, 'scroll_sanctuary', 1],
    [10, 20, 'scroll_extinction', 1],
    [5, 20, 'scroll_great_hall', 2],
    [1, 20, 'scroll_escape', 2]
  ]
};
