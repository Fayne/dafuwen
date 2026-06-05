import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  BOARD_SIZES, BOARD_STARTING_MONEY, COLOR_GROUPS,
  CHANCE_CARDS_TEMPLATE, COMMUNITY_CARDS_TEMPLATE,
  RAILROAD_RENT, UTILITY_MULTIPLIER, GO_BONUS, JAIL_BAIL,
  resolveCards
} from '../data/boardData.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const useGameStore = defineStore('game', () => {
  const phase              = ref('setup')
  const boardSizeKey       = ref('small')
  const players            = ref([])
  const currentPlayerIndex = ref(0)
  const properties         = ref({})
  const chanceDeck         = ref([])
  const communityDeck      = ref([])
  const chanceDiscard      = ref([])
  const communityDiscard   = ref([])
  const log                = ref([])
  const dice               = ref([1, 1])
  const isRolling          = ref(false)
  const movingPlayerId     = ref(null)
  const hasRolledThisTurn  = ref(false)
  const doublesCount       = ref(0)
  const modal              = ref(null)
  const bankruptPlayers    = ref([])
  const parkingPot         = ref(0)

  // ── Derived ────────────────────────────────────────────────────────────────
  const boardConfig   = computed(() => BOARD_SIZES[boardSizeKey.value])
  const squares       = computed(() => boardConfig.value.squares)
  const totalSquares  = computed(() => squares.value.length)
  const innerPerSide  = computed(() => boardConfig.value.innerPerSide)
  const jailPos       = computed(() => boardConfig.value.jailPos)

  const currentPlayer  = computed(() => players.value[currentPlayerIndex.value])
  const activePlayers  = computed(() => players.value.filter(p => !bankruptPlayers.value.includes(p.id)))

  // ── Logging ────────────────────────────────────────────────────────────────
  function addLog(message, type = 'info') {
    log.value.unshift({ message, type, id: Date.now() + Math.random() })
    if (log.value.length > 60) log.value.pop()
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function initGame(playerSetups, sizeKey = 'small', startingMoney) {
    boardSizeKey.value = sizeKey
    const sq = BOARD_SIZES[sizeKey].squares
    const money = startingMoney ?? BOARD_STARTING_MONEY[sizeKey] ?? 1500
    players.value = playerSetups.map((p, i) => ({
      id: i, name: p.name, token: p.token, color: p.color,
      money, position: 0,
      inJail: false, jailTurns: 0, jailFreeCards: 0,
    }))
    properties.value    = {}
    chanceDeck.value    = shuffle(resolveCards(CHANCE_CARDS_TEMPLATE, sq))
    communityDeck.value = shuffle(resolveCards(COMMUNITY_CARDS_TEMPLATE, sq))
    chanceDiscard.value = []
    communityDiscard.value = []
    log.value           = []
    bankruptPlayers.value = []
    parkingPot.value    = 0
    currentPlayerIndex.value = 0
    hasRolledThisTurn.value  = false
    doublesCount.value  = 0
    modal.value         = null
    isRolling.value     = false
    movingPlayerId.value = null
    phase.value         = 'playing'
    addLog('游戏开始！祝大家好运 🎲', 'system')
  }

  // ── Dice ───────────────────────────────────────────────────────────────────
  function rollDice() {
    if (hasRolledThisTurn.value || isRolling.value) return
    isRolling.value = true
    const d1 = Math.floor(Math.random() * 6) + 1
    const d2 = Math.floor(Math.random() * 6) + 1
    dice.value = [d1, d2]
    const isDoubles = d1 === d2
    setTimeout(() => {
      isRolling.value = false
      const player = currentPlayer.value
      addLog(`${player.name} 掷出 ${d1}+${d2}=${d1+d2}${isDoubles ? ' 【双数】' : ''}`, 'roll')
      if (player.inJail) { handleJailRoll(player, d1, d2, isDoubles); return }
      if (isDoubles) {
        doublesCount.value++
        if (doublesCount.value >= 3) { addLog(`${player.name} 连续三次双数，入狱！`, 'jail'); sendToJail(player); hasRolledThisTurn.value = true; return }
      } else { doublesCount.value = 0 }
      movePlayer(player, d1 + d2, isDoubles)
    }, 700)
  }

  function handleJailRoll(player, d1, d2, isDoubles) {
    if (isDoubles) {
      player.inJail = false; player.jailTurns = 0
      addLog(`${player.name} 掷出双数，出狱！`, 'success')
      movePlayer(player, d1 + d2, false)
    } else {
      player.jailTurns++
      if (player.jailTurns >= 3) {
        player.money -= JAIL_BAIL; player.inJail = false; player.jailTurns = 0
        addLog(`${player.name} 服满3回合，缴 $${JAIL_BAIL} 出狱`, 'pay')
        movePlayer(player, d1 + d2, false)
      } else {
        addLog(`${player.name} 未能出狱（第 ${player.jailTurns} 回合）`, 'info')
        hasRolledThisTurn.value = true
      }
    }
  }

  function movePlayer(player, steps, isDoubles) {
    const total = totalSquares.value
    const startPos = player.position
    const endPos = (startPos + steps) % total
    const passedGo = endPos < startPos || startPos + steps >= total
    hasRolledThisTurn.value = true
    movingPlayerId.value = player.id
    let step = 0
    function doStep() {
      step++
      if (step > steps) {
        movingPlayerId.value = null
        if (passedGo) {
          player.money += GO_BONUS
          addLog(`${player.name} 经过出发点，领取 $${GO_BONUS}！`, 'money')
        }
        setTimeout(() => landOnSquare(player, squares.value[endPos], isDoubles), 350)
        return
      }
      player.position = (player.position + 1) % total
      setTimeout(doStep, 280)
    }
    doStep()
  }

  function landOnSquare(player, square, isDoubles) {
    addLog(`${player.name} 落在【${square.name}】`, 'move')
    switch (square.type) {
      case 'go': break
      case 'property': case 'railroad': case 'utility': handlePropertyLanding(player, square); break
      case 'tax': handleTax(player, square); break
      case 'chance': drawCard(player, 'chance'); break
      case 'community': drawCard(player, 'community'); break
      case 'go_to_jail': sendToJail(player); break
      case 'parking':
        if (parkingPot.value > 0) {
          addLog(`${player.name} 获得停车奖金 $${parkingPot.value}！`, 'success')
          player.money += parkingPot.value; parkingPot.value = 0
        }
        break
      case 'jail': addLog(`${player.name} 只是探访监狱`, 'info'); break
    }
    if (isDoubles && !player.inJail) { addLog(`${player.name} 双数，再掷一次！`, 'info'); hasRolledThisTurn.value = false }
    checkBankruptcy(player)
  }

  function handlePropertyLanding(player, square) {
    const prop = properties.value[square.id]
    if (!prop) {
      // No owner — offer to buy
      modal.value = { type: 'buy', square, playerId: player.id }
      return
    }
    // Strict numeric comparison to avoid proxy/string type mismatches
    const ownerId = Number(prop.ownerId)
    if (ownerId === player.id) {
      addLog(`${player.name} 落在自己地产`, 'info')
      return
    }
    if (prop.mortgaged) {
      addLog(`${square.name} 已抵押，无租金`, 'info')
      return
    }
    const owner = players.value.find(p => p.id === ownerId)
    if (!owner || bankruptPlayers.value.includes(ownerId)) return
    const rent = calculateRent(square, prop)
    addLog(`${player.name} 缴租 $${rent} 给 ${owner.name}`, 'pay')
    player.money -= rent
    owner.money  += rent
  }

  function calculateRent(square, prop) {
    const ownerId = Number(prop.ownerId)
    if (square.type === 'railroad') {
      const count = Object.keys(properties.value).filter(id =>
        Number(properties.value[id].ownerId) === ownerId &&
        squares.value[parseInt(id)]?.type === 'railroad'
      ).length
      return RAILROAD_RENT[count] || 25
    }
    if (square.type === 'utility') {
      const count = Object.keys(properties.value).filter(id =>
        Number(properties.value[id].ownerId) === ownerId &&
        squares.value[parseInt(id)]?.type === 'utility'
      ).length
      return (UTILITY_MULTIPLIER[count] || 4) * (dice.value[0] + dice.value[1])
    }
    const group = COLOR_GROUPS[square.group]
    if (!group) return 0
    const houses = prop.houses || 0
    if (houses === 0) {
      const monopoly = squares.value
        .filter(s => s.group === square.group)
        .every(s => Number(properties.value[s.id]?.ownerId) === ownerId)
      return monopoly ? group.rent[0] * 2 : group.rent[0]
    }
    return group.rent[Math.min(houses, 5)]
  }

  function handleTax(player, square) {
    addLog(`${player.name} 缴纳 ${square.name} $${square.amount}`, 'pay')
    player.money -= square.amount; parkingPot.value += square.amount
  }

  function drawCard(player, deck) {
    let card
    if (deck === 'chance') {
      if (!chanceDeck.value.length) { chanceDeck.value = shuffle(chanceDiscard.value); chanceDiscard.value = [] }
      card = chanceDeck.value.pop()
      if (card.action !== 'jail_free') chanceDiscard.value.push(card)
    } else {
      if (!communityDeck.value.length) { communityDeck.value = shuffle(communityDiscard.value); communityDiscard.value = [] }
      card = communityDeck.value.pop()
      if (card.action !== 'jail_free') communityDiscard.value.push(card)
    }
    modal.value = { type: 'card', card, player, deck }
  }

  function executeCard(player, card) {
    addLog(`${player.name} 抽到：${card.text}`, 'card')
    switch (card.action) {
      case 'receive': player.money += card.amount; break
      case 'pay': player.money -= card.amount; parkingPot.value += card.amount; break
      case 'go_to_jail': modal.value = null; sendToJail(player); return
      case 'jail_free': player.jailFreeCards++; break
      case 'advance_to':
        if (card.target < player.position) { player.money += GO_BONUS; addLog(`${player.name} 经过出发点，领取 $${GO_BONUS}`, 'money') }
        player.position = card.target
        if (card.bonus) player.money += card.bonus
        modal.value = null
        setTimeout(() => landOnSquare(player, squares.value[card.target], false), 300)
        return
      case 'move_back':
        player.position = Math.max(0, player.position - card.amount)
        modal.value = null
        setTimeout(() => landOnSquare(player, squares.value[player.position], false), 300)
        return
      case 'collect_from_all':
        activePlayers.value.forEach(p => { if (p.id !== player.id) { p.money -= card.amount; player.money += card.amount } })
        break
      case 'repair':
        let total = 0
        Object.entries(properties.value).forEach(([, prop]) => { if (prop.ownerId === player.id) { const h = prop.houses||0; total += h >= 5 ? card.hotel : h * card.house } })
        if (total > 0) { player.money -= total; addLog(`${player.name} 支付修缮费 $${total}`, 'pay') }
        break
    }
    modal.value = null; checkBankruptcy(player)
  }

  function buyProperty(playerId, square) {
    const player = players.value.find(p => p.id === playerId)
    if (!player) { modal.value = null; return }
    if (player.money < square.price) { addLog('资金不足', 'error'); modal.value = null; return }
    player.money -= square.price
    properties.value = {
      ...properties.value,
      [square.id]: { ownerId: Number(player.id), houses: 0, mortgaged: false }
    }
    addLog(`${player.name} 购买了 ${square.name}，花费 $${square.price}`, 'buy')
    modal.value = null
  }

  function declineBuy() { modal.value = null }

  function buildHouse(playerId, squareId) {
    const square = squares.value[squareId]
    const prop   = properties.value[squareId]
    if (!prop || Number(prop.ownerId) !== playerId || !square?.group) return false
    const player = players.value.find(p => p.id === playerId)
    if (!player) return false
    const groupSquares = squares.value.filter(s => s.group === square.group)
    if (!groupSquares.every(s => Number(properties.value[s.id]?.ownerId) === playerId)) { addLog('需要集齐同色地产', 'error'); return false }
    const houses = prop.houses || 0
    if (houses >= 5) { addLog('已达最大建筑', 'error'); return false }
    const minH = Math.min(...groupSquares.map(s => properties.value[s.id]?.houses || 0))
    if (houses > minH) { addLog('建筑需均匀分布', 'error'); return false }
    if (player.money < square.houseCost) { addLog('资金不足', 'error'); return false }
    player.money -= square.houseCost; prop.houses = houses + 1
    addLog(`${player.name} 在 ${square.name} 建${houses+1 >= 5 ? '酒店🏨' : '房🏠'}`, 'build')
    return true
  }

  function sellHouse(playerId, squareId) {
    const square = squares.value[squareId]
    const prop   = properties.value[squareId]
    if (!prop || Number(prop.ownerId) !== playerId || (prop.houses||0) <= 0) return false
    const player = players.value.find(p => p.id === playerId)
    if (!player) return false
    const refund = Math.floor(square.houseCost / 2)
    prop.houses--; player.money += refund
    addLog(`${player.name} 出售 ${square.name} 建筑，获 $${refund}`, 'sell')
    return true
  }

  function mortgageProperty(playerId, squareId) {
    const square = squares.value[squareId]
    const prop   = properties.value[squareId]
    if (!prop || Number(prop.ownerId) !== playerId || prop.mortgaged) return false
    if ((prop.houses||0) > 0) { addLog('请先拆除建筑', 'error'); return false }
    const player = players.value.find(p => p.id === playerId)
    if (!player) return false
    const mortgage = Math.floor(square.price / 2)
    prop.mortgaged = true; player.money += mortgage
    addLog(`${player.name} 抵押 ${square.name}，获 $${mortgage}`, 'mortgage')
    return true
  }

  function unmortgageProperty(playerId, squareId) {
    const square = squares.value[squareId]
    const prop   = properties.value[squareId]
    if (!prop || Number(prop.ownerId) !== playerId || !prop.mortgaged) return false
    const player = players.value.find(p => p.id === playerId)
    if (!player) return false
    const cost = Math.floor(square.price / 2 * 1.1)
    if (player.money < cost) { addLog('资金不足', 'error'); return false }
    player.money -= cost; prop.mortgaged = false
    addLog(`${player.name} 解押 ${square.name}，花 $${cost}`, 'money')
    return true
  }

  function useJailFreeCard(player) {
    if (player.jailFreeCards <= 0) return false
    player.jailFreeCards--; player.inJail = false; player.jailTurns = 0
    addLog(`${player.name} 使用出狱免费卡出狱！`, 'success'); return true
  }

  function payJailBail(player) {
    if (player.money < JAIL_BAIL) { addLog('资金不足', 'error'); return false }
    player.money -= JAIL_BAIL; player.inJail = false; player.jailTurns = 0
    addLog(`${player.name} 缴 $${JAIL_BAIL} 出狱`, 'pay'); return true
  }

  function sendToJail(player) {
    player.position = jailPos.value; player.inJail = true; player.jailTurns = 0
    doublesCount.value = 0; hasRolledThisTurn.value = true
    addLog(`${player.name} 入狱！🔒`, 'jail')
  }

  function checkBankruptcy(player) {
    if (player.money <= -300 && !bankruptPlayers.value.includes(player.id)) declareBankruptcy(player)
  }

  function declareBankruptcy(player) {
    if (bankruptPlayers.value.includes(player.id)) return
    bankruptPlayers.value.push(player.id)
    Object.keys(properties.value).forEach(id => {
      if (Number(properties.value[id].ownerId) === player.id) delete properties.value[id]
    })
    addLog(`💀 ${player.name} 破产退出！`, 'bankrupt')
    if (activePlayers.value.length === 1) {
      const winner = activePlayers.value[0]
      addLog(`🏆 ${winner.name} 获得最终胜利！`, 'win')
      phase.value = 'ended'; modal.value = { type: 'winner', player: winner }
    } else { endTurn() }
  }

  function endTurn() {
    if (phase.value !== 'playing' || movingPlayerId.value !== null) return
    modal.value = null; doublesCount.value = 0; hasRolledThisTurn.value = false
    let next = (currentPlayerIndex.value + 1) % players.value.length, tries = 0
    while (bankruptPlayers.value.includes(players.value[next].id) && tries < players.value.length) { next = (next + 1) % players.value.length; tries++ }
    currentPlayerIndex.value = next
    addLog(`── ${players.value[next].name} 的回合 ──`, 'turn')
  }

  function closeModal() { modal.value = null }

  function getPlayerProperties(playerId) {
    return Object.entries(properties.value)
      .filter(([, p]) => Number(p.ownerId) === playerId)
      .map(([id, p]) => ({ ...squares.value[parseInt(id)], ...p, squareId: parseInt(id) }))
  }

  function getSquareOwner(squareId) {
    const prop = properties.value[squareId]
    if (!prop) return null
    return players.value.find(p => p.id === Number(prop.ownerId)) ?? null
  }

  // ── localStorage persistence ───────────────────────────────────────────────
  const SAVE_KEY = 'monopoly_save_v2'

  function saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        phase: phase.value, boardSizeKey: boardSizeKey.value,
        players: players.value, currentPlayerIndex: currentPlayerIndex.value,
        properties: properties.value,
        chanceDeck: chanceDeck.value, communityDeck: communityDeck.value,
        chanceDiscard: chanceDiscard.value, communityDiscard: communityDiscard.value,
        log: log.value.slice(0, 30), dice: dice.value,
        hasRolledThisTurn: hasRolledThisTurn.value, doublesCount: doublesCount.value,
        bankruptPlayers: bankruptPlayers.value, parkingPot: parkingPot.value,
      }))
    } catch(e) { console.warn('Save failed', e) }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false
      const s = JSON.parse(raw)
      if (!s?.phase || !Array.isArray(s.players) || !s.players.length) return false
      phase.value = s.phase; boardSizeKey.value = s.boardSizeKey || 'small'
      players.value = s.players; currentPlayerIndex.value = s.currentPlayerIndex ?? 0
      properties.value = s.properties ?? {}
      chanceDeck.value = s.chanceDeck ?? []; communityDeck.value = s.communityDeck ?? []
      chanceDiscard.value = s.chanceDiscard ?? []; communityDiscard.value = s.communityDiscard ?? []
      log.value = s.log ?? []; dice.value = s.dice ?? [1,1]
      hasRolledThisTurn.value = s.hasRolledThisTurn ?? false
      doublesCount.value = s.doublesCount ?? 0
      bankruptPlayers.value = s.bankruptPlayers ?? []; parkingPot.value = s.parkingPot ?? 0
      modal.value = null; isRolling.value = false
      return true
    } catch(e) { console.warn('Load failed', e); return false }
  }

  function clearSave()    { localStorage.removeItem(SAVE_KEY) }
  function hasSavedGame() {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s?.phase === 'playing' && s.players?.length > 0 } catch { return false }
  }
  function tryRestore()   { return loadState() }

  watch(
    [phase, players, currentPlayerIndex, properties, hasRolledThisTurn, doublesCount, bankruptPlayers, parkingPot, log],
    () => { if (phase.value === 'playing') saveState() },
    { deep: true }
  )

  function resetGame() {
    clearSave(); phase.value = 'setup'; players.value = []; properties.value = {}
    log.value = []; bankruptPlayers.value = []; modal.value = null; parkingPot.value = 0
    chanceDeck.value = []; communityDeck.value = []; chanceDiscard.value = []; communityDiscard.value = []
    dice.value = [1,1]; hasRolledThisTurn.value = false; doublesCount.value = 0; currentPlayerIndex.value = 0; movingPlayerId.value = null
    boardSizeKey.value = 'small'
  }

  return {
    phase, boardSizeKey, boardConfig, squares, totalSquares, innerPerSide, jailPos,
    players, currentPlayerIndex, currentPlayer, activePlayers,
    properties, dice, isRolling, movingPlayerId, hasRolledThisTurn, doublesCount,
    modal, log, bankruptPlayers, parkingPot,
    initGame, rollDice, buyProperty, declineBuy, buildHouse, sellHouse,
    mortgageProperty, unmortgageProperty, sendToJail, endTurn, closeModal,
    getPlayerProperties, getSquareOwner, executeCard, declareBankruptcy,
    useJailFreeCard, payJailBail, resetGame, tryRestore, hasSavedGame, clearSave,
  }
})