// Floor Tables - defines what spawns on each floor
var FLOOR_TABLE = {
  enemies: [
    // [minFloor, maxFloor, enemyId, spawnWeight]
    [1, 5, 'mamel', 10],
    [1, 7, 'chintala', 8],
    [3, 10, 'nigiri', 6],
    [5, 12, 'midnighthat', 7],
    [7, 15, 'polygon', 6],
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
    [5, 20, 'katana', 3],
    [5, 20, 'iron_shield', 3],
    [1, 20, 'scroll_map', 5],
    [1, 20, 'scroll_confusion', 4],
    [3, 20, 'scroll_powerup', 3],
    [5, 20, 'scroll_identify', 4],
    [1, 20, 'power_grass', 3],
    [3, 20, 'big_onigiri', 4],
    [1, 20, 'poison_grass', 3]
  ]
};
