export interface EligibilityDemand {
  id: string;
  emails: string[];
  version: string;
  addresses_count: number;
  progress: number;
  error_count: number;
  eligibile_count: number;
  created_at: string;
  in_error: boolean;
}
