<template>
  <div class="setup-root player-setup-scroll">
    <div class="setup-card">
      <div class="text-center mb-6">
        <div class="text-5xl mb-2">🎲</div>
        <h1 class="font-display text-5xl font-black text-gold tracking-widest" style="text-shadow:0 2px 12px rgba(201,168,76,0.4)">
          {{ isZh ? '大 富 翁' : 'MONOPOLY' }}
        </h1>
        <p class="text-ivory/50 font-body text-base tracking-widest mt-1">MONOPOLY · 地产大亨</p>
        <div class="w-28 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-3"></div>

        <!-- Language toggle -->
        <div class="lang-toggle mt-4">
          <button @click="setLang('zh')" :class="['lang-btn', lang === 'zh' ? 'lang-active' : 'lang-idle']">🇨🇳 中文</button>
          <button @click="setLang('en')" :class="['lang-btn', lang === 'en' ? 'lang-active' : 'lang-idle']">🇺🇸 English</button>
        </div>
      </div>

      <!-- Continue banner -->
      <div v-if="hasSave && !forceNew" class="continue-banner">
        <div class="continue-info">
          <span class="text-2xl">💾</span>
          <div>
            <div class="text-gold font-display font-bold text-sm">{{ isZh ? '发现存档' : 'Saved Game Found' }}</div>
            <div class="text-ivory/60 text-xs font-body">{{ isZh ? '上次游戏尚未结束，是否继续？' : 'Your last game is unfinished. Continue?' }}</div>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button @click="continueGame" class="btn-gold px-5 py-2 rounded-lg text-sm flex-1">{{ isZh ? '继续游戏' : 'Continue' }}</button>
          <button @click="forceNew = true" class="btn-danger px-4 py-2 rounded-lg text-sm">{{ isZh ? '新开一盘' : 'New Game' }}</button>
        </div>
      </div>

      <template v-if="!hasSave || forceNew">
        <div v-if="hasSave && forceNew" class="discard-warning">
          ⚠️ {{ isZh ? '放弃存档并开始新游戏，旧进度将永久清除。' : 'Your saved progress will be permanently lost.' }}
        </div>

        <!-- Board size -->
        <div class="mb-5">
          <label class="label-text">{{ isZh ? '棋盘大小' : 'Board Size' }}</label>
          <div class="flex gap-2">
            <button
              v-for="(cfg, key) in currentBoardSizes" :key="key"
              @click="selectedSize = key"
              class="flex-1 py-2.5 rounded-lg font-display font-bold text-sm transition-all"
              :class="selectedSize === key ? 'btn-gold' : 'count-btn'"
            >{{ cfg.label }}</button>
          </div>
          <p class="text-ivory/35 text-xs font-body mt-1.5 text-center">
            {{ isZh ? '地名采用中国大陆省市' : 'Properties are US cities' }}
          </p>
        </div>

        <!-- Player count -->
        <div class="mb-5">
          <label class="label-text">{{ isZh ? '玩家人数' : 'Number of Players' }}</label>
          <div class="flex gap-2">
            <button v-for="n in [2,3,4,5]" :key="n" @click="setPlayerCount(n)"
              class="flex-1 py-3 rounded-lg font-display font-bold text-xl transition-all"
              :class="playerCount === n ? 'btn-gold' : 'count-btn'"
            >{{ n }}</button>
          </div>
        </div>

        <!-- Starting money -->
        <div class="mb-5">
          <label class="label-text">{{ isZh ? '起始资金（每人）' : 'Starting Money (per player)' }}</label>
          <input v-model.number="startingMoney" type="number" min="500" step="100"
            class="money-input" />
          <p class="text-ivory/35 text-xs font-body mt-1.5 text-center">
            {{ isZh ? '默认：小 $1,500 · 中 $2,000 · 大 $2,500' : 'Default: Small $1,500 · Medium $2,000 · Large $2,500' }}
          </p>
        </div>

        <!-- Players -->
        <div class="space-y-2 mb-5">
          <div v-for="(p, i) in playerSetups" :key="i" class="player-row">
            <span class="text-xl w-7 text-center select-none">{{ p.token }}</span>
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: p.color }"></div>
            <input v-model="p.name" :placeholder="isZh ? `玩家 ${i+1}` : `Player ${i+1}`" maxlength="10" class="player-input"/>
            <div class="flex gap-0.5">
              <button v-for="tok in TOKENS" :key="tok" @click="p.token = tok"
                class="tok-btn" :class="p.token === tok ? 'tok-active' : 'tok-idle'"
              >{{ tok }}</button>
            </div>
          </div>
        </div>

        <button @click="startGame" :disabled="!canStart"
          class="w-full py-3 rounded-xl font-display text-lg font-black tracking-widest transition-all"
          :class="canStart ? 'btn-gold pulse-gold' : 'btn-disabled'"
        >{{ isZh ? '开始游戏' : 'Start Game' }}</button>
      </template>
    </div>
    <p class="text-center text-ivory/25 font-body text-xs mt-3">
      {{ isZh
        ? `每位玩家起始 $${boardDefaultMoney.toLocaleString()} · 经过出发点领取 $200 · 空格掷骰 · ESC结束回合`
        : `Each player starts with $${boardDefaultMoney.toLocaleString()} · Pass GO collect $200 · Space to roll · ESC end turn`
      }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useI18n } from '../composables/useI18n.js'
import { PLAYER_TOKENS, PLAYER_COLORS, BOARD_SIZES, BOARD_SIZES_EN, BOARD_STARTING_MONEY } from '../data/boardData.js'

const store      = useGameStore()
const { lang, isZh, setLang } = useI18n()
const TOKENS     = PLAYER_TOKENS
const hasSave    = computed(() => store.hasSavedGame())
const forceNew   = ref(false)
const selectedSize  = ref('small')
const playerCount   = ref(2)
const playerSetups  = ref(makeSetups(2))
const startingMoney = ref(BOARD_STARTING_MONEY[selectedSize.value])
watch(selectedSize, s => { startingMoney.value = BOARD_STARTING_MONEY[s] })

const currentBoardSizes = computed(() => isZh.value ? BOARD_SIZES : BOARD_SIZES_EN)
const boardDefaultMoney = computed(() => BOARD_STARTING_MONEY[selectedSize.value])

function makeSetups(n) {
  return Array.from({ length: n }, (_, i) => ({
    name: isZh.value ? `玩家 ${i+1}` : `Player ${i+1}`,
    token: PLAYER_TOKENS[i],
    color: PLAYER_COLORS[i]
  }))
}
function setPlayerCount(n) { playerCount.value = n; playerSetups.value = makeSetups(n) }
const canStart = computed(() => playerSetups.value.every(p => p.name.trim()))
function continueGame() { store.tryRestore() }
function startGame() {
  if (!canStart.value) return
  store.clearSave()
  store.initGame(playerSetups.value, selectedSize.value, startingMoney.value)
}
</script>

<style scoped>
.setup-root {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100vh; padding: 32px 16px 24px; box-sizing: border-box;
}
.setup-card { width: 100%; max-width: 500px; background: #1a3a2a; border: 2px solid #c9a84c; border-radius: 16px; padding: 24px 24px 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.6); }
.lang-toggle { display: flex; gap: 8px; justify-content: center; }
.lang-btn { padding: 5px 16px; border-radius: 20px; font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.lang-active { background: linear-gradient(135deg, #e2c06a, #c9a84c); color: #2a1a0a; box-shadow: 0 2px 8px rgba(201,168,76,0.3); }
.lang-idle { background: rgba(0,0,0,0.2); color: rgba(245,234,213,0.45); border: 1px solid rgba(201,168,76,0.15); }
.lang-idle:hover { border-color: rgba(201,168,76,0.4); color: rgba(245,234,213,0.75); }
.continue-banner { background: rgba(0,0,0,0.3); border: 1px solid rgba(201,168,76,0.3); border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; }
.continue-info { display: flex; align-items: center; gap: 10px; }
.discard-warning { font-family: 'Crimson Text', serif; font-size: 13px; color: #ffb74d; background: rgba(255,183,77,0.08); border: 1px solid rgba(255,183,77,0.2); border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; }
.label-text { display: block; font-family: 'Playfair Display', serif; color: #e2c06a; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.count-btn { background: rgba(0,0,0,0.25); color: rgba(245,234,213,0.45); border: 1px solid rgba(201,168,76,0.15); transition: all 0.15s; }
.count-btn:hover { border-color: rgba(201,168,76,0.5); color: rgba(245,234,213,0.8); }
.player-row { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(201,168,76,0.1); border-radius: 8px; padding: 8px 10px; }
.player-input { flex: 1; background: transparent; font-family: 'Crimson Text', serif; font-size: 16px; color: #f5ead5; outline: none; border-bottom: 1px solid rgba(201,168,76,0.2); padding-bottom: 1px; transition: border-color 0.15s; }
.player-input::placeholder { color: rgba(245,234,213,0.3); }
.player-input:focus { border-bottom-color: rgba(201,168,76,0.6); }
.tok-btn { font-size: 15px; padding: 2px 3px; border-radius: 4px; transition: all 0.1s; cursor: pointer; }
.tok-active { background: rgba(201,168,76,0.2); transform: scale(1.15); }
.tok-idle { opacity: 0.35; }
.tok-idle:hover { opacity: 0.7; }
.btn-disabled { background: rgba(0,0,0,0.2); color: rgba(245,234,213,0.25); cursor: not-allowed; border: 1px solid rgba(201,168,76,0.08); }
.btn-danger { background: rgba(239,154,154,0.12); color: #ef9a9a; border: 1px solid rgba(239,154,154,0.25); font-family: 'Playfair Display', serif; font-weight: 600; transition: all 0.15s; }
.btn-danger:hover { background: rgba(239,154,154,0.22); }
.money-input { width: 100%; background: rgba(0,0,0,0.25); border: 1px solid rgba(201,168,76,0.2); border-radius: 8px; padding: 10px 14px; font-family: 'Courier Prime', monospace; font-size: 18px; font-weight: 700; color: #e2c06a; outline: none; text-align: center; transition: border-color 0.15s; }
.money-input:focus { border-color: rgba(201,168,76,0.6); }
.money-input::-webkit-inner-spin-button { opacity: 0.5; }
</style>
