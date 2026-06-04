import { ref } from 'vue'

const muted = ref(localStorage.getItem('audio_muted') !== 'false')

let bgm = null
let diceSfx = null
let tokenSfx = null

function ensureLoaded() {
  if (!bgm) {
    bgm = new Audio('/monopoly-game.mp3')
    bgm.loop = true
    bgm.volume = 0.5
  }
  if (!diceSfx) {
    diceSfx = new Audio('/dice_rolling.ogg')
  }
  if (!tokenSfx) {
    tokenSfx = new Audio('/token_move.mp3')
  }
}

export function useAudio() {
  function playBgm() {
    ensureLoaded()
    if (muted.value) return
    bgm.currentTime = 0
    bgm.play().catch(() => {})
  }

  function stopBgm() {
    if (bgm) { bgm.pause(); bgm.currentTime = 0 }
  }

  function duckBgm() {
    if (bgm) bgm.volume = 0.15
  }

  function restoreBgm() {
    if (bgm) bgm.volume = 0.5
  }

  function playDice() {
    ensureLoaded()
    if (muted.value) return
    diceSfx.currentTime = 0
    diceSfx.play().catch(() => {})
  }

  function stopDice() {
    if (diceSfx) { diceSfx.pause(); diceSfx.currentTime = 0 }
  }

  function playTokenMove() {
    ensureLoaded()
    if (muted.value) return
    tokenSfx.currentTime = 0
    tokenSfx.play().catch(() => {})
  }

  function stopTokenMove() {
    if (tokenSfx) { tokenSfx.pause(); tokenSfx.currentTime = 0 }
  }

  function toggleMute() {
    muted.value = !muted.value
    localStorage.setItem('audio_muted', muted.value)
    if (muted.value) stopBgm()
    else playBgm()
  }

  return {
    muted, playBgm, stopBgm, duckBgm, restoreBgm,
    playDice, stopDice, playTokenMove, stopTokenMove, toggleMute,
  }
}
