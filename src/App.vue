<template>
  <div class="app-root">
    <PlayerSetup v-if="store.phase === 'setup'" />

    <template v-else>
      <!-- ═══════════════════════════════════════════
           DESKTOP layout (≥ 768px) — unchanged
      ═══════════════════════════════════════════ -->
      <div class="game-layout desktop-layout">
        <aside class="sidebar-left scrollbar-thin"><PlayerPanel /></aside>
        <main class="board-area">
          <Board @squareClick="openSquareDetail">
            <div class="center-content">
              <div class="title-text">大富翁</div>
              <Dice />
              <div class="parking-pot" v-if="store.parkingPot > 0">
                <span class="pp-label">停车奖金</span>
                <span class="pp-amount">${{ store.parkingPot }}</span>
              </div>
            </div>
          </Board>
        </main>
        <aside class="sidebar-right"><GameLog /></aside>
      </div>

      <!-- ═══════════════════════════════════════════
           MOBILE layout (< 768px)
           Board fills screen; everything else is
           floating panels / bottom bar
      ═══════════════════════════════════════════ -->
      <div class="mobile-layout">
        <!-- Full-screen board -->
        <div class="mobile-board-wrap">
          <Board @squareClick="openSquareDetail">
            <div class="mobile-center">
              <div class="title-text-mobile">大富翁</div>
              <Dice />
              <div class="parking-pot-sm" v-if="store.parkingPot > 0">🅿️ ${{ store.parkingPot }}</div>
            </div>
          </Board>
        </div>

        <!-- ── Top status bar ── -->
        <div class="mobile-topbar">
          <!-- Current player pill -->
          <div class="topbar-player" v-if="store.currentPlayer">
            <span class="topbar-token" :style="{ borderColor: store.currentPlayer.color }">{{ store.currentPlayer.token }}</span>
            <span class="topbar-name">{{ store.currentPlayer.name }}</span>
            <span class="topbar-money">${{ store.currentPlayer.money.toLocaleString() }}</span>
            <span v-if="store.currentPlayer.inJail" class="topbar-badge jail">🔒</span>
            <span v-if="store.doublesCount > 0" class="topbar-badge double">×{{ store.doublesCount }}</span>
          </div>
          <!-- Top-right buttons -->
          <div class="topbar-actions">
            <button class="topbar-btn" @click="mobilePanel = mobilePanel === 'players' ? null : 'players'" :class="{ active: mobilePanel === 'players' }">👥</button>
            <button class="topbar-btn" @click="mobilePanel = mobilePanel === 'log' ? null : 'log'" :class="{ active: mobilePanel === 'log' }">📋</button>
          </div>
        </div>

        <!-- ── Bottom action bar ── -->
        <div class="mobile-actions" v-if="store.phase === 'playing' && store.currentPlayer">
          <!-- Jail mode -->
          <template v-if="store.currentPlayer.inJail">
            <button v-if="store.currentPlayer.jailFreeCards > 0"
              @click="store.useJailFreeCard(store.currentPlayer)"
              class="mob-btn mob-btn-special">🃏 免费卡</button>
            <button @click="store.payJailBail(store.currentPlayer)"
              :disabled="store.currentPlayer.money < 50"
              class="mob-btn mob-btn-pay disabled:opacity-40">缴 $50</button>
            <button @click="store.rollDice()"
              :disabled="store.hasRolledThisTurn || store.isRolling"
              class="mob-btn mob-btn-roll flex-1 disabled:opacity-40">
              🎲 {{ store.isRolling ? '…' : '赌双数' }}
            </button>
          </template>
          <!-- Normal mode -->
          <template v-else>
            <button @click="store.rollDice()"
              :disabled="store.hasRolledThisTurn || store.isRolling"
              class="mob-btn mob-btn-roll flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
              🎲 {{ store.isRolling ? '掷骰中…' : '掷骰子' }}
            </button>
            <button @click="store.endTurn()"
              :disabled="!store.hasRolledThisTurn || store.isRolling"
              class="mob-btn mob-btn-end flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
              结束回合 →
            </button>
          </template>
          <!-- Manage button -->
          <button class="mob-btn mob-btn-manage" @click="mobilePanel = mobilePanel === 'manage' ? null : 'manage'" :class="{ active: mobilePanel === 'manage' }">🏘️</button>
        </div>

        <!-- ── Slide-up panels ── -->
        <Transition name="panel-slide">
          <div v-if="mobilePanel === 'players'" class="mobile-panel" @click.self="mobilePanel = null">
            <div class="panel-sheet">
              <div class="panel-handle"></div>
              <div class="panel-title">玩家</div>
              <div class="panel-scroll">
                <!-- Player cards (simplified for mobile) -->
                <div v-for="player in store.players" :key="player.id"
                  class="mob-player-card"
                  :class="{ 'mob-active': store.currentPlayer?.id === player.id, 'mob-bankrupt': store.bankruptPlayers.includes(player.id) }"
                  :style="{ '--pc': player.color }"
                  @click="openPlayerAssets(player); mobilePanel = null"
                >
                  <span class="mob-token" :style="{ borderColor: player.color }">{{ player.token }}</span>
                  <div class="mob-pinfo">
                    <div class="mob-pname">{{ player.name }}</div>
                    <div class="mob-pmoney" :class="player.money < 0 ? 'text-red-400' : ''">
                      ${{ player.money.toLocaleString() }}
                    </div>
                  </div>
                  <div class="mob-pbadges">
                    <span v-if="player.inJail" class="mob-badge jail">🔒</span>
                    <span v-if="player.jailFreeCards > 0" class="mob-badge free">🃏{{ player.jailFreeCards }}</span>
                    <span v-if="store.bankruptPlayers.includes(player.id)" class="mob-badge bust">破产</span>
                  </div>
                  <span class="mob-prop-count" v-if="store.getPlayerProperties(player.id).length">
                    🏠{{ store.getPlayerProperties(player.id).length }}
                  </span>
                </div>
              </div>
              <!-- New game / bankrupt -->
              <div class="panel-footer">
                <button @click="confirmBankrupt(); mobilePanel = null" class="panel-footer-btn danger">宣告破产</button>
                <button @click="confirmNewGame(); mobilePanel = null" class="panel-footer-btn">🔄 新开一盘</button>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="panel-slide">
          <div v-if="mobilePanel === 'log'" class="mobile-panel" @click.self="mobilePanel = null">
            <div class="panel-sheet">
              <div class="panel-handle"></div>
              <div class="panel-title">游戏日志</div>
              <div class="panel-scroll">
                <GameLog />
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="panel-slide">
          <div v-if="mobilePanel === 'manage'" class="mobile-panel" @click.self="mobilePanel = null">
            <div class="panel-sheet">
              <div class="panel-handle"></div>
              <div class="panel-title">管理地产 · {{ store.currentPlayer?.name }}</div>
              <div class="panel-scroll">
                <div v-if="!currentProps.length" class="mob-empty">尚无地产</div>
                <div v-for="prop in currentProps" :key="prop.squareId" class="mob-manage-row">
                  <span class="mob-color-dot" :style="{ background: propColor(prop) }"></span>
                  <div class="mob-manage-info">
                    <div class="mob-manage-name">{{ prop.name }}</div>
                    <div class="mob-manage-sub">
                      <span v-if="(prop.houses||0) >= 5">🏨 酒店</span>
                      <span v-else-if="(prop.houses||0) > 0">🏠 ×{{ prop.houses }}</span>
                      <span v-else class="text-ivory/40">空地</span>
                      <span v-if="prop.mortgaged" class="mob-mortgage-tag ml-1">抵押中</span>
                    </div>
                  </div>
                  <div class="mob-manage-btns">
                    <button v-if="prop.type === 'property' && !prop.mortgaged && (prop.houses||0) < 5"
                      @click="store.buildHouse(store.currentPlayer.id, prop.squareId)"
                      class="mob-mini-btn build">+🏠</button>
                    <button v-if="prop.type === 'property' && (prop.houses||0) > 0"
                      @click="store.sellHouse(store.currentPlayer.id, prop.squareId)"
                      class="mob-mini-btn sell">-🏠</button>
                    <button v-if="!prop.mortgaged && (prop.houses||0) === 0"
                      @click="store.mortgageProperty(store.currentPlayer.id, prop.squareId)"
                      class="mob-mini-btn mortgage">抵押</button>
                    <button v-if="prop.mortgaged"
                      @click="store.unmortgageProperty(store.currentPlayer.id, prop.squareId)"
                      class="mob-mini-btn unmortgage">解押</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </template>

    <Modal />
    <SquareDetailModal :square="detailSquare" @close="detailSquare = null" />
    <PlayerAssetsModal :player="assetsPlayer" @close="assetsPlayer = null" />

    <!-- Audio toggle (shared) -->
    <button class="audio-toggle" @click="audio.toggleMute" :title="audio.muted.value ? '开启音效' : '关闭音效'">
      <span v-if="audio.muted.value">🔇</span><span v-else>🔊</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/game.js'
import { useAudio } from './composables/useAudio.js'
import { COLOR_GROUPS } from './data/boardData.js'
import PlayerSetup from './components/PlayerSetup.vue'
import Board from './components/Board.vue'
import PlayerPanel from './components/PlayerPanel.vue'
import GameLog from './components/GameLog.vue'
import Dice from './components/Dice.vue'
import Modal from './components/Modal.vue'
import SquareDetailModal from './components/SquareDetailModal.vue'
import PlayerAssetsModal from './components/PlayerAssetsModal.vue'

const store = useGameStore()
const audio = useAudio()
const detailSquare = ref(null)
const assetsPlayer = ref(null)
const mobilePanel  = ref(null)

function openSquareDetail(sq) { detailSquare.value = sq }
function openPlayerAssets(p)  { assetsPlayer.value = p  }

const currentProps = computed(() =>
  store.currentPlayer ? store.getPlayerProperties(store.currentPlayer.id) : []
)
function propColor(prop) {
  if (!prop.group) return '#888'
  return COLOR_GROUPS[prop.group]?.color || '#888'
}
function confirmBankrupt() {
  if (confirm(`确定让 ${store.currentPlayer?.name} 宣告破产？`)) store.declareBankruptcy(store.currentPlayer)
}
function confirmNewGame() {
  if (confirm('放弃当前游戏并新开一盘？进度将被清除。')) store.resetGame()
}

// Close panel when modal opens
watch(() => store.modal, (m) => { if (m) mobilePanel.value = null })

watch(() => store.phase, (p) => { if (p === 'playing') audio.playBgm(); else audio.stopBgm() })
watch(() => store.isRolling, (rolling) => {
  if (rolling) { audio.playDice(); audio.duckBgm() }
  else { audio.stopDice(); if (store.movingPlayerId === null) audio.restoreBgm() }
})
watch(() => store.movingPlayerId, (id) => {
  if (id !== null) { audio.playTokenMove(); audio.duckBgm() }
  else { audio.stopTokenMove(); if (!store.isRolling) audio.restoreBgm() }
})

function onKeydown(e) {
  if (store.phase !== 'playing' || store.modal || store.movingPlayerId !== null) return
  if (e.code === 'Space' && !store.hasRolledThisTurn && !store.isRolling) { e.preventDefault(); store.rollDice() }
  if (e.code === 'Escape' && store.hasRolledThisTurn && !store.isRolling) { e.preventDefault(); store.endTurn() }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.app-root { height: 100vh; overflow: hidden; display: flex; flex-direction: column; }

/* Setup screen: unlock height so content can scroll freely on any screen size */
.app-root:has(.player-setup-scroll) {
  height: auto;
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── DESKTOP (shown ≥768px, hidden on mobile) ── */
.desktop-layout {
  flex: 1; display: flex; gap: 10px; padding: 10px; overflow: hidden; min-height: 0;
}
.sidebar-left  { width: 210px; flex-shrink: 0; overflow-y: auto; overflow-x: hidden; }
.sidebar-right { width: 190px; flex-shrink: 0; display: flex; flex-direction: column; min-height: 0; }
.board-area    { flex: 1; min-width: 0; min-height: 0; display: flex; align-items: center; justify-content: center; }

.center-content {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; z-index: 1; position: relative;
}
.title-text {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 3.5vw, 46px); font-weight: 900; color: #c9a84c;
  letter-spacing: 0.2em; text-shadow: 0 2px 16px rgba(201,168,76,0.5); line-height: 1;
}
.parking-pot { display:flex; flex-direction:column; align-items:center; gap:2px; background:rgba(0,0,0,0.3); border:1px solid rgba(201,168,76,0.3); border-radius:8px; padding:5px 12px; }
.pp-label { font-size:11px; color:rgba(245,234,213,0.5); font-family:'Crimson Text',serif; }
.pp-amount { font-family:'Courier Prime',monospace; font-weight:700; color:#c9a84c; font-size:15px; }

/* ── MOBILE layout (shown <768px, hidden on desktop) ── */
.mobile-layout { display: none; flex: 1; flex-direction: column; position: relative; overflow: hidden; }

.mobile-board-wrap {
  flex: 1; min-height: 0;
  /* leave room for top bar (44px) + bottom bar (64px) */
  padding-top: 44px;
  padding-bottom: 64px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}

/* Mobile center panel content */
.mobile-center {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; z-index: 1; position: relative;
}
.title-text-mobile {
  font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900;
  color: #c9a84c; letter-spacing: 0.2em; text-shadow: 0 2px 8px rgba(201,168,76,0.5);
}
.parking-pot-sm {
  font-family: 'Courier Prime', monospace; font-size: 11px; font-weight: 700;
  color: #c9a84c; background: rgba(0,0,0,0.35); border-radius: 6px; padding: 2px 8px;
}

/* ── Top status bar (mobile) ── */
.mobile-topbar {
  position: absolute; top: 0; left: 0; right: 0; height: 44px;
  background: rgba(15,35,24,0.92); backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(201,168,76,0.2);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 10px; z-index: 20; gap: 8px;
}
.topbar-player { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.topbar-token  {
  width: 28px; height: 28px; border: 2px solid; border-radius: 50%;
  background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.topbar-name  { font-family:'Playfair Display',serif; font-size:13px; font-weight:700; color:#e2c06a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px; }
.topbar-money { font-family:'Courier Prime',monospace; font-size:13px; font-weight:700; color:#f5ead5; white-space:nowrap; }
.topbar-badge { font-size: 10px; padding: 1px 4px; border-radius: 4px; flex-shrink: 0; }
.topbar-badge.jail   { background: rgba(255,138,101,0.2); color:#ff8a65; }
.topbar-badge.double { background: rgba(201,168,76,0.2);  color:#e2c06a; }
.topbar-actions { display: flex; gap: 4px; flex-shrink: 0; }
.topbar-btn {
  width: 32px; height: 32px; border-radius: 8px; font-size: 14px;
  background: rgba(0,0,0,0.3); border: 1px solid rgba(201,168,76,0.2);
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;
}
.topbar-btn.active { background: rgba(201,168,76,0.2); border-color: rgba(201,168,76,0.5); }

/* ── Bottom action bar (mobile) ── */
.mobile-actions {
  position: absolute; bottom: 0; left: 0; right: 0; height: 64px;
  background: rgba(15,35,24,0.95); backdrop-filter: blur(8px);
  border-top: 1px solid rgba(201,168,76,0.2);
  display: flex; align-items: center; gap: 6px; padding: 0 10px; z-index: 20;
}
.mob-btn {
  height: 44px; border-radius: 10px; font-family: 'Playfair Display', serif;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s;
  padding: 0 14px; white-space: nowrap; display: flex; align-items: center; justify-content: center;
}
.mob-btn-roll {
  background: linear-gradient(135deg, #e2c06a, #c9a84c, #8a6820);
  color: #2a1a0a; box-shadow: 0 2px 8px rgba(201,168,76,0.3);
}
.mob-btn-roll:hover:not(:disabled) { transform: translateY(-1px); }
.mob-btn-end  { background: rgba(245,234,213,0.1); color: #f5ead5; border: 1px solid rgba(245,234,213,0.25); }
.mob-btn-end:hover:not(:disabled) { background: rgba(245,234,213,0.18); }
.mob-btn-pay     { background: rgba(239,154,154,0.15); color:#ef9a9a; border:1px solid rgba(239,154,154,0.3); }
.mob-btn-special { background: rgba(165,214,167,0.15); color:#a5d6a7; border:1px solid rgba(165,214,167,0.3); }
.mob-btn-manage  {
  width: 44px; padding: 0; flex-shrink: 0;
  background: rgba(0,0,0,0.3); color: #f5ead5; border: 1px solid rgba(201,168,76,0.2);
}
.mob-btn-manage.active { background: rgba(201,168,76,0.2); border-color: rgba(201,168,76,0.5); }

/* ── Slide-up panels ── */
.mobile-panel {
  position: absolute; inset: 0; z-index: 50;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.panel-sheet {
  width: 100%; max-height: 70vh; background: #1a3a2a;
  border: 1px solid rgba(201,168,76,0.3); border-bottom: none;
  border-radius: 16px 16px 0 0;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.panel-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(201,168,76,0.3); margin: 10px auto 0; flex-shrink: 0;
}
.panel-title {
  font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700;
  color: #e2c06a; text-align: center; padding: 8px 16px 6px; flex-shrink: 0;
  border-bottom: 1px solid rgba(201,168,76,0.12);
}
.panel-scroll { flex: 1; overflow-y: auto; padding: 8px 0; }
.panel-footer { display:flex; gap:8px; padding:10px 12px; border-top:1px solid rgba(201,168,76,0.12); flex-shrink:0; }
.panel-footer-btn {
  flex:1; padding:10px; border-radius:8px; font-family:'Playfair Display',serif; font-size:13px; font-weight:700;
  background:rgba(245,234,213,0.08); color:rgba(245,234,213,0.6); border:1px solid rgba(245,234,213,0.12); cursor:pointer; transition:all 0.15s;
}
.panel-footer-btn.danger { background:rgba(239,154,154,0.1); color:rgba(239,154,154,0.6); border-color:rgba(239,154,154,0.2); }
.panel-footer-btn:hover { opacity:0.85; }

/* Mobile player cards inside panel */
.mob-player-card {
  display:flex; align-items:center; gap:10px; padding:10px 14px; cursor:pointer;
  border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.15s;
}
.mob-player-card:hover { background:rgba(255,255,255,0.04); }
.mob-active { background:rgba(0,0,0,0.25) !important; border-left:3px solid var(--pc); }
.mob-bankrupt { opacity:0.4; }
.mob-token { width:36px; height:36px; border:2px solid; border-radius:50%; background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
.mob-pinfo { flex:1; min-width:0; }
.mob-pname { font-family:'Playfair Display',serif; font-size:14px; font-weight:700; color:#e2c06a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mob-pmoney { font-family:'Courier Prime',monospace; font-size:14px; font-weight:700; color:#f5ead5; }
.mob-pbadges { display:flex; gap:3px; flex-wrap:wrap; }
.mob-badge { font-size:10px; padding:1px 4px; border-radius:4px; }
.mob-badge.jail { background:rgba(255,138,101,0.2); color:#ff8a65; }
.mob-badge.free { background:rgba(165,214,167,0.2); color:#a5d6a7; }
.mob-badge.bust { background:rgba(239,154,154,0.2); color:#ef9a9a; }
.mob-prop-count { font-family:'Courier Prime',monospace; font-size:12px; color:rgba(245,234,213,0.5); flex-shrink:0; }
.mob-empty { text-align:center; padding:24px; font-family:'Crimson Text',serif; color:rgba(245,234,213,0.4); font-size:15px; }

/* Manage panel rows */
.mob-manage-row { display:flex; align-items:center; gap:8px; padding:8px 14px; border-bottom:1px solid rgba(255,255,255,0.04); }
.mob-color-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.mob-manage-info { flex:1; min-width:0; }
.mob-manage-name { font-family:'Playfair Display',serif; font-size:13px; font-weight:600; color:#f5ead5; }
.mob-manage-sub { font-family:'Crimson Text',serif; font-size:12px; color:rgba(245,234,213,0.55); }
.mob-mortgage-tag { font-size:10px; padding:0 4px; background:rgba(255,183,77,0.15); color:#ffb74d; border-radius:3px; }
.mob-manage-btns { display:flex; gap:4px; flex-shrink:0; }
.mob-mini-btn { font-size:12px; padding:4px 8px; border-radius:6px; cursor:pointer; font-family:'Courier Prime',monospace; transition:all 0.15s; }
.mob-mini-btn.build     { background:rgba(129,199,132,0.2); color:#81c784; }
.mob-mini-btn.sell      { background:rgba(239,154,154,0.2); color:#ef9a9a; }
.mob-mini-btn.mortgage  { background:rgba(255,183,77,0.2);  color:#ffb74d; }
.mob-mini-btn.unmortgage{ background:rgba(144,202,249,0.2); color:#90caf9; }

/* Panel transition */
.panel-slide-enter-active, .panel-slide-leave-active { transition: all 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.panel-slide-enter-from .panel-sheet, .panel-slide-leave-to .panel-sheet { transform: translateY(100%); }
.panel-slide-enter-from, .panel-slide-leave-to { background: transparent; }

/* Audio toggle */
.audio-toggle {
  position: fixed; bottom: 14px; left: 14px; z-index: 999;
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(0,0,0,0.5); border: 1px solid rgba(201,168,76,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; cursor: pointer; transition: all 0.15s;
}
.audio-toggle:hover { background:rgba(0,0,0,0.7); border-color:rgba(201,168,76,0.6); }

/* ── Media query switch ── */
@media (min-width: 768px) {
  .desktop-layout { display: flex !important; }
  .mobile-layout  { display: none  !important; }
}
@media (max-width: 767px) {
  .desktop-layout { display: none  !important; }
  .mobile-layout  { display: flex  !important; }
  /* Push audio toggle above bottom bar */
  .audio-toggle { bottom: 74px; left: 10px; width: 32px; height: 32px; font-size: 13px; }
}
</style>
