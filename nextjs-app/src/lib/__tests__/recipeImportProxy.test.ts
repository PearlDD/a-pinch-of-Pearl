/** @jest-environment node */
import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import { lookup } from 'node:dns/promises';
import { createPublicBrowserProxy } from '../recipeImportProxy';

jest.mock('node:http', () => ({ createServer: jest.fn() }));
jest.mock('node:net', () => ({ connect: jest.fn() }));
jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

function socket() { return Object.assign(new EventEmitter(), { destroyed: false, destroy: jest.fn(), write: jest.fn(), pipe: jest.fn(), setTimeout: jest.fn() }); }
describe('browser proxy destination guard', () => {
  let server: ReturnType<typeof makeServer>;
  function makeServer() { return Object.assign(new EventEmitter(), { listen: jest.fn((_port, _host, done) => done()), address: () => ({ port: 12345 }), close: jest.fn(done => done()) }); }
  beforeEach(() => {
    jest.resetAllMocks(); server = makeServer(); (createServer as jest.Mock).mockReturnValue(server);
  });
  it('rejects private DNS destinations without opening a TCP connection', async () => {
    (lookup as jest.Mock).mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);
    const proxy = await createPublicBrowserProxy();
    const client = socket();
    await server.listeners('connect')[0]({ url: 'metadata.example:443' }, client, Buffer.alloc(0));
    expect(client.destroy).toHaveBeenCalled();
    expect(connect).not.toHaveBeenCalled();
    await proxy.close();
  });
  it('rejects custom ports and credentials before DNS lookup', async () => {
    const proxy = await createPublicBrowserProxy();
    await server.listeners('connect')[0]({ url: 'example.com:8080' }, socket(), Buffer.alloc(0));
    await server.listeners('connect')[0]({ url: 'user:password@example.com:443' }, socket(), Buffer.alloc(0));
    expect(lookup).not.toHaveBeenCalled();
    expect(connect).not.toHaveBeenCalled();
    await proxy.close();
  });
  it('connects to the validated IP without another hostname lookup', async () => {
    (lookup as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    const upstream = socket(); (connect as jest.Mock).mockReturnValue(upstream);
    const proxy = await createPublicBrowserProxy(); const client = socket();
    await server.listeners('connect')[0]({ url: 'example.com:443' }, client, Buffer.alloc(0));
    expect(connect).toHaveBeenCalledWith({ host: '8.8.8.8', family: 4, port: 443 });
    upstream.emit('connect');
    expect(client.write).toHaveBeenCalledWith('HTTP/1.1 200 Connection Established\r\n\r\n');
    await proxy.close();
    expect(upstream.destroy).toHaveBeenCalled();
  });
});
