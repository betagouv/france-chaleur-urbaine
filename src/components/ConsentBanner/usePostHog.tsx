import posthog from 'posthog-js';
import { useEffect } from 'react';

import { useAuthentication } from '@/modules/auth/client/hooks';

export const usePostHog = (enable: boolean) => {
  const { user } = useAuthentication();

  useEffect(() => {
    if (enable) {
      posthog.set_config({
        autocapture: true,
        capture_pageview: true,
        disable_session_recording: false,
        persistence: 'localStorage+cookie',
      });
      posthog.opt_in_capturing({
        captureEventName: false,
      });
    } else {
      posthog.reset();
      posthog.set_config({
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
        persistence: 'memory',
      });
      posthog.opt_out_capturing();
    }
  }, [enable]);

  useEffect(() => {
    if (enable && user) {
      posthog.identify(user.id, {
        email: user.email,
        id: user.id,
        role: user.role,
      });
    }
  }, [enable, user?.id]);
};
