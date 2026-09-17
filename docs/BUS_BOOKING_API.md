# Bus Booking API Documentation

Base URL:

```text
http://localhost:8080/api/v1
```

For protected endpoints, send:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

## Table of Contents

- [Auth](#auth)
- [Bookings](#bookings)
- [Buses](#buses)
- [Seats](#seats)
- [Locations](#locations)
- [Operators](#operators)
- [Payments](#payments)
- [Routes](#routes)
- [Route Stops](#route-stops)
- [Tickets](#tickets)
- [Schedules](#schedules)
- [Trips](#trips)
- [Trip Seats](#trip-seats)
- [Users](#users)
- [End-to-End Flows](#end-to-end-flows)
- [Authorization Summary](#authorization-summary)

---

# Auth

Authentication endpoints are public.

## 1. Register Passenger

```http
POST /api/v1/auth/register
```

Creates a normal user with `ROLE_PASSENGER`.

### Request

```json
{
  "email": "passenger@example.com",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210"
}
```

### Response

```json
{
  "userId": 1,
  "email": "passenger@example.com",
  "firstName": "John",
  "message": "Registration successful"
}
```

---

## 2. Register Operator

```http
POST /api/v1/auth/operator/register
```

Creates the `User`, assigns `ROLE_OPERATOR`, and creates the associated `Operator` record.

An operator is **not** registered as a passenger first.

### Request

```json
{
  "email": "operator@example.com",
  "password": "Operator@123",
  "firstName": "John",
  "lastName": "Operator",
  "phone": "9876543210",
  "operatorName": "Chennai Express",
  "registrationNumber": "TN-CE-001",
  "contactPhone": "9876543210"
}
```

### Response

```json
{
  "userId": 2,
  "operatorId": 1,
  "email": "operator@example.com",
  "operatorName": "Chennai Express",
  "message": "Operator registration successful"
}
```

Database result:

```text
users
  ↓
user_roles → ROLE_OPERATOR
  ↓
operators
```

---

## 3. Login

```http
POST /api/v1/auth/login
```

Used by passengers, operators, and admins.

### Request

```json
{
  "email": "operator@example.com",
  "password": "Operator@123"
}
```

### Response

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

Use the token in subsequent protected requests.

---

# Bookings

Passenger operations.

## 4. Create Booking

```http
POST /api/v1/bookings
```

Requires `ROLE_PASSENGER`.

Create the seat hold first, then create the booking.

### Request

```json
{
  "tripId": 1,
  "seatHoldIds": [10, 11],
  "pickupLocationId": 1,
  "dropLocationId": 3
}
```

The authenticated passenger is obtained from the JWT. Do not trust a client-supplied `userId`.

### Flow

```text
Search trip
    ↓
Select seats
    ↓
POST /seat-holds
    ↓
POST /bookings
    ↓
POST /payments
    ↓
Ticket
```

---

## 5. Cancel Booking

```http
POST /api/v1/bookings/{bookingId}/cancel
```

Requires `ROLE_PASSENGER`.

Example:

```http
POST /api/v1/bookings/25/cancel
```

The booking must belong to the authenticated passenger.

A successful cancellation releases the booked seats and starts the refund flow where applicable.

---

## 6. Hold Seats

```http
POST /api/v1/seat-holds
```

Requires `ROLE_PASSENGER`.

### Request

```json
{
  "tripId": 1,
  "seatIds": [1, 2]
}
```

Current design uses a 10-minute hold.

Do not send `userId`; determine the user from the JWT.

---

# Buses

Bus writes require `ROLE_OPERATOR` or `ROLE_ADMIN`.

Operators may only manage their own buses.

## 7. Create Bus

```http
POST /api/v1/buses
```

### Request

```json
{
  "registrationNumber": "TN-01-AB-1234",
  "model": "Volvo B11R",
  "busType": "SEMI_SLEEPER",
  "status": "ACTIVE"
}
```

Prefer deriving the operator from the authenticated user:

```text
JWT
 ↓
User
 ↓
Operator
 ↓
Bus
```

Do not allow an operator to create a bus for an arbitrary `operatorId`.

---

## 8. List Buses

```http
GET /api/v1/buses
```

Requires authentication.

---

## 9. Get Bus

```http
GET /api/v1/buses/{id}
```

Example:

```http
GET /api/v1/buses/15
```

---

## 10. Get Buses by Operator

```http
GET /api/v1/buses/operator/{operatorId}
```

Example:

```http
GET /api/v1/buses/operator/3
```

Operators should only access their own buses; admins can access all.

---

## 11. Update Bus

```http
PUT /api/v1/buses/{id}
```

### Request

```json
{
  "registrationNumber": "TN-01-AB-1234",
  "model": "Volvo B11R",
  "busType": "SEMI_SLEEPER",
  "status": "ACTIVE"
}
```

---

## 12. Delete Bus

```http
DELETE /api/v1/buses/{id}
```

Example:

```http
DELETE /api/v1/buses/15
```

---

# Seats

Seats belong to buses.

Writes require `ROLE_OPERATOR` or `ROLE_ADMIN`.

## 13. Create Seat

```http
POST /api/v1/seats
```

### Request

```json
{
  "busId": 15,
  "seatNumber": "01",
  "seatType": "SEAT",
  "position": "WINDOW"
}
```

---

## 14. Get Seat

```http
GET /api/v1/seats/{id}
```

Example:

```http
GET /api/v1/seats/120
```

---

## 15. Get Seats by Bus

```http
GET /api/v1/seats/bus/{busId}
```

Example:

```http
GET /api/v1/seats/bus/15
```

Useful for displaying a bus seat layout.

---

## 16. Update Seat

```http
PUT /api/v1/seats/{id}
```

### Request

```json
{
  "busId": 15,
  "seatNumber": "01",
  "seatType": "SEAT",
  "position": "WINDOW"
}
```

---

## 17. Delete Seat

```http
DELETE /api/v1/seats/{id}
```

Example:

```http
DELETE /api/v1/seats/120
```

---

# Locations

Location reads require authentication.

Location creation/update/deletion are admin operations.

## 18. Create Location

```http
POST /api/v1/locations
```

### Request

```json
{
  "name": "Chennai Central",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "country": "India",
  "latitude": 13.0827,
  "longitude": 80.2707
}
```

---

## 19. List Locations

```http
GET /api/v1/locations
```

---

## 20. Get Location

```http
GET /api/v1/locations/{id}
```

Example:

```http
GET /api/v1/locations/1
```

---

## 21. Update Location

```http
PUT /api/v1/locations/{id}
```

Admin only.

### Request

```json
{
  "name": "Chennai Central",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "country": "India",
  "latitude": 13.0827,
  "longitude": 80.2707
}
```

---

## 22. Delete Location

```http
DELETE /api/v1/locations/{id}
```

Admin only.

---

# Operators

Normal operator registration is done through:

```http
POST /api/v1/auth/operator/register
```

The following endpoints are operator-resource management endpoints.

## 23. Create Operator

```http
POST /api/v1/operators
```

With the new registration flow, this should **not** be used for normal operator registration.

Prefer:

```http
POST /api/v1/auth/operator/register
```

If this endpoint is retained, restrict it to admin use.

---

## 24. List Operators

```http
GET /api/v1/operators
```

Returns registered operators.

---

## 25. Get Operator

```http
GET /api/v1/operators/{id}
```

Example:

```http
GET /api/v1/operators/5
```

---

## 26. Update Operator

```http
PUT /api/v1/operators/{id}
```

### Request

```json
{
  "name": "Chennai Express",
  "registrationNumber": "TN-CE-001",
  "contactEmail": "operator@example.com",
  "contactPhone": "9876543210",
  "status": "ACTIVE"
}
```

---

## 27. Delete Operator

```http
DELETE /api/v1/operators/{id}
```

Admin operation.

---

# Payments

Payment operations require `ROLE_PASSENGER`.

## 28. Process Payment

```http
POST /api/v1/payments
```

### Request

```json
{
  "bookingId": 25,
  "paymentMethod": "UPI"
}
```

Supported methods:

```text
CARD
UPI
NET_BANKING
WALLET
```

### Flow

```text
Booking
   ↓
Payment
   ↓
SUCCESS
   ↓
SeatHold → CONVERTED
TripSeat → BOOKED
   ↓
Ticket generated
```

The service must verify that the booking belongs to the authenticated passenger.

---

# Routes

Routes define the logical journey.

Route writes are admin operations. Reads require authentication.

## 29. Create Route

```http
POST /api/v1/routes
```

### Request

```json
{
  "name": "Chennai - Pondicherry",
  "status": "ACTIVE"
}
```

Route stops are created separately.

---

## 30. List Routes

```http
GET /api/v1/routes
```

---

## 31. Get Route

```http
GET /api/v1/routes/{id}
```

Example:

```http
GET /api/v1/routes/1
```

---

## 32. Update Route

```http
PUT /api/v1/routes/{id}
```

### Request

```json
{
  "name": "Chennai - Pondicherry",
  "status": "ACTIVE"
}
```

---

## 33. Delete Route

```http
DELETE /api/v1/routes/{id}
```

---

# Route Stops

A route is composed of ordered locations.

Example:

```text
Chennai → Mahabalipuram → Pondicherry

Stop 1: Chennai          0 km
Stop 2: Mahabalipuram   55 km
Stop 3: Pondicherry    130 km
```

`distanceFromOriginKm` is also used by the pricing calculation.

## 34. Create Route Stop

```http
POST /api/v1/route-stops
```

### Request

```json
{
  "routeId": 1,
  "locationId": 1,
  "stopOrder": 1,
  "arrivalOffsetMinutes": 0,
  "departureOffsetMinutes": 5,
  "distanceFromOriginKm": 0
}
```

Example second stop:

```json
{
  "routeId": 1,
  "locationId": 4,
  "stopOrder": 2,
  "arrivalOffsetMinutes": 60,
  "departureOffsetMinutes": 65,
  "distanceFromOriginKm": 55
}
```

---

## 35. Get Route Stop

```http
GET /api/v1/route-stops/{id}
```

---

## 36. Get Route Stops

```http
GET /api/v1/route-stops/route/{routeId}
```

Example:

```http
GET /api/v1/route-stops/route/1
```

Returns the stops that form the route.

---

## 37. Update Route Stop

```http
PUT /api/v1/route-stops/{id}
```

### Request

```json
{
  "routeId": 1,
  "locationId": 4,
  "stopOrder": 2,
  "arrivalOffsetMinutes": 60,
  "departureOffsetMinutes": 65,
  "distanceFromOriginKm": 55
}
```

---

## 38. Delete Route Stop

```http
DELETE /api/v1/route-stops/{id}
```

---

# Tickets

Tickets represent confirmed passenger journeys.

## 39. Generate Ticket

```http
POST /api/v1/tickets/booking/{bookingId}
```

Example:

```http
POST /api/v1/tickets/booking/25
```

The intended business flow is for ticket generation to happen automatically after successful payment.

---

## 40. Get Ticket by Booking

```http
GET /api/v1/tickets/booking/{bookingId}
```

Example:

```http
GET /api/v1/tickets/booking/25
```

A passenger should only retrieve their own booking's ticket.

---

## 41. Get Ticket by Ticket Number

```http
GET /api/v1/tickets/{ticketNumber}
```

Example:

```http
GET /api/v1/tickets/TKT-2026-000025
```

---

# Schedules

A schedule defines a recurring service.

```text
Route
  +
Bus
  +
Departure time
  +
Operating days
  +
Pricing
```

## 42. Create Schedule

```http
POST /api/v1/schedules
```

Operator/Admin.

### Request

```json
{
  "routeId": 1,
  "busId": 15,
  "departureTime": "08:30:00",
  "effectiveFrom": "2026-09-01",
  "effectiveUntil": "2026-12-31",
  "operatingDays": "MON,TUE,WED,THU,FRI,SAT,SUN",
  "baseFare": 200.00,
  "pricePerKm": 2.50,
  "status": "ACTIVE"
}
```

The operator must own the selected bus.

Pricing is copied to the trip when a trip is created.

---

## 43. List Schedules

```http
GET /api/v1/schedules
```

---

## 44. Get Schedule

```http
GET /api/v1/schedules/{id}
```

---

## 45. Get Schedules by Route

```http
GET /api/v1/schedules/route/{routeId}
```

Example:

```http
GET /api/v1/schedules/route/1
```

---

## 46. Get Schedules by Bus

```http
GET /api/v1/schedules/bus/{busId}
```

Example:

```http
GET /api/v1/schedules/bus/15
```

---

## 47. Update Schedule

```http
PUT /api/v1/schedules/{id}
```

### Request

```json
{
  "routeId": 1,
  "busId": 15,
  "departureTime": "09:00:00",
  "effectiveFrom": "2026-09-01",
  "effectiveUntil": "2026-12-31",
  "operatingDays": "MON,TUE,WED,THU,FRI,SAT,SUN",
  "baseFare": 220.00,
  "pricePerKm": 2.75,
  "status": "ACTIVE"
}
```

---

## 48. Delete Schedule

```http
DELETE /api/v1/schedules/{id}
```

---

# Trips

A trip is a concrete instance of a schedule on a specific date.

```text
Schedule
  ↓
Trip on 2026-09-15
```

Creating a trip should also create its `TripSeat` records.

For a 40-seat bus:

```text
1 Trip
 ↓
40 TripSeats
```

## 49. Create Trip

```http
POST /api/v1/trips
```

### Request

```json
{
  "scheduleId": 1,
  "tripDate": "2026-09-15"
}
```

---

## 50. List Trips

```http
GET /api/v1/trips
```

Returns trips available to the authenticated user according to current authorization rules.

---

## 51. Get Trip

```http
GET /api/v1/trips/{id}
```

Example:

```http
GET /api/v1/trips/100
```

---

## 52. Get Trips by Route

```http
GET /api/v1/trips/route/{routeId}
```

Example:

```http
GET /api/v1/trips/route/1
```

Useful for trip search.

---

## 53. Get Trips by Bus

```http
GET /api/v1/trips/bus/{busId}
```

Example:

```http
GET /api/v1/trips/bus/15
```

---

## 54. Update Trip

```http
PUT /api/v1/trips/{id}
```

Use the fields supported by the current `TripRequest`.

Example:

```json
{
  "scheduleId": 1,
  "tripDate": "2026-09-15"
}
```

Trips with existing bookings should not be freely modified.

---

## 55. Delete Trip

```http
DELETE /api/v1/trips/{id}
```

Avoid deleting trips with active bookings.

---

# Trip Seats

A `TripSeat` is the inventory record for one physical seat on one specific trip.

```text
Bus 15
  └── Seat 01

Trip 100
  └── TripSeat 5001
```

Possible statuses:

```text
AVAILABLE
HELD
BOOKED
BLOCKED
```

## 56. Get Trip Seat

```http
GET /api/v1/trip-seats/{id}
```

Example:

```http
GET /api/v1/trip-seats/5001
```

---

## 57. Get Trip Seats

```http
GET /api/v1/trip-seats/trip/{tripId}
```

Example:

```http
GET /api/v1/trip-seats/trip/100
```

Use this endpoint to display the seat availability for a trip.

Example:

```json
[
  {
    "id": 5001,
    "seatId": 1,
    "seatNumber": "01",
    "status": "AVAILABLE"
  },
  {
    "id": 5002,
    "seatId": 2,
    "seatNumber": "02",
    "status": "BOOKED"
  },
  {
    "id": 5003,
    "seatId": 3,
    "seatNumber": "03",
    "status": "HELD"
  }
]
```

---

# Users

The `/users` endpoints are administrative operations.

Normal passengers should use `/auth/register`.

Operators should use `/auth/operator/register`.

## 58. Create User

```http
POST /api/v1/users
```

Admin only.

### Request

```json
{
  "email": "created@example.com",
  "password": "Password@123",
  "firstName": "Created",
  "lastName": "User",
  "phone": "9876543210",
  "status": "ACTIVE"
}
```

Use this for administrative user creation.

---

## 59. List Users

```http
GET /api/v1/users
```

Admin only.

---

## 60. Get User

```http
GET /api/v1/users/{id}
```

Example:

```http
GET /api/v1/users/20
```

---

## 61. Update User

```http
PUT /api/v1/users/{id}
```

### Request

```json
{
  "email": "user@example.com",
  "password": "NewPassword@123",
  "firstName": "Updated",
  "lastName": "User",
  "phone": "9876543210",
  "status": "ACTIVE"
}
```

---

## 62. Delete User

```http
DELETE /api/v1/users/{id}
```

Admin only.

---

# End-to-End Flows

## Passenger

```text
POST /auth/register
        ↓
POST /auth/login
        ↓
GET /trips
        ↓
GET /trip-seats/trip/{tripId}
        ↓
POST /seat-holds
        ↓
POST /bookings
        ↓
POST /payments
        ↓
GET /tickets/booking/{bookingId}
```

## Operator

```text
POST /auth/operator/register
        ↓
POST /auth/login
        ↓
POST /buses
        ↓
POST /seats
        ↓
POST /schedules
        ↓
POST /trips
        ↓
GET /trip-seats/trip/{tripId}
```

## Admin

```text
POST /auth/login
        ↓
Locations
        ↓
Routes
        ↓
Route Stops
        ↓
Users / Operators
        ↓
Platform management
```

---

# Authorization Summary

| Resource | Passenger | Operator | Admin |
|---|:---:|:---:|:---:|
| Passenger registration | Public | Public | Public |
| Operator registration | Public | Public | Public |
| Login | Public | Public | Public |
| Bookings | Own | ❌ | — |
| Seat holds | Own | ❌ | — |
| Payments | Own | ❌ | — |
| Tickets | Own | — | ✅ |
| Buses | Read | Own | ✅ |
| Seats | Read | Own buses | ✅ |
| Locations | Read | Read | ✅ |
| Operators | Read | Own | ✅ |
| Routes | Read | Read | ✅ |
| Route stops | Read | Read | ✅ |
| Schedules | Read | Own | ✅ |
| Trips | Read | Own | ✅ |
| Trip seats | Read | Read | ✅ |
| Users | ❌ | ❌ | ✅ |

## Security Principles

### Never trust client-supplied user identity

For authenticated operations:

```java
String email = SecurityUtils.getCurrentUserEmail();
User user = userService.findByEmail(email);
```

rather than accepting arbitrary `userId`.

### Operator ownership

```text
JWT
 ↓
User
 ↓
Operator
 ↓
Owned Bus
 ↓
Owned Seats / Schedules / Trips
```

`ROLE_OPERATOR` means that the user is an operator. It does not mean they own every operator resource.

### Passenger ownership

A passenger may only:

- access their own bookings
- cancel their own bookings
- pay for their own bookings
- access their own tickets

### Role and ownership are separate checks

```text
Role check:
"Are you an OPERATOR?"

Ownership check:
"Does this bus belong to you?"
```

Both checks are required for operator resource operations.
