// Board squares — 40 total, index 0 = GO (bottom-right), going counter-clockwise
export const COLOR_GROUPS = {
  brown:    { name: '褐色',   color: '#8B4513', bgColor: '#8B4513', rent: [2, 10, 30, 90, 160, 250] },
  lightblue:{ name: '浅蓝色', color: '#87CEEB', bgColor: '#87CEEB', rent: [6, 30, 90, 270, 400, 550] },
  pink:     { name: '粉红色', color: '#C2185B', bgColor: '#C2185B', rent: [10, 50, 150, 450, 625, 750] },
  orange:   { name: '橙色',   color: '#FF8C00', bgColor: '#FF8C00', rent: [14, 70, 200, 550, 750, 950] },
  red:      { name: '红色',   color: '#C62828', bgColor: '#C62828', rent: [18, 90, 250, 700, 875, 1050] },
  yellow:   { name: '黄色',   color: '#F9A825', bgColor: '#F9A825', rent: [22, 110, 330, 800, 975, 1150] },
  green:    { name: '绿色',   color: '#2E7D32', bgColor: '#2E7D32', rent: [26, 130, 390, 900, 1100, 1275] },
  darkblue: { name: '深蓝色', color: '#1565C0', bgColor: '#1565C0', rent: [35, 175, 500, 1100, 1300, 1500] },
}

export const BOARD_SQUARES = [
  // Bottom row (index 0-10), right to left
  { id: 0,  type: 'go',        name: '出发点',       icon: '🏁' },
  { id: 1,  type: 'property',  name: '台北路',        price: 60,  group: 'brown',     houseCost: 50  },
  { id: 2,  type: 'community', name: '命运',          icon: '🎴' },
  { id: 3,  type: 'property',  name: '基隆路',        price: 60,  group: 'brown',     houseCost: 50  },
  { id: 4,  type: 'tax',       name: '所得税',        amount: 200, icon: '💸' },
  { id: 5,  type: 'railroad',  name: '台铁北站',      price: 200, icon: '🚂' },
  { id: 6,  type: 'property',  name: '新竹路',        price: 100, group: 'lightblue', houseCost: 50  },
  { id: 7,  type: 'chance',    name: '机会',          icon: '❓' },
  { id: 8,  type: 'property',  name: '苗栗路',        price: 100, group: 'lightblue', houseCost: 50  },
  { id: 9,  type: 'property',  name: '台中路',        price: 120, group: 'lightblue', houseCost: 50  },
  { id: 10, type: 'jail',      name: '监狱/探访',     icon: '🔒' },

  // Left column (index 11-19), bottom to top
  { id: 11, type: 'property',  name: '彰化路',        price: 140, group: 'pink',      houseCost: 100 },
  { id: 12, type: 'utility',   name: '台湾电力',      price: 150, icon: '⚡' },
  { id: 13, type: 'property',  name: '南投路',        price: 140, group: 'pink',      houseCost: 100 },
  { id: 14, type: 'property',  name: '云林路',        price: 160, group: 'pink',      houseCost: 100 },
  { id: 15, type: 'railroad',  name: '台铁西站',      price: 200, icon: '🚂' },
  { id: 16, type: 'property',  name: '嘉义路',        price: 180, group: 'orange',    houseCost: 100 },
  { id: 17, type: 'community', name: '命运',          icon: '🎴' },
  { id: 18, type: 'property',  name: '台南路',        price: 180, group: 'orange',    houseCost: 100 },
  { id: 19, type: 'property',  name: '高雄路',        price: 200, group: 'orange',    houseCost: 100 },

  // Top row (index 20-30), left to right
  { id: 20, type: 'parking',   name: '免费停车',      icon: '🅿️' },
  { id: 21, type: 'property',  name: '屏东路',        price: 220, group: 'red',       houseCost: 150 },
  { id: 22, type: 'chance',    name: '机会',          icon: '❓' },
  { id: 23, type: 'property',  name: '花莲路',        price: 220, group: 'red',       houseCost: 150 },
  { id: 24, type: 'property',  name: '台东路',        price: 240, group: 'red',       houseCost: 150 },
  { id: 25, type: 'railroad',  name: '台铁南站',      price: 200, icon: '🚂' },
  { id: 26, type: 'property',  name: '宜兰路',        price: 260, group: 'yellow',    houseCost: 150 },
  { id: 27, type: 'property',  name: '桃园路',        price: 260, group: 'yellow',    houseCost: 150 },
  { id: 28, type: 'utility',   name: '台湾自来水',    price: 150, icon: '💧' },
  { id: 29, type: 'property',  name: '新北路',        price: 280, group: 'yellow',    houseCost: 150 },
  { id: 30, type: 'go_to_jail', name: '入狱',         icon: '👮' },

  // Right column (index 31-39), top to bottom
  { id: 31, type: 'property',  name: '松山路',        price: 300, group: 'green',     houseCost: 200 },
  { id: 32, type: 'property',  name: '信义路',        price: 300, group: 'green',     houseCost: 200 },
  { id: 33, type: 'community', name: '命运',          icon: '🎴' },
  { id: 34, type: 'property',  name: '大安路',        price: 320, group: 'green',     houseCost: 200 },
  { id: 35, type: 'railroad',  name: '台铁东站',      price: 200, icon: '🚂' },
  { id: 36, type: 'chance',    name: '机会',          icon: '❓' },
  { id: 37, type: 'property',  name: '中山路',        price: 350, group: 'darkblue',  houseCost: 200 },
  { id: 38, type: 'tax',       name: '奢侈税',        amount: 100, icon: '💸' },
  { id: 39, type: 'property',  name: '仁爱路',        price: 400, group: 'darkblue',  houseCost: 200 },
]

export const CHANCE_CARDS = [
  { text: '前进至出发点，领取 $200', action: 'advance_to', target: 0, bonus: 200 },
  { text: '前进至台铁北站', action: 'advance_to', target: 5 },
  { text: '前进至信义路', action: 'advance_to', target: 32 },
  { text: '银行支付你股息 $50', action: 'receive', amount: 50 },
  { text: '出狱免费卡（保留备用）', action: 'jail_free' },
  { text: '退回 3 格', action: 'move_back', amount: 3 },
  { text: '入狱！直接前往监狱', action: 'go_to_jail' },
  { text: '房屋修缮费：每栋房 $25，每间酒店 $100', action: 'repair', house: 25, hotel: 100 },
  { text: '缴纳罚款 $15', action: 'pay', amount: 15 },
  { text: '前进至仁爱路', action: 'advance_to', target: 39 },
  { text: '银行错误多付你 $200', action: 'receive', amount: 200 },
  { text: '缴纳学费 $150', action: 'pay', amount: 150 },
  { text: '获得奖金 $100', action: 'receive', amount: 100 },
  { text: '前进至高雄路', action: 'advance_to', target: 19 },
  { text: '所有玩家支付你 $50', action: 'collect_from_all', amount: 50 },
  { text: '获得建筑贷款退款 $150', action: 'receive', amount: 150 },
]

export const COMMUNITY_CARDS = [
  { text: '银行发放红利，领取 $200', action: 'receive', amount: 200 },
  { text: '缴纳医疗费 $50', action: 'pay', amount: 50 },
  { text: '出狱免费卡（保留备用）', action: 'jail_free' },
  { text: '入狱！直接前往监狱', action: 'go_to_jail' },
  { text: '获得遗产 $100', action: 'receive', amount: 100 },
  { text: '缴纳学费 $50', action: 'pay', amount: 50 },
  { text: '获得保险理赔 $100', action: 'receive', amount: 100 },
  { text: '所有玩家付你生日礼金 $10', action: 'collect_from_all', amount: 10 },
  { text: '缴纳医生费 $50', action: 'pay', amount: 50 },
  { text: '缴纳医院费 $100', action: 'pay', amount: 100 },
  { text: '获得股票收益 $45', action: 'receive', amount: 45 },
  { text: '房屋修缮费：每栋房 $40，每间酒店 $115', action: 'repair', house: 40, hotel: 115 },
  { text: '缴纳税款 $100', action: 'pay', amount: 100 },
  { text: '获得奖金 $20', action: 'receive', amount: 20 },
  { text: '前进至出发点，领取 $200', action: 'advance_to', target: 0, bonus: 200 },
  { text: '获得美容比赛奖金 $10', action: 'receive', amount: 10 },
]

export const PLAYER_TOKENS = ['🎩', '🚗', '🐕', '⚓', '🎲', '👑']
export const PLAYER_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa']
export const PLAYER_COLOR_NAMES = ['红色', '蓝色', '绿色', '橙色', '紫色']

export const RAILROAD_RENT = { 1: 25, 2: 50, 3: 100, 4: 200 }
export const UTILITY_MULTIPLIER = { 1: 4, 2: 10 }

export const STARTING_MONEY = 1500
export const GO_BONUS = 200
export const JAIL_POSITION = 10
export const JAIL_BAIL = 50
