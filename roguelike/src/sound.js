// Sound Effects System using Web Audio API
var Sound = (function() {
  'use strict';

  var ctx = null;
  var muted = false;
  var bgmMuted = false;

  function _getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function init() {
    _getCtx();
  }

  function play(type) {
    if (muted) return;
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();

    switch(type) {
      case 'attack': playTone(200, 0.05, 'square'); break;
      case 'hit': playTone(150, 0.08, 'sawtooth'); break;
      case 'kill': playTone(400, 0.1, 'square'); playTone(600, 0.1, 'square', 0.1); break;
      case 'pickup': playTone(800, 0.05, 'sine'); playTone(1000, 0.05, 'sine', 0.05); break;
      case 'stairs': playTone(300, 0.1, 'sine'); playTone(400, 0.1, 'sine', 0.1); playTone(500, 0.1, 'sine', 0.2); break;
      case 'levelup': playTone(400, 0.1, 'sine'); playTone(500, 0.1, 'sine', 0.1); playTone(600, 0.1, 'sine', 0.2); playTone(800, 0.15, 'sine', 0.3); break;
      case 'damage': playNoise(0.08); break;
      case 'heal': playTone(600, 0.08, 'sine'); playTone(800, 0.08, 'sine', 0.08); break;
      case 'trap': playTone(100, 0.15, 'sawtooth'); break;
      case 'miss': playTone(100, 0.03, 'sine'); break;
      case 'equip': playTone(500, 0.05, 'square'); playTone(700, 0.05, 'square', 0.05); break;
      case 'scroll': playTone(600, 0.08, 'sine'); playTone(500, 0.08, 'sine', 0.08); playTone(700, 0.08, 'sine', 0.16); break;
      case 'gameover': playTone(400, 0.2, 'sawtooth'); playTone(300, 0.2, 'sawtooth', 0.2); playTone(200, 0.3, 'sawtooth', 0.4); break;
      case 'victory': for(var i=0;i<6;i++) playTone(400+i*100, 0.1, 'sine', i*0.1); break;
      case 'shop': playTone(500, 0.05, 'sine'); playTone(600, 0.05, 'sine', 0.08); break;
      case 'thief': playTone(200, 0.1, 'square'); playTone(300, 0.1, 'square', 0.1); playTone(200, 0.1, 'square', 0.2); break;
      case 'arrow': playTone(300, 0.04, 'sawtooth'); playTone(250, 0.04, 'sawtooth', 0.04); break;
    }
  }

  function playTone(freq, dur, type, delay) {
    delay = delay || 0;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type || 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.01);
  }

  function playNoise(dur) {
    var bufferSize = ctx.sampleRate * dur;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    var gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    source.start();
  }

  function toggleMute() {
    muted = !muted;
    if (muted && Sound.bgm) Sound.bgm.stop();
    return muted;
  }

  function isMuted() {
    return muted;
  }

  return {
    play: play,
    init: init,
    toggleMute: toggleMute,
    isMuted: isMuted,
    _getCtx: _getCtx,
    get muted() { return muted; },
    get bgmMuted() { return bgmMuted; },
    set bgmMuted(v) { bgmMuted = v; }
  };
})();

// BGM System - chiptune background music
Sound.bgm = {
  playing: false,
  intervalId: null,
  currentTrack: null,

  // Dungeon: calm, atmospheric A minor pentatonic
  dungeon: [
    [220, 0.35], [262, 0.35], [294, 0.35], [330, 0.7],
    [294, 0.35], [262, 0.35], [220, 0.35], [196, 0.7],
    [220, 0.35], [294, 0.35], [330, 0.35], [392, 0.7],
    [330, 0.35], [294, 0.35], [262, 0.35], [220, 0.7],
    [196, 0.35], [220, 0.35], [262, 0.35], [294, 0.7],
    [262, 0.35], [220, 0.35], [196, 0.35], [175, 0.7],
    [196, 0.35], [220, 0.35], [262, 0.35], [220, 0.7],
    [0, 0.7] // rest
  ],

  // Danger: faster, tense melody for deep floors / monster house
  danger: [
    [330, 0.2], [294, 0.2], [262, 0.2], [220, 0.2],
    [262, 0.2], [294, 0.2], [330, 0.4],
    [392, 0.2], [330, 0.2], [294, 0.2], [262, 0.2],
    [294, 0.2], [330, 0.2], [392, 0.4],
    [440, 0.2], [392, 0.2], [330, 0.2], [294, 0.2],
    [262, 0.2], [220, 0.2], [196, 0.4],
    [220, 0.2], [262, 0.2], [220, 0.2], [196, 0.4],
    [0, 0.2]
  ],

  // Shop: cheerful major pentatonic
  shop: [
    [392, 0.25], [440, 0.25], [494, 0.25], [523, 0.5],
    [494, 0.25], [440, 0.25], [392, 0.5],
    [440, 0.25], [494, 0.25], [523, 0.25], [587, 0.5],
    [523, 0.25], [494, 0.25], [440, 0.5],
    [523, 0.25], [494, 0.25], [440, 0.25], [392, 0.5],
    [440, 0.25], [392, 0.25], [349, 0.5],
    [392, 0.25], [440, 0.25], [392, 0.5],
    [0, 0.5]
  ],

  play: function(track) {
    if (this.playing || Sound.muted || Sound.bgmMuted) return;
    this.playing = true;
    this.currentTrack = track || 'dungeon';
    var notes = this[this.currentTrack] || this.dungeon;
    var noteIndex = 0;
    var ctx = Sound._getCtx();

    var self = this;
    var playNext = function() {
      if (!self.playing || Sound.muted || Sound.bgmMuted) {
        self.playing = false;
        return;
      }
      var note = notes[noteIndex % notes.length];
      if (note[0] > 0) { // skip rests (freq 0)
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = note[0];
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note[1] * 0.85);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + note[1]);
      }
      noteIndex++;
      self.intervalId = setTimeout(playNext, note[1] * 1000);
    };
    playNext();
  },

  stop: function() {
    this.playing = false;
    this.currentTrack = null;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  },

  switchTrack: function(track) {
    if (this.currentTrack === track) return;
    this.stop();
    var self = this;
    setTimeout(function() { self.play(track); }, 100);
  },

  toggleBgm: function() {
    Sound.bgmMuted = !Sound.bgmMuted;
    if (Sound.bgmMuted) {
      this.stop();
    } else if (!this.playing) {
      this.play(this.currentTrack || 'dungeon');
    }
    return Sound.bgmMuted;
  }
};
