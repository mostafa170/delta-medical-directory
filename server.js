import express from 'express'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001
const DATA_FILE = join(__dirname, 'favorites.json')

app.use(express.json({ limit: '2mb' }))

function read() {
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf8')) }
  catch { return [] }
}

function write(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

app.get('/api/favorites', (_, res) => {
  res.json(read())
})

app.post('/api/favorites/:id', (req, res) => {
  const favs = read()
  if (!favs.some(f => f._id === req.params.id)) {
    favs.push(req.body)
    write(favs)
  }
  res.json({ ok: true })
})

app.delete('/api/favorites/:id', (req, res) => {
  write(read().filter(f => f._id !== req.params.id))
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Favorites API running → http://localhost:${PORT}`)
})
