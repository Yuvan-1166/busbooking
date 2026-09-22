# Bus Booking API Documentation

#### Base URL: http://localhost:8080

---

## Auth Endpoints


### POST /api/v1/auth/register
**Purpose:** Register a new passenger or operator account (unified endpoint, dispatched by `userType` via registration strategies) \
**Access:** Public \
**Request Body:**
```json
{
    "userType": "PASSENGER",
    "email": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string"
}
```
For an operator account, `userType` is `"OPERATOR"` and the operator-specific fields are required:
```json
{
    "userType": "OPERATOR",
    "email": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "operatorName": "string",
    "registrationNumber": "string",
    "contactPhone": "string"
}
```

**Response:**
```json
{
    "userId": 1,
    "operatorId": null,
    "email": "user@example.com",
    "firstName": "string",
    "operatorName": null,
    "message": "Registration successful. Check your email for a verification code."
}
```

---

### POST /api/v1/auth/reset-password
**Purpose:** Verify OTP and update user's password \
**Access:** Public \
**Request Body:**

```json
{
    "email": "string",
    "otp": "String",
    "newPassword": "String"
}
```

**Response:**
```json
{
  "message": "Password reset successfully",
  "success": boolean
}
```

---

### POST /api/v1/auth/forgot-password
**Purpose:** Sends an OTP to the registered user's email to reset Password
**Access:** Public
**Request Body:**

```json
{
    "email": "string"
}
```

**Response:** 
```json
{
  "message": "string",
  "success": boolean
}
```

---

### POST /api/v1/auth/oauth/authorize
**Purpose:** Step 1 of unified OAuth sign-in. Generates the provider's authorization URL (and CSRF state). Clients with client-side authorization (e.g. Google) can skip the redirect and go straight to the callback.
**Access:** Public
**Request Body:**
- `provider` (string) - OAuth provider (GOOGLE or TWITTER)

**Response:**
```json
{
  "provider": "TWITTER",
  "authorizeUrl": "https://twitter.com/i/oauth2/authorize?...",
  "state": "opaque-csrf-state"
}
```

---

### POST /api/v1/auth/oauth/callback
**Purpose:** Step 2 of unified OAuth sign-in. Validates the provider callback, creates or updates the user, and issues a JWT. Provider-specific fields are interpreted per provider:
- `GOOGLE` expects `idToken`
- `TWITTER` expects `code` and `state`
**Access:** Public
**Request Body:**
- `provider` (string) - OAuth provider (GOOGLE or TWITTER)
- `userType` (string) - Type of user (PASSENGER or OPERATOR)
- `idToken` (string, GOOGLE only) - Google ID token
- `code` (string, TWITTER only) - Authorization code from the provider's redirect
- `state` (string, TWITTER only) - CSRF state token returned at authorize

**Response:**
```json
{
  "accessToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "onboardingRequired": true
}
```

---

### POST /api/v1/auth/login
**Purpose:** Authenticate user with email and password
**Access:** Public
**Request Body:**
- `email` (string) - User email
- `password` (string) - User password

**Response:**
```json
{
  "accessToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

---

### POST /api/v1/auth/login/verify-totp
**Purpose:** Verify TOTP code and complete login
**Access:** Public
**Request Body:**
- `tempToken` (string) - Temporary JWT token from initial login
- `totpCode` (string) - 6-digit TOTP code
- `ipAddress` (string) - Client IP address
- `userAgent` (string) - Client user agent

**Response:**
```json
{
  "accessToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

---

### POST /api/v1/auth/onboarding/complete
**Purpose:** Completes user onboarding after Google OAuth (assigns role, saves profile, creates operator if needed)
**Access:** Authenticated
**Request Body:**
- `firstName` (string) - User's first name
- `lastName` (string) - User's last name
- `role` (string) - User role (PASSENGER or OPERATOR)
- `operatorName` (string, optional) - Business name if operator
- `registrationNumber` (string, optional) - Registration number if operator
- `contactPhone` (string, optional) - Contact phone if operator

**Response:**
```json
{
  "accessToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

---

### POST /api/v1/auth/totp-alternative/send
**Purpose:** Send alternative OTP during TOTP login (SMS, Email, etc.)
**Access:** Public
**Request Body:**
- `tempToken` (string) - Temporary JWT token
- `method` (string) - OTP method (SMS or EMAIL)

**Response:**
```json
{
  "sessionId": 1,
  "method": "EMAIL",
  "maskedRecipient": "user@exam***.com"
}
```

---

### POST /api/v1/auth/totp-alternative/verify
**Purpose:** Verify alternative OTP code and authenticate user
**Access:** Public
**Request Body:**
- `tempToken` (string) - Temporary JWT token
- `sessionId` (string) - Session ID from send endpoint
- `code` (string) - OTP code

**Response:**
```json
{
  "accessToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

---

### POST /api/v1/auth/totp/backup-codes/generate
**Purpose:** Generate backup codes for authenticated user
**Access:** Authenticated
**Request Body:** Empty

**Response:**
```json
{
  "backupCodes": ["code1", "code2", ...],
  "message": "Backup codes generated successfully"
}
```

---

### POST /api/v1/auth/totp/disable
**Purpose:** Disable TOTP 2FA (requires password confirmation)
**Access:** Authenticated
**Request Body:**
- `password` (string) - User's current password

**Response:**
```json
{
  "message": "Two-factor authentication has been disabled."
}
```

---

### POST /api/v1/auth/totp/setup
**Purpose:** Generate TOTP secret and QR code for enabling 2FA
**Access:** Authenticated
**Request Body:** Empty

**Response:**
```json
{
  "secret": "string",
  "qrCode": "string (base64 or URL)"
}
```

---

### POST /api/v1/auth/totp/verify-setup
**Purpose:** Verify TOTP code during initial setup and enable 2FA
**Access:** Authenticated
**Request Body:**
- `totpCode` (string) - 6-digit TOTP code to verify

**Response:**
```json
{
  "message": "Two-factor authentication enabled successfully."
}
```

---

### POST /api/v1/auth/verify/confirm
**Purpose:** Confirm 6-digit OTP and activate user account
**Access:** Public
**Request Body:**
- `email` (string) - User email
- `otp` (string) - 6-digit OTP code

**Response:**
```json
{
  "message": "Email verified successfully. You can now sign in."
}
```

---

### POST /api/v1/auth/verify/send
**Purpose:** Send 6-digit OTP for email verification to pending user
**Access:** Public
**Request Body:**
- `email` (string) - User email

**Response:**
```json
{
  "message": "Verification code sent to user@example.com"
}
```

---

## Booking Endpoints

### POST /api/v1/bookings
**Purpose:** Create a new booking
**Access:** Authenticated (PASSENGER role)
**Request Body:**
- `tripId` (long) - Trip ID
- `passengerId` (long) - Passenger ID
- `seatIds` (array of long) - Selected seat IDs
- `totalAmount` (decimal) - Total booking amount

**Response:**
```json
{
  "id": 1,
  "tripId": 1,
  "passengerId": 1,
  "status": "CONFIRMED",
  "totalAmount": 1000,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

---

### GET /api/v1/bookings/{bookingId}
**Purpose:** Get booking details by ID
**Access:** Authenticated (PASSENGER role)
**Path Parameters:**
- `bookingId` (long) - Booking ID

**Response:**
```json
{
  "id": 1,
  "tripId": 1,
  "passengerId": 1,
  "seats": ["A1", "A2"],
  "status": "CONFIRMED",
  "totalAmount": 1000,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

---

### POST /api/v1/bookings/{bookingId}/cancel
**Purpose:** Cancel a booking
**Access:** Authenticated (PASSENGER role)
**Path Parameters:**
- `bookingId` (long) - Booking ID
**Request Body:**
- `reason` (string) - Cancellation reason
- `requestedRefund` (decimal) - Refund amount requested

**Response:**
```json
{
  "id": 1,
  "status": "CANCELLED",
  "refundAmount": 950,
  "message": "Booking cancelled successfully"
}
```

---

## Bus Endpoints

### POST /api/v1/buses
**Purpose:** Create a new bus
**Access:** Authenticated (ADMIN or OPERATOR role)
**Request Body:**
- `operatorId` (long) - Operator ID
- `busNumber` (string) - Bus registration number
- `busType` (string) - Bus type (AC, NON_AC, SLEEPER, etc.)
- `totalSeats` (int) - Total number of seats
- `amenities` (array of string) - Bus amenities

**Response:**
```json
{
  "id": 1,
  "operatorId": 1,
  "busNumber": "ABC-123",
  "busType": "AC",
  "totalSeats": 48,
  "amenities": ["WiFi", "Charging"]
}
```

---

### GET /api/v1/buses
**Purpose:** Get all buses
**Access:** Authenticated
**Query Parameters:** None

**Response:**
```json
[
  {
    "id": 1,
    "operatorId": 1,
    "busNumber": "ABC-123",
    "busType": "AC",
    "totalSeats": 48
  }
]
```

---

### GET /api/v1/buses/{id}
**Purpose:** Get bus details by ID
**Access:** Authenticated
**Path Parameters:**
- `id` (long) - Bus ID

**Response:**
```json
{
  "id": 1,
  "operatorId": 1,
  "busNumber": "ABC-123",
  "busType": "AC",
  "totalSeats": 48,
  "amenities": ["WiFi", "Charging"]
}
```

---

### GET /api/v1/buses/operator/{operatorId}
**Purpose:** Get all buses for an operator
**Access:** Authenticated
**Path Parameters:**
- `operatorId` (long) - Operator ID

**Response:**
```json
[
  {
    "id": 1,
    "operatorId": 1,
    "busNumber": "ABC-123",
    "busType": "AC",
    "totalSeats": 48
  }
]
```

---

### PUT /api/v1/buses/{id}
**Purpose:** Update bus details
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Bus ID
**Request Body:**
- `busNumber` (string) - Bus registration number
- `busType` (string) - Bus type
- `amenities` (array of string) - Bus amenities

**Response:**
```json
{
  "id": 1,
  "operatorId": 1,
  "busNumber": "ABC-123",
  "busType": "AC",
  "totalSeats": 48
}
```

---

### DELETE /api/v1/buses/{id}
**Purpose:** Delete a bus
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Bus ID

**Response:** 204 No Content

---

## Location Endpoints

### POST /api/v1/locations
**Purpose:** Create a new location
**Access:** Authenticated (ADMIN role)
**Request Body:**
- `name` (string) - Location name
- `city` (string) - City name
- `state` (string) - State name
- `latitude` (decimal) - Latitude coordinate
- `longitude` (decimal) - Longitude coordinate

**Response:**
```json
{
  "id": 1,
  "name": "Central Bus Station",
  "city": "Bangalore",
  "state": "Karnataka",
  "latitude": 13.0827,
  "longitude": 80.2707
}
```

---

### GET /api/v1/locations
**Purpose:** Get all locations
**Access:** Authenticated
**Query Parameters:** None

**Response:**
```json
[
  {
    "id": 1,
    "name": "Central Bus Station",
    "city": "Bangalore",
    "state": "Karnataka"
  }
]
```

---

### GET /api/v1/locations/{id}
**Purpose:** Get location details by ID
**Access:** Authenticated
**Path Parameters:**
- `id` (long) - Location ID

**Response:**
```json
{
  "id": 1,
  "name": "Central Bus Station",
  "city": "Bangalore",
  "state": "Karnataka",
  "latitude": 13.0827,
  "longitude": 80.2707
}
```

---

### PUT /api/v1/locations/{id}
**Purpose:** Update location details
**Access:** Authenticated (ADMIN role)
**Path Parameters:**
- `id` (long) - Location ID
**Request Body:**
- `name` (string) - Location name
- `city` (string) - City name
- `state` (string) - State name
- `latitude` (decimal) - Latitude coordinate
- `longitude` (decimal) - Longitude coordinate

**Response:**
```json
{
  "id": 1,
  "name": "Central Bus Station",
  "city": "Bangalore",
  "state": "Karnataka"
}
```

---

### DELETE /api/v1/locations/{id}
**Purpose:** Delete a location
**Access:** Authenticated (ADMIN role)
**Path Parameters:**
- `id` (long) - Location ID

**Response:** 204 No Content

---

## Operator Endpoints

### POST /api/v1/operators
**Purpose:** Create a new operator
**Access:** Authenticated (ADMIN role)
**Request Body:**
- `userId` (long) - Associated user ID
- `operatorName` (string) - Business name
- `registrationNumber` (string) - Business registration number
- `contactPhone` (string) - Contact phone number
- `description` (string, optional) - Business description

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "operatorName": "ABC Travels",
  "registrationNumber": "REG-123",
  "contactPhone": "9999999999"
}
```

---

### GET /api/v1/operators
**Purpose:** Get all operators
**Access:** Authenticated
**Query Parameters:** None

**Response:**
```json
[
  {
    "id": 1,
    "operatorName": "ABC Travels",
    "registrationNumber": "REG-123",
    "contactPhone": "9999999999"
  }
]
```

---

### GET /api/v1/operators/{id}
**Purpose:** Get operator details by ID
**Access:** Authenticated
**Path Parameters:**
- `id` (long) - Operator ID

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "operatorName": "ABC Travels",
  "registrationNumber": "REG-123",
  "contactPhone": "9999999999"
}
```

---

### PUT /api/v1/operators/{id}
**Purpose:** Update operator details
**Access:** Authenticated (ADMIN role)
**Path Parameters:**
- `id` (long) - Operator ID
**Request Body:**
- `operatorName` (string) - Business name
- `registrationNumber` (string) - Business registration number
- `contactPhone` (string) - Contact phone number

**Response:**
```json
{
  "id": 1,
  "operatorName": "ABC Travels",
  "registrationNumber": "REG-123",
  "contactPhone": "9999999999"
}
```

---

### DELETE /api/v1/operators/{id}
**Purpose:** Delete an operator
**Access:** Authenticated (ADMIN role)
**Path Parameters:**
- `id` (long) - Operator ID

**Response:** 204 No Content

---

## Payment Endpoints

### POST /api/v1/payments
**Purpose:** Process a payment
**Access:** Authenticated (PASSENGER role)
**Request Body:**
- `bookingId` (long) - Booking ID
- `amount` (decimal) - Payment amount
- `paymentMethod` (string) - Payment method (CARD, UPI, WALLET)
- `transactionId` (string) - Payment gateway transaction ID

**Response:**
```json
{
  "id": 1,
  "bookingId": 1,
  "amount": 1000,
  "paymentMethod": "CARD",
  "status": "SUCCESS",
  "transactionId": "TXN-123"
}
```

---

## Route Endpoints

### POST /api/v1/routes
**Purpose:** Create a new route
**Access:** Authenticated (ADMIN or OPERATOR role)
**Request Body:**
- `routeName` (string) - Route name
- `startLocationId` (long) - Start location ID
- `endLocationId` (long) - End location ID
- `distance` (decimal) - Distance in kilometers
- `estimatedDuration` (int) - Estimated duration in minutes

**Response:**
```json
{
  "id": 1,
  "routeName": "Bangalore - Chennai",
  "startLocationId": 1,
  "endLocationId": 2,
  "distance": 350,
  "estimatedDuration": 360
}
```

---

### GET /api/v1/routes
**Purpose:** Get all routes
**Access:** Authenticated
**Query Parameters:** None

**Response:**
```json
[
  {
    "id": 1,
    "routeName": "Bangalore - Chennai",
    "startLocationId": 1,
    "endLocationId": 2,
    "distance": 350
  }
]
```

---

### GET /api/v1/routes/{id}
**Purpose:** Get route details by ID
**Access:** Authenticated
**Path Parameters:**
- `id` (long) - Route ID

**Response:**
```json
{
  "id": 1,
  "routeName": "Bangalore - Chennai",
  "startLocationId": 1,
  "endLocationId": 2,
  "distance": 350,
  "estimatedDuration": 360
}
```

---

### PUT /api/v1/routes/{id}
**Purpose:** Update route details
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Route ID
**Request Body:**
- `routeName` (string) - Route name
- `distance` (decimal) - Distance in kilometers
- `estimatedDuration` (int) - Estimated duration in minutes

**Response:**
```json
{
  "id": 1,
  "routeName": "Bangalore - Chennai",
  "distance": 350,
  "estimatedDuration": 360
}
```

---

### DELETE /api/v1/routes/{id}
**Purpose:** Delete a route
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Route ID

**Response:** 204 No Content

---

## Route Stop Endpoints

### POST /api/v1/route-stops
**Purpose:** Create a new route stop
**Access:** Authenticated (ADMIN or OPERATOR role)
**Request Body:**
- `routeId` (long) - Route ID
- `locationId` (long) - Location ID
- `stopSequence` (int) - Stop sequence/order
- `arrivalTime` (string) - Arrival time (HH:mm format)
- `departureTime` (string) - Departure time (HH:mm format)

**Response:**
```json
{
  "id": 1,
  "routeId": 1,
  "locationId": 1,
  "stopSequence": 1,
  "arrivalTime": "08:00",
  "departureTime": "08:15"
}
```

---

### GET /api/v1/route-stops/{id}
**Purpose:** Get route stop details by ID
**Access:** Authenticated
**Path Parameters:**
- `id` (long) - Route stop ID

**Response:**
```json
{
  "id": 1,
  "routeId": 1,
  "locationId": 1,
  "stopSequence": 1,
  "arrivalTime": "08:00",
  "departureTime": "08:15"
}
```

---

### GET /api/v1/route-stops/route/{routeId}
**Purpose:** Get all stops for a route
**Access:** Authenticated
**Path Parameters:**
- `routeId` (long) - Route ID

**Response:**
```json
[
  {
    "id": 1,
    "routeId": 1,
    "locationId": 1,
    "stopSequence": 1,
    "arrivalTime": "08:00",
    "departureTime": "08:15"
  }
]
```

---

### PUT /api/v1/route-stops/{id}
**Purpose:** Update route stop details
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Route stop ID
**Request Body:**
- `stopSequence` (int) - Stop sequence/order
- `arrivalTime` (string) - Arrival time (HH:mm format)
- `departureTime` (string) - Departure time (HH:mm format)

**Response:**
```json
{
  "id": 1,
  "routeId": 1,
  "locationId": 1,
  "stopSequence": 1,
  "arrivalTime": "08:00",
  "departureTime": "08:15"
}
```

---

### DELETE /api/v1/route-stops/{id}
**Purpose:** Delete a route stop
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Route stop ID

**Response:** 204 No Content

---

## Schedule Endpoints

### POST /api/v1/schedules
**Purpose:** Create a new schedule
**Access:** Authenticated (ADMIN or OPERATOR role)
**Request Body:**
- `routeId` (long) - Route ID
- `busId` (long) - Bus ID
- `departureDate` (string) - Departure date (YYYY-MM-DD)
- `departureTime` (string) - Departure time (HH:mm format)
- `availableSeats` (int) - Number of available seats
- `farePerSeat` (decimal) - Fare per seat

**Response:**
```json
{
  "id": 1,
  "routeId": 1,
  "busId": 1,
  "departureDate": "2024-12-25",
  "departureTime": "08:00",
  "availableSeats": 48,
  "farePerSeat": 500
}
```

---

### GET /api/v1/schedules
**Purpose:** Get all schedules
**Access:** Authenticated
**Query Parameters:** None

**Response:**
```json
[
  {
    "id": 1,
    "routeId": 1,
    "busId": 1,
    "departureDate": "2024-12-25",
    "availableSeats": 48,
    "farePerSeat": 500
  }
]
```

---

### GET /api/v1/schedules/{id}
**Purpose:** Get schedule details by ID
**Access:** Authenticated
**Path Parameters:**
- `id` (long) - Schedule ID

**Response:**
```json
{
  "id": 1,
  "routeId": 1,
  "busId": 1,
  "departureDate": "2024-12-25",
  "departureTime": "08:00",
  "availableSeats": 48,
  "farePerSeat": 500
}
```

---

### GET /api/v1/schedules/bus/{busId}
**Purpose:** Get all schedules for a bus
**Access:** Authenticated
**Path Parameters:**
- `busId` (long) - Bus ID

**Response:**
```json
[
  {
    "id": 1,
    "routeId": 1,
    "busId": 1,
    "departureDate": "2024-12-25",
    "availableSeats": 48,
    "farePerSeat": 500
  }
]
```

---

### GET /api/v1/schedules/route/{routeId}
**Purpose:** Get all schedules for a route
**Access:** Authenticated
**Path Parameters:**
- `routeId` (long) - Route ID

**Response:**
```json
[
  {
    "id": 1,
    "routeId": 1,
    "busId": 1,
    "departureDate": "2024-12-25",
    "availableSeats": 48,
    "farePerSeat": 500
  }
]
```

---

### PUT /api/v1/schedules/{id}
**Purpose:** Update schedule details
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Schedule ID
**Request Body:**
- `availableSeats` (int) - Number of available seats
- `farePerSeat` (decimal) - Fare per seat

**Response:**
```json
{
  "id": 1,
  "routeId": 1,
  "busId": 1,
  "departureDate": "2024-12-25",
  "availableSeats": 48,
  "farePerSeat": 500
}
```

---

### DELETE /api/v1/schedules/{id}
**Purpose:** Delete a schedule
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Schedule ID

**Response:** 204 No Content

---

## Seat Endpoints

### POST /api/v1/seats
**Purpose:** Create a new seat in a bus
**Access:** Authenticated (ADMIN or OPERATOR role)
**Request Body:**
- `busId` (long) - Bus ID
- `seatNumber` (string) - Seat number (e.g., "A1", "B2")
- `seatType` (string) - Seat type (NORMAL, SLEEPER, etc.)

**Response:**
```json
{
  "id": 1,
  "busId": 1,
  "seatNumber": "A1",
  "seatType": "NORMAL"
}
```

---

### GET /api/v1/seats/{id}
**Purpose:** Get seat details by ID
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Seat ID

**Response:**
```json
{
  "id": 1,
  "busId": 1,
  "seatNumber": "A1",
  "seatType": "NORMAL"
}
```

---

### GET /api/v1/seats/bus/{busId}
**Purpose:** Get all seats for a bus
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `busId` (long) - Bus ID

**Response:**
```json
[
  {
    "id": 1,
    "busId": 1,
    "seatNumber": "A1",
    "seatType": "NORMAL"
  }
]
```

---

### PUT /api/v1/seats/{id}
**Purpose:** Update seat details
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Seat ID
**Request Body:**
- `seatNumber` (string) - Seat number
- `seatType` (string) - Seat type

**Response:**
```json
{
  "id": 1,
  "busId": 1,
  "seatNumber": "A1",
  "seatType": "NORMAL"
}
```

---

### DELETE /api/v1/seats/{id}
**Purpose:** Delete a seat
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Seat ID

**Response:** 204 No Content

---

## Seat Hold Endpoints

### POST /api/v1/seat-holds
**Purpose:** Hold multiple seats for a trip
**Access:** Authenticated (PASSENGER role)
**Request Body:**
- `tripId` (long) - Trip ID
- `seatIds` (array of long) - Seat IDs to hold
- `holdDurationMinutes` (int) - Hold duration in minutes

**Response:**
```json
[
  {
    "id": 1,
    "tripId": 1,
    "seatId": 1,
    "seatNumber": "A1",
    "holdExpiryTime": "2024-12-25T10:30:00Z"
  }
]
```

---

## Ticket Endpoints

### POST /api/v1/tickets/booking/{bookingId}
**Purpose:** Generate ticket for a completed booking
**Access:** Authenticated (PASSENGER role)
**Path Parameters:**
- `bookingId` (long) - Booking ID

**Response:**
```json
{
  "id": 1,
  "ticketNumber": "TICK-20241225-001",
  "bookingId": 1,
  "passengerId": 1,
  "tripId": 1,
  "seats": ["A1", "A2"],
  "status": "ACTIVE",
  "generatedAt": "2024-12-25T08:00:00Z"
}
```

---

### GET /api/v1/tickets/booking
**Purpose:** Get all tickets for authenticated user
**Access:** Authenticated (ADMIN or PASSENGER role)
**Query Parameters:** None

**Response:**
```json
[
  {
    "id": 1,
    "ticketNumber": "TICK-20241225-001",
    "bookingId": 1,
    "passengerId": 1,
    "status": "ACTIVE"
  }
]
```

---

### GET /api/v1/tickets/booking/{bookingId}
**Purpose:** Get ticket by booking ID
**Access:** Authenticated (ADMIN or PASSENGER role)
**Path Parameters:**
- `bookingId` (long) - Booking ID

**Response:**
```json
{
  "id": 1,
  "ticketNumber": "TICK-20241225-001",
  "bookingId": 1,
  "passengerId": 1,
  "tripId": 1,
  "seats": ["A1", "A2"],
  "status": "ACTIVE"
}
```

---

### GET /api/v1/tickets/{ticketNumber}
**Purpose:** Get ticket by ticket number
**Access:** Authenticated (ADMIN or PASSENGER role)
**Path Parameters:**
- `ticketNumber` (string) - Ticket number

**Response:**
```json
{
  "id": 1,
  "ticketNumber": "TICK-20241225-001",
  "bookingId": 1,
  "passengerId": 1,
  "tripId": 1,
  "seats": ["A1", "A2"],
  "status": "ACTIVE"
}
```

---

## Trip Endpoints

### POST /api/v1/trips
**Purpose:** Create a new trip
**Access:** Authenticated (ADMIN or OPERATOR role)
**Request Body:**
- `scheduleId` (long) - Schedule ID
- `busId` (long) - Bus ID
- `routeId` (long) - Route ID
- `departureTime` (string) - Departure time (HH:mm)
- `arrivalTime` (string) - Arrival time (HH:mm)
- `farePerSeat` (decimal) - Fare per seat
- `totalSeats` (int) - Total seats available

**Response:**
```json
{
  "id": 1,
  "scheduleId": 1,
  "busId": 1,
  "routeId": 1,
  "departureTime": "08:00",
  "arrivalTime": "14:00",
  "farePerSeat": 500,
  "totalSeats": 48,
  "status": "SCHEDULED"
}
```

---

### POST /api/v1/trips/bulk
**Purpose:** Create multiple trips in bulk
**Access:** Authenticated (ADMIN or OPERATOR role)
**Request Body:**
- `trips` (array) - Array of trip objects

**Response:**
```json
[
  {
    "id": 1,
    "scheduleId": 1,
    "busId": 1,
    "routeId": 1,
    "status": "SCHEDULED"
  }
]
```

---

### GET /api/v1/trips
**Purpose:** Get all trips
**Access:** Public
**Query Parameters:** None

**Response:**
```json
[
  {
    "id": 1,
    "scheduleId": 1,
    "busId": 1,
    "routeId": 1,
    "farePerSeat": 500,
    "status": "SCHEDULED"
  }
]
```

---

### GET /api/v1/trips/{id}
**Purpose:** Get trip details by ID
**Access:** Public
**Path Parameters:**
- `id` (long) - Trip ID

**Response:**
```json
{
  "id": 1,
  "scheduleId": 1,
  "busId": 1,
  "routeId": 1,
  "departureTime": "08:00",
  "arrivalTime": "14:00",
  "farePerSeat": 500,
  "totalSeats": 48,
  "status": "SCHEDULED"
}
```

---

### GET /api/v1/trips/bus/{busId}
**Purpose:** Get all trips for a bus
**Access:** Public
**Path Parameters:**
- `busId` (long) - Bus ID

**Response:**
```json
[
  {
    "id": 1,
    "scheduleId": 1,
    "busId": 1,
    "routeId": 1,
    "farePerSeat": 500,
    "status": "SCHEDULED"
  }
]
```

---

### GET /api/v1/trips/route/{routeId}
**Purpose:** Get trips for a route on a specific date
**Access:** Public
**Path Parameters:**
- `routeId` (long) - Route ID
**Query Parameters:**
- `date` (string) - Date in YYYY-MM-DD format

**Response:**
```json
[
  {
    "id": 1,
    "scheduleId": 1,
    "busId": 1,
    "routeId": 1,
    "farePerSeat": 500,
    "status": "SCHEDULED"
  }
]
```

---

### PUT /api/v1/trips/{id}
**Purpose:** Update trip details
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Trip ID
**Request Body:**
- `departureTime` (string) - Departure time (HH:mm)
- `arrivalTime` (string) - Arrival time (HH:mm)
- `farePerSeat` (decimal) - Fare per seat

**Response:**
```json
{
  "id": 1,
  "scheduleId": 1,
  "busId": 1,
  "routeId": 1,
  "departureTime": "08:00",
  "arrivalTime": "14:00",
  "farePerSeat": 500,
  "status": "SCHEDULED"
}
```

---

### DELETE /api/v1/trips/{id}
**Purpose:** Delete a trip
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Trip ID

**Response:** 204 No Content

---

### POST /api/v1/trips/{id}/cancel
**Purpose:** Cancel a trip and refund all passengers
**Access:** Authenticated (ADMIN or OPERATOR role)
**Path Parameters:**
- `id` (long) - Trip ID
**Request Body:**
- `reason` (string) - Cancellation reason

**Response:** 204 No Content

---

## Trip Seat Endpoints

### GET /api/v1/trip-seats/{id}
**Purpose:** Get trip seat details by ID
**Access:** Authenticated
**Path Parameters:**
- `id` (long) - Trip seat ID

**Response:**
```json
{
  "id": 1,
  "tripId": 1,
  "seatId": 1,
  "seatNumber": "A1",
  "seatType": "NORMAL",
  "status": "AVAILABLE",
  "fare": 500
}
```

---

### GET /api/v1/trip-seats/trip/{tripId}
**Purpose:** Get all seats for a trip
**Access:** Authenticated
**Path Parameters:**
- `tripId` (long) - Trip ID

**Response:**
```json
[
  {
    "id": 1,
    "tripId": 1,
    "seatId": 1,
    "seatNumber": "A1",
    "seatType": "NORMAL",
    "status": "AVAILABLE",
    "fare": 500
  }
]
```

---

## User Endpoints

### POST /api/v1/users
**Purpose:** Create a new user (ADMIN only)
**Access:** Authenticated (ADMIN role)
**Request Body:**
- `email` (string) - User email
- `password` (string) - User password
- `firstName` (string) - First name
- `lastName` (string) - Last name
- `phone` (string) - Phone number
- `role` (string) - User role

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9999999999",
  "role": "PASSENGER"
}
```

---

### GET /api/v1/users
**Purpose:** Get all users
**Access:** Authenticated (ADMIN role)
**Query Parameters:** None

**Response:**
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "9999999999"
  }
]
```

---

### GET /api/v1/users/{id}
**Purpose:** Get user details by ID
**Access:** Authenticated (ADMIN role)
**Path Parameters:**
- `id` (long) - User ID

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9999999999",
  "role": "PASSENGER"
}
```

---

### GET /api/v1/users/me
**Purpose:** Get authenticated user's profile
**Access:** Authenticated
**Query Parameters:** None

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9999999999",
  "role": "PASSENGER"
}
```

---

### PUT /api/v1/users/{id}
**Purpose:** Update user details (ADMIN only)
**Access:** Authenticated (ADMIN role)
**Path Parameters:**
- `id` (long) - User ID
**Request Body:**
- `email` (string) - User email
- `firstName` (string) - First name
- `lastName` (string) - Last name
- `phone` (string) - Phone number

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9999999999"
}
```

---

### PUT /api/v1/users/me
**Purpose:** Update authenticated user's profile
**Access:** Authenticated
**Request Body:**
- `firstName` (string) - First name
- `lastName` (string) - Last name
- `phone` (string) - Phone number

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9999999999"
}
```

---

### DELETE /api/v1/users/{id}
**Purpose:** Delete a user
**Access:** Authenticated (ADMIN role)
**Path Parameters:**
- `id` (long) - User ID

**Response:** 204 No Content

---

### POST /api/v1/users/me/verify-mobile
**Purpose:** Verify mobile number of authenticated user
**Access:** Authenticated
**Request Body:** Empty

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "mobileVerified": true
}
```

---

## VerifyNow Endpoints

### POST /api/v1/verifynow/send-otp
**Purpose:** Send OTP to mobile number using VerifyNow service
**Access:** Authenticated
**Request Body:**
- `mobileNumber` (string) - 10-digit mobile number

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "VERI-123456",
    "message": "OTP sent successfully"
  },
  "message": "OTP sent successfully"
}
```

---

### POST /api/v1/verifynow/validate-otp
**Purpose:** Validate OTP received from VerifyNow service
**Access:** Authenticated
**Request Body:**
- `verificationId` (string) - Verification ID from send-otp response
- `code` (string) - OTP code (4-6 digits)

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "OTP validated successfully",
    "verificationId": "VERI-123456"
  },
  "message": "OTP validated successfully"
}
```

---

## Wallet Endpoints

### GET /api/v1/wallet
**Purpose:** Get wallet balance of authenticated passenger
**Access:** Authenticated (PASSENGER role)
**Query Parameters:** None

**Response:**
```json
{
  "balance": 5000.00,
  "currency": "INR",
  "lastUpdated": "2024-12-25T10:00:00Z"
}
```

---

## Response Codes

- `200 OK` - Successful GET, PUT request
- `201 CREATED` - Successful POST request creating a resource
- `204 NO CONTENT` - Successful DELETE request or POST with no response body
- `400 BAD REQUEST` - Invalid request parameters or validation error
- `401 UNAUTHORIZED` - Missing or invalid authentication
- `403 FORBIDDEN` - User lacks required permissions
- `404 NOT FOUND` - Resource not found
- `409 CONFLICT` - Resource already exists or conflict in operation
- `500 INTERNAL SERVER ERROR` - Server error

---

## Authentication

Most endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Error Response Format

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-12-25T10:00:00Z"
}
```

---
