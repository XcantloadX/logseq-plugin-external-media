const icon = `<svg fill='currentColor' viewBox='0 0 20 20' class='h-5 w-5'><path clip-rule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' fill-rule='evenodd'></path></svg>`


/**
 * entry
 */
function main () {
    logseq.Editor.registerSlashCommand(
        'external media timestamp',
        insertTimestamp
    );
    
    logseq.App.onMacroRendererSlotted(timestampRenderer);
    socket_connect();
    console.log('external-media loaded');
}

async function insertTimestamp(screenshot=false) {
    client_get_position('.', function(timestamp){
        logseq.Editor.insertAtEditingCursor(`{{renderer :external-media-timestamp, ${timestamp}}}`)
    });
}

async function timestampRenderer({ slot, payload: { arguments: args } }) {
    if (args.length < 1)
        return;
    const type = args[0].trim();
    if (type !== ':external-media-timestamp')
        return;
  
    const time = args[1]?.trim();
    const url = args[2]?.trim() ? args[2]?.trim() : '';
    if (!time)
        return;
  
    const timeStr = formatTime(time);
    logseq.provideUI({
      key: `media-ts-${slot}`,
      slot,
      template: `<a class='kef-media-ts-ts svg-small' data-time='${time}' data-url='${url}' data-slot='${slot}' data-on-click='goto'>${icon}${timeStr}</a>`,
      reset: true,
    });    
}

function isURL(str) {
    const urlRegex = /^(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-zA-Z]{2,}(?:\/\S*)?$/;
    return urlRegex.test(str);
}

async function fetchHTMLTitle(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();

        // 使用正则表达式从 HTML 中提取标题
        const titleRegex = /<title>(.*?)<\/title>/i;
        const matches = html.match(titleRegex);
        if (matches && matches.length >= 2) {
        const title = matches[1];
        return title;
        } else {
        throw new Error('未找到标题');
        }
    } catch (error) {
        console.error('获取 HTML 标题时发生错误:', error);
        throw error;
    }
}

function formatTime(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let remainingSeconds = Math.floor(seconds % 60);
  
    let formattedTime = '';
  
    if (hours > 0) {
      formattedTime += hours.toString().padStart(2, '0') + ':';
    }
  
    formattedTime += minutes.toString().padStart(2, '0') + ':';
    formattedTime += remainingSeconds.toString().padStart(2, '0');
  
    return formattedTime;
}
  

const model = {
    async goto(args) {
        const time = args.dataset.time;
        const url = args.dataset.url ? args.dataset.url : '.';
        socket_send_command('set_position', url, { position: time });
        socket_send_command('play', url, {});
    }
}

// bootstrap
logseq.ready(model, main).catch(console.error)