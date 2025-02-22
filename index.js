import { asVarInt, asUshort, toVarInt } from "./utils/types"
import { statusResponse } from "./utils/responses"

console.log("Server is waiting for players...")

let hand

Bun.listen({
  hostname: "127.0.0.1",
  port: 8080,
  socket: {
    data(socket, data) {
      let buffer = Buffer.from(data)
      const byteArray = Array.from(buffer)

      console.log(byteArray)

      hand = convertHandshake(byteArray)
      socket.write(hand.response())
    },
    open(socket) {
      console.log(`socket opened`)
    },
    close(socket) {
      console.log(`socket closed`)
    },
    error(socket, error) {
      console.log(`Error in socket: ${JSON.stringify(error)}`)
    },
  },
})

const convertHandshake = (byteArray) => {
  const size = byteArray[0]
  const id = byteArray[1]
  if (size < 12 && id != 0) {
    return
  }

  const protocolVersion = asVarInt([byteArray[2], byteArray[3]])

  const stringLength = byteArray[4]

  const ip = []

  for (let i = 5; i < stringLength + 5; i++) {
    ip.push(byteArray[i])
  }

  const ipBuffer = Buffer.from(ip)
  const ipString = ipBuffer.toString("utf-8")

  const portString = asUshort([
    byteArray[stringLength + 5],
    byteArray[stringLength + 6],
  ])

  const nextState = byteArray[byteArray.length - 1]

  return new Handshake(
    size,
    id,
    protocolVersion,
    stringLength,
    ipString,
    portString,
    nextState,
  )
}

class Handshake {
  constructor(size, id, protocolVersion, stringLength, ip, port, nextState) {
    this.size = size
    this.id = id
    this.protocolVersion = protocolVersion
    this.stringLength = stringLength
    this.ip = ip
    this.port = port
    switch (nextState) {
      case 1:
        this.nextState = "status"
        break
      case 2:
        this.nextState = "login"
        break
      default:
        this.nextState = "error"
        break
    }
  }

  show() {
    console.log(
      `Size of package: ${this.size}\n` +
        `Package ID: ${this.id}\n` +
        `Protocol Version: ${this.protocolVersion}\n` +
        //`Length of string: ${this.stringLength}\n` +
        `Server + port: ${this.ip}:${this.port}\n` +
        `Next State: ${this.nextState}\n`,
    )
  }

  response() {
    return statusResponse("1.21.4", 769, 100, 0, "Minecraft server written in js!", "")
  }
}
