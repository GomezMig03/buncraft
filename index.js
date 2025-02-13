console.log("Server is waiting for players...");

Bun.listen({
  hostname: "127.0.0.1",
  port: 8080,
  socket: {
    data(socket, data) {
      let buffer = Buffer.from(data);
      let byteArray = Array.from(buffer);
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

  // TODO: Make a proper VarInt implementation as this assumes that the client will always send two bytes for protocol version
  let protocolVersion = byteArray[2] & 0x7f;
  protocolVersion |= (byteArray[3] & 0x7f) << 7;

  const stringLength = byteArray[4];

  const ip = [];

  for (let i = 5; i < stringLength + 5; i++) {
    ip.push(byteArray[i]);
  }

  const ipBuffer = Buffer.from(ip);
  const ipString = ipBuffer.toString("utf-8");

  // Convert the two port bytes int a 16-bit uint
  // TODO: Make an ushort implementation
  const portString =
    (byteArray[stringLength + 5] << 8) | byteArray[stringLength + 6];

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
