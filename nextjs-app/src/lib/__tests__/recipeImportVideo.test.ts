/** @jest-environment node */
import { cleanCaptions, prepareRecipeVideo, transcribeVideo } from '../recipeImportVideo';
import { fetchPublicResource } from '../recipeImportFetch';
import { prepareVideoMedia, normalizeVideoUrl, needsBrowser } from '../recipeImportBrowser';

jest.mock('../recipeImportFetch', () => ({ ...jest.requireActual('../recipeImportFetch'), fetchPublicResource: jest.fn() }));
jest.mock('../recipeImportBrowser', () => ({ ...jest.requireActual('../recipeImportBrowser'), prepareVideoMedia: jest.fn() }));

describe('video import', () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalProvider = process.env.RECIPE_AI_PROVIDER;
  const mockFetch = jest.fn();
  beforeEach(() => { process.env.RECIPE_AI_PROVIDER = 'openai'; jest.clearAllMocks(); global.fetch = mockFetch; process.env.OPENAI_API_KEY = 'test-key'; });
  afterAll(() => {
    if (originalProvider === undefined) delete process.env.RECIPE_AI_PROVIDER;
    else process.env.RECIPE_AI_PROVIDER = originalProvider;
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });
  it('reads caption text without cue numbers, timestamps or duplicated adjacent lines', () => {
    expect(cleanCaptions('WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\n<b>Boil pasta.</b>\nBoil pasta.\n\n2\n00:00:03.000 --> 00:00:05.000\nAdd tuna.')).toBe('Boil pasta.\nAdd tuna.');
  });
  it('upgrades only the known Rednote CDN to HTTPS and rejects insecure arbitrary sources', () => {
    expect(normalizeVideoUrl('http://sns-v28.rednotecdn.com/video.mp4')).toBe('https://sns-v28.rednotecdn.com/video.mp4');
    expect(() => normalizeVideoUrl('http://example.com/video.mp4')).toThrow();
    expect(needsBrowser('https://chatgpt.com/share/test')).toBe(true);
    expect(needsBrowser('https://rednote.com.attacker.example/post')).toBe(false);
  });
  it('requires a server key before downloading a video', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(prepareRecipeVideo('https://cdn.example.com/video.mp4', '')).rejects.toThrow('OPENAI_API_KEY');
    expect(fetchPublicResource).not.toHaveBeenCalled();
  });
  it('uses a subtitle track without sending audio when subtitles are available', async () => {
    (fetchPublicResource as jest.Mock).mockResolvedValueOnce({ body: Buffer.from('WEBVTT\nBoil pasta.'), contentType: 'text/vtt' })
      .mockResolvedValueOnce({ body: Buffer.from('video'), contentType: 'video/mp4' });
    (prepareVideoMedia as jest.Mock).mockResolvedValue({images:['data:image/jpeg;base64,frame'],audio:Buffer.from('wave')});
    const result = await prepareRecipeVideo('https://cdn.example.com/video.mp4', 'https://cdn.example.com/subs.vtt');
    expect(result.transcript).toBe('Boil pasta.');
    expect(result.images).toHaveLength(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });
  it('prepares bounded media and transcribes its audio in a separate request', async () => {
    (fetchPublicResource as jest.Mock).mockResolvedValue({ body: Buffer.from('video'), contentType: 'video/mp4' });
    (prepareVideoMedia as jest.Mock).mockResolvedValue({images:['data:image/jpeg;base64,frame'],audio:Buffer.from('wave')});
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ text: 'Boil the pasta, then add tuna.' }) });
    const result = await prepareRecipeVideo('https://cdn.example.com/video.mp4', '');
    expect(result.audioBase64).toBe(Buffer.from('wave').toString('base64'));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(await transcribeVideo(Buffer.from(result.audioBase64, 'base64'), 'audio/wav')).toContain('add tuna');
    expect(fetchPublicResource).toHaveBeenCalledWith('https://cdn.example.com/video.mp4', expect.objectContaining({ maxBytes: 80 * 1024 * 1024 }));
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/audio/transcriptions');
    expect(mockFetch.mock.calls[0][1].body.get('file').name).toBe('recipe.wav');
  });
  it('does not pretend a blob-only source is readable', async () => {
    await expect(prepareRecipeVideo('blob:https://example.com/video', '')).rejects.toThrow('does not expose');
  });
  it('does not disguise an upstream transcription failure as empty successful text', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    await expect(transcribeVideo(Buffer.from('video'), 'video/mp4')).rejects.toThrow('could not be transcribed');
  });
});
