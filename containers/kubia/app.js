const http = require('http')
const os = require('os')

console.log('Kubia server starting...')

let requestCount = 0

const handler = (req, res) => {
  console.log(`Received request from from ${req.connection.remoteAddress}`)
  requestCount++
  if (requestCount > 5) {
    res.writeHead(500)
    res.end('I am not well. Please restart me!')
    return
  }
  res.writeHead(200)
  res.end(`You've hit ${os.hostname()} \n`)
}

const www = http.createServer(handler)
www.listen(8080)
