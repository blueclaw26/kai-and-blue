// Enemy Type Definitions
var ENEMY_DATA = {
  mamel: {
    name: 'マムル',
    char: 'M',
    color: '#8bc34a',
    hp: 3,
    attack: 1,
    defense: 0,
    exp: 3,
    minFloor: 1,
    maxFloor: 5,
    special: null
  },
  chintala: {
    name: 'チンタラ',
    char: 'C',
    color: '#ffb74d',
    hp: 5,
    attack: 2,
    defense: 0,
    exp: 5,
    minFloor: 1,
    maxFloor: 7,
    special: null
  },
  nigiri: {
    name: 'にぎり見習い',
    char: 'N',
    color: '#90caf9',
    hp: 8,
    attack: 3,
    defense: 1,
    exp: 10,
    minFloor: 3,
    maxFloor: 10,
    special: 'onigiri'
  },
  midnighthat: {
    name: 'ぼうれい武者',
    char: 'G',
    color: '#9575cd',
    hp: 12,
    attack: 4,
    defense: 1,
    exp: 15,
    minFloor: 5,
    maxFloor: 12,
    special: 'wallpass'
  },
  polygon: {
    name: 'パ王',
    char: 'P',
    color: '#4db6ac',
    hp: 15,
    attack: 5,
    defense: 2,
    exp: 20,
    minFloor: 7,
    maxFloor: 15,
    special: 'magic'
  },
  dragon: {
    name: 'ドラゴン',
    char: 'D',
    color: '#e53935',
    hp: 30,
    attack: 10,
    defense: 4,
    exp: 50,
    minFloor: 10,
    maxFloor: 20,
    special: 'firebreath'
  },
  skull_mage: {
    name: 'スカルドラゴン',
    char: 'S',
    color: '#bdbdbd',
    hp: 25,
    attack: 8,
    defense: 3,
    exp: 35,
    minFloor: 12,
    maxFloor: 20,
    special: 'floorfire'
  },
  minotaur: {
    name: 'タウロス',
    char: 'T',
    color: '#8d6e63',
    hp: 35,
    attack: 12,
    defense: 5,
    exp: 60,
    minFloor: 15,
    maxFloor: 20,
    special: 'critical'
  },
  shopkeeper: {
    name: '店主',
    char: '$',
    color: '#ffd700',
    hp: 200,
    attack: 50,
    defense: 30,
    exp: 0,
    minFloor: 99,
    maxFloor: 99,
    special: null,
    isShopkeeper: true
  }
};
