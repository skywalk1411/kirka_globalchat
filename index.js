const { Client } = require("discord.js");
const websocket = require("websocket");
const { discordkey, channelId, alertId } = require("./config/keys");
const kirkaiows = "wss://chat.kirka.io";
const client = new Client({
  intents: [
    "513",
  ],
});
let chat = [];
client.once("ready", () => {
  console.log("discord connected.");
  const channel = client.channels.cache.get(channelId);
  const alert = client.channels.cache.get(alertId);
  const banned = ['nigg@','gecko','admin','fxck','fck','nude','dev','xip','bug','nibba','nibb@'];
  const discordSendMsg = (content) => {
    channel.send(content);
  };
  const discordSendAlert = (content) => {
    alert.send(content);
  };
  const pushChat = () => {
    if (chat.length >= 6) {
      let pushChatLength = 0;
      let msg = "";
      for (let i = 0; i < 6; i++) {
        if (i === 0) {
          pushChatLength = chat[i].length;
          msg = chat.shift() + "\n";
        } else {
          if (pushChatLength + chat[i]?.length <= 2000) {
            pushChatLength = pushChatLength + chat[i]?.length;
            msg = msg + chat.shift() + "\n";
          }
        }
      }
      discordSendMsg(msg);
    }
    setTimeout(pushChat, 2500);
  };
  const checkArray2=(thearray, thestring)=> {
    return new RegExp(`\\b(${thearray.join('|')})\\b`).test(thestring);
  };
  const beautifyMsg = (x) => {
    if (x.type === 2) {
      chat.push(
        `\`\`\`<${
          x?.user?.role === "MODERATOR"
            ? "✅"
            : x?.user?.role === "ADMIN"
            ? "🛡️"
            : x?.user.role === "OWNER"
            ? "🏠"
            : ""
        }${x?.user?.name}#${x?.user?.shortId}> ${
          x?.message
        }\`\`\``
      );
      if (x?.user != null && checkArray2(banned,x?.message)) {
        discordSendAlert(`${x?.user?.name}#${x?.user?.shortId} said alert message: ${x?.message}`);
      }
    }
    if (x?.type === 13) {
      chat.push(
        `\`\`\`<🤖SERVER> ${x?.message}\`\`\``
      );
    }
  };
  const tunneler = (kirkaObject) => {
    if (kirkaObject.type === 3) {
      for (let i = kirkaObject?.messages?.length - 1; i > -1; i--) {
        beautifyMsg(kirkaObject?.messages[i]);
      }
    }
    if (kirkaObject?.type != 3) {
      beautifyMsg(kirkaObject);
    }
  };
  let wskirka, wskirkatimer;
  const connectws = () => {
    wskirka = null;
    console.log("kirka connecting...");
    wskirka = new websocket.client();
    wskirka.on("connectFailed", function (err) {
      console.log("kirka connect failed");
    });
    wskirka.on("connect", function (connection) {
      clearInterval(wskirkatimer);
      console.log("kirka connected.");
      connection.on("error", function (err) {
        console.log("kirka error", err);
      });
      connection.on("close", function (err) {
        console.log("kirka connection close", err);
        connection.close();
        wskirkatimer = setInterval(connectws, 2500);
      });
      connection.on("message", function (message) {
        let delivery = JSON.parse(message.utf8Data);
        tunneler(delivery);
      });
      pushChat();
    });
    wskirka.connect(kirkaiows, null);
  };
  connectws();
});
console.log("discord connecting...");
client.login(discordkey);
