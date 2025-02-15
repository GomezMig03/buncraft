import { toVarInt, toUshort } from "./utils/types";

console.log("Server is waiting for players...");

Bun.listen({
  hostname: "127.0.0.1",
  port: 8080,
  socket: {
    data(socket, data) {
      let buffer = Buffer.from(data);
      const byteArray = Array.from(buffer);
      console.log(byteArray);

      const hand = convertHandshake(byteArray);
      hand.show();
    },
    open(socket) {
      console.log(`${socket} socket opened`);
    },
    close(socket) {
      console.log(`${socket} close`);
    },
    error(socket, error) {
      console.log(`${socket} Error in socket: ${JSON.stringify(error)}`);
    },
  },
});

const convertHandshake = (byteArray) => {
  const size = byteArray[0];
  const id = byteArray[1];
  if (size < 12 && id != 0) {
    return;
  }

  const protocolVersion = toVarInt([byteArray[2], byteArray[3]]);

  const stringLength = byteArray[4];

  const ip = [];

  for (let i = 5; i < stringLength + 5; i++) {
    ip.push(byteArray[i]);
  }

  const ipBuffer = Buffer.from(ip);
  const ipString = ipBuffer.toString("utf-8");

  const portString = toUshort([
    byteArray[stringLength + 5],
    byteArray[stringLength + 6],
  ]);

  const nextState = byteArray[byteArray.length - 1];

  return new Handshake(
    size,
    id,
    protocolVersion,
    stringLength,
    ipString,
    portString,
    nextState,
  );
};

class Handshake {
  constructor(size, id, protocolVersion, stringLength, ip, port, nextState) {
    this.size = size;
    this.id = id;
    this.protocolVersion = protocolVersion;
    this.stringLength = stringLength;
    this.ip = ip;
    this.port = port;
    switch (nextState) {
      case 1:
        this.nextState = "status";
        break;
      case 2:
        this.nextState = "login";
        break;
      default:
        this.nextState = "error";
        break;
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
    );
  }
}
