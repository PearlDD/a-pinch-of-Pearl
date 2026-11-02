import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipeImport from '../RecipeImport';
import { mockSupabase } from '@/__tests__/mocks/supabase';

describe('RecipeImport', () => {
  const mockFetch = jest.fn();
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'test-token' } } });
  });
  it('previews a recipe and applies it only after a separate click', async () => {
    const onApply = jest.fn();
    const recipe = { name: 'Soup', description: '', ingredients: ['Carrots'], instructions: ['Boil.'], tips: [] };
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ recipe, warnings: ['Review before saving.'] }) });
    render(<RecipeImport onApply={onApply} />);
    fireEvent.change(screen.getByLabelText('Recipe or post link'), { target: { value: 'https://example.com/soup' } });
    fireEvent.click(screen.getByText('Extract recipe'));
    await screen.findByRole('heading', { name: 'Soup' });
    expect(onApply).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/recipes/import', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) }));
    fireEvent.click(screen.getByText('Use in recipe form'));
    expect(onApply).toHaveBeenCalledWith(recipe, false);
    expect(screen.getByText('Use in recipe form')).toBeDisabled();
  });
  it('offers text fallback while keeping the source link after a blocked page', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Page requires login.' }) });
    render(<RecipeImport onApply={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Recipe or post link'), { target: { value: 'https://example.com/post' } });
    fireEvent.click(screen.getByText('Extract recipe'));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByText('Paste text instead'));
    expect(screen.getByLabelText('Original source link (optional)')).toHaveValue('https://example.com/post');
    expect(screen.getByLabelText('Recipe text or transcript')).toBeVisible();
  });
  it('does not call the endpoint without a session', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    render(<RecipeImport onApply={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Recipe or post link'), { target: { value: 'https://example.com/soup' } });
    fireEvent.click(screen.getByText('Extract recipe'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sign in again'));
    expect(mockFetch).not.toHaveBeenCalled();
  });
  it('runs the video phases automatically, then previews before applying', async () => {
    const onApply = jest.fn();
    const recipe = { name: 'Video soup', description: '', ingredients: ['Carrots'], instructions: ['Boil.'], tips: [] };
    const reply = (body: unknown) => ({ ok: true, json: async () => body });
    mockFetch.mockResolvedValueOnce(reply({ next: 'video', text: 'Video soup', sourceUrl: 'https://rednote.com/post', videoUrl: 'https://cdn.example.com/video.mp4', captionUrl: '' }))
      .mockResolvedValueOnce(reply({ transcript: '', audioBase64: 'audio', images: ['data:image/jpeg;base64,frame'], warnings: ['Check sampled frames.'] }))
      .mockResolvedValueOnce(reply({ transcript: 'Boil carrots.' }))
      .mockResolvedValueOnce(reply({ recipe, warnings: ['Review before saving.'] }));
    render(<RecipeImport onApply={onApply} />);
    fireEvent.change(screen.getByLabelText('Recipe or post link'), { target: { value: 'https://rednote.com/post' } });
    fireEvent.click(screen.getByText('Extract recipe'));
    await screen.findByRole('heading', { name: 'Video soup' });
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(JSON.parse(mockFetch.mock.calls[1][1].body).action).toBe('prepare-video');
    expect(JSON.parse(mockFetch.mock.calls[2][1].body).action).toBe('transcribe');
    expect(JSON.parse(mockFetch.mock.calls[3][1].body).value).toContain('Boil carrots.');
    expect(screen.getByText('Check sampled frames.')).toBeVisible();
    expect(onApply).not.toHaveBeenCalled();
  });
  it('stops after an exhausted-credit error instead of making another AI call', async () => {
    const reply = (body: unknown) => ({ ok: true, json: async () => body });
    mockFetch.mockResolvedValueOnce(reply({ next: 'video', text: 'Soup', sourceUrl: 'https://rednote.com/post', videoUrl: 'https://cdn.example.com/video.mp4', captionUrl: '' }))
      .mockResolvedValueOnce(reply({ transcript: '', audioBase64: 'audio', images: ['data:image/jpeg;base64,frame'], warnings: [] }))
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'OpenAI API credits are exhausted.', code: 'AI_QUOTA_EXHAUSTED' }) });
    render(<RecipeImport onApply={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Recipe or post link'), { target: { value: 'https://rednote.com/post' } });
    fireEvent.click(screen.getByText('Extract recipe'));
    expect(await screen.findByRole('alert')).toHaveTextContent('credits are exhausted');
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(screen.queryByText('Use in recipe form')).not.toBeInTheDocument();
  });
});
