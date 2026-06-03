<template>
  <div class="board-wrapper">
    <div class="board" ref="boardRef">
      <!-- Corner squares -->
      <div class="corner corner-br" style="grid-area: c0">
        <div class="corner-inner">
          <div class="text-3xl">🏁</div>
          <div class="corner-label">出发点</div>
          <div class="corner-sublabel text-gold text-xs">领取 $200</div>
          <div class="tokens-area">
            <PlayerToken v-for="p in playersAt(0)" :key="p.id" :player="p" />
          </div>
        </div>
      </div>

      <div class="corner corner-bl" style="grid-area: c10">
        <div class="corner-inner">
          <div class="text-3xl">🔒</div>
          <div class="corner-label">监狱</div>
          <div class="corner-sublabel text-ivory/50 text-xs">探访 / 服刑</div>
          <div class="tokens-area">
            <PlayerToken v-for="p in playersAt(10)" :key="p.id" :player="p" />
          </div>
        </div>
      </div>

      <div class="corner corner-tl" style="grid-area: c20">
        <div class="corner-inner">
          <div class="text-3xl">🅿️</div>
          <div class="corner-label">免费停车</div>
          <div class="corner-sublabel text-gold text-xs" v-if="store.parkingPot > 0">${{ store.parkingPot }}</div>
          <div class="tokens-area">
            <PlayerToken v-for="p in playersAt(20)" :key="p.id" :player="p" />
          </div>
        </div>
      </div>

      <div class="corner corner-tr" style="grid-area: c30">
        <div class="corner-inner">
          <div class="text-3xl">👮</div>
          <div class="corner-label">入狱</div>
          <div class="corner-sublabel text-red-400 text-xs">直接前往</div>
          <div class="tokens-area">
            <PlayerToken v-for="p in playersAt(30)" :key="p.id" :player="p" />
          </div>
        </div>
      </div>

      <!-- Bottom row: squares 1-9 -->
      <BoardSquare
        v-for="id in bottomRow"
        :key="id"
        :square="SQUARES[id]"
        :style="{ gridArea: `b${id}` }"
        orientation="bottom"
        :players="playersAt(id)"
        @squareClick="$emit('squareClick', $event)"
      />

      <!-- Left column: squares 11-19 -->
      <BoardSquare
        v-for="id in leftCol"
        :key="id"
        :square="SQUARES[id]"
        :style="{ gridArea: `l${id}` }"
        orientation="left"
        :players="playersAt(id)"
        @squareClick="$emit('squareClick', $event)"
      />

      <!-- Top row: squares 21-29 -->
      <BoardSquare
        v-for="id in topRow"
        :key="id"
        :square="SQUARES[id]"
        :style="{ gridArea: `t${id}` }"
        orientation="top"
        :players="playersAt(id)"
        @squareClick="$emit('squareClick', $event)"
      />

      <!-- Right column: squares 31-39 -->
      <BoardSquare
        v-for="id in rightCol"
        :key="id"
        :square="SQUARES[id]"
        :style="{ gridArea: `r${id}` }"
        orientation="right"
        :players="playersAt(id)"
        @squareClick="$emit('squareClick', $event)"
      />

      <!-- Center panel -->
      <div class="center-panel" style="grid-area: center">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game.js'
import { BOARD_SQUARES } from '../data/boardData.js'
import BoardSquare from './BoardSquare.vue'
import PlayerToken from './PlayerToken.vue'

defineEmits(['squareClick'])

const store = useGameStore()
const SQUARES = BOARD_SQUARES

const bottomRow = [1,2,3,4,5,6,7,8,9]
const leftCol   = [11,12,13,14,15,16,17,18,19]
const topRow    = [21,22,23,24,25,26,27,28,29]
const rightCol  = [31,32,33,34,35,36,37,38,39]

function playersAt(pos) {
  return store.players.filter(p =>
    p.position === pos && !store.bankruptPlayers.includes(p.id)
  )
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
  /* Fill available height (capped), keep square with aspect-ratio */
  width: min(calc(100vh - 20px), calc(100vw - 450px), 800px);
  height: min(calc(100vh - 20px), calc(100vw - 450px), 800px);
  grid-template-columns: 80px repeat(9, 1fr) 80px;
  grid-template-rows: 80px repeat(9, 1fr) 80px;
  grid-template-areas:
    "c20  t21  t22  t23  t24  t25  t26  t27  t28  t29  c30"
    "l19  center center center center center center center center center r31"
    "l18  center center center center center center center center center r32"
    "l17  center center center center center center center center center r33"
    "l16  center center center center center center center center center r34"
    "l15  center center center center center center center center center r35"
    "l14  center center center center center center center center center r36"
    "l13  center center center center center center center center center r37"
    "l12  center center center center center center center center center r38"
    "l11  center center center center center center center center center r39"
    "c10  b9   b8   b7   b6   b5   b4   b3   b2   b1   c0";
  background: #1a3a2a;
  border: 3px solid #c9a84c;
  box-shadow: 0 0 0 6px #3d1c0e, 0 8px 40px rgba(0,0,0,0.7), 0 0 0 8px #c9a84c50;
}

.corner {
  background: #0f2318;
  border: 1px solid rgba(201,168,76,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
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
.corner-sublabel {
  font-size: 8px;
  text-align: center;
}
.tokens-area {
  display: flex;
  flex-wrap: wrap;
  gap: 1px;
  justify-content: center;
  max-width: 72px;
}

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
    repeating-linear-gradient(0deg, rgba(201,168,76,0.03) 0px, rgba(201,168,76,0.03) 1px, transparent 1px, transparent 40px),
    repeating-linear-gradient(90deg, rgba(201,168,76,0.03) 0px, rgba(201,168,76,0.03) 1px, transparent 1px, transparent 40px);
  pointer-events: none;
}
</style>
