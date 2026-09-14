# Bus Booking
src/main/java/com/yuvan/busbooking/

├── auth/
│   ├── controller/
│   ├── dto/
│   ├── security/
│   └── service/
│
├── user/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── operator/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── bus/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── route/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── trip/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── booking/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── payment/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── ticket/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
└── common/
    ├── config/
    ├── exception/
    ├── response/
    └── util/


## Available API

### Auth

- POST /api/v1/auth/register
- POST /api/v1/auth/operator/register
- POST /api/v1/auth/login

### Bookings

- POST /api/v1/bookings
- POST /api/v1/bookings/{bookingId}/cancel
- POST /api/v1/seat-holds

### Buses

- POST /api/v1/buses
- GET /api/v1/buses
- GET /api/v1/buses/{id}
- GET /api/v1/buses/operator/{operatorId}
- PUT /api/v1/buses/{id}
- DELETE /api/v1/buses/{id}

### Seats

- POST /api/v1/seats
- GET /api/v1/seats/{id}
- GET /api/v1/seats/bus/{busId}
- PUT /api/v1/seats/{id}
- DELETE /api/v1/seats/{id}

### Locations

- POST /api/v1/locations
- GET /api/v1/locations
- GET /api/v1/locations/{id}
- PUT /api/v1/locations/{id}
- DELETE /api/v1/locations/{id}

### Operators

- POST /api/v1/operators
- GET /api/v1/operators
- GET /api/v1/operators/{id}
- PUT /api/v1/operators/{id}
- DELETE /api/v1/operators/{id}

### Payments

- POST /api/v1/payments

### Routes

- POST /api/v1/routes
- GET /api/v1/routes
- GET /api/v1/routes/{id}
- PUT /api/v1/routes/{id}
- DELETE /api/v1/routes/{id}

### RouteStops

- POST /api/v1/route-stops
- GET /api/v1/route-stops/{id}
- GET /api/v1/route-stops/route/{routeId}
- PUT /api/v1/route-stops/{id}
- DELETE /api/v1/route-stops/{id}

### Tickets

- POST /api/v1/tickets/booking/{bookingId}
- GET /api/v1/tickets/booking/{bookingId}
- GET /api/v1/tickets/{ticketNumber}

### Schedules

- POST /api/v1/schedules
- GET /api/v1/schedules
- GET /api/v1/schedules/{id}
- GET /api/v1/schedules/route/{routeId}
- GET /api/v1/schedules/bus/{busId}
- PUT /api/v1/schedules/{id}
- DELETE /api/v1/schedules/{id}

### Trips

- POST /api/v1/trips
- GET /api/v1/trips
- GET /api/v1/trips/{id}
- GET /api/v1/trips/route/{routeId}
- GET /api/v1/trips/bus/{busId}
- PUT /api/v1/trips/{id}
- DELETE /api/v1/trips/{id}

### Trip-Seats

- GET /api/v1/trip-seats/{id}
- GET /api/v1/trip-seats/trip/{tripId}

### Users

- POST /api/v1/users
- GET /api/v1/users
- GET /api/v1/users/{id}
- PUT /api/v1/users/{id}
- DELETE /api/v1/users/{id}

