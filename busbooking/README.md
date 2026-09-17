# Bus Booking
src/main/java/com/yuvan/busbooking/

.
├── auth
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── security
│   ├── service
├── booking
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── service
├── bus
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── service
├── common
│   ├── config
│   ├── exception
│   ├── util
├── location
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── service
├── operator
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── service
├── payment
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── service
├── route
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── service
├── ticket
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── service
├── trip
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   ├── service
├── user
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── exception
│   ├── repository
│   ├── service
├── verifynow
│   ├── config
│   ├── controller
│   ├── dto
│   ├── exception
│   ├── service
├── wallet
    ├── controller
    ├── dto
    ├── entity
    ├── repository
    ├── service


# Available API

## Auth

- POST /api/v1/auth/register
- POST /api/v1/auth/operator/register
- POST /api/v1/auth/reset-password
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/google
- POST /api/v1/auth/login
- POST /api/v1/auth/login/request-otp-fallback
- POST /api/v1/auth/login/verify-otp-fallback
- POST /api/v1/auth/login/verify-totp
- POST /api/v1/auth/onboarding/complete
- POST /api/v1/auth/totp-alternative/send
- POST /api/v1/auth/totp-alternative/verify
- POST /api/v1/auth/totp/backup-codes/generate
- POST /api/v1/auth/totp/disable
- POST /api/v1/auth/totp/setup
- POST /api/v1/auth/totp/verify-setup
- POST /api/v1/auth/verify/confirm
- POST /api/v1/auth/verify/send

## Bookings

- POST /api/v1/bookings
- GET /api/v1/bookings/{bookingId}
- POST /api/v1/bookings/{bookingId}/cancel

## Buses

- POST /api/v1/buses
- GET /api/v1/buses
- GET /api/v1/buses/{id}
- GET /api/v1/buses/operator/{operatorId}
- PUT /api/v1/buses/{id}
- DELETE /api/v1/buses/{id}

## Locations

- POST /api/v1/locations
- GET /api/v1/locations
- GET /api/v1/locations/{id}
- PUT /api/v1/locations/{id}
- DELETE /api/v1/locations/{id}

## Operators

- POST /api/v1/operators
- GET /api/v1/operators
- GET /api/v1/operators/{id}
- PUT /api/v1/operators/{id}
- DELETE /api/v1/operators/{id}

## Payments

- POST /api/v1/payments

## Routes

- POST /api/v1/routes
- GET /api/v1/routes
- GET /api/v1/routes/{id}
- PUT /api/v1/routes/{id}
- DELETE /api/v1/routes/{id}

## Route Stops

- POST /api/v1/route-stops
- GET /api/v1/route-stops/{id}
- GET /api/v1/route-stops/route/{routeId}
- PUT /api/v1/route-stops/{id}
- DELETE /api/v1/route-stops/{id}

## Schedules

- POST /api/v1/schedules
- GET /api/v1/schedules
- GET /api/v1/schedules/{id}
- GET /api/v1/schedules/bus/{busId}
- GET /api/v1/schedules/route/{routeId}
- PUT /api/v1/schedules/{id}
- DELETE /api/v1/schedules/{id}

## Seats

- POST /api/v1/seats
- GET /api/v1/seats/{id}
- GET /api/v1/seats/bus/{busId}
- PUT /api/v1/seats/{id}
- DELETE /api/v1/seats/{id}

## Seat Holds

- POST /api/v1/seat-holds

## Tickets

- POST /api/v1/tickets/booking/{bookingId}
- GET /api/v1/tickets/booking
- GET /api/v1/tickets/booking/{bookingId}
- GET /api/v1/tickets/{ticketNumber}

## Trips

- POST /api/v1/trips
- POST /api/v1/trips/bulk
- GET /api/v1/trips
- GET /api/v1/trips/{id}
- GET /api/v1/trips/bus/{busId}
- GET /api/v1/trips/route/{routeId}
- PUT /api/v1/trips/{id}
- DELETE /api/v1/trips/{id}
- POST /api/v1/trips/{id}/cancel

## Trip Seats

- GET /api/v1/trip-seats/{id}
- GET /api/v1/trip-seats/trip/{tripId}

## Users

- POST /api/v1/users
- GET /api/v1/users
- GET /api/v1/users/{id}
- GET /api/v1/users/me
- PUT /api/v1/users/{id}
- PUT /api/v1/users/me
- DELETE /api/v1/users/{id}
- POST /api/v1/users/me/verify-mobile

## VerifyNow

- POST /api/v1/verifynow/send-otp
- POST /api/v1/verifynow/validate-otp

## Wallet

- GET /api/v1/wallet


## DB Designs

---------------------------
|                         |
| booking_passengers      |
| bookings                |
| buses                   |
| cancellations           |
| google_credentials      |
| locations               |
| operators               |
| otp_verifications       |
| payments                |
| roles                   |
| route_stops             |
| routes                  |
| schedules               |
| seat_holds              |
| seats                   |
| tickets                 |
| trip_seats              |
| trips                   |
| user_google_credentials |
| user_roles              |
| user_wallets            |
| users                   |
|                         |
---------------------------

## BooingPassengers

+---------------------+-------------------------------+------+-----+---------+----------------+
| Field               | Type                          | Null | Key | Default | Extra          |
+---------------------+-------------------------------+------+-----+---------+----------------+
| id                  | bigint                        | NO   | PRI | NULL    | auto_increment |
| age                 | int                           | NO   |     | NULL    |                |
| allow_male_adjacent | bit(1)                        | YES  |     | NULL    |                |
| created_at          | datetime(6)                   | NO   |     | NULL    |                |
| first_name          | varchar(100)                  | NO   |     | NULL    |                |
| gender              | enum('FEMALE','MALE','OTHER') | NO   |     | NULL    |                |
| last_name           | varchar(100)                  | YES  |     | NULL    |                |
| booking_id          | bigint                        | NO   | MUL | NULL    |                |
| seat_hold_id        | bigint                        | NO   | MUL | NULL    |                |
| trip_seat_id        | bigint                        | NO   | MUL | NULL    |                |
+---------------------+-------------------------------+------+-----+---------+----------------+

## Bookings

+---------------------+--------------------------------------------+------+-----+---------+----------------+
| Field               | Type                                       | Null | Key | Default | Extra          |
+---------------------+--------------------------------------------+------+-----+---------+----------------+
| id                  | bigint                                     | NO   | PRI | NULL    | auto_increment |
| booking_reference   | varchar(20)                                | NO   | UNI | NULL    |                |
| created_at          | datetime(6)                                | NO   |     | NULL    |                |
| status              | enum('CANCELLED','CONFIRMED','EXPIRED',    |      |     |         |                |
|                     |      'FAILED','PAYMENT_PENDING','PENDING') | NO   |     | NULL    |                |
| total_amount        | decimal(10,2)                              | NO   |     | NULL    |                |
| updated_at          | datetime(6)                                | NO   |     | NULL    |                |
| drop_location_id    | bigint                                     | NO   | MUL | NULL    |                |
| pickup_location_id  | bigint                                     | NO   | MUL | NULL    |                |
| trip_id             | bigint                                     | NO   | MUL | NULL    |                |
| user_id             | bigint                                     | NO   | MUL | NULL    |                |
| cancellation_reason | varchar(500)                               | YES  |     | NULL    |                |
+---------------------+--------------------------------------------+------+-----+---------+----------------+

## Buses

+---------------------+-----------------------------------------+------+-----+---------+----------------+
| Field               | Type                                    | Null | Key | Default | Extra          |
+---------------------+-----------------------------------------+------+-----+---------+----------------+
| id                  | bigint                                  | NO   | PRI | NULL    | auto_increment |
| bus_type            | enum('SEATER','SEMI_SLEEPER','SLEEPER') | NO   |     | NULL    |                |
| created_at          | datetime(6)                             | NO   |     | NULL    |                |
| model               | varchar(150)                            | NO   |     | NULL    |                |
| registration_number | varchar(50)                             | NO   | UNI | NULL    |                |
| status              | enum('ACTIVE','INACTIVE','MAINTENANCE') | NO   |     | NULL    |                |
| updated_at          | datetime(6)                             | NO   |     | NULL    |                |
| operator_id         | bigint                                  | NO   | MUL | NULL    |                |
+---------------------+-----------------------------------------+------+-----+---------+----------------+

## Cacellations

+---------------+---------------+------+-----+---------+----------------+
| Field         | Type          | Null | Key | Default | Extra          |
+---------------+---------------+------+-----+---------+----------------+
| id            | bigint        | NO   | PRI | NULL    | auto_increment |
| cancelled_at  | datetime(6)   | NO   |     | NULL    |                |
| created_at    | datetime(6)   | NO   |     | NULL    |                |
| reason        | varchar(500)  | YES  |     | NULL    |                |
| refund_amount | decimal(10,2) | NO   |     | NULL    |                |
| updated_at    | datetime(6)   | NO   |     | NULL    |                |
| booking_id    | bigint        | NO   | UNI | NULL    |                |
+---------------+---------------+------+-----+---------+----------------+

## Locations

+------------+--------------+------+-----+---------+----------------+
| Field      | Type         | Null | Key | Default | Extra          |
+------------+--------------+------+-----+---------+----------------+
| id         | bigint       | NO   | PRI | NULL    | auto_increment |
| city       | varchar(100) | NO   |     | NULL    |                |
| country    | varchar(100) | NO   |     | NULL    |                |
| created_at | datetime(6)  | NO   |     | NULL    |                |
| latitude   | decimal(9,6) | YES  |     | NULL    |                |
| longitude  | decimal(9,6) | YES  |     | NULL    |                |
| name       | varchar(150) | NO   |     | NULL    |                |
| state      | varchar(100) | NO   |     | NULL    |                |
| updated_at | datetime(6)  | NO   |     | NULL    |                |
+------------+--------------+------+-----+---------+----------------+

## Operators

+---------------------+---------------------------------------+------+-----+---------+----------------+
| Field               | Type                                  | Null | Key | Default | Extra          |
+---------------------+---------------------------------------+------+-----+---------+----------------+
| id                  | bigint                                | NO   | PRI | NULL    | auto_increment |
| contact_email       | varchar(255)                          | NO   |     | NULL    |                |
| contact_phone       | varchar(20)                           | YES  |     | NULL    |                |
| created_at          | datetime(6)                           | NO   |     | NULL    |                |
| name                | varchar(150)                          | NO   |     | NULL    |                |
| registration_number | varchar(100)                          | NO   | UNI | NULL    |                |
| status              | enum('ACTIVE','DEACTIVE','SUSPENDED') | NO   |     | NULL    |                |
| updated_at          | datetime(6)                           | NO   |     | NULL    |                |
| user_id             | bigint                                | NO   | UNI | NULL    |                |
+---------------------+---------------------------------------+------+-----+---------+----------------+

## OtpVerifications

+-------------+---------------------------------------+------+-----+---------+----------------+
| Field       | Type                                  | Null | Key | Default | Extra          |
+-------------+---------------------------------------+------+-----+---------+----------------+
| id          | bigint                                | NO   | PRI | NULL    | auto_increment |
| attempts    | int                                   | NO   |     | NULL    |                |
| created_at  | datetime(6)                           | NO   |     | NULL    |                |
| email       | varchar(255)                          | NO   | MUL | NULL    |                |
| expires_at  | datetime(6)                           | NO   |     | NULL    |                |
| otp_hash    | varchar(255)                          | NO   |     | NULL    |                |
| purpose     | enum('PASSWORD_RESET','REGISTRATION') | NO   |     | NULL    |                |
| status      | enum('ACTIVE','EXPIRED','VERIFIED')   | NO   |     | NULL    |                |
| verified_at | datetime(6)                           | YES  |     | NULL    |                |
+-------------+---------------------------------------+------+-----+---------+----------------+

## Payments

+-----------------------+--------------------------------------------------------------+------+-----+---------+----------------+
| Field                 | Type                                                         | Null | Key | Default | Extra          |
+-----------------------+--------------------------------------------------------------+------+-----+---------+----------------+
| id                    | bigint                                                       | NO   | PRI | NULL    | auto_increment |
| amount                | decimal(10,2)                                                | NO   |     | NULL    |                |
| created_at            | datetime(6)                                                  | NO   |     | NULL    |                |
| failure_reason        | varchar(500)                                                 | YES  |     | NULL    |                |
| payment_method        | enum('CARD','NET_BANKING','UPI','WALLET')                    | NO   |     | NULL    |                |
| status                | enum('FAILED','INITIATED','PROCESSING','REFUNDED','SUCCESS') | NO   |     | NULL    |                |
| transaction_reference | varchar(50)                                                  | NO   | UNI | NULL    |                |
| updated_at            | datetime(6)                                                  | NO   |     | NULL    |                |
| booking_id            | bigint                                                       | NO   | UNI | NULL    |                |
+-----------------------+--------------------------------------------------------------+------+-----+---------+----------------+

## Roles

+-------+--------------------------------------+------+-----+---------+----------------+
| Field | Type                                 | Null | Key | Default | Extra          |
+-------+--------------------------------------+------+-----+---------+----------------+
| id    | bigint                               | NO   | PRI | NULL    | auto_increment |
| name  | enum('ADMIN','OPERATOR','PASSENGER') | NO   | UNI | NULL    |                |
+-------+--------------------------------------+------+-----+---------+----------------+

## RouteStops

+--------------------------+---------------+------+-----+---------+----------------+
| Field                    | Type          | Null | Key | Default | Extra          |
+--------------------------+---------------+------+-----+---------+----------------+
| id                       | bigint        | NO   | PRI | NULL    | auto_increment |
| arrival_offset_minutes   | int           | YES  |     | NULL    |                |
| created_at               | datetime(6)   | NO   |     | NULL    |                |
| departure_offset_minutes | int           | YES  |     | NULL    |                |
| distance_from_origin_km  | decimal(10,2) | NO   |     | NULL    |                |
| stop_order               | int           | NO   |     | NULL    |                |
| updated_at               | datetime(6)   | NO   |     | NULL    |                |
| location_id              | bigint        | NO   | MUL | NULL    |                |
| route_id                 | bigint        | NO   | MUL | NULL    |                |
+--------------------------+---------------+------+-----+---------+----------------+

## Routes

+------------+---------------------------+------+-----+---------+----------------+
| Field      | Type                      | Null | Key | Default | Extra          |
+------------+---------------------------+------+-----+---------+----------------+
| id         | bigint                    | NO   | PRI | NULL    | auto_increment |
| created_at | datetime(6)               | NO   |     | NULL    |                |
| name       | varchar(150)              | NO   |     | NULL    |                |
| status     | enum('ACTIVE','INACTIVE') | NO   |     | NULL    |                |
| updated_at | datetime(6)               | NO   |     | NULL    |                |
+------------+---------------------------+------+-----+---------+----------------+

## Schedules

+-----------------+---------------------------+------+-----+---------+----------------+
| Field           | Type                      | Null | Key | Default | Extra          |
+-----------------+---------------------------+------+-----+---------+----------------+
| id              | bigint                    | NO   | PRI | NULL    | auto_increment |
| base_fare       | decimal(10,2)             | NO   |     | NULL    |                |
| created_at      | datetime(6)               | NO   |     | NULL    |                |
| departure_time  | time                      | NO   |     | NULL    |                |
| effective_from  | date                      | NO   |     | NULL    |                |
| effective_until | date                      | YES  |     | NULL    |                |
| operating_days  | varchar(27)               | NO   |     | NULL    |                |
| price_per_km    | decimal(10,2)             | NO   |     | NULL    |                |
| status          | enum('ACTIVE','INACTIVE') | NO   |     | NULL    |                |
| updated_at      | datetime(6)               | NO   |     | NULL    |                |
| bus_id          | bigint                    | NO   | MUL | NULL    |                |
| route_id        | bigint                    | NO   | MUL | NULL    |                |
+-----------------+---------------------------+------+-----+---------+----------------+

## SeatHolds

+--------------+-------------------------------------------------+------+-----+---------+----------------+
| Field        | Type                                            | Null | Key | Default | Extra          |
+--------------+-------------------------------------------------+------+-----+---------+----------------+
| id           | bigint                                          | NO   | PRI | NULL    | auto_increment |
| created_at   | datetime(6)                                     | NO   |     | NULL    |                |
| expires_at   | datetime(6)                                     | NO   |     | NULL    |                |
| held_at      | datetime(6)                                     | NO   |     | NULL    |                |
| status       | enum('ACTIVE','CONVERTED','EXPIRED','RELEASED') | NO   |     | NULL    |                |
| updated_at   | datetime(6)                                     | NO   |     | NULL    |                |
| trip_seat_id | bigint                                          | NO   | MUL | NULL    |                |
| user_id      | bigint                                          | NO   | MUL | NULL    |                |
+--------------+-------------------------------------------------+------+-----+---------+----------------+

## Seats

+---------------+---------------------------------+------+-----+---------+----------------+
| Field         | Type                            | Null | Key | Default | Extra          |
+---------------+---------------------------------+------+-----+---------+----------------+
| id            | bigint                          | NO   | PRI | NULL    | auto_increment |
| created_at    | datetime(6)                     | NO   |     | NULL    |                |
| gender_policy | tinyint                         | YES  |     | NULL    |                |
| position      | enum('AISLE','MIDDLE','WINDOW') | NO   |     | NULL    |                |
| seat_number   | varchar(20)                     | NO   |     | NULL    |                |
| seat_type     | enum('SEAT','SLEEPER')          | NO   |     | NULL    |                |
| updated_at    | datetime(6)                     | NO   |     | NULL    |                |
| bus_id        | bigint                          | NO   | MUL | NULL    |                |
+---------------+---------------------------------+------+-----+---------+----------------+

## Tickets

+---------------+---------------------------------------------+------+-----+---------+----------------+
| Field         | Type                                        | Null | Key | Default | Extra          |
+---------------+---------------------------------------------+------+-----+---------+----------------+
| id            | bigint                                      | NO   | PRI | NULL    | auto_increment |
| created_at    | datetime(6)                                 | NO   |     | NULL    |                |
| expires_at    | datetime(6)                                 | NO   |     | NULL    |                |
| issued_at     | datetime(6)                                 | NO   |     | NULL    |                |
| status        | enum('ACTIVE','CANCELLED','EXPIRED','USED') | NO   |     | NULL    |                |
| ticket_number | varchar(30)                                 | NO   | UNI | NULL    |                |
| updated_at    | datetime(6)                                 | NO   |     | NULL    |                |
| booking_id    | bigint                                      | NO   | UNI | NULL    |                |
+---------------+---------------------------------------------+------+-----+---------+----------------+

## TripSeats

+------------+---------------------------------------------+------+-----+---------+----------------+
| Field      | Type                                        | Null | Key | Default | Extra          |
+------------+---------------------------------------------+------+-----+---------+----------------+
| id         | bigint                                      | NO   | PRI | NULL    | auto_increment |
| created_at | datetime(6)                                 | NO   |     | NULL    |                |
| held_until | datetime(6)                                 | YES  |     | NULL    |                |
| status     | enum('AVAILABLE','BLOCKED','BOOKED','HELD') | NO   |     | NULL    |                |
| updated_at | datetime(6)                                 | NO   |     | NULL    |                |
| version    | bigint                                      | NO   |     | NULL    |                |
| seat_id    | bigint                                      | NO   | MUL | NULL    |                |
| trip_id    | bigint                                      | NO   | MUL | NULL    |                |
+------------+---------------------------------------------+------+-----+---------+----------------+

## Trips

mysql> desc trips;
+----------------+--------------------------------------------------------------------+------+-----+---------+----------------+
| Field          | Type                                                               | Null | Key | Default | Extra          |
+----------------+--------------------------------------------------------------------+------+-----+---------+----------------+
| id             | bigint                                                             | NO   | PRI | NULL    | auto_increment |
| base_fare      | decimal(10,2)                                                      | NO   |     | NULL    |                |
| created_at     | datetime(6)                                                        | NO   |     | NULL    |                |
| departure_time | time                                                               | NO   |     | NULL    |                |
| price_per_km   | decimal(10,2)                                                      | NO   |     | NULL    |                |
| status         | enum('BOARDING','CANCELLED','COMPLETED','IN_PROGRESS','SCHEDULED') | NO   |     | NULL    |                |
| trip_date      | date                                                               | NO   |     | NULL    |                |
| updated_at     | datetime(6)                                                        | NO   |     | NULL    |                |
| bus_id         | bigint                                                             | NO   | MUL | NULL    |                |
| route_id       | bigint                                                             | NO   | MUL | NULL    |                |
| schedule_id    | bigint                                                             | NO   | MUL | NULL    |                |
+----------------+--------------------------------------------------------------------+------+-----+---------+----------------+

## UserGoogleCredentials

+--------------+--------------+------+-----+---------+----------------+
| Field        | Type         | Null | Key | Default | Extra          |
+--------------+--------------+------+-----+---------+----------------+
| id           | bigint       | NO   | PRI | NULL    | auto_increment |
| created_at   | datetime(6)  | NO   |     | NULL    |                |
| display_name | varchar(255) | YES  |     | NULL    |                |
| google_email | varchar(255) | NO   |     | NULL    |                |
| google_sub   | varchar(128) | NO   | UNI | NULL    |                |
| picture_url  | varchar(512) | YES  |     | NULL    |                |
| updated_at   | datetime(6)  | NO   |     | NULL    |                |
| user_id      | bigint       | NO   | UNI | NULL    |                |
+--------------+--------------+------+-----+---------+----------------+

## UserRoles

+---------+--------+------+-----+---------+----------------+
| Field   | Type   | Null | Key | Default | Extra          |
+---------+--------+------+-----+---------+----------------+
| id      | bigint | NO   | PRI | NULL    | auto_increment |
| role_id | bigint | NO   | MUL | NULL    |                |
| user_id | bigint | NO   | MUL | NULL    |                |
+---------+--------+------+-----+---------+----------------+

## UserWallets

+------------+---------------+------+-----+---------+----------------+
| Field      | Type          | Null | Key | Default | Extra          |
+------------+---------------+------+-----+---------+----------------+
| id         | bigint        | NO   | PRI | NULL    | auto_increment |
| balance    | decimal(12,2) | NO   |     | NULL    |                |
| created_at | datetime(6)   | NO   |     | NULL    |                |
| updated_at | datetime(6)   | NO   |     | NULL    |                |
| user_id    | bigint        | NO   | UNI | NULL    |                |
+------------+---------------+------+-----+---------+----------------+

## Users

+----------------------+-----------------------------------------------------------------+------+-----+---------+----------------+
| Field                | Type                                                            | Null | Key | Default | Extra          |
+----------------------+-----------------------------------------------------------------+------+-----+---------+----------------+
| id                   | bigint                                                          | NO   | PRI | NULL    | auto_increment |
| created_at           | datetime(6)                                                     | NO   |     | NULL    |                |
| email                | varchar(255)                                                    | NO   | UNI | NULL    |                |
| first_name           | varchar(100)                                                    | NO   |     | NULL    |                |
| last_name            | varchar(100)                                                    | YES  |     | NULL    |                |
| password_hash        | varchar(255)                                                    | YES  |     | NULL    |                |
| phone                | varchar(20)                                                     | YES  |     | NULL    |                |
| status               | enum('ACTIVE','DEACTIVATED','PENDING_VERIFICATION','SUSPENDED') | NO   |     | NULL    |                |
| updated_at           | datetime(6)                                                     | NO   |     | NULL    |                |
| onboarding_completed | tinyint(1)                                                      | NO   |     | 0       |                |
+----------------------+-----------------------------------------------------------------+------+-----+---------+----------------+