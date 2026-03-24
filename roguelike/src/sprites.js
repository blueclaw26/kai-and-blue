// Pixel Art Sprite System - 16x16 coded sprites
var Sprites = (function() {
  'use strict';
  
  var TILE_SIZE = 24; // render at 24px but sprite data is 16x16, scale up
  var cache = {}; // canvas cache for rendered sprites
  
  // Color palette
  var C = {
    _: null,        // transparent
    K: '#1a1a1a',   // black
    W: '#ffffff',    // white
    G: '#4caf50',   // green
    g: '#81c784',   // light green
    R: '#f44336',   // red
    r: '#e57373',   // light red
    B: '#2196f3',   // blue
    b: '#64b5f6',   // light blue
    Y: '#ffc107',   // yellow
    y: '#fff176',   // light yellow
    O: '#ff9800',   // orange
    o: '#ffb74d',   // light orange
    P: '#9c27b0',   // purple
    p: '#ce93d8',   // light purple
    T: '#4a8f7f',   // teal
    t: '#80cbc4',   // light teal
    D: '#795548',   // brown
    d: '#a1887f',   // light brown
    S: '#607d8b',   // steel
    s: '#90a4ae',   // light steel
    F: '#fdd835',   // gold
    f: '#fff59d',   // light gold
    N: '#3e2723',   // dark brown
    n: '#5d4037',   // medium brown
  };
  
  // Define sprites as 16x16 arrays of palette keys
  var SPRITES = {};
  
  // PLAYER - simple adventurer with blue outfit
  SPRITES.player = [
    '________________',
    '______TTT_______',
    '_____TTTTT______',
    '_____TfTfT______',
    '_____TTTTT______',
    '______TTT_______',
    '______bBb_______',
    '_____bBBBb______',
    '____SbBBBbS_____',
    '_____bBBBb______',
    '______bBb_______',
    '______b_b_______',
    '_____bb_bb______',
    '_____D___D______',
    '_____D___D______',
    '_____DD_DD______',
  ];
  
  // MAMEL - green blob/slime creature
  SPRITES.mamel = [
    '________________',
    '________________',
    '______ggg_______',
    '____gGGGGg______',
    '___gGGGGGGg_____',
    '___gGGKGKGg_____',
    '___gGGGGGGg_____',
    '___gGGGGGGg_____',
    '____gGGGGg______',
    '_____gGGg_______',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // CHINTALA - orange small animal
  SPRITES.chintala = [
    '________________',
    '________________',
    '____OO__OO______',
    '___OOOOOOOO_____',
    '___OoKOOKoO_____',
    '___OOOOOOOO_____',
    '____OOOOOO______',
    '_____OOOO_______',
    '____OOOOOO______',
    '___OOOOOOOO_____',
    '___O__OO__O_____',
    '______OO________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // NIGIRI - rice ball shaped creature
  SPRITES.nigiri = [
    '________________',
    '______KKK_______',
    '____KKWWWKK_____',
    '___KWWWWWWWK____',
    '___KWWWWWWWK____',
    '___KWWKWKWWK____',
    '___KWWWWWWWK____',
    '___KWWWKKWWK____',
    '____KWWWWWK_____',
    '____KKNNNKK_____',
    '_____NNNNN______',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // GHOST - purple ghost
  SPRITES.ghost = [
    '________________',
    '_____ppPpp______',
    '____PPPPPP______',
    '____PKPPKp______',
    '____PPPPPP______',
    '____PPpPPP______',
    '_____PPPP_______',
    '____PPPPPP______',
    '___PPPPPPPP_____',
    '___P_PP_PP_P____',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // POLYGON - teal mage with staff
  SPRITES.polygon = [
    '________________',
    '______tTt_______',
    '_____TTTTT______',
    '_____TKTTKT_____',
    '_____TTTTT______',
    '______TTT_______',
    '___Y__tTt_______',
    '___Y_tTTTt______',
    '___Y_tTTTt______',
    '___Y__tTt_______',
    '______t_t_______',
    '_____tt_tt______',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // DRAGON - red dragon
  SPRITES.dragon = [
    '________________',
    '___RR_____RR____',
    '___RRR___RRR____',
    '____RRRRRRR_____',
    '____RYKRYRKR____',
    '____RRRRRRR_____',
    '_____RRRRR______',
    '___RRRRRRRR_____',
    '__RRRRRRRRRR____',
    '__RR_RRRR_RR____',
    '_____RRRR_______',
    '______RR________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // SKULL_MAGE - gray skeletal dragon
  SPRITES.skull_mage = [
    '________________',
    '___ss_____ss____',
    '___sss___sss____',
    '____sssssss_____',
    '____sKsssKs_____',
    '____sssssss_____',
    '_____RRRRR______',
    '___sssssssss____',
    '__sssssssssss___',
    '__ss_ssss_ss____',
    '_____ssss_______',
    '______ss________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // MINOTAUR - brown bulky warrior
  SPRITES.minotaur = [
    '___DD_____DD____',
    '___DDDDDDDDD____',
    '____DDDDDDD_____',
    '____DKDDKD______',
    '____DDDDDDD_____',
    '_____DDDDD______',
    '____DDDDDDD_____',
    '___DDDDDDDDD____',
    '___DDDDDDDDD____',
    '___DD_DDD_DD____',
    '______DDD_______',
    '______D_D_______',
    '_____DD_DD______',
    '________________',
    '________________',
    '________________',
  ];
  
  // SHOPKEEPER - golden merchant
  SPRITES.shopkeeper = [
    '________________',
    '______FFF_______',
    '_____FFFFF______',
    '_____FKFFKF_____',
    '_____FFFFF______',
    '______FFF_______',
    '_____YYYYY______',
    '____YYYYYYY_____',
    '____YYYYYYY_____',
    '_____YYYYY______',
    '______Y_Y_______',
    '_____YY_YY______',
    '_____D___D______',
    '________________',
    '________________',
    '________________',
  ];
  
  // GUARD DOG - orange/red wolf
  SPRITES.guard_dog = [
    '________________',
    '___RR_____RR____',
    '___RRR___RRR____',
    '____RRRRRRR_____',
    '____RKRRRKR_____',
    '____RRRRRRR_____',
    '_____RRRRR______',
    '____RRRRRRR_____',
    '___RRRRRRRRR____',
    '___R__RRR__R____',
    '______RRR_______',
    '______R_R_______',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // ITEMS
  SPRITES.weapon = [
    '________________',
    '____________s___',
    '___________sS___',
    '__________sS____',
    '_________sS_____',
    '________sS______',
    '_______sS_______',
    '______sS________',
    '_____sS_________',
    '____DD__________',
    '___DdD__________',
    '___DD___________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  SPRITES.shield = [
    '________________',
    '________________',
    '____SSSSSS______',
    '___SssssssSS____',
    '___SssSSsssS____',
    '___SsSSSSSsS____',
    '___SsSSSSSSS____',
    '___SsSSSSSsS____',
    '___SssSSsssS____',
    '___SssssssSS____',
    '____SSSSSS______',
    '_____SSSS_______',
    '______SS________',
    '________________',
    '________________',
    '________________',
  ];
  
  SPRITES.grass = [
    '________________',
    '________________',
    '________________',
    '______GG________',
    '_____GGGG_______',
    '____GGGGG_______',
    '____GgGGG_______',
    '____GGGGG_______',
    '____GGGGG_______',
    '_____GGGG_______',
    '______GG________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  SPRITES.scroll = [
    '________________',
    '________________',
    '____YYYYYYY_____',
    '___YfffffffY____',
    '___YfKKKKKfY____',
    '___YfffffffY____',
    '___YfKKKKKfY____',
    '___YfffffffY____',
    '___YfKKKKKfY____',
    '___YfffffffY____',
    '____YYYYYYY_____',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  SPRITES.staff = [
    '________________',
    '___________bB___',
    '___________Bb___',
    '__________D_____',
    '_________D______',
    '________D_______',
    '_______D________',
    '______D_________',
    '_____D__________',
    '____D___________',
    '___D____________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  SPRITES.food = [
    '________________',
    '________________',
    '________________',
    '______KK________',
    '_____KKKKK______',
    '____KWWWWWK_____',
    '___KWWWWWWWK____',
    '___KWWWWWWWK____',
    '___KNNNNNNWK____',
    '___KNNNNNNWK____',
    '____KNNNNK______',
    '_____KKKK_______',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  SPRITES.stairs = [
    '________________',
    '__sssssssssss___',
    '__s_________s___',
    '__s_sssssss_s___',
    '__s_s_____s_s___',
    '__s_s_sss_s_s___',
    '__s_s_sKs_s_s___',
    '__s_s_sss_s_s___',
    '__s_s_____s_s___',
    '__s_sssssss_s___',
    '__s_________s___',
    '__sssssssssss___',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  SPRITES.trap = [
    '________________',
    '________________',
    '________________',
    '_______R________',
    '______RRR_______',
    '_____RRRRR______',
    '____RRRKRRR_____',
    '___RRRRRRRRR____',
    '___RRRRRRRRR____',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // TILES
  SPRITES.wall = [
    'NNNNNNNNNNNNNNNN',
    'NnnnNnnnNnnnNnnn',
    'NnnnNnnnNnnnNnnn',
    'NNNNNNNNNNNNNNNN',
    'nNnnnNnnnNnnnNnn',
    'nNnnnNnnnNnnnNnn',
    'NNNNNNNNNNNNNNNN',
    'NnnnNnnnNnnnNnnn',
    'NnnnNnnnNnnnNnnn',
    'NNNNNNNNNNNNNNNN',
    'nNnnnNnnnNnnnNnn',
    'nNnnnNnnnNnnnNnn',
    'NNNNNNNNNNNNNNNN',
    'NnnnNnnnNnnnNnnn',
    'NnnnNnnnNnnnNnnn',
    'NNNNNNNNNNNNNNNN',
  ];
  
  SPRITES.pot = [
    '________________',
    '________________',
    '______SSS_______',
    '_____S___S______',
    '____SSSSSSS_____',
    '___SsssssssS____',
    '___SsssssssS____',
    '___SsssssssS____',
    '___SsssssssS____',
    '____SsssssS_____',
    '_____SSSSS______',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // TOAD (ガマラ) - green frog
  SPRITES.toad = [
    '________________',
    '________________',
    '____GG____GG____',
    '___GGGG__GGGG___',
    '___GKGG__GGKG___',
    '____GGGGGGGG____',
    '____GGGGGGGG____',
    '___GGGGGGGGGG___',
    '___GGGGGGGGGG___',
    '____GGGGGGGG____',
    '___GG______GG___',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // BOY_CART (ボーイ) - orange boy with cart
  SPRITES.boy_cart = [
    '________________',
    '______OOO_______',
    '_____OOOOO______',
    '_____OKOOK______',
    '_____OOOOO______',
    '______OOO_______',
    '_____oOOOo______',
    '____oOOOOOo_____',
    '____oOOOOOo_____',
    '_____oOOOo______',
    '______o_o_______',
    '_____oo_oo______',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // SLUG (おばけ大根) - green radish monster
  SPRITES.slug = [
    '________________',
    '______GG________',
    '_____GGGG_______',
    '____GGGGGG______',
    '____GKGGKG______',
    '____GGGGGG______',
    '____GGgGGG______',
    '____GGGGGG______',
    '_____GGGG_______',
    '____GGGGGG______',
    '___GG____GG_____',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // THIEF_PELICAN (ぬすっトド) - blue seal/pelican
  SPRITES.thief_pelican = [
    '________________',
    '_____bBBBb______',
    '____BBBBBBB_____',
    '____BKBBBKB_____',
    '____BBBBBBB_____',
    '____BWWWWWB_____',
    '_____BBBBB______',
    '____BBBBBBB_____',
    '___BBBBBBBBB____',
    '____BBBBBBB_____',
    '_____BB_BB______',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // KENGO (ケンゴウ) - steel samurai
  SPRITES.kengo = [
    '________________',
    '______sss_______',
    '_____sSSSs______',
    '_____SKSKS______',
    '_____sSSSSs_____',
    '______sSs_______',
    '___s__sSs_______',
    '___s_sSSSs______',
    '___s_sSSSs______',
    '___s__sSs_______',
    '______s_s_______',
    '_____ss_ss______',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // CURSE_GIRL (ミドロ) - purple slime
  SPRITES.curse_girl = [
    '________________',
    '________________',
    '_____pPPPp______',
    '____PPPPPPP_____',
    '____PPKPPKP_____',
    '____PPPPPPP_____',
    '____PPpPPPP_____',
    '___PPPPPPPPP____',
    '___PPPPPPPPP____',
    '____PPPPPPP_____',
    '_____PPPPP______',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // BIG_CHINTALA (ギガヘッド) - large orange brute
  SPRITES.big_chintala = [
    '________________',
    '___OOOO__OOOO___',
    '__OOOOOOOOOOOO__',
    '__OOoKOOOOKoOO__',
    '__OOOOOOOOOOOO__',
    '__OOOOOOOOOOOO__',
    '___OOOOOOOOOO___',
    '____OOOOOOOO____',
    '___OOOOOOOOOO___',
    '__OOOOOOOOOOOO__',
    '__OOOOOOOOOOOO__',
    '__OO__OOOO__OO__',
    '______OOOO______',
    '________________',
    '________________',
    '________________',
  ];

  // MEGA_DRAGON (アークドラゴン) - dark red dragon
  SPRITES.mega_dragon = [
    '________________',
    '___RR_____RR____',
    '___RRR___RRR____',
    '____RRRRRRR_____',
    '____RYKRYRKR____',
    '____RRRRRRR_____',
    '__RRRRRRRRRRR___',
    '_RRRRRRRRRRRRR__',
    '_RR_RRRRRR_RR___',
    '____RRRRRR______',
    '___RRRRRRRR_____',
    '______RR________',
    '______RR________',
    '________________',
    '________________',
    '________________',
  ];

  // DEATH_REAPER (しにがみ) - dark skeletal figure
  SPRITES.death_reaper = [
    '________________',
    '______KKK_______',
    '_____KKKKK______',
    '_____KWKWK______',
    '_____KKKKK______',
    '______KKK_______',
    '___s__KKK_______',
    '___s_KKKKK______',
    '___s_KKKKK______',
    '___s__KKK_______',
    '______K_K_______',
    '_____KK_KK______',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // PHANTOM (ファントムデビル) - deep purple ghost
  SPRITES.phantom = [
    '________________',
    '_____PPPPP______',
    '____PPPPPPP_____',
    '____PPKPPKP_____',
    '____PPPPPPP_____',
    '____PPpPPPP_____',
    '_____PPPPP______',
    '___PPPPPPPPP____',
    '__PPPPPPPPPPP___',
    '__PP_PPP_PP_PP__',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // HELL_DRAGON (ギガドラゴン) - massive crimson dragon
  SPRITES.hell_dragon = [
    '__RR_______RR___',
    '__RRR_____RRR___',
    '___RRRRRRRRR____',
    '___RYKRRRYRKR___',
    '___RRRRRRRRR____',
    '____RRRRRRR_____',
    '__RRRRRRRRRRRR__',
    '_RRRRRRRRRRRRRR_',
    '_RRR_RRRRRR_RRR_',
    '_____RRRRRR_____',
    '____RRRRRRRR____',
    '_____RRRRRR_____',
    '______RRRR______',
    '______RR_RR_____',
    '________________',
    '________________',
  ];

  // CHAOS_KNIGHT (混沌の騎士) - dark magenta armored knight
  SPRITES.chaos_knight = [
    '________________',
    '______PPP_______',
    '_____PPPPP______',
    '_____PKPPKP_____',
    '_____PPPPP______',
    '______PPP_______',
    '___s_PPPPP______',
    '___sPPPPPPP_____',
    '___sPPPPPPP_____',
    '____PPPPPPP_____',
    '_____PP_PP______',
    '____PPP_PPP_____',
    '____SS___SS_____',
    '________________',
    '________________',
    '________________',
  ];

  // BRACELET - ring/circle
  SPRITES.bracelet = [
    '________________',
    '________________',
    '________________',
    '________________',
    '_____bBBBb______',
    '____Bb___bB_____',
    '___B_______B____',
    '___B_______B____',
    '___B_______B____',
    '____Bb___bB_____',
    '_____bBBBb______',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  // ARROW - pointed stick
  SPRITES.arrow = [
    '________________',
    '________________',
    '________________',
    '____________s___',
    '___________sS___',
    '__________sS____',
    '_________sS_____',
    '________DD______',
    '_______DD_______',
    '______DD________',
    '_____DD_________',
    '____DD__________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];

  SPRITES.floor = null; // just fill with color
  
  SPRITES.gold = [
    '________________',
    '________________',
    '________________',
    '_____FFFFF______',
    '____FFfFfFF_____',
    '___FFfFFFFfF____',
    '___FFfFFFFF_____',
    '___FFfFFFFF_____',
    '___FFfFFFFfF____',
    '____FFfFfFF_____',
    '_____FFFFF______',
    '________________',
    '________________',
    '________________',
    '________________',
    '________________',
  ];
  
  // Render a sprite definition to a cached canvas
  function renderSprite(spriteDef) {
    if (!spriteDef) return null;
    var canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    var ctx = canvas.getContext('2d');
    
    for (var y = 0; y < 16; y++) {
      var row = spriteDef[y];
      for (var x = 0; x < row.length && x < 16; x++) {
        var key = row[x];
        if (key === '_' || key === ' ') continue; // transparent
        var color = C[key];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }
  
  // Get a rendered sprite (cached)
  function getSprite(name) {
    if (!cache[name]) {
      if (SPRITES[name]) {
        cache[name] = renderSprite(SPRITES[name]);
      }
    }
    return cache[name] || null;
  }
  
  return {
    getSprite: getSprite,
    TILE_SIZE: TILE_SIZE,
    C: C
  };
})();
