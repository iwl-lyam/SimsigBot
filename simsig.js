import { Client } from '@stomp/stompjs';
import { TCPWrapper } from '@stomp/tcp-wrapper';
import {EventEmitter} from 'node:events'

export default SignalLoop = new EventEmitter

const client = new Client({
  // hostname (or ip addess) and port number of the STOMP broker
  webSocketFactory: () => new TCPWrapper('80.193.196.5', 51515),
  heartbeatOutgoing: 20000,
  heartbeatIncoming: 20000,
  // debug: console.log,
  onConnect: () => {
    client.subscribe('/topic/TD_ALL_SIG_AREA', TD_ALL_SIG_AREA);
  },
});

const TD_ALL_SIG_AREA = msg => {
  let last = {}
  let body = JSON.parse(msg.body)
    if (Object.hasOwn(body,"SG_MSG")) {
      body = body.SG_MSG
      if (body.obj_id === last.obj_id) return
      switch (body.obj_type) {
        case "signal":
          console.log("Area: "+body.area_id)
          console.log("Signal number "+body.obj_id)
          let aspect = ""
          switch (parseInt(body.aspect)) {
            case 0:
              aspect = "red"
              break
            case 1:
              aspect = "shunt"
              break
            case 2:
              aspect = "yellow"
              break
            case 3:
              aspect = "flashing yellow??"
              break
            case 4:
              aspect = "double yellow"
              break
            case 5:
              aspect = "flashing double yellow?? wtf??"
              break
            case 6:
              aspect = "green"
              break
            default:
              aspect = "fuck you"
              break
          }
          console.log("Currently showing "+aspect)
          console.log(body)
          SignalLoop.emit("signalChange", body)
          break
      }
    }
  last = body
}

client.activate();
