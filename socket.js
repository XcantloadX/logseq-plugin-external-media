let socket;
let callbacks = [];

function socket_connect() {
    socket = new WebSocket('ws://127.0.0.1:2233');
  
    socket.onopen = function() {
        console.log('websocket connected');
        socket_send_command('logseq_connect', null, {});
    };
  
    socket.onmessage = function(event) {
        console.log('received:', event.data);
        // messages.push(event.data);
        const obj = JSON.parse(event.data);
        if(!obj.success)
        {
            console.error(obj);
            logseq.App.showMsg('Error received from client: ' + obj.data.message);
            callbacks.pop();
            return;
        }
        callbacks.pop()(event.data);
    };
  
    socket.onclose = function(event) {
        console.log('websocket connection closed');
  
        // 断开连接时进行重连
        setTimeout(socket_connect, 2000); // 2秒后进行重连
    };
  
    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

function socket_send(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      console.error('WebSocket连接未建立或已关闭');
    }
}

function socket_send_command(command, match, data) {
    socket_send(JSON.stringify({
        command: command,
        match: match,
        data: data
    }));
}

function socket_receive_command(callback) {
    callbacks.push(function(rawMessage){
        callback(JSON.parse(rawMessage));
    });
}

// in seconds
function client_get_position(match, callback) {
    socket_send_command('get_position', match, {});
    socket_receive_command(function(message){
        callback(message.data.position);
    });
}
