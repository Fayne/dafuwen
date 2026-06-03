<template>
  <div class="flex gap-3 justify-center">
    <div
      v-for="(val, i) in store.dice"
      :key="i"
      class="die"
      :class="{ 'dice-rolling': store.isRolling }"
    >
      <div class="die-face">
        <template v-if="val === 1">
          <span class="dot center"></span>
        </template>
        <template v-else-if="val === 2">
          <span class="dot top-left"></span>
          <span class="dot bot-right"></span>
        </template>
        <template v-else-if="val === 3">
          <span class="dot top-left"></span>
          <span class="dot center"></span>
          <span class="dot bot-right"></span>
        </template>
        <template v-else-if="val === 4">
          <span class="dot top-left"></span>
          <span class="dot top-right"></span>
          <span class="dot bot-left"></span>
          <span class="dot bot-right"></span>
        </template>
        <template v-else-if="val === 5">
          <span class="dot top-left"></span>
          <span class="dot top-right"></span>
          <span class="dot center"></span>
          <span class="dot bot-left"></span>
          <span class="dot bot-right"></span>
        </template>
        <template v-else>
          <span class="dot top-left"></span>
          <span class="dot top-right"></span>
          <span class="dot mid-left"></span>
          <span class="dot mid-right"></span>
          <span class="dot bot-left"></span>
          <span class="dot bot-right"></span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/game.js'
const store = useGameStore()
</script>

<style scoped>
.die {
  width: 44px;
  height: 44px;
  background: linear-gradient(145deg, #f5ead5, #e8d9b8);
  border-radius: 8px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.5);
}
.die-face {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 5px;
}
.dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #2a1a0a;
  border-radius: 50%;
}
.center  { top: 50%; left: 50%; transform: translate(-50%,-50%); }
.top-left  { top: 20%;  left: 20%;  }
.top-right { top: 20%;  right: 20%; }
.mid-left  { top: 50%;  left: 20%;  transform: translateY(-50%); }
.mid-right { top: 50%;  right: 20%; transform: translateY(-50%); }
.bot-left  { bottom: 20%; left: 20%;  }
.bot-right { bottom: 20%; right: 20%; }
</style>
