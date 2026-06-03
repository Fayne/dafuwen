<template>
  <div
    class="player-token"
    :class="{ 'token-small': small, 'token-bounce': bouncing }"
    :style="{ borderColor: player.color }"
    :title="player.name"
  >{{ player.token }}</div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useGameStore } from '../stores/game.js'

const props = defineProps({
  player: Object,
  small: Boolean,
})

const store = useGameStore()
const bouncing = ref(false)

watch(() => props.player.position, () => {
  bouncing.value = true
  setTimeout(() => bouncing.value = false, 400)
})
</script>

<style scoped>
.player-token {
  font-size: 14px;
  border: 2px solid;
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
}
.token-small {
  font-size: 9px;
  width: 14px;
  height: 14px;
  border-width: 1px;
}
</style>
