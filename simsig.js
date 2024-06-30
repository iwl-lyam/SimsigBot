import { Client } from '@stomp/stompjs';
import { TCPWrapper } from '@stomp/tcp-wrapper';
import {EventEmitter} from 'node:events'

const SignalLoop = new EventEmitter
export default SignalLoop

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
          SignalLoop.emit("signalChange", body)
          break
      }
    }
  last = body
}

client.activate();
