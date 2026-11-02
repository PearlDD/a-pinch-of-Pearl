/** @jest-environment node */
import { EventEmitter } from 'node:events';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { fetchRecipePage } from '../recipeImportFetch';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
jest.mock('node:https', () => ({ request: jest.fn() }));

const resolveHost = lookup as jest.Mock;
const send = request as jest.Mock;
function respond(statusCode: number, headers: Record<string, string>, html = '') {
  send.mockImplementationOnce((_url, _options, callback) => {
    const response = Object.assign(new EventEmitter(), { statusCode, headers, destroy: jest.fn() });
    return { on: jest.fn(), end() {
      callback(response);
      if (statusCode === 200) { response.emit('data', Buffer.from(html)); response.emit('end'); }
    } };
  });
}

describe('safe recipe page fetch', () => {
  beforeEach(() => { jest.resetAllMocks(); });
  it('never opens a connection when a host resolves to a private address', async () => {
    resolveHost.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    await expect(fetchRecipePage('https://example.com')).rejects.toThrow('public website');
    expect(send).not.toHaveBeenCalled();
  });
  it('revalidates DNS after redirects and blocks redirects into private networks', async () => {
    resolveHost.mockResolvedValueOnce([{ address: '8.8.8.8', family: 4 }]).mockResolvedValueOnce([{ address: '169.254.169.254', family: 4 }]);
    respond(302, { location: 'https://internal.example/metadata' });
    await expect(fetchRecipePage('https://example.com')).rejects.toThrow('public website');
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('pins the validated IP to the HTTPS connection and preserves the hostname', async () => {
    resolveHost.mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
    respond(200, { 'content-type': 'text/html' }, '<h1>Soup</h1>');
    await expect(fetchRecipePage('https://example.com/soup')).resolves.toEqual({ html: '<h1>Soup</h1>', url: 'https://example.com/soup' });
    const [url, options] = send.mock.calls[0];
    expect(url.hostname).toBe('example.com');
    expect(options.family).toBe(4);
    const callback = jest.fn();
    options.lookup('example.com', {}, callback);
    expect(callback).toHaveBeenCalledWith(null, '8.8.8.8', 4);
  });
});
