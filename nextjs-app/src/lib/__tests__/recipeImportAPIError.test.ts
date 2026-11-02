/** @jest-environment node */
import { openAIImportError } from '../recipeImportAPIError';

describe('AI import errors', () => {
  it('identifies exhausted credits without exposing raw provider messages', async () => {
    const response = { status: 429, json: async () => ({ error: { code: 'credit_balance_exhausted', type: 'insufficient_quota', message: 'private provider detail' } }) } as Response;
    const error = await openAIImportError(response, 'Fallback');
    expect(error).toMatchObject({ status: 402, code: 'AI_QUOTA_EXHAUSTED' });
    expect(error.message).toContain('billing');
    expect(error.message).not.toContain('private provider detail');
  });
  it('distinguishes rate limits from depleted credits', async () => {
    const response = { status: 429, json: async () => ({ error: { code: 'rate_limit_exceeded' } }) } as Response;
    expect(await openAIImportError(response, 'Fallback')).toMatchObject({ status: 429, code: 'AI_RATE_LIMITED' });
  });
  it('does not present provider credentials errors as an expired website session', async () => {
    const response = { status: 401, json: async () => ({ error: { code: 'invalid_api_key' } }) } as Response;
    expect(await openAIImportError(response, 'Fallback')).toMatchObject({ status: 503, code: 'AI_ACCESS_ERROR' });
  });
});
