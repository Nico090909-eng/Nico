const TIP = {
  backgroundColor: '#0d0d16',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  titleColor: '#ededf5',
  bodyColor: '#60607e',
  titleFont: { family: "'Syne', sans-serif", size: 12, weight: '700' },
  bodyFont:  { family: "'Space Mono', monospace", size: 11 },
  padding: 12,
  cornerRadius: 10,
  displayColors: true,
  boxWidth: 8,
  boxHeight: 8,
}

const LEG = {
  labels: {
    color: '#60607e',
    font: { family: "'Space Mono', monospace", size: 10 },
    boxWidth: 8, boxHeight: 8,
    padding: 14,
    usePointStyle: true,
  },
}

const AXIS_X = {
  ticks: { color: '#60607e', font: { family: "'Space Mono', monospace", size: 9 }, maxRotation: 0 },
  grid:  { color: 'rgba(255,255,255,0.04)', drawBorder: false },
  border:{ color: 'rgba(255,255,255,0.06)' },
}
const AXIS_Y = {
  ticks: { color: '#60607e', font: { family: "'Space Mono', monospace", size: 9 } },
  grid:  { color: 'rgba(255,255,255,0.04)', drawBorder: false },
  border:{ color: 'rgba(255,255,255,0.06)' },
}

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  animation: { duration: 500, easing: 'easeInOutQuart' },
  plugins: { legend: LEG, tooltip: TIP },
  scales: { x: AXIS_X, y: AXIS_Y },
}

export const noAxesOptions = {
  responsive: true,
  maintainAspectRatio: true,
  animation: { duration: 500, easing: 'easeInOutQuart' },
  plugins: { legend: LEG, tooltip: TIP },
}

export const BUCKET_COLORS = {
  equities: '#00d4ff',
  gold: '#ffd94a',
  crypto: '#a066ff',
  savings: '#00e87a',
}

export const BUCKET_META = {
  equities: { label: 'Actions',  emoji: '📈', colorVar: 'var(--accent)' },
  gold:     { label: 'Or',       emoji: '🥇', colorVar: 'var(--gold)'   },
  crypto:   { label: 'Crypto',   emoji: '₿',  colorVar: 'var(--purple)' },
  savings:  { label: 'Épargne',  emoji: '🏦', colorVar: 'var(--green)'  },
}

export const BUCKET_ORDER = ['equities', 'gold', 'crypto', 'savings']

export const CATEGORY_COLORS = [
  '#00d4ff', '#ffd94a', '#a066ff', '#00e87a', '#ff8c42',
  '#ff4466', '#40e0d0', '#ff6b9d', '#c0ff3e', '#6ec6ff',
]

export const CATEGORY_EMOJIS = {
  Restaurants: '🍽️',
  Courses: '🛒',
  Divertissement: '🎬',
  Transport: '🚗',
  Logement: '🏠',
  Santé: '💊',
  Vêtements: '👕',
  Voyages: '✈️',
  Abonnements: '📱',
  Investissement: '📈',
  Autre: '💡',
}

export const CATEGORIES = Object.keys(CATEGORY_EMOJIS)

export function fmtEur(n) {
  if (n === undefined || n === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export function fmtPct(n) {
  if (n === undefined || n === null || !isFinite(n)) return '—'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function fmtNum(n, decimals = 2) {
  if (n === undefined || n === null) return '—'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimals }).format(n)
}

export function getMonthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getLastMonthKey() {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(+y, +m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}
