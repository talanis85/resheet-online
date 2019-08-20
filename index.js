const child_process = require('child_process')
const crypto = require('crypto')
// const process = require('process')
const express = require('express')
const fs = require('fs')
const app = express()
const port = 3000

try {
  fs.mkdirSync('rendered')
} catch (e) {
}

try {
  fs.mkdirSync('sheets')
} catch (e) {
}

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
  const filename = crypto.createHash('sha256').update(data).digest('hex')

  fs.writeFileSync(process.cwd() + "/sheets/" + filename, data)

  res.set('Content-Type', 'application/json')
  res.send({
    hash: filename
  })
})

app.post('/render', function (req, res) {
  const data = req.body.data.replace(/\r\n/g, "\n")
  const filename = crypto.createHash('sha256').update(data).digest('hex')
  const fullname = process.cwd() + "/rendered/" + filename

  try {
    fs.accessSync(fullname + ".pdf")
    res.sendFile(process.cwd() + "/rendered/" + filename + ".pdf")
  } catch (err) {
    console.debug(`${fullname}.pdf not found. Trying to build it.`)

    console.debug("Running resheet")
    const procResheet = child_process.exec('resheet')

    var stderrResheet = ""
    var stdoutResheet = ""
    procResheet.stderr.on('data', function (data) { stderrResheet += data })
    procResheet.stdout.on('data', function (data) { stdoutResheet += data })

    procResheet.on('exit', function (code, signal) {
      console.debug("Resheet completed")
      if (code == 0) {
        console.debug("Running lilypond")
        const procLilypond = child_process.exec(`lilypond -o "rendered/${filename}" -`)

        var stderrLilypond = ""
        var stdoutLilypond = ""
        procLilypond.stderr.on('data', function (data) { stderrLilypond += data })
        procLilypond.stdout.on('data', function (data) { stdoutLilypond += data })

        procLilypond.on('exit', function (code, signal) {
          console.debug("Lilypond completed")
          if (code == 0) {
            res.set('Content-Type', 'application/pdf')
            res.sendFile(process.cwd() + "/rendered/" + filename + ".pdf")
          } else {
            res.render('lilypond_error', { error: stderrLilypond })
          }
        })

        procLilypond.stdin.write(stdoutResheet)
        procLilypond.stdin.end()
      } else {
        const match = stderrResheet.match(/line (?<line>\d+), column (?<column>\d+)/)
        if (match == null) {
          res.render('unknown_error', {
            error: stderrResheet
          })
        } else {
          const lineNumber = parseInt(match.groups.line)
          const columnNumber = parseInt(match.groups.column)
          const lines = data.split('\n')
          const preCode = lines.slice(0, lineNumber-1).join('\n')
          const offendingLine = lines[lineNumber-1]
          const postCode = lines.slice(lineNumber+1).join('\n')
          res.render('resheet_error', {
            line: lineNumber,
            column: columnNumber,
            preCode: preCode,
            offendingLine: offendingLine,
            postCode: postCode,
            error: stderrResheet
          })
        }
      }
    })

    procResheet.stdin.write(data)
    procResheet.stdin.end()
  }
})

app.listen(port, function () {
  console.log("Listening...")
})
