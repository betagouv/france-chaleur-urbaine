import Section, { type SectionProps } from '@/components/ui/Section';
import cx from '@/utils/cx';

import { STEPS } from '../../constants';
import { SectionIntro } from '../ui/SectionIntro';

type StepsTimelineSectionProps = Pick<SectionProps, 'variant'>;

/**
 * "Le parcours" section: the seven steps from simulation to installation, laid out on a
 * wave timeline on desktop and as a vertical list on mobile.
 */
export function StepsTimelineSection({ variant }: StepsTimelineSectionProps) {
  return (
    <Section variant={variant} size="compact">
      <SectionIntro eyebrow="Le parcours" title="De la simulation à l’installation : 7 étapes" />

      <div className="mt-8 space-y-6 md:hidden">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex items-start gap-4 rounded-lg border border-[#DDDDDD] bg-white p-4">
            <StepNumber stepNumber={index + 1} className="h-11 w-11 text-2xl" />
            <div>
              <h3 className="mb-1 text-lg font-bold">{step.title}</h3>
              <p className="mb-0 text-sm leading-6 whitespace-pre-line text-[#3A3A3A]">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative my-10 hidden min-h-90 md:block">
        <img
          src="/img/chaleur-renouvelable-timeline.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-33 h-[130px] w-full"
        />
        {STEPS.map((step, index) => {
          const isTop = index % 2 === 0;
          return (
            <div
              key={step.title}
              className={cx('absolute w-60 -translate-x-1/2', isTop ? 'top-0' : 'top-[265px]', STEP_LEFT_CLASSES[index])}
            >
              <StepCard stepNumber={index + 1} title={step.title} text={step.text} textBelowNumber={!isTop} />
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// Horizontal position of each step on the desktop timeline, matching the wave SVG
const STEP_LEFT_CLASSES = ['left-[11%]', 'left-[24%]', 'left-[37%]', 'left-[50%]', 'left-[63%]', 'left-[76%]', 'left-[89%]'];

type StepCardProps = {
  stepNumber: number;
  title: string;
  text: string;
  textBelowNumber: boolean;
};

function StepCard({ stepNumber, title, text, textBelowNumber }: StepCardProps) {
  const label = (
    <>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className={cx('max-w-60 text-sm leading-6 whitespace-pre-line text-[#3A3A3A]', textBelowNumber ? 'mb-0' : 'mb-4')}>{text}</p>
    </>
  );

  return (
    <div className="flex flex-col items-center text-center">
      {!textBelowNumber && label}
      <StepNumber stepNumber={stepNumber} className={cx('h-14 w-14 text-3xl shadow-[0_0_0_4px_white]', textBelowNumber && 'mb-4')} />
      {textBelowNumber && label}
    </div>
  );
}

type StepNumberProps = {
  stepNumber: number;
  className: string;
};

function StepNumber({ stepNumber, className }: StepNumberProps) {
  return (
    <div
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        stepNumber === 1 ? 'bg-[#000091]' : 'bg-[#6EA8FE]',
        className
      )}
    >
      {stepNumber}
    </div>
  );
}
