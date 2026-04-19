const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3001

const DATA_DIR      = path.join(__dirname, '../data')
const PORTFOLIO_FILE = path.join(DATA_DIR, 'portfolio.json')
const EXPENSES_FILE  = path.join(DATA_DIR, 'expenses.json')
const PORTFOLIO_SEED = path.join(DATA_DIR, 'portfolio.seed.json')
const EXPENSES_SEED  = path.join(DATA_DIR, 'expenses.seed.json')

// Auto-create data files from seeds on first run
if (!fs.existsSync(PORTFOLIO_FILE)) {
  fs.copyFileSync(PORTFOLIO_SEED, PORTFOLIO_FILE)
  console.log('Created portfolio.json from seed')
}
if (!fs.existsSync(EXPENSES_FILE)) {
  fs.copyFileSync(EXPENSES_SEED, EXPENSES_FILE)
  console.log('Created expenses.json from seed')
}

app.use(cors())
app.use(express.json())

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// Portfolio routes
app.get('/api/portfolio', (req, res) => {
  res.json(readJSON(PORTFOLIO_FILE))
})

app.put('/api/portfolio', (req, res) => {
  const data = req.body
  writeJSON(PORTFOLIO_FILE, data)
  res.json({ ok: true })
})

app.post('/api/portfolio/positions', (req, res) => {
  const portfolio = readJSON(PORTFOLIO_FILE)
  const position = { ...req.body, id: Date.now().toString() }
  portfolio.positions.push(position)
  writeJSON(PORTFOLIO_FILE, portfolio)
  res.json(position)
})

app.put('/api/portfolio/positions/:id', (req, res) => {
  const portfolio = readJSON(PORTFOLIO_FILE)
  const idx = portfolio.positions.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  portfolio.positions[idx] = { ...portfolio.positions[idx], ...req.body }
  writeJSON(PORTFOLIO_FILE, portfolio)
  res.json(portfolio.positions[idx])
})

app.delete('/api/portfolio/positions/:id', (req, res) => {
  const portfolio = readJSON(PORTFOLIO_FILE)
  portfolio.positions = portfolio.positions.filter(p => p.id !== req.params.id)
  writeJSON(PORTFOLIO_FILE, portfolio)
  res.json({ ok: true })
})

app.post('/api/portfolio/snapshots', (req, res) => {
  const portfolio = readJSON(PORTFOLIO_FILE)
  const snapshot = req.body
  const existingIdx = portfolio.snapshots.findIndex(s => s.date === snapshot.date)
  if (existingIdx >= 0) {
    portfolio.snapshots[existingIdx] = snapshot
  } else {
    portfolio.snapshots.push(snapshot)
  }
  portfolio.snapshots.sort((a, b) => a.date.localeCompare(b.date))
  writeJSON(PORTFOLIO_FILE, portfolio)
  res.json({ ok: true })
})

app.delete('/api/portfolio/snapshots/:date', (req, res) => {
  const portfolio = readJSON(PORTFOLIO_FILE)
  portfolio.snapshots = portfolio.snapshots.filter(s => s.date !== req.params.date)
  writeJSON(PORTFOLIO_FILE, portfolio)
  res.json({ ok: true })
})

app.put('/api/portfolio/income', (req, res) => {
  const portfolio = readJSON(PORTFOLIO_FILE)
  portfolio.income = req.body.income
  writeJSON(PORTFOLIO_FILE, portfolio)
  res.json({ ok: true })
})

// Expenses routes
app.get('/api/expenses', (req, res) => {
  res.json(readJSON(EXPENSES_FILE))
})

app.post('/api/expenses/entries', (req, res) => {
  const expenses = readJSON(EXPENSES_FILE)
  const entry = {
    id: Date.now().toString(),
    amount: req.body.amount,
    date: req.body.date,
    category: req.body.category,
    note: req.body.note || '',
  }
  expenses.entries.push(entry)
  writeJSON(EXPENSES_FILE, expenses)
  res.json(entry)
})

app.delete('/api/expenses/entries/:id', (req, res) => {
  const expenses = readJSON(EXPENSES_FILE)
  expenses.entries = expenses.entries.filter(e => e.id !== req.params.id)
  writeJSON(EXPENSES_FILE, expenses)
  res.json({ ok: true })
})

app.put('/api/expenses/budgets', (req, res) => {
  const expenses = readJSON(EXPENSES_FILE)
  expenses.budgets = req.body.budgets
  writeJSON(EXPENSES_FILE, expenses)
  res.json({ ok: true })
})

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
