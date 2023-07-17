import json
import asyncio
import websockets
from datetime import datetime

# 用于存储已连接的客户端
clients = []
logseq_client = None


async def handle_client(websocket, path):
    global logseq_client

    # 接收客户端消息
    async for message in websocket:
        print(f"[{websocket.remote_address}]: {message}")

        # 解析消息
        try:
            data = json.loads(message)
            command = data.get("command")

            # 处理不同的命令
            if command == "client_connect":
                clients.append(websocket)
                print(f"Client connected: {websocket.remote_address}")

            elif command == "logseq_connect":
                if logseq_client is not None:
                    await logseq_client.close()
                
                logseq_client = websocket
                print(f"Logseq client connected: {websocket.remote_address}")

            elif command == 'reply':
                # 转发消息给 Logseq 客户端
                if logseq_client is not None:
                    print('sending to', logseq_client)
                    await logseq_client.send(message)
            else:
                for client in clients:
                    try:
                        await client.send(message)
                    except:
                        pass

        except json.JSONDecodeError:
            print("[Error] Invalid message format")



start_server = websockets.serve(handle_client, "localhost", 2233)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
