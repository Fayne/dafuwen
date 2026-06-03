<template>
  <div class="player-panel">
    <!-- Player cards -->
    <div class="players-grid">
      <div
        v-for="player in store.players"
        :key="player.id"
        class="player-card"
        :class="{
          'active-player': store.currentPlayer?.id === player.id && store.phase === 'playing',
          'bankrupt': store.bankruptPlayers.includes(player.id)
        }"
        :style="{ '--player-color': player.color }"
      >
        <div class="player-top">
          <div class="player-token-big">{{ player.token }}</div>
          <div class="player-info">
            <div class="player-name">{{ player.name }}</div>
            <div class="player-money" :class="player.money < 0 ? 'text-red-400' : ''">
              ${{ player.money.toLocaleString() }}
            </div>
          </div>
          <div class="player-badges">
            <span v-if="player.inJail" class="badge badge-jail" title="在监狱中">🔒</span>
            <span v-if="player.jailFreeCards > 0" class="badge badge-free" title="出狱免费卡">🃏×{{ player.jailFreeCards }}</span>
            <span v-if="store.bankruptPlayers.includes(player.id)" class="badge badge-bust">破产</span>
          </div>
        </div>

        <!-- Properties mini display -->
        <div class="player-properties" v-if="myProps(player.id).length">
          <div
            v-for="prop in myProps(player.id)"
            :key="prop.squareId"
            class="prop-chip"
            :class="{ 'prop-mortgaged': prop.mortgaged }"
            :style="{ background: propColor(prop) }"
            :title="prop.name"
          >
            <span v-if="(prop.houses||0) >= 5">🏨</span>
            <span v-else-if="prop.houses > 0">{{ prop.houses }}🏠</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action panel for current player -->
    <div class="action-panel" v-if="store.phase === 'playing' && store.currentPlayer">
      <div class="action-header">
        <span class="font-display text-gold font-semibold text-sm">
          {{ store.currentPlayer.name }} 的回合
        </span>
        <span v-if="store.doublesCount > 0" class="doubles-badge">双数 ×{{ store.doublesCount }}</span>
      </div>

      <!-- Jail options -->
      <div v-if="store.currentPlayer.inJail" class="jail-options">
        <p class="jail-info text-orange-300 text-xs mb-2 font-body">在监狱中（第 {{ store.currentPlayer.jailTurns }} 回合）</p>
        <div class="flex gap-2 flex-wrap">
          <button
            v-if="store.currentPlayer.jailFreeCards > 0"
            @click="store.useJailFreeCard(store.currentPlayer)"
            class="action-btn btn-special text-xs"
          >使用免费卡</button>
          <button
            @click="store.payJailBail(store.currentPlayer)"
            :disabled="store.currentPlayer.money < 50"
            class="action-btn btn-pay text-xs disabled:opacity-40"
          >缴 $50 出狱</button>
          <button
            @click="store.rollDice()"
            :disabled="store.hasRolledThisTurn || store.isRolling"
            class="action-btn btn-roll text-xs disabled:opacity-40"
          >掷骰（赌双数）</button>
        </div>
      </div>

      <!-- Normal actions -->
      <div v-else class="normal-actions">
        <div class="flex gap-2">
          <button
            @click="store.rollDice()"
            :disabled="store.hasRolledThisTurn || store.isRolling"
            class="action-btn btn-roll flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🎲 {{ store.isRolling ? '掷骰中...' : '掷骰子' }}
          </button>
          <button
            @click="store.endTurn()"
            :disabled="!store.hasRolledThisTurn || store.isRolling"
            class="action-btn btn-end flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >结束回合 →</button>
        </div>
      </div>

      <!-- Build/Manage section -->
      <div v-if="myProps(store.currentPlayer.id).length" class="manage-section">
        <div class="manage-header" @click="showManage = !showManage">
          <span class="text-xs text-ivory/60 font-display">管理地产</span>
          <span class="text-gold text-xs">{{ showManage ? '▲' : '▼' }}</span>
        </div>
        <div v-if="showManage" class="manage-list">
          <div
            v-for="prop in myProps(store.currentPlayer.id)"
            :key="prop.squareId"
            class="manage-row"
          >
            <div class="manage-info">
              <span
                class="manage-color-dot"
                :style="{ background: propColor(prop) }"
              ></span>
              <span class="manage-name">{{ prop.name }}</span>
              <span class="manage-houses text-xs" v-if="prop.houses > 0">
                {{ prop.houses >= 5 ? '🏨' : `🏠×${prop.houses}` }}
              </span>
              <span v-if="prop.mortgaged" class="text-xs text-orange-400">抵押中</span>
            </div>
            <div class="manage-btns">
              <button
                v-if="prop.type === 'property' && !prop.mortgaged && (prop.houses||0) < 5"
                @click="store.buildHouse(store.currentPlayer.id, prop.squareId)"
                class="mini-btn mini-build" title="建房"
              >+🏠</button>
              <button
                v-if="prop.type === 'property' && (prop.houses||0) > 0"
                @click="store.sellHouse(store.currentPlayer.id, prop.squareId)"
                class="mini-btn mini-sell" title="卖房"
              >-🏠</button>
              <button
                v-if="!prop.mortgaged && (prop.houses||0) === 0"
                @click="store.mortgageProperty(store.currentPlayer.id, prop.squareId)"
                class="mini-btn mini-mortgage" title="抵押"
              >抵</button>
              <button
                v-if="prop.mortgaged"
                @click="store.unmortgageProperty(store.currentPlayer.id, prop.squareId)"
                class="mini-btn mini-unmortgage" title="解押"
              >解</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bankrupt button -->
      <button
        @click="confirmBankrupt"
        class="action-btn btn-bankrupt mt-2 w-full text-xs"
      >宣告破产</button>

      <!-- New game button -->
      <button
        @click="confirmNewGame"
        class="action-btn btn-newgame mt-1 w-full text-xs"
      >🔄 新开一盘</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game.js'
import { COLOR_GROUPS, BOARD_SQUARES } from '../data/boardData.js'

const store = useGameStore()
const showManage = ref(false)

function myProps(playerId) {
  return store.getPlayerProperties(playerId)
}

function propColor(prop) {
  if (!prop.group) return '#888'
  return COLOR_GROUPS[prop.group]?.color || '#888'
}

function confirmBankrupt() {
  if (confirm(`确定要让 ${store.currentPlayer.name} 宣告破产吗？`)) {
    store.declareBankruptcy(store.currentPlayer)
  }
}

function confirmNewGame() {
  if (confirm('确定放弃当前游戏并新开一盘？\n本局进度将被清除且无法恢复。')) {
    store.resetGame()
  }
}
</script>

<style scoped>
.player-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}
.players-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.player-card {
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(201,168,76,0.15);
  border-radius: 8px;
  padding: 8px 10px;
  transition: all 0.2s;
}
.active-player {
  border-color: var(--player-color) !important;
  background: rgba(0,0,0,0.4) !important;
  box-shadow: 0 0 0 1px var(--player-color), 0 2px 12px rgba(0,0,0,0.4);
}
.bankrupt { opacity: 0.4; }
.player-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.player-token-big {
  font-size: 20px;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}
.player-info { flex: 1; min-width: 0; }
.player-name {
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 600;
  color: #e2c06a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.player-money {
  font-family: 'Courier Prime', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #f5ead5;
}
.player-badges { display: flex; gap: 3px; flex-wrap: wrap; }
.badge {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
  font-family: 'Crimson Text', serif;
}
.badge-jail { background: rgba(255,138,101,0.2); color: #ff8a65; }
.badge-free { background: rgba(165,214,167,0.2); color: #a5d6a7; }
.badge-bust { background: rgba(239,154,154,0.2); color: #ef9a9a; }

.player-properties {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.prop-chip {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  border: 1px solid rgba(255,255,255,0.15);
}
.prop-mortgaged { opacity: 0.4; filter: grayscale(1); }

.action-panel {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 8px;
  padding: 10px;
}
.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.doubles-badge {
  font-size: 10px;
  padding: 1px 6px;
  background: rgba(201,168,76,0.2);
  color: #e2c06a;
  border-radius: 4px;
  font-family: 'Crimson Text', serif;
}
.jail-options { margin-bottom: 8px; }
.normal-actions { margin-bottom: 8px; }

.action-btn {
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;
  cursor: pointer;
}
.btn-roll {
  background: linear-gradient(135deg, #e2c06a, #c9a84c, #8a6820);
  color: #2a1a0a;
  box-shadow: 0 2px 8px rgba(201,168,76,0.3);
}
.btn-roll:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(201,168,76,0.4); }
.btn-end {
  background: rgba(245,234,213,0.08);
  color: #f5ead5;
  border: 1px solid rgba(245,234,213,0.2);
}
.btn-end:hover:not(:disabled) { background: rgba(245,234,213,0.15); }
.btn-pay { background: rgba(239,154,154,0.15); color: #ef9a9a; border: 1px solid rgba(239,154,154,0.3); }
.btn-special { background: rgba(165,214,167,0.15); color: #a5d6a7; border: 1px solid rgba(165,214,167,0.3); }
.btn-bankrupt { background: rgba(239,154,154,0.08); color: rgba(239,154,154,0.5); border: 1px solid rgba(239,154,154,0.15); }
.btn-bankrupt:hover { background: rgba(239,154,154,0.15); color: #ef9a9a; }
.btn-newgame { background: rgba(245,234,213,0.05); color: rgba(245,234,213,0.3); border: 1px solid rgba(245,234,213,0.08); }
.btn-newgame:hover { background: rgba(245,234,213,0.1); color: rgba(245,234,213,0.6); }

.manage-section { border-top: 1px solid rgba(201,168,76,0.1); margin-top: 8px; padding-top: 8px; }
.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 2px 0;
}
.manage-list { margin-top: 6px; display: flex; flex-direction: column; gap: 4px; }
.manage-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.manage-info { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.manage-color-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.manage-name { font-size: 11px; color: rgba(245,234,213,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.manage-houses { flex-shrink: 0; }
.manage-btns { display: flex; gap: 2px; flex-shrink: 0; }
.mini-btn {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  font-family: 'Courier Prime', monospace;
  cursor: pointer;
  transition: all 0.15s;
}
.mini-build { background: rgba(129,199,132,0.2); color: #81c784; }
.mini-sell  { background: rgba(239,154,154,0.2); color: #ef9a9a; }
.mini-mortgage { background: rgba(255,183,77,0.2); color: #ffb74d; }
.mini-unmortgage { background: rgba(144,202,249,0.2); color: #90caf9; }
</style>
