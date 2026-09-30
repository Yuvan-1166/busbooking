const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

function authHeaders(extra = {}) {
  let session = null
  try {
    session = JSON.parse(localStorage.getItem('busbooking.auth'))
  } catch {
    localStorage.removeItem('busbooking.auth')
  }
  return {
    ...(session?.accessToken ? { Authorization: `${session.tokenType || 'Bearer'} ${session.accessToken}` } : {}),
    ...extra,
  }
}

async function throwIfFailed(response) {
  if (response.ok) return
  // Try to parse error response
  let errorMessage = `${response.status} ${response.statusText}`
  let errorData = null
  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      errorData = await response.json()
      // Handle different error response formats, extracting the most specific message
      if (errorData.errors) {
        let validationMsg = ''
        if (Array.isArray(errorData.errors)) {
          validationMsg = errorData.errors.join(', ')
        } else if (typeof errorData.errors === 'object') {
          validationMsg = Object.entries(errorData.errors)
            .map(([field, msg]) => `${field.charAt(0).toUpperCase() + field.slice(1)}: ${msg}`)
            .join(', ')
        }
        if (validationMsg) {
          errorMessage = errorData.message && !errorData.message.toLowerCase().includes('validation failed')
            ? `${errorData.message}: ${validationMsg}`
            : validationMsg
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } else if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.errorMessage) {
        errorMessage = errorData.errorMessage
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
    } else {
      const text = await response.text()
      if (text) errorMessage = text
    }
  } catch (parseError) {
    // If parsing fails, use default message
    console.error('Failed to parse error response:', parseError)
  }

  // Create error object that includes status code for proper error handling
  const error = new Error(errorMessage)
  error.status = response.status
  error.statusCode = response.status
  error.response = {
    status: response.status,
    data: errorData || { message: errorMessage }
  }
  throw error
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(options.headers),
    },
  })
  if (response.status === 401) window.dispatchEvent(new Event('auth:unauthorized'))
  await throwIfFailed(response)
  return response.status === 204 ? null : response.json()
}

// Binary endpoints (report PDFs) cannot go through `request`, which always
// parses the body as JSON.
async function download(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
  })
  if (response.status === 401) window.dispatchEvent(new Event('auth:unauthorized'))
  await throwIfFailed(response)
  return {
    blob: await response.blob(),
    fileName: fileNameFrom(response.headers.get('content-disposition')),
  }
}

function fileNameFrom(contentDisposition) {
  if (!contentDisposition) return null
  // RFC 5987 form wins when present, since it survives non-ASCII names.
  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim())
    } catch {
      // Fall through to the plain form.
    }
  }
  const plain = contentDisposition.match(/filename="?([^";]+)"?/i)
  return plain ? plain[1].trim() : null
}

export const api = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userType, details) => request('/auth/register', { method: 'POST', body: JSON.stringify({ userType, ...details }) }),
  // Unified OAuth (Google, Twitter, …) – provider selected in the request body
  oauthAuthorize: (provider, userType = 'PASSENGER') => request('/auth/oauth/authorize', { method: 'POST', body: JSON.stringify({ provider, userType }) }),
  oauthCallback: (payload) => request('/auth/oauth/callback', { method: 'POST', body: JSON.stringify(payload) }),
  verifyTwitterEmail: (email, otp) => request('/users/me/verify-twitter-email', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  completeOnboarding: (payload) => request('/auth/onboarding/complete', { method: 'POST', body: JSON.stringify(payload) }),
  // Unified OTP endpoints: the channel decides how `target` is read, validated
  // and delivered to, so no per-delivery-method endpoint is needed.
  sendOtp: (target, { channel = 'EMAIL', purpose = 'REGISTRATION' } = {}) =>
    request('/auth/verify/send', { method: 'POST', body: JSON.stringify({ target, channel, purpose }) }),
  verifyOtp: (target, otp, { channel = 'EMAIL', purpose = 'REGISTRATION' } = {}) =>
    request('/auth/verify/confirm', { method: 'POST', body: JSON.stringify({ target, otp, channel, purpose }) }),
  forgotPassword: (target, channel = 'EMAIL') =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ target, channel }) }),
  resetPassword: (target, otp, newPassword, channel = 'EMAIL') =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ target, otp, newPassword, channel }) }),
  setupTotp: () => request('/auth/totp/setup', { method: 'POST' }),
  verifyTotpSetup: (totpCode) => request('/auth/totp/verify-setup', { method: 'POST', body: JSON.stringify({ totpCode }) }),
  disableTotp: (data) => request('/auth/totp/disable', { method: 'POST', body: JSON.stringify(data) }),
  generateBackupCodes: () => request('/auth/totp/backup-codes/generate', { method: 'POST' }),
  // TOTP Alternative OTP methods (SMS, Email, etc.)
  sendTotpAlternativeOtp: (method, tempToken) => request('/auth/totp-alternative/send', { method: 'POST', body: JSON.stringify({ method, tempToken }) }),
  verifyTotpAlternativeOtp: (tempToken, sessionId, code) => request('/auth/totp-alternative/verify', { method: 'POST', body: JSON.stringify({ tempToken, sessionId, code }) }),
  getLocations: () => request('/locations'),
  getRoutes: () => request('/routes'),
  getRouteStops: (routeId) => request(`/route-stops/route/${routeId}`),
  getTrips: (routeId, date) => request(`/trips/route/${routeId}?date=${date}`),
  getSeats: (tripId) => request(`/trip-seats/trip/${tripId}`),
  holdSeats: (tripId, seats) => request('/seat-holds', { method: 'POST', body: JSON.stringify({ tripId, seats }) }),
  createBooking: (payload) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  cancelBooking: (bookingId, reason) => request(`/bookings/${bookingId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  initiatePayment: (bookingId, paymentMethod) => request('/payments', { method: 'POST', body: JSON.stringify({ bookingId, paymentMethod }) }),
  confirmPayment: (payload) => request('/payments/confirm', { method: 'POST', body: JSON.stringify(payload) }),
  getTicket: (bookingId) => request(`/tickets/booking/${bookingId}`),
  getTickets: () => request('/tickets/booking'),
  getBooking: (bookingId) => request(`/bookings/${bookingId}`),
  getWalletBalance: () => request('/wallet'),
  getBuses: () => request('/buses'),
  getBus: (busId) => request(`/buses/${busId}`),
  createBus: (payload) => request('/buses', { method: 'POST', body: JSON.stringify(payload) }),
  updateBus: (busId, payload) => request(`/buses/${busId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBus: (busId) => request(`/buses/${busId}`, { method: 'DELETE' }),
  getSeatsByBus: (busId) => request(`/seats/bus/${busId}`),
  createSeat: (payload) => request('/seats', { method: 'POST', body: JSON.stringify(payload) }),
  createSeats: (payloads) => request('/seats/batch', { method: 'POST', body: JSON.stringify(payloads) }),
  updateSeat: (seatId, payload) => request(`/seats/${seatId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSeat: (seatId) => request(`/seats/${seatId}`, { method: 'DELETE' }),
  // Seat Templates
  getSeatTemplates: (deckType) => request(deckType ? `/seat-templates?deckType=${deckType}` : '/seat-templates'),
  getSeatTemplate: (templateId) => request(`/seat-templates/${templateId}`),
  previewSeatTemplate: (templateId, rows = null) => request(rows?.length ? `/seat-templates/${templateId}/preview?rows=${rows.join(',')}` : `/seat-templates/${templateId}/preview`),
  applySeatTemplate: (templateId, busId, clearExisting = false, rows = null) => request(`/seat-templates/${templateId}/apply`, { method: 'POST', body: JSON.stringify(rows?.length ? { busId, clearExisting, rows } : { busId, clearExisting }) }),
  getSchedules: () => request('/schedules'),
  createSchedule: (payload) => request('/schedules', { method: 'POST', body: JSON.stringify(payload) }),
  updateSchedule: (scheduleId, payload) => request(`/schedules/${scheduleId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSchedule: (scheduleId) => request(`/schedules/${scheduleId}`, { method: 'DELETE' }),
  getAllTrips: () => request('/trips'),
  createTrip: (payload) => request('/trips', { method: 'POST', body: JSON.stringify(payload) }),
  createBulkTrips: (payload) => request('/trips/bulk', { method: 'POST', body: JSON.stringify(payload) }),
  updateTrip: (tripId, payload) => request(`/trips/${tripId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTrip: (tripId) => request(`/trips/${tripId}`, { method: 'DELETE' }),
  cancelTrip: (tripId, reason) => request(`/trips/${tripId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getUsers: () => request('/users'),
  getCurrentUser: () => request('/users/me'),
  getUser: (id) => request(`/users/${id}`),
  updateUser: (payload) => request(`/users/me`, { method: 'PUT', body: JSON.stringify(payload) }),
  getOperators: () => request('/operators'),
  getOperator: (operatorId) => request(`/operators/${operatorId}`),
  getBus: (busId) => request(`/buses/${busId}`),
  getAllLocations: () => request('/locations'),
  createLocation: (payload) => request('/locations', { method: 'POST', body: JSON.stringify(payload) }),
  updateLocation: (locationId, payload) => request(`/locations/${locationId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteLocation: (locationId) => request(`/locations/${locationId}`, { method: 'DELETE' }),
  getAllRoutes: () => request('/routes'),
  createRoute: (payload) => request('/routes', { method: 'POST', body: JSON.stringify(payload) }),
  updateRoute: (routeId, payload) => request(`/routes/${routeId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteRoute: (routeId) => request(`/routes/${routeId}`, { method: 'DELETE' }),
  // Verifying the phone number on the profile is not part of the unified OTP
  // flow (it flips user.mobileVerified rather than verifying the account), so
  // it keeps using the Message Central endpoints directly.
  sendMobileOtp: (mobileNumber) => request('/verifynow/send-otp', { method: 'POST', body: JSON.stringify({ mobileNumber }) }),
  validateMobileOtp: (verificationId, mobileNumber, code) => request('/verifynow/validate-otp', { method: 'POST', body: JSON.stringify({ verificationId, mobileNumber, code }) }),
  updateMobileVerificationStatus: () => request('/users/me/verify-mobile', { method: 'POST' }),
  getAnalytics: (from, to, operatorId) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (operatorId) params.set('operatorId', operatorId)
    const qs = params.toString()
    return request(`/analytics/dashboard${qs ? `?${qs}` : ''}`)
  },
  // Recurring emailed reports (operators & admins)
  getReportPreferences: () => request('/report-preferences'),
  upsertReportPreference: (preference) => request('/report-preferences', { method: 'PUT', body: JSON.stringify(preference) }),
  deleteReportPreference: (reportType) => request(`/report-preferences/${reportType}`, { method: 'DELETE' }),
  sendReportNow: (reportType) => request(`/report-preferences/${reportType}/send-now`, { method: 'POST' }),
  // On-demand PDF export. `period` covers the recurring windows; passing
  // `from`/`to` instead asks for an explicit range.
  downloadReportPdf: (reportType, { period, from, to } = {}) => {
    const params = new URLSearchParams()
    if (period) params.set('period', period)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const qs = params.toString()
    return download(`/reports/${reportType}/pdf${qs ? `?${qs}` : ''}`)
  },
}

export { API_BASE }
