const WebSocket = require('ws');
const { encode, decode } = require("msgpack-lite");
const MessageParser = require('./messageParser')
const MessageBuilder = require('./messageBuilder')
const validationToken = require('./validationToken');
// const VersionManager = require('./VersionManager')
const Token = new validationToken();
const fetch = require('node-fetch');

let num;

async function getAhk () {
  var source = await(await fetch('https://api.sys32.dev/v2/source')).text();
  var ahk = parseInt(source.match(/\.exports=([\d\.]+)/)[1]);
  let num2 = 0xff & (ahk + 0);
  num = num2;
}

getAhk();

const req = require('./req.js')
async function genuuid(game){
  var source = await(await fetch('https://api.sys32.dev/v2/source')).text();
  var build = source.match(/\.exports='(\w+)'/)[1];
    var token = await Token.token_argument(),
    mm_params = new URLSearchParams(Object.entries({
        hostname: 'krunker.io',
        region: 'us-sv',
        game: game,
        validationToken: token,
        dataQuery: JSON.stringify({ v: build }),
    })),
    mm_failed = false,
    mm = await req('https://matchmaker.krunker.io/seek-game?' + mm_params).text().catch(err => mm_failed = err),
    errors = {
        GameFull: 'matchmaker.full2',
        InvalidGameId: 'matchmaker.invalid',
        NoServersMatchQuery: 'matchmaker.updating',
        NoAvailableServers : 'matchmaker.none',
    };

    if(!mm_failed) try{ 
        mm = JSON.parse(mm) 
    } catch(err){ 
        mm_failed = err 
    }

    if(mm.error) mm_failed = mm.error;

    if(errors[mm_failed]) console.warn('<Matchmaker error> ' + errors[mm_failed]), process.exit(0);
    else if(mm_failed) console.error('<Seek-game error>\n', mm_failed), process.exit(0);
    let connect_params = new URLSearchParams(Object.entries({
        gameId: mm.gameId,
        clientKey: mm.clientId,
    }))
    let wsval = 'wss://' + mm.host + '/ws?' + connect_params
    return wsval
}

class GameApi {
  constructor() {
    this.server = null;
    this.rankVar = 0.03;
    this.chalVar = 0.03;
    this.maxChal = 24;
    this.minChalLevel = 30;
    this.eloPer = 120;
    this.eloK = 32;
    this.msgIndexSequence = [7, 8];
    this.msgIndexSequencePosition = 0;
    this.msgIndex1 = 7;
    this.msgIndex2 = 8;
  }

  async Connect(id) {
    let uuid = await genuuid(id);
    console.log(uuid)
    this.server = new WebSocket(uuid, {
      perMessageDeflate: true,
      followRedirects: true,
      maxRedirects: 999999,
      protocolVersion: 13,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36 Edg/86.0.622.51',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Origin': 'https://krunker.io',
        'Connection': 'keep-alive, Upgrade',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Upgrade': 'websocket'
      },
    });
  }


  Disconnect() {
    this.server.close();
    this.server = null;
  }

  async GetGame(id) {
    await this.Connect(id);

    return new Promise((resolve, reject) => {
      this.server.on("message", (data) => {
        let decoded = decode(data);
        if(decoded[0] === 'pi'){
          this.send('po')
        } else if(decoded[0] === 'load'){
          this.send('load', null)
        } else if(decoded[0] === 'ready'){
          // this.send('a', 1, ['divinelemon', 'Joey12345', '6LdvBrQUAAAAAL6gtEpVNzii_3nQkbOyx912nvlm'], null)
          // this.send(['en', [1, 2482, [-1, -1], -1, -1, 2, 0, 1, 1, -1, -1, 1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1], 16, 18])
          let class_id = 1, spray_id = 0, challenge_mode = 0, skin_tone = 0, attachment = 0;
          // this.send('en', [class_id, spray_id, [-1,-1], -1, -1, 2, 0, challenge_mode, 1, -1, skin_tone, 1, attachment, -1, -1, 1, 0, -1, -1, -1, 0, -1], 16, 18);
        }
        console.log(decoded);
      });
    });
  }

  async send(id, ...data){    
    if (!num) return;
    
    var append = [0xf & (num >> 4), 0xf & num],
        encoded = encode([ id, ...data]),
        binary = new Uint8Array(encoded.length + 2);
    
    binary.set(append, binary.length - 2);
    binary.set(encoded, 0);
    
    return this.server.send(binary);
  }

  // send(data){
  //   // if (this.isDisconnected) {
  //   //     return;
  //   // }

  //   this.msgIndex1 += this.msgIndexSequence[this.msgIndexSequencePosition][0];
  //   if (this.msgIndex1 >= 16) {
  //       this.msgIndex1 -= 16;
  //   }

  //   this.msgIndex2 += this.msgIndexSequence[this.msgIndexSequencePosition][1];
  //   if (this.msgIndex2 >= 16) {
  //       this.msgIndex2 -= 16;
  //   }

  //   this.msgIndexSequencePosition++;
  //   if (this.msgIndexSequencePosition >= 16) {
  //       this.msgIndexSequencePosition = 0;
  //   }

  //   this.socket.send(Buffer.concat([encode(data), new Uint8Array([this.msgIndex1, this.msgIndex2])]));
  // }
}

module.exports = GameApi;

