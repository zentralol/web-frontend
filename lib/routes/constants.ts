export const MOCK_DATA_SUFFIX = "";

export function withMockData(value: string): string {
  return value.endsWith(MOCK_DATA_SUFFIX) ? value : `${value}${MOCK_DATA_SUFFIX}`;
}
