<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="store.modal" class="modal-overlay" @click.self="handleOverlayClick">
        <div class="modal-box card-shadow" :class="`modal-${store.modal.type}`">

          <!-- BUY PROPERTY -->
          <template v-if="store.modal.type === 'buy'">
            <div class="modal-header">
              <div v-if="store.modal.square.group" class="color-stripe" :style="{ background: groupColor }"></div>
              <div class="modal-icon">🏘️</div>
              <h2 class="modal-title">{{ store.modal.square.name }}</h2>
              <p class="modal-sub">{{ squareTypeLabel }}</p>
            </div>
            <div class="modal-body">
              <div class="price-row">
                <span class="price-label">购买价格</span>
                <span class="price-value">${{ store.modal.square.price }}</span>
              </div>
              <div class="price-row" v-if="store.modal.square.group">
                <span class="price-label">基础租金</span>
                <span class="price-value text-sm">${{ baseRent }}</span>
              </div>
              <div class="price-row">
                <span class="price-label">{{ buyPlayer?.name }} 余额</span>
                <span class="price-value" :class="buyPlayer?.money < store.modal.square.price ? 'text-red-400' : 'text-green-400'">
                  ${{ buyPlayer?.money }}
                </span>
              </div>
            </div>
            <div class="modal-actions">
              <button
                @click="store.buyProperty(store.modal.playerId, store.modal.square)"
                :disabled="buyPlayer?.money < store.modal.square.price"
                class="btn-gold px-6 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >购买</button>
              <button @click="store.declineBuy()" class="btn-secondary px-6 py-3 rounded-lg">放弃</button>
            </div>
          </template>

          <!-- CARD DRAWN -->
          <template v-else-if="store.modal.type === 'card'">
            <div class="modal-header">
              <div class="modal-icon text-4xl">{{ store.modal.deck === 'chance' ? '❓' : '🎴' }}</div>
              <h2 class="modal-title">{{ store.modal.deck === 'chance' ? '机会卡' : '命运卡' }}</h2>
            </div>
            <div class="modal-body">
              <div class="card-text">{{ store.modal.card.text }}</div>
              <div class="player-indicator">
                <span class="token-badge" :style="{ borderColor: store.modal.player.color }">
                  {{ store.modal.player.token }}
                </span>
                {{ store.modal.player.name }}
              </div>
            </div>
            <div class="modal-actions">
              <button
                @click="store.executeCard(store.modal.player, store.modal.card)"
                class="btn-gold px-8 py-3 rounded-lg"
              >确认</button>
            </div>
          </template>

          <!-- WINNER -->
          <template v-else-if="store.modal.type === 'winner'">
            <div class="modal-header winner-header">
              <div class="winner-crown">🏆</div>
              <h2 class="modal-title text-gold">游戏结束！</h2>
              <div class="winner-token" :style="{ borderColor: store.modal.player.color }">
                {{ store.modal.player.token }}
              </div>
              <p class="winner-name">{{ store.modal.player.name }}</p>
              <p class="winner-sub">获得最终胜利！</p>
              <p class="winner-money">${{ store.modal.player.money }}</p>
            </div>
            <div class="modal-actions">
              <button @click="store.resetGame()" class="btn-gold px-8 py-3 rounded-lg">重新开始</button>
            </div>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game.js'
import { COLOR_GROUPS } from '../data/boardData.js'

const store = useGameStore()

// For buy modal: look up the buyer by id rather than holding a reactive reference
const buyPlayer = computed(() => {
  if (store.modal?.type !== 'buy') return null
  return store.players.find(p => p.id === store.modal.playerId) ?? null
})

const groupColor = computed(() => {
  if (!store.modal?.square?.group) return null
  return COLOR_GROUPS[store.modal.square.group]?.color
})

const baseRent = computed(() => {
  if (!store.modal?.square?.group) return 0
  return COLOR_GROUPS[store.modal.square.group]?.rent[0] || 0
})

const squareTypeLabel = computed(() => {
  const t = store.modal?.square?.type
  if (t === 'property') return '地产'
  if (t === 'railroad') return '铁路站'
  if (t === 'utility') return '公用事业'
  return ''
})

function handleOverlayClick() {
  // Don't close on overlay click for important modals
  if (store.modal?.type === 'winner') return
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}
.modal-box {
  background: #1a3a2a;
  border: 2px solid #c9a84c;
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  overflow: hidden;
}
.modal-header {
  padding: 20px 20px 12px;
  text-align: center;
  position: relative;
}
.color-stripe {
  height: 8px;
  margin: -20px -20px 12px;
}
.modal-icon { font-size: 32px; margin-bottom: 8px; }
.modal-title {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: #e2c06a;
  margin-bottom: 4px;
}
.modal-sub {
  font-family: 'Crimson Text', serif;
  color: rgba(245,234,213,0.6);
  font-size: 13px;
}
.modal-body {
  padding: 4px 20px 16px;
}
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(201,168,76,0.1);
}
.price-label {
  font-family: 'Crimson Text', serif;
  color: rgba(245,234,213,0.7);
  font-size: 15px;
}
.price-value {
  font-family: 'Courier Prime', monospace;
  font-weight: 700;
  color: #e2c06a;
  font-size: 16px;
}
.card-text {
  font-family: 'Crimson Text', serif;
  font-size: 18px;
  color: #f5ead5;
  text-align: center;
  line-height: 1.5;
  padding: 12px 0;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(201,168,76,0.2);
}
.player-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Crimson Text', serif;
  color: rgba(245,234,213,0.8);
}
.token-badge {
  border: 2px solid;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
}
.modal-actions {
  display: flex;
  gap: 10px;
  padding: 12px 20px 20px;
  justify-content: center;
}
.btn-secondary {
  background: rgba(245,234,213,0.1);
  color: #f5ead5;
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  border: 1px solid rgba(245,234,213,0.2);
  transition: all 0.2s;
}
.btn-secondary:hover { background: rgba(245,234,213,0.2); }

/* Winner styles */
.winner-header { padding: 24px 20px; }
.winner-crown { font-size: 48px; animation: bounce 1s infinite; }
.winner-token {
  border: 3px solid;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  margin: 12px auto;
}
.winner-name {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: #f5ead5;
  margin-bottom: 4px;
}
.winner-sub {
  color: rgba(245,234,213,0.6);
  font-family: 'Crimson Text', serif;
  font-size: 15px;
  margin-bottom: 8px;
}
.winner-money {
  font-family: 'Courier Prime', monospace;
  font-size: 28px;
  font-weight: 700;
  color: #e2c06a;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.95); }
</style>
