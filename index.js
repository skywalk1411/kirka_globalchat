const { Client } = require("discord.js");
const websocket = require("websocket");
const { discordkey, channelId, alertId } = require("./config/keys");
const client = new Client({
  intents: [ "513" ],
});
let chatbuffer = [];
const settings = {
  kirkaiows : "wss://chat.kirka.io",
  discordMaxLength : 2000,
  chatBufferMinimum : 6,
  chatBufferTimeout : 2500,
  KirkaWsReconnectTimeout: 2500,
}
client.once("ready", () => {
  console.log("discord connected.");
  const globalChannel = client.channels.cache.get(channelId);
  const alertChannel = client.channels.cache.get(alertId);
  const alertWords = ['nigg@','gecko','admin','fxck','fck','nude','dev','xip','bug','nibba','nibb@'];
  const discordSendMsg = (content) => {
    globalChannel.send(content);
  };
  const discordSendAlert = (content) => {
    alertChannel.send(content);
  };
  const pushChatBuffer = () => {
    if (chatbuffer.length >= settings.chatBufferMinimum) {
      let pushChatBufferLength = 0;
      let msg = "";
      for (let i = 0; i < settings.chatBufferMinimum; i++) {
        if (i === 0) {
          pushChatBufferLength = chatbuffer[i].length;
          msg = chatbuffer.shift() + "\n";
        } else {
          if (pushChatBufferLength + chatbuffer[i]?.length <= settings.discordMaxLength) {
            pushChatBufferLength = pushChatBufferLength + chatbuffer[i]?.length;
            msg = msg + chatbuffer.shift() + "\n";
          }
        }
      }
      discordSendMsg(msg);
    }
    setTimeout(pushChatBuffer, settings.chatBufferTimeout);
  };
  const checkMessageBannedAlert = (thearray, thestring) => {
    return new RegExp(`\\b(${thearray.join('|')})\\b`).test(thestring);
  };
  const beautifyMsg = (x) => {
    if (x.type === 2) {
      chatbuffer.push(
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
      if (x?.user != null && checkMessageBannedAlert(alertWords,x?.message)) {
        discordSendAlert(`${x?.user?.name}#${x?.user?.shortId} said alert message: ${x?.message}`);
      }
    }
    if (x?.type === 13) {
      chatbuffer.push(
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
        wskirkatimer = setInterval(connectws, settings.KirkaWsReconnectTimeout);
      });
      connection.on("message", function (message) {
        let delivery = JSON.parse(message.utf8Data);
        tunneler(delivery);
      });
      pushChatBuffer();
    });
    wskirka.connect(settings.kirkaiows, null);
  };
  connectws();
});
console.log("discord connecting...");
client.login(discordkey);
