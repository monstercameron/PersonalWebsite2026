import { extractFinancialRiskFindingsFromCurrentCollectionsState } from '../core/pure.js'

// Every response echoes the caller-provided requestId so the main thread can route
// concurrent risk computations back to the correct pending tuple promise.
globalThis.onmessage = (messageEvent) => {
  const payload = messageEvent.data
  if (!payload || typeof payload !== 'object') {
    globalThis.postMessage({ requestId: -1, findings: [], error: { kind: 'VALIDATION', message: 'worker payload must be an object' } })
    return
  }
  const requestId = typeof payload.requestId === 'number' ? payload.requestId : -1

  const [findings, findingsError] = extractFinancialRiskFindingsFromCurrentCollectionsState(payload.currentCollectionsState)
  if (findingsError) {
    globalThis.postMessage({ requestId, findings: [], error: findingsError })
    return
  }

  globalThis.postMessage({ requestId, findings: findings ?? [], error: null })
}
