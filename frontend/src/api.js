const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

async function request(path, options = {}) {
  let session = null
  try {
    session = JSON.parse(localStorage.getItem('busbooking.auth'))
  } catch {
    localStorage.removeItem('busbooking.auth')
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(session?.accessToken ? { Authorization: `${session.tokenType || 'Bearer'} ${session.accessToken}` } : {}),
      ...options.headers,
    },
  })
  if (response.status === 401) window.dispatchEvent(new Event('auth:unauthorized'))
  if (!response.ok) {
    // Try to parse error response
    let errorMessage = `${response.status} ${response.statusText}`
    let errorData = null
    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        errorData = await response.json()
        // Handle different error response formats
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.errorMessage) {
          errorMessage = errorData.errorMessage
        } else if (errorData.errors) {
          // Handle validation errors
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(', ')
          } else if (typeof errorData.errors === 'object') {
            errorMessage = Object.values(errorData.errors).join(', ')
          }
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
    error.response = {
      status: response.status,
      data: errorData || { message: errorMessage }
    }
    throw error
  }
  return response.status === 204 ? null : response.json()
}

export const api = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userType, details) => request('/auth/register', { method: 'POST', body: JSON.stringify({ userType, ...details }) }),
  // Unified OAuth (Google, Twitter, …) – provider selected in the request body
  oauthAuthorize: (provider, userType = 'PASSENGER') => request('/auth/oauth/authorize', { method: 'POST', body: JSON.stringify({ provider, userType }) }),
  oauthCallback: (payload) => request('/auth/oauth/callback', { method: 'POST', body: JSON.stringify(payload) }),
  verifyTwitterEmail: (email, otp) => request('/users/me/verify-twitter-email', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  completeOnboarding: (payload) => request('/auth/onboarding/complete', { method: 'POST', body: JSON.stringify(payload) }),
  sendOtp: (email) => request('/auth/verify/send', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email, otp) => request('/auth/verify/confirm', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email, otp, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
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
  // Mobile verification via MessageCentral
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
}

export { API_BASE }
