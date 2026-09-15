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
    const message = await response.text()
    throw new Error(message || `${response.status} ${response.statusText}: ${path}`)
  }
  return response.status === 204 ? null : response.json()
}

export const api = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  registerPassenger: (details) => request('/auth/register', { method: 'POST', body: JSON.stringify(details) }),
  registerOperator: (details) => request('/auth/operator/register', { method: 'POST', body: JSON.stringify(details) }),
  sendOtp: (email) => request('/auth/verify/send', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email, otp) => request('/auth/verify/confirm', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email, otp, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  getLocations: () => request('/locations'),
  getRoutes: () => request('/routes'),
  getRouteStops: (routeId) => request(`/route-stops/route/${routeId}`),
  getTrips: (routeId, date) => request(`/trips/route/${routeId}?date=${date}`),
  getSeats: (tripId) => request(`/trip-seats/trip/${tripId}`),
  holdSeats: (tripId, seats) => request('/seat-holds', { method: 'POST', body: JSON.stringify({ tripId, seats }) }),
  createBooking: (payload) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  cancelBooking: (bookingId, reason) => request(`/bookings/${bookingId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  pay: (bookingId, paymentMethod) => request('/payments', { method: 'POST', body: JSON.stringify({ bookingId, paymentMethod }) }),
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
  updateSeat: (seatId, payload) => request(`/seats/${seatId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSeat: (seatId) => request(`/seats/${seatId}`, { method: 'DELETE' }),
  getSchedules: () => request('/schedules'),
  createSchedule: (payload) => request('/schedules', { method: 'POST', body: JSON.stringify(payload) }),
  updateSchedule: (scheduleId, payload) => request(`/schedules/${scheduleId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSchedule: (scheduleId) => request(`/schedules/${scheduleId}`, { method: 'DELETE' }),
  getAllTrips: () => request('/trips'),
  createTrip: (payload) => request('/trips', { method: 'POST', body: JSON.stringify(payload) }),
  createBulkTrips: (payload) => request('/trips/bulk', { method: 'POST', body: JSON.stringify(payload) }),
  updateTrip: (tripId, payload) => request(`/trips/${tripId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTrip: (tripId) => request(`/trips/${tripId}`, { method: 'DELETE' }),
  getUsers: () => request('/users'),
  getCurrentUser: () => request('/users/me'),
  getUser: (id) => request(`/users/${id}`),
  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getOperators: () => request('/operators'),
  getOperator: (operatorId) => request(`/operators/${operatorId}`),
  getBus: (busId) => request(`/buses/${busId}`),
  getAllLocations: () => request('/locations'),
  createLocation: (payload) => request('/locations', { method: 'POST', body: JSON.stringify(payload) }),
  getAllRoutes: () => request('/routes'),
  createRoute: (payload) => request('/routes', { method: 'POST', body: JSON.stringify(payload) }),
}

export { API_BASE }
