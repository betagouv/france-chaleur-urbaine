export const eventTypes = [
  'user_login',
  'user_activated',
  'user_created',
  'user_updated',
  'user_deleted',
  'demand_created',
  'demand_assigned',
  'demand_updated',
  'demand_deleted',
  'pro_eligibility_test_created',
  'pro_eligibility_test_renamed',
  'pro_eligibility_test_updated',
  'pro_eligibility_test_deleted',
] as const;

export type EventType = (typeof eventTypes)[number];
