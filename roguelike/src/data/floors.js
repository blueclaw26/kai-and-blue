// Floor Tables - defines what spawns on each floor
// Phase-based floor design inspired by Shiren 6's super-shinzui dungeon
//
// Phase 1: Survival (F1-9) - マムル, チンタラ, ガマラ, 毒サソリ(F4+), ボーイ
// Phase 2: First Mazerun (F10-15) - マゼルン, ガイコツまじん, にぎり見習い, ケンゴウ
// Phase 3: Mid-early trial (F16-22) - コドモ戦車, にぎり変化, ぼうれい武者, めまわし大根
// Phase 4: Second Mazerun + Thief (F23-30) - マゼモン, みどりトド, ちゅうチンタラ, 鬼サソリ, まわるポリゴン
// Phase 5: Ghost hell (F31-40) - 死の使い, はんにゃ武者, ガイコツまどう, イアイ
// Phase 6: Mazerun 2 + Dragon (F40-46) - マゼゴン, スカイドラゴン, メガタウロス
// Phase 7: Slime + Scorpion (F47-55) - オドロ, チドロ, 大鬼サソリ, アイアントド
// Phase 8: Nightmare lineup (F56-65) - にぎり親方, みだれ大根, うたうポリゴン, 死神
// Phase 9: THE WALL (F66-79) - ガイコツまてん, シハン, メガタウロス, マゼドン
// Phase 10: Final stretch (F80-99) - アークドラゴン, 冥王, マゼドン

var FLOOR_TABLE = {
  enemies: [
    // === Phase 1: Survival (F1-9) ===
    [1, 4, 'mamel', 10],
    [1, 7, 'chintala', 8],
    [1, 6, 'toad', 6],
    [2, 8, 'boy_cart', 5],
    [3, 9, 'nigiri', 6],
    [3, 9, 'slug', 5],
    [4, 10, 'thief_pelican', 4],
    [4, 10, 'poison_scorpion', 6],
    [6, 9, 'cave_mamel', 3],

    // === Phase 2: First Mazerun (F10-15) ===
    [6, 14, 'midnighthat', 7],
    [7, 16, 'kengo', 5],
    [8, 16, 'curse_girl', 4],
    [9, 18, 'skull_apprentice', 6],
    [10, 15, 'mazerun', 5],
    [10, 15, 'nigiri', 3],
    [13, 18, 'dragon', 4],
    [14, 25, 'oya_toad', 4],

    // === Phase 3: Mid-early trial (F16-22) ===
    [16, 28, 'child_tank', 5],
    [16, 30, 'nigiri_morph', 5],
    [16, 35, 'minotaur', 4],
    [16, 22, 'midnighthat', 3],
    [20, 35, 'mid_chintala', 5],
    [20, 35, 'spinning_polygon', 4],
    [22, 35, 'dizzy_radish', 5],

    // === Phase 4: Second Mazerun + Thief (F23-30) ===
    [24, 35, 'mazemon', 4],
    [25, 40, 'green_thief', 4],
    [25, 40, 'death_angel', 5],
    [25, 40, 'hannya', 4],
    [28, 45, 'demon_scorpion', 4],
    [28, 40, 'dragon', 3],
    [28, 50, 'big_chintala', 5],

    // === Phase 5: Ghost hell (F31-40) ===
    [30, 45, 'skull_mage_mid', 5],
    [30, 50, 'iai', 4],
    [35, 55, 'sky_dragon', 5],
    [38, 50, 'oyaji_tank', 4],

    // === Phase 6: Mazerun 2 + Dragon (F40-46) ===
    [45, 60, 'mazegon', 4],
    [45, 65, 'mega_taur', 4],
    [45, 65, 'singing_polygon', 4],

    // === Phase 7: Slime + Scorpion (F47-55) ===
    [42, 54, 'odoro', 5],
    [48, 54, 'chidoro', 4],
    [48, 55, 'great_scorpion', 5],
    [50, 65, 'iron_thief', 3],
    [50, 65, 'death_reaper', 5],

    // === Phase 8: Nightmare lineup (F56-65) ===
    [55, 70, 'nigiri_master', 4],
    [55, 65, 'sky_dragon', 3],
    [60, 75, 'chaos_radish', 4],

    // === Phase 9: THE WALL (F66-79) ===
    [66, 79, 'skull_master', 5],
    [66, 79, 'shihan', 5],
    [66, 79, 'mega_taur', 3],
    [70, 85, 'mazedon', 3],

    // === Phase 10: Final stretch (F80-99) ===
    [80, 99, 'mega_dragon', 5],
    [80, 99, 'dark_lord', 5],
    [80, 99, 'death_reaper', 3],
    [80, 99, 'mazedon', 2],
    [80, 99, 'skull_master', 3],
    [80, 99, 'shihan', 2]
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
    // Pots - synthesis pots boosted in F10-15 range
    [1, 99, 'pot_storage', 3],
    [5, 99, 'pot_synthesis', 3],
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
    [5, 99, 'scroll_great_hall', 2],
    [1, 99, 'scroll_escape', 2],
    [15, 99, 'scroll_blank', 1]
  ]
};
