<template>
  <div class="board-wrapper">
    <div class="board" :style="gridStyle">

      <!-- Corner 0: GO -->
      <div class="corner" :style="{ gridArea: cornerArea(0) }">
        <div class="corner-inner">
          <div class="text-3xl">🏁</div>
          <div class="corner-label text-gold">{{ isZh ? '出发点' : 'GO' }}</div>
          <div class="corner-sublabel">{{ isZh ? '领取 $200' : 'Collect $200' }}</div>
          <div class="corner-tokens"><PlayerToken v-for="p in playersAt(corners[0])" :key="p.id" :player="p"/></div>
        </div>
      </div>

      <!-- Corner 1: Jail -->
      <div class="corner" :style="{ gridArea: cornerArea(1) }">
        <div class="corner-inner">
          <div class="text-3xl">🔒</div>
          <div class="corner-label">{{ isZh ? '监狱' : 'Jail' }}</div>
          <div class="corner-sublabel">{{ isZh ? '探访 / 服刑' : 'Visit / Jail' }}</div>
          <div class="corner-tokens"><PlayerToken v-for="p in playersAt(corners[1])" :key="p.id" :player="p"/></div>
        </div>
      </div>

      <!-- Corner 2: Free Parking -->
      <div class="corner" :style="{ gridArea: cornerArea(2) }">
        <div class="corner-inner">
          <div class="text-3xl">🅿️</div>
          <div class="corner-label">{{ isZh ? '免费停车' : 'Free Parking' }}</div>
          <div class="corner-sublabel text-gold" v-if="store.parkingPot > 0">${{ store.parkingPot }}</div>
          <div class="corner-tokens"><PlayerToken v-for="p in playersAt(corners[2])" :key="p.id" :player="p"/></div>
        </div>
      </div>

      <!-- Corner 3: Go To Jail -->
      <div class="corner" :style="{ gridArea: cornerArea(3) }">
        <div class="corner-inner">
          <div class="text-3xl">👮</div>
          <div class="corner-label">{{ isZh ? '入狱' : 'Go To Jail' }}</div>
          <div class="corner-sublabel text-red-400">{{ isZh ? '直接前往' : 'Go Directly' }}</div>
          <div class="corner-tokens"><PlayerToken v-for="p in playersAt(corners[3])" :key="p.id" :player="p"/></div>
        </div>
      </div>

      <!-- Bottom row squares -->
      <BoardSquare
        v-for="id in bottomRow" :key="id"
        :square="allSquares[id]" :style="{ gridArea: `b${id}` }"
        orientation="bottom" :players="playersAt(id)"
        @squareClick="$emit('squareClick', $event)"
      />

      <!-- Left column squares -->
      <BoardSquare
        v-for="id in leftCol" :key="id"
        :square="allSquares[id]" :style="{ gridArea: `l${id}` }"
        orientation="left" :players="playersAt(id)"
        @squareClick="$emit('squareClick', $event)"
      />

      <!-- Top row squares -->
      <BoardSquare
        v-for="id in topRow" :key="id"
        :square="allSquares[id]" :style="{ gridArea: `t${id}` }"
        orientation="top" :players="playersAt(id)"
        @squareClick="$emit('squareClick', $event)"
      />

      <!-- Right column squares -->
      <BoardSquare
        v-for="id in rightCol" :key="id"
        :square="allSquares[id]" :style="{ gridArea: `r${id}` }"
        orientation="right" :players="playersAt(id)"
        @squareClick="$emit('squareClick', $event)"
      />

      <!-- Center panel -->
      <div class="center-panel" :style="{ gridArea: 'center' }">
        <slot />
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game.js'
import { useI18n } from '../composables/useI18n.js'
import BoardSquare from './BoardSquare.vue'
import PlayerToken from './PlayerToken.vue'

defineEmits(['squareClick'])
const store = useGameStore()
const { isZh } = useI18n()

const allSquares   = computed(() => store.squares)
const n            = computed(() => store.innerPerSide)   // inner squares per side
const total        = computed(() => store.totalSquares)   // total squares

// Corner IDs: [GO, Jail, Parking, GoToJail]
const corners = computed(() => {
  const s = n.value + 1  // side length = inner + 1 corner
  return [0, s, s * 2, s * 3]
})

// Build the four inner ranges from the squares array
const bottomRow = computed(() => {
  const start = 1; const end = corners.value[1] - 1
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
const leftCol = computed(() => {
  const start = corners.value[1] + 1; const end = corners.value[2] - 1
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
const topRow = computed(() => {
  const start = corners.value[2] + 1; const end = corners.value[3] - 1
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
const rightCol = computed(() => {
  const start = corners.value[3] + 1; const end = total.value - 1
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// Build CSS grid-template-areas dynamically
const gridStyle = computed(() => {
  const inner = n.value
  const cols  = inner + 2  // corner + inner + corner

  // Row 1: top row  [c2, t(n+2)..t(2n), c3]  (left→right)
  const topIds   = topRow.value
  const leftIds  = [...leftCol.value].reverse()   // bottom→top when reading top-down
  const bottomIds= [...bottomRow.value].reverse() // right→left
  const rightIds = rightCol.value

  // Build grid-template-areas string
  // Row 0 (top): c2  t21..t29  c3
  const row0 = `"${cornerArea(2)} ${topIds.map(i => `t${i}`).join(' ')} ${cornerArea(3)}"`
  // Rows 1..n (middle): lN  center..center  rN
  const midRows = leftIds.map((lid, i) => {
    const rid = rightIds[i]
    return `"l${lid} ${Array(inner).fill('center').join(' ')} r${rid}"`
  })
  // Last row (bottom): c1  b9..b1  c0
  const lastRow = `"${cornerArea(1)} ${bottomIds.map(i => `b${i}`).join(' ')} ${cornerArea(0)}"`

  const areas = [row0, ...midRows, lastRow].join('\n')

  // Grid columns: corner-size, n×fr, corner-size
  const isMobile = window.innerWidth < 768
  const cornerSize = isMobile ? '56px' : '72px'
  const gridCols = `${cornerSize} repeat(${inner}, 1fr) ${cornerSize}`
  const gridRows = `${cornerSize} repeat(${inner}, 1fr) ${cornerSize}`

  return {
    gridTemplateAreas: areas,
    gridTemplateColumns: gridCols,
    gridTemplateRows: gridRows,
  }
})

function cornerArea(idx) {
  return ['c0', 'c1', 'c2', 'c3'][idx]
}

function playersAt(pos) {
  return store.players.filter(p => p.position === pos && !store.bankruptPlayers.includes(p.id))
}
</script>

<style scoped>
.board-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.board {
  display: grid;
  /* Desktop: constrained by sidebars; Mobile: full viewport width */
  width:  min(calc(100vh - 24px), calc(100vw - 440px), 860px);
  height: min(calc(100vh - 24px), calc(100vw - 440px), 860px);
  background: #1a3a2a;
  border: 3px solid #c9a84c;
  box-shadow: 0 0 0 6px #3d1c0e, 0 8px 40px rgba(0,0,0,0.7), 0 0 0 8px rgba(201,168,76,0.3);
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .board {
    width:  min(calc(100vw - 8px), calc(100vh - 120px));
    height: min(calc(100vw - 8px), calc(100vh - 120px));
  }
  .corner-label   { font-size: 7px; }
  .corner-sublabel{ font-size: 6px; }
}

/* ── Corners ── */
.corner {
  background: #0f2318;
  border: 1px solid rgba(201,168,76,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.corner-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px;
}
.corner-label {
  font-family: 'Playfair Display', serif;
  font-size: 9px;
  font-weight: 700;
  color: #e2c06a;
  text-align: center;
  line-height: 1.2;
}
.corner-sublabel { font-size: 8px; color: rgba(245,234,213,0.5); text-align: center; }
.corner-tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  justify-content: center;
  max-width: 68px;
  margin-top: 2px;
}

/* ── Center panel ── */
.center-panel {
  background: #1a3a2a;
  background-image: radial-gradient(ellipse at center, #234d38 0%, #1a3a2a 70%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.center-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg,   rgba(201,168,76,0.03) 0, rgba(201,168,76,0.03) 1px, transparent 1px, transparent 40px),
    repeating-linear-gradient(90deg,  rgba(201,168,76,0.03) 0, rgba(201,168,76,0.03) 1px, transparent 1px, transparent 40px);
  pointer-events: none;
}
</style>