// Get today's date in Amsterdam timezone
// This ensures the frontend and backend are in sync about what "today" means
export function getTodayAmsterdam() {
  const now = new Date()
  // Format date in Amsterdam timezone
  const amsterdamDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)
  return amsterdamDate // Returns YYYY-MM-DD format
}

// Get time remaining until midnight in Amsterdam timezone
export function getTimeUntilMidnightAmsterdam() {
  const now = new Date()

  // Get current time in Amsterdam
  const amsterdamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }))

  // Calculate midnight Amsterdam time
  const midnightAmsterdam = new Date(amsterdamTime)
  midnightAmsterdam.setDate(midnightAmsterdam.getDate() + 1)
  midnightAmsterdam.setHours(0, 0, 0, 0)

  // Calculate difference in milliseconds
  const diff = midnightAmsterdam - amsterdamTime

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
}
