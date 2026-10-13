import { readSSE, sseEvent } from './sse.ts';
export const MODEL_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
export type AIResult = { text: string; model: string; createdAt: string; readerId?: string; readerName?: string; usage?: Record<string, number> };
type Options = { apiKey: string; model: string; readerId?: string; readerName?: string; messages: { role: string; content: string }[]; signal: AbortSignal; onComplete: (result: AIResult) => void; onFinish: () => void };

export function modelStream(options: Options, fetcher: typeof fetch = fetch): ReadableStream<Uint8Array> {
  const abort = new AbortController();
  const encoder = new TextEncoder();
  let closed = false;
  let reason = '生成已停止，已收到的内容未完成。';
  let idle: ReturnType<typeof setTimeout>;
  let total: ReturnType<typeof setTimeout>;
  let heartbeat: ReturnType<typeof setInterval>;
  const stop = () => abort.abort();
  return new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => { if (!closed) controller.enqueue(encoder.encode(sseEvent(event, data))); };
      const resetIdle = (ms: number) => { clearTimeout(idle); idle = setTimeout(() => { reason = '模型响应超时，已收到的内容未完成。'; abort.abort(); }, ms); };
      options.signal.addEventListener('abort', stop, { once: true });
      if (options.signal.aborted) abort.abort();
      resetIdle(45000);
      total = setTimeout(() => { reason = '生成超过两分钟，已收到的内容未完成。'; abort.abort(); }, 120000);
      heartbeat = setInterval(() => { if (!closed) controller.enqueue(encoder.encode(': keepalive\n\n')); }, 15000);
      try {
        const body: Record<string, unknown> = { model: options.model, messages: options.messages, max_tokens: 1500, temperature: .7, stream: true, stream_options: { include_usage: true } };
        if (options.model.toLowerCase() === 'glm-5.2') body.thinking = { type: 'disabled' };
        const response = await fetcher(MODEL_ENDPOINT, { method: 'POST', signal: abort.signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.apiKey}` }, body: JSON.stringify(body) });
        if (!response.ok || !response.body) {
          await response.body?.cancel();
          throw new Error(response.status === 401 || response.status === 403 ? 'Key 无效或没有模型权限，请检查标准 API 配置。' : response.status === 429 ? '模型额度不足或请求过于频繁，请稍后主动重试。' : `模型服务暂时不可用（${response.status}），本地解读仍可阅读。`);
        }
        let text = ''; let model = options.model; let finish = ''; let ended = false;
        let usage: Record<string, number> | undefined;
        for await (const event of readSSE(response.body)) {
          if (event.data === '[DONE]') { ended = true; break; }
          const chunk = JSON.parse(event.data);
          if (chunk.error) throw new Error('模型返回错误，请检查 Key、模型权限和额度。');
          resetIdle(30000);
          if (typeof chunk.model === 'string') model = chunk.model;
          if (chunk.usage && typeof chunk.usage === 'object') usage = chunk.usage;
          const choice = chunk.choices?.[0];
          if (choice?.finish_reason) finish = choice.finish_reason;
          const delta = choice?.delta?.content;
          if (typeof delta === 'string' && delta) {
            text += delta;
            if (text.length > 16000) throw new Error('输出过长，已收到的内容未完成。');
            send('delta', { text: delta });
          }
        }
        if (abort.signal.aborted) throw new Error(reason);
        if (!text.trim() || finish !== 'stop') throw new Error(finish === 'length' ? '输出达到长度上限，已收到的内容未完成。' : '模型未完整结束，已收到的内容未完成。');
        // A stop finish event is an explicit completion even if the provider omits [DONE].
        if (!ended && !finish) throw new Error('连接中断，解读未完成。');
        const result: AIResult = { text, model, createdAt: new Date().toISOString(), readerId: options.readerId, readerName: options.readerName, ...(usage ? { usage } : {}) };
        options.onComplete(result);
        send('done', result);
      } catch (error) {
        // Never expose upstream payloads or network exceptions that may contain credentials.
        const message = abort.signal.aborted ? reason : error instanceof Error && /^(Key |模型|输出|连接)/.test(error.message) ? error.message : '连接或流数据异常，已收到的内容未完成。本地解读仍可阅读。';
        send('error', { error: message });
      } finally {
        clearTimeout(idle); clearTimeout(total); clearInterval(heartbeat);
        options.signal.removeEventListener('abort', stop);
        options.onFinish();
        if (!closed) { closed = true; controller.close(); }
      }
    },
    cancel() { closed = true; abort.abort(); },
  });
}
