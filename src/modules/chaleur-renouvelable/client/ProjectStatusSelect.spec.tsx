import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { trackPostHogEvent } from '@/modules/analytics/client';

import { projectStatusOptions } from '../constants';
import { ProjectStatusSelect } from './ProjectStatusSelect';

vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: vi.fn() }));

it.each([false, true])('preserves other selected stages and tracks the advisor path (%s)', async (isPublicAdvisorSelected) => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const firstStage = projectStatusOptions[0].nativeInputProps.value;
  const secondStage = projectStatusOptions[1].nativeInputProps.value;
  const { rerender } = render(
    <ProjectStatusSelect value={[firstStage]} onChange={onChange} isPublicAdvisorSelected={isPublicAdvisorSelected} />
  );
  const trigger = screen.getByRole('button');
  await user.click(trigger);
  await user.click(screen.getByRole('checkbox', { name: secondStage }));
  expect(onChange).toHaveBeenLastCalledWith([firstStage, secondStage]);
  expect(trackPostHogEvent).toHaveBeenLastCalledWith('fcr_contact:project_stage_selected', {
    is_raccordable: !isPublicAdvisorSelected,
    stages: [firstStage, secondStage],
  });

  rerender(<ProjectStatusSelect value={[firstStage, secondStage]} onChange={onChange} isPublicAdvisorSelected={isPublicAdvisorSelected} />);
  screen.getByRole('checkbox', { name: secondStage }).focus();
  await user.keyboard('[Space]');
  expect(onChange).toHaveBeenLastCalledWith([firstStage]);
  expect(trackPostHogEvent).toHaveBeenLastCalledWith('fcr_contact:project_stage_selected', {
    is_raccordable: !isPublicAdvisorSelected,
    stages: [firstStage],
  });
  await user.keyboard('[Escape]');
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(trigger).toHaveFocus();
});
