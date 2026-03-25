// PNG Sprite Loader - loads 0x72 DungeonTileset II individual frames
// Falls back to coded sprites (sprites.js) if PNG not loaded
var SpriteLoader = (function() {
  'use strict';

  var sprites = {};
  var loaded = 0;
  var total = 0;
  var onReady = null;

  function load(name, path) {
    total++;
    var img = new Image();
    img.onload = function() {
      sprites[name] = img;
      loaded++;
      if (loaded >= total && onReady) onReady();
    };
    img.onerror = function() {
      console.warn('Failed to load sprite:', path);
      loaded++;
      if (loaded >= total && onReady) onReady();
    };
    img.src = path;
  }

  function init(callback) {
    onReady = callback;

    // Player (knight) - 16x28 frames
    load('player_idle_0', 'assets/knight_m_idle_anim_f0.png');
    load('player_idle_1', 'assets/knight_m_idle_anim_f1.png');
    load('player_idle_2', 'assets/knight_m_idle_anim_f2.png');
    load('player_idle_3', 'assets/knight_m_idle_anim_f3.png');
    load('player_run_0', 'assets/knight_m_run_anim_f0.png');
    load('player_run_1', 'assets/knight_m_run_anim_f1.png');

    // Enemies (only assets that actually exist)
    load('chintala_0', 'assets/goblin_idle_anim_f0.png');
    load('chintala_1', 'assets/goblin_idle_anim_f1.png');
    load('ghost_0', 'assets/wogol_idle_anim_f0.png');
    load('ghost_1', 'assets/wogol_idle_anim_f1.png');
    load('dragon_0', 'assets/big_demon_idle_anim_f0.png');
    load('dragon_1', 'assets/big_demon_idle_anim_f1.png');
    load('skull_mage_0', 'assets/skelet_idle_anim_f0.png');
    load('skull_mage_1', 'assets/skelet_idle_anim_f1.png');
    load('minotaur_0', 'assets/ogre_idle_anim_f0.png');
    load('minotaur_1', 'assets/ogre_idle_anim_f1.png');
    load('shopkeeper_0', 'assets/orc_warrior_idle_anim_f0.png');
    load('shopkeeper_1', 'assets/orc_warrior_idle_anim_f1.png');
    load('toad_0', 'assets/tiny_zombie_idle_anim_f0.png');
    load('toad_1', 'assets/tiny_zombie_idle_anim_f1.png');
    load('boy_cart_0', 'assets/imp_idle_anim_f0.png');
    load('boy_cart_1', 'assets/imp_idle_anim_f1.png');
    load('thief_0', 'assets/chort_idle_anim_f0.png');
    load('thief_1', 'assets/chort_idle_anim_f1.png');
    load('kengo_0', 'assets/masked_orc_idle_anim_f0.png');
    load('kengo_1', 'assets/masked_orc_idle_anim_f1.png');

    // Floor tiles (16x16)
    for (var i = 1; i <= 8; i++) {
      load('floor_' + i, 'assets/floor_' + i + '.png');
    }

    // Wall tiles (16x16)
    load('wall_mid', 'assets/wall_mid.png');
    load('wall_top_mid', 'assets/wall_top_mid.png');
    load('wall_left', 'assets/wall_left.png');
    load('wall_right', 'assets/wall_right.png');
    load('wall_top_left', 'assets/wall_top_left.png');
    load('wall_top_right', 'assets/wall_top_right.png');

    // Items
    load('flask_red', 'assets/flask_big_red.png');
    load('flask_green', 'assets/flask_big_green.png');
    load('flask_blue', 'assets/flask_big_blue.png');
    load('flask_yellow', 'assets/flask_big_yellow.png');
    load('coin_0', 'assets/coin_anim_f0.png');
    load('coin_1', 'assets/coin_anim_f1.png');
    load('coin_2', 'assets/coin_anim_f2.png');
    load('weapon_sword', 'assets/weapon_regular_sword.png');
    load('weapon_knight', 'assets/weapon_knight_sword.png');
    load('weapon_anime', 'assets/weapon_anime_sword.png');
    load('weapon_rusty', 'assets/weapon_rusty_sword.png');
    load('weapon_hammer', 'assets/weapon_big_hammer.png');
    load('weapon_red_gem', 'assets/weapon_red_gem_sword.png');

    // If no sprites to load, fire callback immediately
    if (total === 0 && onReady) onReady();
  }

  function get(name) {
    return sprites[name] || null;
  }

  function getAnimFrame(baseName, frameCount) {
    var frame = Math.floor(Date.now() / 300) % frameCount;
    return sprites[baseName + '_' + frame] || sprites[baseName + '_0'] || null;
  }

  function isLoaded() {
    return loaded >= total;
  }

  return {
    init: init,
    get: get,
    getAnimFrame: getAnimFrame,
    isLoaded: isLoaded
  };
})();
