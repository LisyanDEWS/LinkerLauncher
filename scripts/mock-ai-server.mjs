import http from 'http';

const port = Number(process.env.MOCK_AI_PORT || 9099);

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url?.includes('/chat/completions')) {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const last = parsed.messages?.[parsed.messages.length - 1]?.content || '';
        const content = `MOCK_OK: ${typeof last === 'string' ? last.slice(0, 80) : 'binary'}`;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            id: 'mock-1',
            object: 'chat.completion',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          })
        );
      } catch (e) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: String(e) }));
      }
    });
    return;
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Mock AI server on :${port}`);
});
