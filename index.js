import SignalLoop from './simsig.js'
import dotenv from 'dotenv'
dotenv.config({path: "./secrets.env"})
import {WebSocket} from 'ws'
import {gatewayLogger} from "./logger.js";
import fetch from "node-fetch"

export default function bot() {
  const conLink  = "wss://gateway.discord.gg/?v=10&encoding=json"
  const con = new WebSocket(conLink)
  con.on('open', () => {
      gatewayLogger.info("Gateway connection open")
  })

  let hbint = 0
  let ident = false
  con.on('close', (code, reason) => {
      gatewayLogger.error(`${code} ${reason}`)
      bot()
  })
  con.on('message', message => {
      message = JSON.parse(message)

      switch(message.op) {
          case 10:
              gatewayLogger.verbose("Hello received")
              hbint = message.d.heartbeat_interval
              con.send(JSON.stringify({op: 1,s:null,t:null,d:{}}))
              gatewayLogger.info("Heartbeat sent")
              break
          case 11:
              gatewayLogger.info("Heartbeat acknowledged")
              setTimeout(() => {
                  con.send(JSON.stringify({op: 1,s:null,t:null,d:{}}))
                  gatewayLogger.info("Heartbeat sent")
              }, hbint)
              gatewayLogger.verbose(`Time until next heartbeat: ${hbint}`)
              gatewayLogger.verbose(`Identifying: ${!ident}`)

              if (!ident) {
                  con.send(JSON.stringify({op: 2, d: {
                      token: process.env.TOKEN,
                      intents: 0,
                      properties: {
                          os: "darwin",
                          browser: "who knows",
                          device: "all change"
                      }
                  }}))

                  gatewayLogger.verbose("Identify sent")
                  ident = true;
              }

              break
          case 1:
              gatewayLogger.info("Heartbeat received")
              con.send(JSON.stringify({op: 1,s:null,t:null,d:{}}))
              gatewayLogger.info("Heartbeat sent")
              break
          case 0:
              gatewayLogger.debug(`Event: ${message.t}`)
              if (message.t === "INTERACTION_CREATE") {
                  // do later
              } 
              break

          default:
              gatewayLogger.error(`Unknown gateway opcode sent: ${message.op}`)
              throw new Error("Unknown gateway opcode sent")
      }

  })

  SignalLoop.on("signalChange", body => {
    gatewayLogger.error("Signal change found")
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
    // send embed in 1256877186523332628
    fetch(`https://discord.com/api/v10/channels/1256877186523332628/messages`, {
      method: "POST",
      headers: {Authorization: "Bot "+process.env.TOKEN, "Content-Type": "application/json"},
      body: JSON.stringify({
        content: `Signal ${body.obj_id} has changed to aspect ${aspect} in scenario ${body.area_id}!`
      })
    }).then(res => res.text()).then(console.log)
  })
}
bot()