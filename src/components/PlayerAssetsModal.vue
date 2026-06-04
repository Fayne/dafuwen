<template>
  <Teleport to="body">
    <Transition name="assets-fade">
      <div v-if="player" class="assets-overlay" @click.self="$emit('close')">
        <div class="assets-box card-shadow">
          <button class="close-btn" @click="$emit('close')">✕</button>

          <!-- Header -->
          <div class="assets-header" :style="{ borderBottomColor: player.color }">
            <div class="player-avatar" :style="{ borderColor: player.color }">{{ player.token }}</div>
            <div class="player-info">
              <div class="player-name">{{ player.name }}</div>
              <div class="player-money" :class="player.money < 0 ? 'text-red-400' : 'text-gold'">
                ${{ player.money.toLocaleString() }}
              </div>
            </div>
            <div class="player-badges-col">
              <span v-if="player.inJail" class="badge badge-jail">🔒 服刑中</span>
              <span v-if="player.jailFreeCards > 0" class="badge badge-free">🃏 ×{{ player.jailFreeCards }}</span>
              <span v-if="isBankrupt" class="badge badge-bust">已破产</span>
            </div>
          </div>

          <!-- Net worth -->
          <div class="net-worth-bar">
            <span class="nw-label">净资产估值</span>
            <span class="nw-value">${{ netWorth.toLocaleString() }}</span>
          </div>

          <!-- Empty state -->
          <div v-if="!props.length" class="empty-state">
            <div class="text-3xl mb-2">🏜️</div>
            <p>尚未拥有任何地产</p>
          </div>

          <!-- Properties grouped by color -->
          <div v-else class="props-container scrollbar-thin">
            <div v-for="(group, groupKey) in groupedProps" :key="groupKey" class="prop-group">
              <div class="group-header" :style="{ background: COLOR_GROUPS[groupKey]?.color + '22', borderLeftColor: COLOR_GROUPS[groupKey]?.color }">
                <span class="group-dot" :style="{ background: COLOR_GROUPS[groupKey]?.color }"></span>
                <span class="group-name">{{ COLOR_GROUPS[groupKey]?.name }}</span>
                <span class="monopoly-badge" v-if="hasMonopoly(groupKey)">独占 ✓</span>
              </div>
              <div class="prop-list">
                <div v-for="prop in group" :key="prop.squareId" class="prop-item">
                  <div class="prop-color-bar" :style="{ background: COLOR_GROUPS[groupKey]?.color }"></div>
                  <div class="prop-details">
                    <div class="prop-name">{{ prop.name }}</div>
                    <div class="prop-meta">
                      <span v-if="prop.type === 'property'">
                        <span v-if="(prop.houses||0) >= 5">🏨 酒店</span>
                        <span v-else-if="(prop.houses||0) > 0">🏠 ×{{ prop.houses }}</span>
                        <span v-else class="text-ivory/40">空地</span>
                      </span>
                      <span v-else-if="prop.type === 'railroad'">🚂 铁路</span>
                      <span v-else-if="prop.type === 'utility'">⚡ 公用</span>
                      <span v-if="prop.mortgaged" class="mortgage-tag ml-1">抵押中</span>
                    </div>
                  </div>
                  <div class="prop-value">
                    <div class="text-xs text-ivory/50">价值</div>
                    <div class="text-xs font-mono font-bold text-ivory/80">${{ prop.price }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Non-property assets (railroads, utilities) -->
            <div v-if="otherAssets.length" class="prop-group">
              <div class="group-header" style="border-left-color: #888; background: rgba(136,136,136,0.1)">
                <span class="group-dot" style="background:#888"></span>
                <span class="group-name">特殊资产</span>
              </div>
              <div class="prop-list">
                <div v-for="prop in otherAssets" :key="prop.squareId" class="prop-item">
                  <div class="prop-color-bar" style="background: #888"></div>
                  <div class="prop-details">
                    <div class="prop-name">{{ prop.name }}</div>
                    <div class="prop-meta">
                      <span v-if="prop.type === 'railroad'">🚂 铁路站</span>
                      <span v-else-if="prop.type === 'utility'">{{ prop.icon }} 公用事业</span>
                      <span v-if="prop.mortgaged" class="mortgage-tag ml-1">抵押中</span>
                    </div>
                  </div>
                  <div class="prop-value">
                    <div class="text-xs text-ivory/50">价值</div>
                    <div class="text-xs font-mono font-bold text-ivory/80">${{ prop.price }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game.js'
import { COLOR_GROUPS } from '../data/boardData.js'

const emit = defineEmits(['close'])
const propsData = defineProps({ player: Object })

const store = useGameStore()

const isBankrupt = computed(() =>
  propsData.player ? store.bankruptPlayers.includes(propsData.player.id) : false
)

const props = computed(() =>
  propsData.player ? store.getPlayerProperties(propsData.player.id) : []
)

// Separate colored properties from railroads/utilities
const coloredProps = computed(() => props.value.filter(p => p.group))
const otherAssets  = computed(() => props.value.filter(p => !p.group && p.price))

// Group by color
const groupedProps = computed(() => {
  const g = {}
  coloredProps.value.forEach(p => {
    if (!g[p.group]) g[p.group] = []
    g[p.group].push(p)
  })
  return g
})

function hasMonopoly(groupKey) {
  if (!propsData.player) return false
  const groupSquares = store.squares.filter(s => s.group === groupKey)
  return groupSquares.every(s => store.properties[s.id]?.ownerId === propsData.player.id)
}

const netWorth = computed(() => {
  if (!propsData.player) return 0
  let total = propsData.player.money
  props.value.forEach(p => {
    total += p.mortgaged ? Math.floor(p.price / 2) : p.price
    if (p.houses) total += (p.houses >= 5 ? 5 : p.houses) * (p.houseCost || 0) * 0.5
  })
  return Math.max(0, total)
})
</script>

<style scoped>
.assets-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 300; padding: 16px;
}
.assets-box {
  background: #1a3a2a;
  border: 2px solid #c9a84c;
  border-radius: 16px;
  width: 100%; max-width: 400px;
  max-height: 85vh;
  display: flex; flex-direction: column;
  overflow: hidden; position: relative;
}
.close-btn {
  position: absolute; top: 10px; right: 12px;
  color: rgba(245,234,213,0.5); font-size: 14px; z-index: 10; cursor: pointer;
  background: rgba(0,0,0,0.3); border-radius: 50%; width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.close-btn:hover { color: #f5ead5; background: rgba(0,0,0,0.5); }

.assets-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 44px 16px 16px;
  border-bottom: 2px solid;
  flex-shrink: 0;
}
.player-avatar {
  width: 48px; height: 48px; border: 3px solid; border-radius: 50%;
  background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;
  font-size: 24px; flex-shrink: 0;
}
.player-info { flex: 1; min-width: 0; }
.player-name  { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #f5ead5; }
.player-money { font-family: 'Courier Prime', monospace; font-size: 20px; font-weight: 700; }
.player-badges-col { display: flex; flex-direction: column; gap: 4px; }
.badge { font-size: 11px; padding: 2px 6px; border-radius: 4px; font-family: 'Crimson Text', serif; white-space: nowrap; }
.badge-jail { background: rgba(255,138,101,0.2); color: #ff8a65; }
.badge-free { background: rgba(165,214,167,0.2); color: #a5d6a7; }
.badge-bust { background: rgba(239,154,154,0.2); color: #ef9a9a; }

.net-worth-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 16px; background: rgba(0,0,0,0.2); flex-shrink: 0;
}
.nw-label { font-family: 'Crimson Text', serif; color: rgba(245,234,213,0.5); font-size: 13px; }
.nw-value { font-family: 'Courier Prime', monospace; font-weight: 700; color: #e2c06a; font-size: 16px; }

.empty-state {
  padding: 32px; text-align: center;
  font-family: 'Crimson Text', serif; color: rgba(245,234,213,0.4); font-size: 16px;
}

.props-container { flex: 1; overflow-y: auto; padding: 8px 0; }

.prop-group { margin-bottom: 8px; }
.group-header {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px; margin: 0 8px;
  border-left: 3px solid; border-radius: 4px;
  font-family: 'Playfair Display', serif; font-size: 12px;
}
.group-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.group-name { color: #f5ead5; font-weight: 600; flex: 1; }
.monopoly-badge {
  font-size: 10px; padding: 1px 5px;
  background: rgba(201,168,76,0.2); color: #e2c06a;
  border-radius: 4px;
}

.prop-list { padding: 4px 8px 0; display: flex; flex-direction: column; gap: 2px; }
.prop-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 6px;
  background: rgba(0,0,0,0.15);
  transition: background 0.1s;
}
.prop-item:hover { background: rgba(0,0,0,0.3); }
.prop-color-bar { width: 4px; height: 28px; border-radius: 2px; flex-shrink: 0; }
.prop-details { flex: 1; min-width: 0; }
.prop-name { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 600; color: #f5ead5; }
.prop-meta { font-family: 'Crimson Text', serif; font-size: 12px; color: rgba(245,234,213,0.55); margin-top: 1px; }
.mortgage-tag { font-size: 11px; padding: 0 4px; background: rgba(255,183,77,0.15); color: #ffb74d; border-radius: 3px; }
.prop-value { text-align: right; flex-shrink: 0; }

.assets-fade-enter-active, .assets-fade-leave-active { transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1); }
.assets-fade-enter-from, .assets-fade-leave-to { opacity: 0; transform: scale(0.9); }
</style>