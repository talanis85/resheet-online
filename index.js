const child_process = require('child_process')
const crypto = require('crypto')
// const process = require('process')
const express = require('express')
const fs = require('fs')
const app = express()
const port = 3000

app.set('view engine', 'pug')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/static', express.static('static'))

app.get('/', function (req, res) {
  res.render('index', { data: "" })
})

app.get('/:filename', function (req, res) {
  const filename = req.params.filename
  const data = fs.readFileSync(process.cwd() + "/sheets/" + filename, "utf8")
  res.render('index', { data: data })
})

app.get('/tutorial', function (req, res) {
  res.render('tutorial')
})

app.post('/save', function (req, res) {
  const data = req.body.data.replace(/\r\n/g, "\n")
  const hash = crypto.createHash('sha256')
  hash.update(data)
  const filename = hash.digest('hex')
  fs.writeFileSync(process.cwd() + "/sheets/" + filename, data)
  res.set('Content-Type', 'application/json')
  res.send({
    hash: filename
  })
})

app.post('/render', function (req, res) {
  const data = req.body.data.replace(/\r\n/g, "\n")
  const hash = crypto.createHash('sha256')
  hash.update(data)
  const filename = hash.digest('hex')
  const fullname = process.cwd() + "/rendered/" + filename
  try {
    fs.accessSync(fullname + ".pdf")
    res.sendFile(process.cwd() + "/rendered/" + filename + ".pdf")
  } catch (err) {
    const options = {
      input: data
    }
    const output = child_process.execSync("resheet | lilypond -o \"rendered/" + filename + "\" -", options)
    res.set('Content-Type', 'application/pdf')
    res.sendFile(process.cwd() + "/rendered/" + filename + ".pdf")
  }
})

app.listen(port, function () {
  console.log("Listening...")
})
