<template>
  <Teleport to="body">
    <Transition name="detail-fade">
      <div v-if="square" class="detail-overlay" @click.self="$emit('close')">
        <div class="detail-box card-shadow">

          <!-- Close button -->
          <button class="close-btn" @click="$emit('close')">✕</button>

          <!-- Color header band -->
          <div
            v-if="square.group"
            class="detail-color-band"
            :style="{ background: groupColor }"
          >
            <div class="detail-houses" v-if="propData?.houses">
              <span v-if="propData.houses >= 5">🏨 酒店</span>
              <span v-else>🏠 × {{ propData.houses }}</span>
            </div>
          </div>

          <!-- Icon header for non-property -->
          <div v-else class="detail-icon-header">
            <span class="detail-big-icon">{{ squareIcon }}</span>
          </div>

          <!-- Title -->
          <div class="detail-header">
            <h2 class="detail-title">{{ square.name }}</h2>
            <p class="detail-type-label">{{ typeLabel }}</p>
          </div>

          <!-- Owner banner -->
          <div v-if="owner" class="owner-banner" :style="{ borderColor: owner.color }">
            <span class="owner-token" :style="{ borderColor: owner.color }">{{ owner.token }}</span>
            <span class="owner-text">{{ owner.name }} 持有</span>
            <span v-if="propData?.mortgaged" class="mortgage-tag">抵押中</span>
          </div>
          <div v-else-if="isOwnable && !owner" class="unowned-banner">
            <span class="unowned-dot"></span>
            <span class="text-ivory/60 text-sm">尚未购买</span>
          </div>

          <!-- Property details -->
          <div class="detail-rows" v-if="square.type === 'property'">
            <div class="detail-row">
              <span>购买价格</span>
              <span class="val-gold">${{ square.price }}</span>
            </div>
            <div class="detail-row">
              <span>抵押价值</span>
              <span>${{ Math.floor(square.price / 2) }}</span>
            </div>
            <div class="detail-row section-divider">
              <span>建房费用</span>
              <span>${{ square.houseCost }} / 栋</span>
            </div>
            <div class="detail-row rent-row" :class="{ 'highlight': (propData?.houses||0) === 0 && !hasMonopoly }">
              <span>基础租金</span>
              <span>${{ groupRent[0] }}</span>
            </div>
            <div class="detail-row rent-row" :class="{ 'highlight': (propData?.houses||0) === 0 && hasMonopoly }">
              <span>独占租金</span>
              <span>${{ groupRent[0] * 2 }}</span>
            </div>
            <div
              v-for="(r, i) in groupRent.slice(1)"
              :key="i"
              class="detail-row rent-row"
              :class="{ 'highlight': (propData?.houses||0) === i + 1 }"
            >
              <span>{{ i < 4 ? `${i+1} 栋房` : '1 间酒店' }}</span>
              <span>${{ r }}</span>
            </div>
          </div>

          <!-- Railroad -->
          <div class="detail-rows" v-else-if="square.type === 'railroad'">
            <div class="detail-row">
              <span>购买价格</span>
              <span class="val-gold">${{ square.price }}</span>
            </div>
            <div class="detail-row section-divider">
              <span>持有1座</span><span>$25</span>
            </div>
            <div class="detail-row"><span>持有2座</span><span>$50</span></div>
            <div class="detail-row"><span>持有3座</span><span>$100</span></div>
            <div class="detail-row"><span>持有4座</span><span>$200</span></div>
          </div>

          <!-- Utility -->
          <div class="detail-rows" v-else-if="square.type === 'utility'">
            <div class="detail-row">
              <span>购买价格</span>
              <span class="val-gold">${{ square.price }}</span>
            </div>
            <div class="detail-row section-divider">
              <span>持有1座</span><span>骰子点数 × 4</span>
            </div>
            <div class="detail-row"><span>持有2座</span><span>骰子点数 × 10</span></div>
          </div>

          <!-- Tax -->
          <div class="detail-rows" v-else-if="square.type === 'tax'">
            <div class="detail-row">
              <span>缴纳金额</span>
              <span class="val-red">${{ square.amount }}</span>
            </div>
            <div class="detail-note">税款将进入免费停车奖金池</div>
          </div>

          <!-- Special squares -->
          <div class="detail-note-box" v-else>
            <p>{{ specialDesc }}</p>
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

const props = defineProps({ square: Object })
defineEmits(['close'])

const store = useGameStore()

const owner    = computed(() => props.square ? store.getSquareOwner(props.square.id) : null)
const propData = computed(() => props.square ? store.properties[props.square.id] : null)

const groupColor = computed(() => {
  if (!props.square?.group) return null
  return COLOR_GROUPS[props.square.group]?.color
})

const groupRent = computed(() => {
  if (!props.square?.group) return []
  return COLOR_GROUPS[props.square.group]?.rent || []
})

const hasMonopoly = computed(() => {
  if (!props.square?.group || !propData.value) return false
  const groupSquares = store.squares.filter(s => s.group === props.square.group)
  return groupSquares.every(s => store.properties[s.id]?.ownerId === propData.value.ownerId)
})

const isOwnable = computed(() =>
  ['property', 'railroad', 'utility'].includes(props.square?.type)
)

const typeLabel = computed(() => {
  const t = props.square?.type
  const map = {
    property: `地产 · ${COLOR_GROUPS[props.square?.group]?.name || ''}`,
    railroad: '铁路站',
    utility: '公用事业',
    tax: '税务',
    chance: '机会卡',
    community: '命运卡',
    go: '出发点',
    jail: '监狱 / 探访',
    go_to_jail: '入狱',
    parking: '免费停车',
  }
  return map[t] || t
})

const squareIcon = computed(() => {
  const t = props.square?.type
  if (t === 'railroad') return '🚂'
  if (t === 'utility')  return props.square.icon || '⚡'
  if (t === 'chance')   return '❓'
  if (t === 'community') return '🎴'
  if (t === 'tax')      return '💸'
  return props.square?.icon || '⬜'
})

const specialDesc = computed(() => {
  const t = props.square?.type
  if (t === 'go')        return '每次经过或落在出发点，领取 $200 奖金。'
  if (t === 'jail')      return '落在此处仅为探访，不需缴任何费用。连续三次掷出双数、或被送入监狱的玩家在此服刑。'
  if (t === 'go_to_jail') return '直接入狱！不经过出发点，不领取 $200。'
  if (t === 'parking')   return '免费停车！落在此处可获得税款奖金池的积累金额（若有）。'
  if (t === 'chance')    return '抽取一张机会卡，按照卡面指示执行。'
  if (t === 'community') return '抽取一张命运卡，按照卡面指示执行。'
  return ''
})
</script>

<style scoped>
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

.detail-box {
  background: #1a3a2a;
  border: 2px solid #c9a84c;
  border-radius: 16px;
  width: 100%;
  max-width: 340px;
  overflow: hidden;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  color: rgba(245,234,213,0.5);
  font-size: 14px;
  z-index: 10;
  cursor: pointer;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.close-btn:hover { color: #f5ead5; background: rgba(0,0,0,0.5); }

/* Color band header */
.detail-color-band {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.detail-houses {
  font-size: 13px;
  color: rgba(255,255,255,0.9);
  font-family: 'Crimson Text', serif;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}

.detail-icon-header {
  padding: 20px 0 8px;
  text-align: center;
}
.detail-big-icon { font-size: 36px; }

.detail-header {
  padding: 12px 20px 8px;
  text-align: center;
  border-bottom: 1px solid rgba(201,168,76,0.15);
}
.detail-title {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: #e2c06a;
  line-height: 1.2;
}
.detail-type-label {
  font-family: 'Crimson Text', serif;
  color: rgba(245,234,213,0.5);
  font-size: 13px;
  margin-top: 2px;
}

/* Owner / unowned banner */
.owner-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0,0,0,0.25);
  border-top: 1px solid rgba(201,168,76,0.1);
  border-left: 3px solid;
}
.owner-token {
  width: 26px;
  height: 26px;
  border: 2px solid;
  border-radius: 50%;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.owner-text {
  flex: 1;
  font-family: 'Crimson Text', serif;
  font-size: 15px;
  color: #f5ead5;
}
.mortgage-tag {
  font-size: 11px;
  padding: 1px 6px;
  background: rgba(255,183,77,0.2);
  color: #ffb74d;
  border-radius: 4px;
  font-family: 'Courier Prime', monospace;
}
.unowned-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0,0,0,0.15);
}
.unowned-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(245,234,213,0.2);
  flex-shrink: 0;
}

/* Detail rows */
.detail-rows {
  padding: 4px 0 12px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  font-family: 'Crimson Text', serif;
  font-size: 15px;
  color: rgba(245,234,213,0.8);
  transition: background 0.1s;
}
.detail-row:nth-child(even) { background: rgba(0,0,0,0.1); }
.section-divider {
  border-top: 1px solid rgba(201,168,76,0.12);
  margin-top: 4px;
  padding-top: 10px;
}
.val-gold {
  font-family: 'Courier Prime', monospace;
  font-weight: 700;
  color: #e2c06a;
}
.val-red {
  font-family: 'Courier Prime', monospace;
  font-weight: 700;
  color: #ef9a9a;
}
.rent-row span:last-child {
  font-family: 'Courier Prime', monospace;
  font-size: 13px;
  color: rgba(245,234,213,0.7);
}
.highlight {
  background: rgba(201,168,76,0.12) !important;
}
.highlight span { color: #e2c06a !important; font-weight: 600; }

.detail-note {
  padding: 6px 20px;
  font-family: 'Crimson Text', serif;
  font-size: 13px;
  color: rgba(245,234,213,0.4);
  font-style: italic;
}
.detail-note-box {
  padding: 12px 20px 16px;
  font-family: 'Crimson Text', serif;
  font-size: 15px;
  color: rgba(245,234,213,0.75);
  line-height: 1.6;
  text-align: center;
}

/* Transition */
.detail-fade-enter-active, .detail-fade-leave-active {
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.detail-fade-enter-from, .detail-fade-leave-to {
  opacity: 0;
  transform: scale(0.88);
}
</style>
