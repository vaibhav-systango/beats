export const MOCK_EVENT_ACTION_DELAY_MS = 300

export function mockEventActionDelay(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_EVENT_ACTION_DELAY_MS)
  })
}
