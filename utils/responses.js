import { toVarInt, asVarInt } from "./types"

export const statusResponse = (version, protocolV, maxPlayers, onPlayers, motd, favicon) => {
  const res = {
    "version": { 
      "name": version,
      "protocol": protocolV
    },
    "players": {
      "max": maxPlayers,
      "online": onPlayers,
      "sample" : []
    },
    "description": motd,
  }

  const json = JSON.stringify(res)
  const bytes = Buffer.from(json)

  console.log(JSON.parse(bytes.toString()))

 return Buffer.concat([toVarInt(bytes.length), toVarInt(0x00), bytes])
}
