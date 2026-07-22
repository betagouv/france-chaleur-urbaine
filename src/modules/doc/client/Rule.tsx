import { type BusinessRuleId, businessRules } from '@/modules/app/business-rules';

type RuleProps = {
  id: BusinessRuleId;
};

/**
 * Renders a numeric business rule (threshold, delay…) from the shared registry
 * (src/modules/app/business-rules.ts) that production code also reads — so the value shown
 * here can never diverge from the code. Use in MDX instead of a hardcoded number.
 */
export function Rule({ id }: RuleProps) {
  const rule = businessRules[id];
  return (
    <strong title={rule.description} className="whitespace-nowrap underline decoration-dotted underline-offset-2">
      {rule.display}
    </strong>
  );
}
