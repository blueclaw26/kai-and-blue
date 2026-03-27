// Inventory System - extracted from game.js
// Adds inventory/item management methods to Game.prototype
(function() {
  'use strict';

  Game.prototype.pickUpItem = function() {
    var item = this.getItemAt(this.player.x, this.player.y);
    if (!item) {
      // If in shop with debt, 'g' pays the debt
      if (this.inShop && this.shopDebt > 0 && !this.shopkeeperHostile) {
        return this._payShopDebt();
      }
      this.ui.addMessage('足元には何もない', 'system');
      return false;
    }

    // Gold pickup
    if (item.isGold) {
      this.player.gold += item.goldAmount;
      this.removeItem(item);
      this.ui.addMessage(item.goldAmount + 'ギタンを拾った', 'pickup');
      return true;
    }

    // Shop item: pick up but track as debt (Shiren-style)
    if (item.shopItem && !this.shopkeeperHostile) {
      return this._pickUpShopItem(item);
    }

    if (!this.player.canPickUp()) {
      this.ui.addMessage('持ち物がいっぱいだ', 'system');
      return false;
    }
    this.player.pickUp(item);
    this.removeItem(item);
    Sound.play('pickup');
    this.ui.addMessage(item.getDisplayName() + 'を拾った', 'pickup');
    return true;
  };

  Game.prototype.dropItem = function(item) {
    if (this.getItemAt(this.player.x, this.player.y)) {
      this.ui.addMessage('ここには既にアイテムがある', 'system');
      return false;
    }
    if (this.player.weapon === item) {
      this.player.weapon = null;
      this.player._recalcStats();
    }
    if (this.player.shield === item) {
      this.player.shield = null;
      this.player._recalcStats();
    }
    if (this.player.bracelet === item) {
      this.player.bracelet = null;
      this.player._recalcStats();
    }
    this.player.removeFromInventory(item);
    item.x = this.player.x;
    item.y = this.player.y;
    this.items.push(item);

    // If dropping in shop room → sell offer (with price identification)
    if (this.isInShop(this.player.x, this.player.y) && !this.shopkeeperHostile && this.getShopkeeper()) {
      var sellPrice = item.getSellPrice();
      this.ui.addMessage('店主「' + item.getDisplayName() + 'を' + sellPrice + 'ギタンで買い取るよ」(y/n)', 'system');
      this.sellConfirmMode = { item: item, price: sellPrice };
      return true;
    }

    this.ui.addMessage(item.getDisplayName() + 'を足元に置いた', 'system');
    return true;
  };

  Game.prototype.useItem = function(item) {
    var consumed = item.use(this, this.player);
    if (consumed) {
      this.player.removeFromInventory(item);
      if (this.inventorySelection >= this.player.inventory.length) {
        this.inventorySelection = Math.max(0, this.player.inventory.length - 1);
      }
    }
    return consumed;
  };

  // --- Pot interaction ---
  Game.prototype.putItemInPot = function(pot, item) {
    var ui = this.ui;
    var player = this.player;

    if (!pot.contents) pot.contents = [];
    if (pot.contents.length >= pot.capacity) {
      ui.addMessage('壺がいっぱいだ', 'system');
      return false;
    }

    if (item.type === 'pot') {
      ui.addMessage('壺に壺は入れられない', 'system');
      return false;
    }

    if (player.weapon === item || player.shield === item) {
      ui.addMessage('装備中のアイテムは入れられない', 'system');
      return false;
    }

    player.removeFromInventory(item);
    pot.contents.push(item);

    switch (pot.effect) {
      case 'identify':
        if (!item.identified) {
          var fakeName = item.getDisplayName();
          item.identify();
          ui.addMessage(item.getRealDisplayName() + 'だと判明した！', 'pickup');
        } else {
          ui.addMessage(item.getDisplayName() + 'を入れた', 'system');
        }
        break;
      case 'synthesis':
        this._trySynthesis(pot, ui);
        break;
      case 'none':
        ui.addMessage(item.getDisplayName() + 'を入れた', 'system');
        break;
      default:
        ui.addMessage(item.getDisplayName() + 'を入れた', 'system');
        break;
    }

    return true;
  };

  Game.prototype._trySynthesis = function(pot, ui) {
    if (!pot.contents || pot.contents.length < 2) return;

    var baseWeapon = null;
    var baseShield = null;
    for (var i = 0; i < pot.contents.length; i++) {
      if (pot.contents[i].type === 'weapon' && !baseWeapon) baseWeapon = pot.contents[i];
      if (pot.contents[i].type === 'shield' && !baseShield) baseShield = pot.contents[i];
    }

    // Synthesize weapons
    if (baseWeapon) {
      var merged = false;
      for (var w = pot.contents.length - 1; w >= 0; w--) {
        var wItem = pot.contents[w];
        if (wItem === baseWeapon) continue;
        if (wItem.type !== 'weapon') continue;

        baseWeapon.plus = (baseWeapon.plus || 0) + (wItem.plus || 0);
        baseWeapon.modifier = (baseWeapon.modifier || 0) + (wItem.modifier || 0);
        baseWeapon.attack = (baseWeapon.attack || 0) + (wItem.modifier || 0);

        if (!baseWeapon.seals) baseWeapon.seals = [];
        var maxSeals = baseWeapon.slots || 3;
        if (wItem.seals) {
          for (var si = 0; si < wItem.seals.length; si++) {
            if (baseWeapon.seals.length >= maxSeals) break;
            if (baseWeapon.seals.indexOf(wItem.seals[si]) === -1) {
              baseWeapon.seals.push(wItem.seals[si]);
            }
          }
        }

        pot.contents.splice(w, 1);
        merged = true;
      }
      if (merged) {
        ui.addMessage('合成成功！ ' + baseWeapon.getDisplayName(), 'heal');
      }
    }

    // Synthesize shields
    if (baseShield) {
      var mergedS = false;
      for (var s = pot.contents.length - 1; s >= 0; s--) {
        var sItem = pot.contents[s];
        if (sItem === baseShield) continue;
        if (sItem.type !== 'shield') continue;

        baseShield.plus = (baseShield.plus || 0) + (sItem.plus || 0);
        baseShield.modifier = (baseShield.modifier || 0) + (sItem.modifier || 0);
        baseShield.defense = (baseShield.defense || 0) + (sItem.modifier || 0);

        if (!baseShield.seals) baseShield.seals = [];
        var maxSSeals = baseShield.slots || 3;
        if (sItem.seals) {
          for (var ssi = 0; ssi < sItem.seals.length; ssi++) {
            if (baseShield.seals.length >= maxSSeals) break;
            if (baseShield.seals.indexOf(sItem.seals[ssi]) === -1) {
              baseShield.seals.push(sItem.seals[ssi]);
            }
          }
        }

        pot.contents.splice(s, 1);
        mergedS = true;
      }
      if (mergedS) {
        ui.addMessage('合成成功！ ' + baseShield.getDisplayName(), 'heal');
      }
    }
  };

  Game.prototype.takeItemFromPot = function(pot, contentIndex) {
    var ui = this.ui;
    var player = this.player;

    if (pot.effect !== 'storage' && pot.effect !== 'synthesis') {
      ui.addMessage('この壺からは取り出せない！', 'system');
      return false;
    }

    if (!pot.contents || pot.contents.length === 0) {
      ui.addMessage('壺は空だ', 'system');
      return false;
    }

    if (!player.canPickUp()) {
      ui.addMessage('持ち物がいっぱいだ', 'system');
      return false;
    }

    var item = pot.contents.splice(contentIndex, 1)[0];
    player.inventory.push(item);
    ui.addMessage(item.getDisplayName() + 'を取り出した', 'pickup');
    return true;
  };

})();
