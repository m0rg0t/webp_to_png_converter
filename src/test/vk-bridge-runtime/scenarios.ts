export type VkMockScenarioName =
  | 'success'
  | 'dark'
  | 'permission-declined'
  | 'ads-unavailable'
  | 'storage-error'
  | 'init-unavailable'
  | 'user-info-unavailable'
  | 'user-info-timeout';

export type VkMockFailure = {
  error_type: string;
  error_data: {
    error_code: number;
    error_reason: string;
  };
};

export const VK_MOCK_SCENARIOS: readonly VkMockScenarioName[] = [
  'success',
  'dark',
  'permission-declined',
  'ads-unavailable',
  'storage-error',
  'init-unavailable',
  'user-info-unavailable',
  'user-info-timeout',
];

export const isVkMockScenario = (value: string | null): value is VkMockScenarioName =>
  value !== null && VK_MOCK_SCENARIOS.includes(value as VkMockScenarioName);

export const failure = (
  method: string,
  error_code: number,
  error_reason: string,
): VkMockFailure => ({
  error_type: `${method}Failed`,
  error_data: { error_code, error_reason },
});

