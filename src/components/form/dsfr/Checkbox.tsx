import { trackPostHogEvent } from '@/modules/analytics/client';
import type { PostHogEvent, PostHogTrackingProps } from '@/modules/analytics/posthog.config';

import Checkboxes, { type CheckboxesProps } from './Checkboxes';

type CheckboxOption = CheckboxesProps['options'][number];
export type CheckboxProps<Event extends PostHogEvent = PostHogEvent> = Omit<CheckboxesProps, 'options'> &
  Omit<CheckboxOption, 'nativeInputProps'> &
  PostHogTrackingProps<Event> & { nativeInputProps?: CheckboxOption['nativeInputProps'] & { name: string } };

function Checkbox<Event extends PostHogEvent = PostHogEvent>({
  label,
  hintText,
  nativeInputProps,
  postHogEventKey,
  postHogEventProps,
  ...props
}: CheckboxProps<Event>) {
  return (
    <Checkboxes
      options={[
        {
          hintText,
          label,
          nativeInputProps: {
            ...nativeInputProps,
            onChange: (event) => {
              nativeInputProps?.onChange?.(event);
              if (event.target.checked) {
                trackPostHogEvent(postHogEventKey, postHogEventProps);
              }
            },
          },
        },
      ]}
      {...props}
    />
  );
}

export default Checkbox;
