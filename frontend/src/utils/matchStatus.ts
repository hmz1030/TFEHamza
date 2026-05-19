function normalizeStatus(status: string) {
  return status.trim().toLowerCase()
}

export function isFinished(status: string) {
  const value = normalizeStatus(status)
  return value.includes('finish') || value.includes('term') || value === 'ft'
}

export function isScheduled(status: string) {
  const value = normalizeStatus(status)
  return value === 'scheduled' || value === 'notstarted' || value === 'not started'
}

export function isLive(status: string) {
  const value = normalizeStatus(status)
  return value.includes('live') || value.includes('direct') || value.includes('progress')
}
