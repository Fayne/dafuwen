<template>
  <div class="app-root">
    <PlayerSetup v-if="store.phase === 'setup'" />

    <div v-else class="game-layout">
      <!-- Left sidebar -->
      <aside class="sidebar-left scrollbar-thin">
        <PlayerPanel />
      </aside>

      <!-- Board -->
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

      <!-- Right sidebar -->
      <aside class="sidebar-right">
        <GameLog />
      </aside>
    </div>

    <Modal />
    <SquareDetailModal :square="detailSquare" @close="detailSquare = null" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/game.js'
import PlayerSetup from './components/PlayerSetup.vue'
import Board from './components/Board.vue'
import PlayerPanel from './components/PlayerPanel.vue'
import GameLog from './components/GameLog.vue'
import Dice from './components/Dice.vue'
import Modal from './components/Modal.vue'
import SquareDetailModal from './components/SquareDetailModal.vue'

const store = useGameStore()
const detailSquare = ref(null)
function openSquareDetail(sq) { detailSquare.value = sq }

function onKeydown(e) {
  if (store.phase !== 'playing' || store.modal) return
  if (e.code === 'Space' && !store.hasRolledThisTurn && !store.isRolling) {
    e.preventDefault()
    store.rollDice()
  }
  if (e.code === 'Escape' && store.hasRolledThisTurn && !store.isRolling) {
    e.preventDefault()
    store.endTurn()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* Lock the whole app to viewport height — no body scroll */
.app-root {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Setup screen may need scroll on small devices */
.app-root:has(.player-setup-scroll) {
  overflow-y: auto;
}

/* Game layout: three columns, fully fills the viewport height */
.game-layout {
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 10px;
  overflow: hidden;       /* children must not cause scroll */
  min-height: 0;
}

/* Left sidebar scrolls internally if content is taller than viewport */
.sidebar-left {
  width: 210px;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Right sidebar fills full height, GameLog handles its own scroll */
.sidebar-right {
  width: 190px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Board area takes remaining space and is square */
.board-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Center-panel content */
.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  z-index: 1;
  position: relative;
}

.title-text {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 3.5vw, 46px);
  font-weight: 900;
  color: #c9a84c;
  letter-spacing: 0.2em;
  text-shadow: 0 2px 16px rgba(201,168,76,0.5);
  line-height: 1;
}

.parking-pot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 8px;
  padding: 5px 12px;
}
.pp-label { font-size: 11px; color: rgba(245,234,213,0.5); font-family: 'Crimson Text', serif; }
.pp-amount { font-family: 'Courier Prime', monospace; font-weight: 700; color: #c9a84c; font-size: 15px; }
</style>
