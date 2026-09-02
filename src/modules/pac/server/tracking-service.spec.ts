import { beforeEach, describe, expect, it, vi } from 'vitest';

import { postFetchJSON } from '@/utils/network';

import { recordSimulateurPacEvent } from './tracking-service';

const serverConfigMock = vi.hoisted(
  (): {
    tracking: {
      postHogApiHost: string | undefined;
      postHogKey: string | undefined;
    };
  } => ({
    tracking: {
      postHogApiHost: 'https://posthog.test',
      postHogKey: 'phc_test',
    },
  })
);

const loggerMock = vi.hoisted(() => ({
  debug: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('@/server/config', () => ({
  serverConfig: serverConfigMock,
}));

vi.mock('@/server/helpers/logger', () => ({
  createLogger: () => loggerMock,
}));

vi.mock('@/utils/network', () => ({
  postFetchJSON: vi.fn(),
}));

const mockedPostFetchJSON = vi.mocked(postFetchJSON);

describe('recordSimulateurPacEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serverConfigMock.tracking.postHogApiHost = 'https://posthog.test';
    serverConfigMock.tracking.postHogKey = 'phc_test';
  });

  it('relays PAC simulator events to PostHog', async () => {
    mockedPostFetchJSON.mockResolvedValueOnce({ status: 1 });

    const result = await recordSimulateurPacEvent({
      distinctId: 'visitor-1',
      event: 'simulateur_pac:results_requested',
      properties: {
        current_step: 8,
        department_code: '75',
        source_host: 'example.fr',
      },
    });

    expect(result).toStrictEqual({ tracked: true });
    expect(mockedPostFetchJSON).toHaveBeenCalledWith('https://posthog.test/capture/', {
      api_key: 'phc_test',
      distinct_id: 'visitor-1',
      event: 'simulateur_pac:results_requested',
      properties: {
        $process_person_profile: false,
        current_step: 8,
        department_code: '75',
        source: 'simulateur_pac',
        source_host: 'example.fr',
      },
    });
  });

  it('does not call PostHog when tracking is not configured', async () => {
    serverConfigMock.tracking.postHogKey = undefined;

    const result = await recordSimulateurPacEvent({
      distinctId: 'visitor-1',
      event: 'simulateur_pac:form_started',
      properties: {},
    });

    expect(result).toStrictEqual({ reason: 'posthog_disabled', tracked: false });
    expect(mockedPostFetchJSON).not.toHaveBeenCalled();
  });

  it('does not fail the caller when PostHog rejects the event', async () => {
    mockedPostFetchJSON.mockRejectedValueOnce(new Error('PostHog down'));

    const result = await recordSimulateurPacEvent({
      distinctId: 'visitor-1',
      event: 'simulateur_pac:form_started',
      properties: {},
    });

    expect(result).toStrictEqual({ reason: 'posthog_failed', tracked: false });
    expect(loggerMock.warn).toHaveBeenCalledWith('PostHog PAC tracking failed', {
      error: 'PostHog down',
      event: 'simulateur_pac:form_started',
    });
  });
});
