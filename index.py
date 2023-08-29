import discord
import asyncio
import websockets
from config.keys import discordkey, channelId, alertId

intents = discord.Intents.default()
intents.typing = False
intents.presences = False
intents.message_content = True

client = discord.Client(intents=intents)

bt = '`'
chatbuffer = []
settings = {
    'kirkaiows': 'wss://chat.kirka.io',
    'discordMaxLength': 2000,
    'chatBufferMinimum': 6,
    'chatBufferTimeout': 2500,
    'kirkaWsReconnectTimeout': 2500,
}

@client.event
async def on_ready():
    print('discord connected.')
    global_channel = client.get_channel(channelId)
    alert_channel = client.get_channel(alertId)
    alert_words = ['nigg@', 'gecko', 'admin', 'fxck', 'fck', 'nude', 'dev', 'xip', 'bug', 'nibba', 'nibb@', 'irrvlo', 'scam', 'scamm', 'scammed', 'scamer', 'scammer']

    def discord_send_msg(content):
        asyncio.ensure_future(global_channel.send(content))

    def discord_send_alert(content):
        asyncio.ensure_future(alert_channel.send(content))

    def push_chat_buffer():
        if len(chatbuffer) >= settings['chatBufferMinimum']:
            push_chat_buffer_length = 0
            msg = ""
            for i in range(settings['chatBufferMinimum']):
                if i == 0:
                    push_chat_buffer_length = len(chatbuffer[i])
                    msg = chatbuffer.pop(0) + "\n"
                else:
                    if push_chat_buffer_length + len(chatbuffer[i]) <= settings['discordMaxLength']:
                        push_chat_buffer_length += len(chatbuffer[i])
                        msg += chatbuffer.pop(0) + "\n"
            discord_send_msg(msg)
        asyncio.get_event_loop().call_later(settings['chatBufferTimeout'] / 1000, push_chat_buffer)

    def check_message_banned_alert(the_array, the_string):
        return any(word in the_string for word in the_array)

    def beautify_msg(x):
        if x.type == discord.MessageType.default:
            roles = {
                'MODERATOR': '✅',
                'ADMIN': '🛡️',
                'OWNER': '🏠'
            }
            role_emoji = roles.get(x.author.role, '')
            chatbuffer.append(f'```<{role_emoji}{x.author.name}#{x.author.shortId}> {x.content}```')
            if check_message_banned_alert(alert_words, x.content):
                discord_send_alert(f'{x.author.name}#{x.author.shortId} said alert message: {bt}{bt}{bt}{x.content}{bt}{bt}{bt}')
        if x.type == discord.MessageType.bot:
            chatbuffer.append(f'```<🤖SERVER> {x.content}```')

    async def tunneler(kirka_object):
        if kirka_object.type == discord.MessageType.message:
            for message in reversed(kirka_object.messages):
                beautify_msg(message)
        else:
            beautify_msg(kirka_object)

    async def connect_ws():
        print('kirka connecting...')
        while True:
            try:
                async with websockets.connect(settings['kirkaiows']) as wskirka:
                    print('kirka connected.')
                    async for message in wskirka:
                        delivery = json.loads(message)
                        await tunneler(delivery)
            except Exception as e:
                print('kirka connection error:', e)
            await asyncio.sleep(settings['kirkaWsReconnectTimeout'] / 1000)

    asyncio.ensure_future(connect_ws())
    push_chat_buffer()

    print('discord connecting...')

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    # Your code for handling incoming messages from Discord can go here

client.run(discordkey)
