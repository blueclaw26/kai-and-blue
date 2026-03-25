// Floor Tables - defines what spawns on each floor
var FLOOR_TABLE = {
  enemies: [
    // [minFloor, maxFloor, enemyId, spawnWeight]
    // Early game (F1-10)
    [1, 5, 'mamel', 10],
    [1, 7, 'chintala', 8],
    [1, 6, 'toad', 6],
    [2, 8, 'boy_cart', 5],
    [3, 10, 'nigiri', 6],
    [3, 9, 'slug', 5],
    // Mid-early (F4-18)
    [4, 10, 'thief_pelican', 4],
    [6, 14, 'midnighthat', 7],
    [7, 16, 'kengo', 4],
    [8, 16, 'curse_girl', 4],
    [9, 18, 'polygon', 6],
    // Mid (F13-40)
    [13, 30, 'dragon', 5],
    [18, 40, 'skull_mage', 5],
    [16, 35, 'minotaur', 4],
    // Mid-late (F28-65)
    [28, 50, 'big_chintala', 6],
    [35, 65, 'mega_dragon', 4],
    [28, 45, 'dragon', 3],
    [28, 40, 'minotaur', 3],
    // Late (F50-85)
    [50, 80, 'death_reaper', 5],
    [55, 85, 'phantom', 4],
    [50, 65, 'big_chintala', 3],
    [50, 65, 'mega_dragon', 4],
    // Nightmare (F70-99)
    [70, 99, 'hell_dragon', 5],
    [80, 99, 'chaos_knight', 5],
    [70, 99, 'death_reaper', 3],
    [70, 99, 'phantom', 3],
    [65, 99, 'mega_dragon', 2]
  ],
  items: [
    // [minFloor, maxFloor, itemId, spawnWeight]
    // Food & healing (always available — increased onigiri weight for hunger pressure)
    [1, 99, 'herb', 8],
    [1, 99, 'onigiri', 12],
    [3, 99, 'otogiriso', 7],
    [3, 99, 'big_onigiri', 5],
    // Early weapons & shields (including decent ones on F1)
    [1, 20, 'wooden_sword', 6],
    [1, 20, 'wooden_shield', 6],
    [1, 20, 'club', 4],
    [1, 20, 'palm_shield', 4],
    [1, 25, 'bronze_sword', 5],
    [1, 25, 'leather_shield', 5],
    // Mid weapons & shields (カタナ/どうたぬき available from F1 with low weight for "good draw")
    [1, 40, 'katana', 2],
    [1, 40, 'iron_shield', 3],
    [1, 50, 'dotanuki', 1],
    [5, 50, 'heavy_shield', 2],
    [5, 50, 'drain_sword', 2],
    [3, 40, 'ghost_sickle', 2],
    // Late weapons & shields (rare items can appear from F5 with very low weight)
    [5, 99, 'dragon_sword', 1],
    [5, 99, 'kabura', 1],
    [7, 99, 'dragon_shield', 2],
    [6, 99, 'blast_shield', 2],
    [5, 99, 'counter_shield', 2],
    // Scrolls
    [1, 99, 'scroll_map', 5],
    [1, 99, 'scroll_confusion', 4],
    [3, 99, 'scroll_powerup', 3],
    [1, 99, 'scroll_identify', 5],
    [4, 99, 'scroll_weapon_up', 3],
    [4, 99, 'scroll_shield_up', 3],
    // Grass
    [1, 99, 'power_grass', 3],
    [1, 99, 'poison_grass', 3],
    [3, 99, 'grass_sleep', 3],
    [3, 99, 'grass_confusion', 3],
    [2, 99, 'grass_warp', 3],
    [4, 99, 'grass_sight', 2],
    [8, 99, 'grass_happy', 1],
    [5, 99, 'grass_unlucky', 2],
    [15, 99, 'grass_invincible', 1],
    [10, 99, 'grass_dragon', 1],
    // Staves
    [1, 99, 'staff_knockback', 3],
    [1, 99, 'staff_slow', 3],
    [2, 99, 'staff_paralyze', 3],
    [3, 99, 'staff_swap', 2],
    [3, 99, 'staff_tunnel', 2],
    [5, 99, 'staff_lightning', 3],
    [3, 99, 'staff_heal', 3],
    [8, 99, 'staff_clone', 1],
    [5, 99, 'staff_seal', 2],
    [7, 99, 'staff_invisible', 2],
    // Pots
    [1, 99, 'pot_storage', 3],
    [5, 99, 'pot_synthesis', 2],
    [3, 99, 'pot_identify', 2],
    [5, 99, 'pot_heal', 2],
    [1, 99, 'pot_useless', 2],
    // Bracelets
    [8, 99, 'bracelet_see', 1],
    [5, 99, 'bracelet_scout', 2],
    [7, 99, 'bracelet_float', 1],
    [5, 99, 'bracelet_strength', 2],
    [1, 99, 'bracelet_hunger', 2],
    [6, 99, 'bracelet_regen', 2],
    // Arrows
    [1, 99, 'arrow_wood', 5],
    [4, 99, 'arrow_iron', 3],
    [8, 99, 'arrow_silver', 2],
    // Special scrolls
    [6, 99, 'scroll_sanctuary', 2],
    [10, 99, 'scroll_extinction', 1],
    [5, 99, 'scroll_great_hall', 2],
    [1, 99, 'scroll_escape', 2]
  ]
};
