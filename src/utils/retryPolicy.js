// When a failed API query is tried again (React Query `retry` / `retryDelay`).
//
// Retrying blindly (the old default: every failure twice more) turned one
// broken endpoint into three identical requests per page load, spent the
// API's 300-requests-a-day allowance for the office, and queued behind the
// backend's small Databricks connection pool. So:
// - no response at all (network drop, cold start): up to 2 more tries
// - 4xx (login, permission, rate limit) and 503 ("not generated yet"): never,
//   the answer will not change by asking again
// - other 5xx: one more try, in case it was a passing warehouse hiccup
export function shouldRetryRequest(failureCount, error) {
  const status = error?.response?.status

  if (!status) return failureCount < 2
  if (status < 500 || status === 503) return false
  return failureCount < 1
}

// 2 s, then 4 s: long enough for a busy warehouse to free a connection.
export const retryDelay = (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 8000)
