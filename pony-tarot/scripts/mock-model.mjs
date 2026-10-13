// Only loaded by check-ai.mjs into an isolated test server; never part of runtime configuration.
const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async (url, options) => {
  if (String(url) !== 'https://open.bigmodel.cn/api/paas/v4/chat/completions') return originalFetch(url, options);
  calls++;
  const body = JSON.parse(options.body);
  const prompt = body.messages[1].content;
  if (prompt.includes('[RATE]')) return new Response('not exposed upstream body', { status: 429 });
  const encoder = new TextEncoder();
  const text = prompt.includes('[LONG]') ? Array.from({ length: 8 }, (_, i) => `第${i + 1}段模拟长解读：先整理眼前的想法，再挑出今天能完成的一件事。允许自己保留一点余地，不必一次解决所有问题。把行动分成小步骤，做完后回头看看感受是否有所变化。`).join('\n\n') : '这是一份模拟流式解读：先照顾当前感受，再选择今天可以做到的小行动。';
  const events = [': heartbeat\r\n\r\n', 'data: ' + JSON.stringify({ model: 'test-model', choices: [{ delta: { reasoning_content: '不应展示的思考' } }] }) + '\r\n\r\n', ...[text.slice(0, 9), text.slice(9)].map(content => 'data: ' + JSON.stringify({ choices: [{ delta: { content } }] }) + '\r\n\r\n'), 'data: ' + JSON.stringify({ choices: [{ delta: {}, finish_reason: prompt.includes('[INCOMPLETE]') ? 'length' : 'stop' }] }) + '\r\n\r\n', 'data: ' + JSON.stringify({ choices: [], usage: { prompt_tokens: 30, completion_tokens: 20, total_tokens: 50 + calls } }) + '\r\n\r\n', 'data: [DONE]\r\n\r\n'];
  let timer;
  let stopped = false;
  return new Response(new ReadableStream({
    start(controller) {
      const bytes = encoder.encode(events.join(''));
      let offset = 0;
      const abort = () => { if (!stopped) { stopped = true; clearInterval(timer); controller.error(new Error('aborted')); } };
      options.signal.addEventListener('abort', abort, { once: true });
      if (options.signal.aborted) { abort(); return; }
      timer = setInterval(() => {
        if (stopped) return;
        // Deliberately split UTF-8 Chinese characters and SSE separators across chunks.
        if (prompt.includes('[SLOW]') && offset >= bytes.length / 2) return;
        if (offset >= bytes.length) { stopped = true; clearInterval(timer); options.signal.removeEventListener('abort', abort); controller.close(); }
        else { controller.enqueue(bytes.slice(offset, offset + 7)); offset += 7; }
      }, 2);
    },
    cancel() { stopped = true; clearInterval(timer); },
  }), { headers: { 'Content-Type': 'text/event-stream' } });
};
