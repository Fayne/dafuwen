<template>
  <div
    class="board-square"
    :class="[`orient-${orientation}`, { 'is-owned': !!owner, 'is-mortgaged': propData?.mortgaged }]"
    @click="$emit('squareClick', square)"
  >
    <!--
      Left / right cells: we absolutely position an inner div that is
      pre-rotated so its text runs along the cell's long axis.
      Top / bottom cells: normal flow.
    -->

    <!-- Color band (property group color) -->
    <div v-if="square.group" class="color-band" :style="{ background: groupColor }">
      <div class="houses-row" v-if="propData?.houses">
        <span v-if="propData.houses >= 5">🏨</span>
        <template v-else>
          <span v-for="h in propData.houses" :key="h">🏠</span>
        </template>
      </div>
    </div>

    <!-- Text content -->
    <div class="sq-content">
      <div v-if="!square.group" class="sq-icon">
        <span v-if="square.type === 'railroad'">🚂</span>
        <span v-else-if="square.type === 'chance'">❓</span>
        <span v-else-if="square.type === 'community'">🎴</span>
        <span v-else-if="square.type === 'tax'">💸</span>
        <span v-else>{{ square.icon }}</span>
      </div>
      <div class="sq-name">{{ square.name }}</div>
      <div class="sq-price" v-if="square.price">${{ square.price }}</div>
      <div class="sq-price sq-tax" v-else-if="square.amount">${{ square.amount }}</div>
    </div>

    <!-- Owner dot -->
    <div v-if="owner" class="owner-dot" :style="{ background: owner.color }" :title="owner.name"></div>

    <!-- Mortgage overlay -->
    <div v-if="propData?.mortgaged" class="mortgage-overlay">抵押</div>

    <!-- Player tokens -->
    <div class="tokens-wrap" v-if="players?.length">
      <PlayerToken v-for="p in players" :key="p.id" :player="p" small />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game.js'
import { COLOR_GROUPS } from '../data/boardData.js'
import PlayerToken from './PlayerToken.vue'

defineEmits(['squareClick'])
const props = defineProps({ square: Object, orientation: String, players: Array })

const store    = useGameStore()
const owner    = computed(() => store.getSquareOwner(props.square.id))
const propData = computed(() => store.properties[props.square.id])
const groupColor = computed(() => COLOR_GROUPS[props.square.group]?.color ?? null)
</script>

<style scoped>
/* ─────────────────────────────────────────────
   Base cell
───────────────────────────────────────────── */
.board-square {
  background: #f5ead5;
  border: 1px solid rgba(201,168,76,0.25);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: filter 0.15s;
}
.board-square:hover { filter: brightness(1.1); }
.is-mortgaged { opacity: 0.6; }

/* ─────────────────────────────────────────────
   TOP / BOTTOM rows  — normal column flex
───────────────────────────────────────────── */
.orient-top,
.orient-bottom {
  display: flex;
  flex-direction: column;
}

/* color strip: top of cell for bottom-row, bottom of cell for top-row */
.orient-bottom .color-band { order: 0; width: 100%; height: 22%; border-bottom: 1px solid rgba(0,0,0,0.15); }
.orient-top    .color-band { order: 1; width: 100%; height: 22%; border-top:    1px solid rgba(0,0,0,0.15); }

.orient-top    .sq-content,
.orient-bottom .sq-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 2px 1px;
  overflow: hidden;
}

/* ─────────────────────────────────────────────
   LEFT / RIGHT columns — absolutely positioned
   rotated inner block

   The cell itself has a fixed width (80 px corner +
   9 equal cols, so each col ≈ (board - 160)/9 px wide)
   and an implicit height from the grid row.

   Strategy:
   • The cell uses position:relative (already set above).
   • .sq-content is position:absolute, sized width=100%
     height=100%, then rotated around its own centre.
   • Because rotation swaps visual width/height we set
       width  = 100%   (= cell width before rotation)
       height = 100%   (= cell height before rotation)
     and let CSS rotation do the rest.  The text will
     then flow along the long axis of the cell.
───────────────────────────────────────────── */
.orient-left,
.orient-right {
  display: block; /* children use absolute positioning */
}

/* Color band rendered as a vertical stripe */
.orient-left  .color-band {
  position: absolute;
  right: 0; top: 0; bottom: 0;
  width: 22%;
  border-left: 1px solid rgba(0,0,0,0.15);
}
.orient-right .color-band {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 22%;
  border-right: 1px solid rgba(0,0,0,0.15);
}
.orient-left  .color-band,
.orient-right .color-band {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/*
  The content block fills the entire cell, then we rotate it.
  After a 90° rotation the visual bounding box is the same as
  the cell's own bounding box, so everything stays inside.
*/
.orient-left  .sq-content,
.orient-right .sq-content {
  position: absolute;
  /* Start full-cell */
  top: 0; left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 2px 1px;

  /* Rotate around the exact centre of the cell */
  transform-origin: 50% 50%;
}
.orient-left  .sq-content { transform: rotate(90deg);  }   /* text reads bottom→top on left edge  */
.orient-right .sq-content { transform: rotate(-90deg); }   /* text reads top→bottom on right edge */

/* ─────────────────────────────────────────────
   Shared text styles
───────────────────────────────────────────── */
.sq-icon  { font-size: 10px; line-height: 1; flex-shrink: 0; }

.sq-name {
  font-family: 'Playfair Display', serif;
  font-size: 7px;
  font-weight: 600;
  color: #2a1a0a;
  text-align: center;
  line-height: 1.2;
  /* Allow wrapping — the rotated box is as wide as the cell height, plenty of room */
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: break-word;
  max-width: 90%;
}

.sq-price {
  font-family: 'Courier Prime', monospace;
  font-size: 6.5px;
  font-weight: 700;
  color: #5a3a1a;
  white-space: nowrap;
  flex-shrink: 0;
}
.sq-tax { color: #b71c1c; }

/* ─────────────────────────────────────────────
   Decorations
───────────────────────────────────────────── */
.houses-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  justify-content: center;
  font-size: 6px;
  line-height: 1;
}

.owner-dot {
  position: absolute;
  bottom: 2px; right: 2px;
  width: 6px; height: 6px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.5);
  z-index: 6;
}

.mortgage-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 7px;
  font-weight: 700;
  color: #e2c06a;
  background: rgba(0,0,0,0.45);
  z-index: 5;
}

.tokens-wrap {
  position: absolute;
  bottom: 1px; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 1px; flex-wrap: wrap; justify-content: center;
  pointer-events: none;
  z-index: 7;
}
.orient-left  .tokens-wrap,
.orient-right .tokens-wrap {
  left: auto; bottom: auto;
  top: 50%; right: 1px;
  transform: translateY(-50%);
  flex-direction: column;
}
</style>
