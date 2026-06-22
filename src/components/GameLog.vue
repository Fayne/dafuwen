<template>
  <div class="game-log">
    <div class="log-header">
      <span class="font-display text-gold text-sm font-semibold tracking-wider">{{ isZh ? '游戏日志' : 'Game Log' }}</span>
    </div>
    <div class="log-body scrollbar-thin" ref="logBody">
      <TransitionGroup name="log-item">
        <div
          v-for="entry in store.log"
          :key="entry.id"
          class="log-entry"
          :class="`log-${entry.type}`"
        >
          <span class="log-dot"></span>
          <span class="log-text">{{ entry.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/game.js'
import { useI18n } from '../composables/useI18n.js'
const store = useGameStore()
const { isZh } = useI18n()
</script>

<style scoped>
.game-log {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.log-header {
  padding: 8px 12px;
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid rgba(201,168,76,0.15);
  flex-shrink: 0;
}
.log-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}
.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 3px 10px;
  font-family: 'Crimson Text', serif;
  font-size: 13px;
  line-height: 1.4;
  color: rgba(245,234,213,0.75);
}
.log-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(201,168,76,0.4);
  margin-top: 4px;
  flex-shrink: 0;
}
.log-text { flex: 1; word-break: break-word; }

.log-system .log-dot  { background: #a5d6a7; }
.log-system .log-text { color: #a5d6a7; font-weight: 600; }
.log-turn .log-text   { color: rgba(201,168,76,0.9); font-family: 'Playfair Display', serif; font-size: 12px; }
.log-roll .log-dot    { background: #90caf9; }
.log-money .log-dot   { background: #c9a84c; }
.log-money .log-text  { color: #e2c06a; }
.log-pay .log-dot     { background: #ef9a9a; }
.log-pay .log-text    { color: #ef9a9a; }
.log-buy .log-dot     { background: #81c784; }
.log-buy .log-text    { color: #81c784; }
.log-card .log-text   { font-style: italic; }
.log-jail .log-text   { color: #ff8a65; }
.log-success .log-text{ color: #a5d6a7; }
.log-error .log-text  { color: #ef9a9a; }
.log-win .log-text    { color: #e2c06a; font-family: 'Playfair Display', serif; font-weight: 700; }
.log-bankrupt .log-text{ color: #ef9a9a; font-weight: 600; }
.log-build .log-dot   { background: #80cbc4; }
.log-build .log-text  { color: #80cbc4; }

.log-item-enter-active { transition: all 0.3s ease; }
.log-item-enter-from   { opacity: 0; transform: translateX(-8px); }
</style>
