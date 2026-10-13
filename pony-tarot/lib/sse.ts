export type SSEEvent = { event: string; data: string };

// Decode UTF-8 incrementally and keep events buffered across network chunks.
export async function* readSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<SSEEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let separator: RegExpExecArray | null;
      while ((separator = /\r\n\r\n|\n\n|\r\r/.exec(buffer))) {
        const block = buffer.slice(0, separator.index);
        buffer = buffer.slice(separator.index + separator[0].length);
        let event = 'message';
        const data: string[] = [];
        for (const line of block.split(/\r\n|\r|\n/)) {
          if (line.startsWith(':')) continue;
          const colon = line.indexOf(':');
          const field = colon < 0 ? line : line.slice(0, colon);
          const content = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
          if (field === 'event') event = content;
          if (field === 'data') data.push(content);
        }
        if (data.length) yield { event, data: data.join('\n') };
      }
      if (buffer.length > 1_000_000) throw new Error('流事件过大');
      if (done) { if (buffer.trim()) throw new Error('流事件未完整结束'); break; }
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export function sseEvent(event: string, value: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(value)}\n\n`;
}
