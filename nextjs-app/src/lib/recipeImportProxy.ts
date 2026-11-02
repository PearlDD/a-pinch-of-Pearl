import { createServer } from 'node:http';
import { connect, type Socket } from 'node:net';
import { lookup } from 'node:dns/promises';
import { isPublicAddress, validateSourceUrl } from './recipeImportFetch';

// A local CONNECT proxy preserves Chromium's own TLS, cookies and redirects,
// while resolving and pinning every destination outside the browser.
export async function createPublicBrowserProxy() {
  const sockets = new Set<Socket>();
  let connections = 0;
  let bytes = 0;
  const server = createServer((_req, res) => { res.writeHead(403); res.end(); });
  server.on('connection', socket => { sockets.add(socket); socket.on('error', () => {}); socket.on('close', () => sockets.delete(socket)); });
  server.on('connect', async (req, client, head) => {
    try {
      if (++connections > 150) throw new Error('Connection limit');
      const url = validateSourceUrl(`https://${req.url}`);
      const answers = await lookup(url.hostname.replace(/^\[|\]$/g, ''), { all: true });
      if (!answers.length || answers.some(answer => !isPublicAddress(answer.address))) throw new Error('Non-public destination');
      if (client.destroyed) return;
      const upstream = connect({ host: answers[0].address, family: answers[0].family, port: 443 });
      sockets.add(upstream);
      upstream.setTimeout(15000, () => upstream.destroy());
      upstream.on('close', () => { sockets.delete(upstream); client.destroy(); });
      upstream.on('error', () => client.destroy());
      client.on('error', () => upstream.destroy());
      client.on('close', () => upstream.destroy());
      const limit = (chunk: Buffer) => { bytes += chunk.length; if (bytes > 45 * 1024 * 1024) { upstream.destroy(); client.destroy(); } };
      upstream.on('data', limit);
      client.on('data', limit);
      upstream.on('connect', () => {
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length) upstream.write(head);
        client.pipe(upstream); upstream.pipe(client);
      });
    } catch { client.destroy(); }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Browser proxy unavailable');
  return {
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>(resolve => server.close(() => resolve()));
    },
  };
}
