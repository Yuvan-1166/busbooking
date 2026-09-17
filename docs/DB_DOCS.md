# Bus Booking Database Documentation

## Database Overview

This document describes the complete database schema for the Bus Booking application. The database is relational (SQL-based) with PostgreSQL/MySQL as the recommended DBMS.

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [User Management Tables](#user-management-tables)
3. [Bus & Fleet Management Tables](#bus--fleet-management-tables)
4. [Route & Location Tables](#route--location-tables)
5. [Trip & Schedule Tables](#trip--schedule-tables)
6. [Booking & Passenger Tables](#booking--passenger-tables)
7. [Payment & Wallet Tables](#payment--wallet-tables)
8. [Ticket Tables](#ticket-tables)
9. [Authentication Tables](#authentication-tables)
10. [Enumeration Types](#enumeration-types)
11. [Database Relationships](#database-relationships)
12. [Indexes & Constraints](#indexes--constraints)

---

## Core Tables

### 1. Users Table

**Table Name:** `users`

**Purpose:** Stores information about all users in the system (both passengers and operators).

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| `password_hash` | VARCHAR(255) | NULLABLE | Hashed password (null for OAuth users) |
| `first_name` | VARCHAR(100) | NOT NULL | User's first name |
| `last_name` | VARCHAR(100) | NULLABLE | User's last name |
| `phone` | VARCHAR(20) | NULLABLE | User's phone number |
| `status` | ENUM | NOT NULL | Account status (ACTIVE, INACTIVE, PENDING_VERIFICATION) |
| `onboarding_completed` | BOOLEAN | NOT NULL, DEFAULT: false | Whether user completed onboarding |
| `totp_secret` | VARCHAR(255) | NULLABLE | TOTP secret key for 2FA |
| `totp_enabled` | BOOLEAN | NOT NULL, DEFAULT: false | Whether 2FA is enabled |
| `mobile_verified` | BOOLEAN | NOT NULL, DEFAULT: false | Whether mobile is verified |
| `mobile_verified_at` | TIMESTAMP | NULLABLE | When mobile was verified |
| `created_at` | TIMESTAMP | NOT NULL | Account creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- One-to-One with `operators` (optional)
- One-to-Many with `bookings`
- One-to-Many with `seat_holds`
- One-to-One with `user_wallets`
- One-to-Many with `user_roles`
- One-to-One with `user_google_credentials`

**Indexes:**
- `email` (UNIQUE)
- `created_at`
- `status`

---

## User Management Tables

### 2. Roles Table

**Table Name:** `roles`

**Purpose:** Defines different user roles in the system.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique role identifier |
| `name` | ENUM | NOT NULL, UNIQUE | Role name (ADMIN, OPERATOR, PASSENGER) |

**Relationships:**
- One-to-Many with `user_roles`

---

### 3. User Roles Junction Table

**Table Name:** `user_roles`

**Purpose:** Maps users to their roles (many-to-many relationship).

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `user_id` | BIGINT | NOT NULL, FK -> users.id | Reference to user |
| `role_id` | BIGINT | NOT NULL, FK -> roles.id | Reference to role |

**Constraints:**
- UNIQUE(user_id, role_id) - Ensures no duplicate role assignments

**Relationships:**
- Many-to-One with `users`
- Many-to-One with `roles`

---

### 4. Operators Table

**Table Name:** `operators`

**Purpose:** Stores information about bus operators/transport companies.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique operator identifier |
| `user_id` | BIGINT | NOT NULL, FK -> users.id, UNIQUE | Reference to operator's user account |
| `name` | VARCHAR(150) | NOT NULL | Operator/company name |
| `registration_number` | VARCHAR(100) | NOT NULL, UNIQUE | Business registration number |
| `contact_email` | VARCHAR(255) | NOT NULL | Contact email address |
| `contact_phone` | VARCHAR(20) | NULLABLE | Contact phone number |
| `status` | ENUM | NOT NULL | Operator status (ACTIVE, DEACTIVE, SUSPENDED) |
| `created_at` | TIMESTAMP | NOT NULL | Account creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- One-to-One with `users`
- One-to-Many with `buses`

**Indexes:**
- `user_id` (UNIQUE)
- `registration_number` (UNIQUE)
- `status`

---

## Bus & Fleet Management Tables

### 5. Buses Table

**Table Name:** `buses`

**Purpose:** Stores information about buses in the system.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique bus identifier |
| `operator_id` | BIGINT | NOT NULL, FK -> operators.id | Reference to operator |
| `registration_number` | VARCHAR(50) | NOT NULL, UNIQUE | Vehicle registration number |
| `model` | VARCHAR(150) | NOT NULL | Bus model/name |
| `bus_type` | ENUM | NOT NULL | Bus type (AC, NON_AC, SLEEPER, SEMI_SLEEPER) |
| `status` | ENUM | NOT NULL | Bus status (ACTIVE, INACTIVE, MAINTENANCE) |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- Many-to-One with `operators`
- One-to-Many with `seats`
- One-to-Many with `schedules`
- One-to-Many with `trips`

**Indexes:**
- `operator_id`
- `registration_number` (UNIQUE)
- `status`

---

### 6. Seats Table

**Table Name:** `seats`

**Purpose:** Stores seat information for each bus.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique seat identifier |
| `bus_id` | BIGINT | NOT NULL, FK -> buses.id | Reference to bus |
| `seat_number` | VARCHAR(20) | NOT NULL | Seat number (e.g., "A1", "B5") |
| `seat_type` | ENUM | NOT NULL | Seat type (NORMAL, UPPER, SLEEPER, RECLINER) |
| `position` | ENUM | NOT NULL | Seat position (WINDOW, AISLE, MIDDLE) |
| `gender_policy` | ENUM | NULLABLE | Gender policy (MALE_ONLY, FEMALE_ONLY, NEUTRAL) |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Constraints:**
- UNIQUE(bus_id, seat_number) - Each seat number is unique per bus

**Relationships:**
- Many-to-One with `buses`
- One-to-Many with `trip_seats`

**Indexes:**
- `bus_id`
- `UNIQUE(bus_id, seat_number)`

---

## Route & Location Tables

### 7. Locations Table

**Table Name:** `locations`

**Purpose:** Stores bus stop/station information.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique location identifier |
| `name` | VARCHAR(150) | NOT NULL | Location/station name |
| `city` | VARCHAR(100) | NOT NULL | City name |
| `state` | VARCHAR(100) | NOT NULL | State/province name |
| `country` | VARCHAR(100) | NOT NULL | Country name |
| `latitude` | DECIMAL(9,6) | NULLABLE | Geographic latitude |
| `longitude` | DECIMAL(9,6) | NULLABLE | Geographic longitude |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- One-to-Many with `route_stops`
- One-to-Many with `bookings` (pickup/drop locations)

**Indexes:**
- `city`
- `state`
- `name`

---

### 8. Routes Table

**Table Name:** `routes`

**Purpose:** Defines routes connecting multiple locations.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique route identifier |
| `name` | VARCHAR(150) | NOT NULL | Route name (e.g., "Bangalore - Chennai") |
| `status` | ENUM | NOT NULL | Route status (ACTIVE, INACTIVE, SUSPENDED) |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- One-to-Many with `route_stops`
- One-to-Many with `schedules`
- One-to-Many with `trips`

**Indexes:**
- `status`
- `name`

---

### 9. Route Stops Table

**Table Name:** `route_stops`

**Purpose:** Defines stops along a route with sequence and timing information.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique route stop identifier |
| `route_id` | BIGINT | NOT NULL, FK -> routes.id | Reference to route |
| `location_id` | BIGINT | NOT NULL, FK -> locations.id | Reference to location/stop |
| `stop_order` | INT | NOT NULL | Stop sequence (1, 2, 3, ...) |
| `arrival_offset_minutes` | INT | NULLABLE | Minutes from route start to arrival |
| `departure_offset_minutes` | INT | NULLABLE | Minutes from route start to departure |
| `distance_from_origin_km` | DECIMAL(10,2) | NOT NULL | Distance from route origin in km |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Constraints:**
- UNIQUE(route_id, stop_order) - Each route has unique stop orders

**Relationships:**
- Many-to-One with `routes`
- Many-to-One with `locations`

**Indexes:**
- `route_id`
- `location_id`
- `UNIQUE(route_id, stop_order)`

---

## Trip & Schedule Tables

### 10. Schedules Table

**Table Name:** `schedules`

**Purpose:** Defines recurring schedules for routes with buses.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique schedule identifier |
| `route_id` | BIGINT | NOT NULL, FK -> routes.id | Reference to route |
| `bus_id` | BIGINT | NOT NULL, FK -> buses.id | Reference to bus |
| `departure_time` | TIME | NOT NULL | Time of departure (HH:mm:ss) |
| `effective_from` | DATE | NOT NULL | Schedule effective from date |
| `effective_until` | DATE | NULLABLE | Schedule effective until date |
| `operating_days` | VARCHAR(27) | NOT NULL | Operating days (e.g., "MTWRFSS") |
| `base_fare` | DECIMAL(10,2) | NOT NULL | Base fare amount |
| `price_per_km` | DECIMAL(10,2) | NOT NULL | Price per kilometer |
| `status` | ENUM | NOT NULL | Schedule status (ACTIVE, INACTIVE) |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- Many-to-One with `routes`
- Many-to-One with `buses`
- One-to-Many with `trips`

**Indexes:**
- `route_id`
- `bus_id`
- `effective_from`
- `status`

---

### 11. Trips Table

**Table Name:** `trips`

**Purpose:** Stores individual trips/services based on schedules.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique trip identifier |
| `schedule_id` | BIGINT | NOT NULL, FK -> schedules.id | Reference to schedule |
| `route_id` | BIGINT | NOT NULL, FK -> routes.id | Reference to route |
| `bus_id` | BIGINT | NOT NULL, FK -> buses.id | Reference to bus |
| `trip_date` | DATE | NOT NULL | Date of the trip |
| `departure_time` | TIME | NOT NULL | Departure time for this trip |
| `base_fare` | DECIMAL(10,2) | NOT NULL | Base fare for this trip |
| `price_per_km` | DECIMAL(10,2) | NOT NULL | Price per kilometer for this trip |
| `status` | ENUM | NOT NULL | Trip status (SCHEDULED, DEPARTED, COMPLETED, CANCELLED) |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Constraints:**
- UNIQUE(schedule_id, trip_date) - One trip per schedule per date

**Relationships:**
- Many-to-One with `schedules`
- Many-to-One with `routes`
- Many-to-One with `buses`
- One-to-Many with `trip_seats`
- One-to-Many with `bookings`

**Indexes:**
- `schedule_id`
- `trip_date`
- `status`
- `UNIQUE(schedule_id, trip_date)`

---

### 12. Trip Seats Table

**Table Name:** `trip_seats`

**Purpose:** Stores seat availability status for each trip.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique trip seat identifier |
| `trip_id` | BIGINT | NOT NULL, FK -> trips.id | Reference to trip |
| `seat_id` | BIGINT | NOT NULL, FK -> seats.id | Reference to seat |
| `status` | ENUM | NOT NULL | Seat status (AVAILABLE, BOOKED, HELD, BLOCKED) |
| `held_until` | TIMESTAMP | NULLABLE | When the seat hold expires |
| `version` | BIGINT | NOT NULL | Optimistic locking version |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Constraints:**
- UNIQUE(trip_id, seat_id) - One seat per trip

**Relationships:**
- Many-to-One with `trips`
- Many-to-One with `seats`
- One-to-Many with `seat_holds`
- One-to-Many with `booking_passengers`

**Indexes:**
- `trip_id`
- `seat_id`
- `status`
- `UNIQUE(trip_id, seat_id)`

---

## Booking & Passenger Tables

### 13. Bookings Table

**Table Name:** `bookings`

**Purpose:** Stores booking information for each reservation.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique booking identifier |
| `user_id` | BIGINT | NOT NULL, FK -> users.id | Reference to passenger/user |
| `trip_id` | BIGINT | NOT NULL, FK -> trips.id | Reference to trip |
| `booking_reference` | VARCHAR(20) | NOT NULL, UNIQUE | Unique booking reference number |
| `status` | ENUM | NOT NULL | Booking status (PENDING, CONFIRMED, CANCELLED) |
| `total_amount` | DECIMAL(10,2) | NOT NULL | Total booking amount |
| `pickup_location_id` | BIGINT | NOT NULL, FK -> locations.id | Passenger pickup location |
| `drop_location_id` | BIGINT | NOT NULL, FK -> locations.id | Passenger drop location |
| `cancellation_reason` | VARCHAR(500) | NULLABLE | Reason for cancellation if cancelled |
| `created_at` | TIMESTAMP | NOT NULL | Booking creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- Many-to-One with `users`
- Many-to-One with `trips`
- Many-to-One with `locations` (pickup)
- Many-to-One with `locations` (drop)
- One-to-Many with `booking_passengers`
- One-to-One with `payments`
- One-to-One with `tickets`
- One-to-One with `cancellations`

**Indexes:**
- `user_id`
- `trip_id`
- `booking_reference` (UNIQUE)
- `status`
- `created_at`

---

### 14. Booking Passengers Table

**Table Name:** `booking_passengers`

**Purpose:** Stores individual passenger details for each booking.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `booking_id` | BIGINT | NOT NULL, FK -> bookings.id | Reference to booking |
| `trip_seat_id` | BIGINT | NOT NULL, FK -> trip_seats.id | Reference to booked seat |
| `seat_hold_id` | BIGINT | NOT NULL, FK -> seat_holds.id | Reference to seat hold |
| `first_name` | VARCHAR(100) | NOT NULL | Passenger's first name |
| `last_name` | VARCHAR(100) | NULLABLE | Passenger's last name |
| `age` | INT | NOT NULL | Passenger's age |
| `gender` | ENUM | NOT NULL | Passenger's gender (MALE, FEMALE, OTHER) |
| `allow_male_adjacent` | BOOLEAN | NOT NULL | Whether to allow males sitting adjacent |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |

**Relationships:**
- Many-to-One with `bookings`
- Many-to-One with `trip_seats`
- Many-to-One with `seat_holds`

**Indexes:**
- `booking_id`
- `trip_seat_id`

---

### 15. Seat Holds Table

**Table Name:** `seat_holds`

**Purpose:** Tracks temporary seat holds during booking process.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique hold identifier |
| `trip_seat_id` | BIGINT | NOT NULL, FK -> trip_seats.id | Reference to trip seat |
| `user_id` | BIGINT | NOT NULL, FK -> users.id | Reference to user holding seat |
| `status` | ENUM | NOT NULL | Hold status (ACTIVE, EXPIRED, RELEASED) |
| `held_at` | TIMESTAMP | NOT NULL | When seat was held |
| `expires_at` | TIMESTAMP | NOT NULL | When hold expires |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- Many-to-One with `trip_seats`
- Many-to-One with `users`
- One-to-Many with `booking_passengers`

**Indexes:**
- `trip_seat_id`
- `user_id`
- `expires_at`
- `status`

---

## Payment & Wallet Tables

### 16. Payments Table

**Table Name:** `payments`

**Purpose:** Stores payment transaction information.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique payment identifier |
| `booking_id` | BIGINT | NOT NULL, FK -> bookings.id, UNIQUE | Reference to booking |
| `transaction_reference` | VARCHAR(50) | NOT NULL, UNIQUE | Payment gateway transaction ID |
| `status` | ENUM | NOT NULL | Payment status (INITIATED, SUCCESS, FAILED, REFUNDED) |
| `payment_method` | ENUM | NOT NULL | Payment method (CARD, UPI, WALLET, NET_BANKING) |
| `amount` | DECIMAL(10,2) | NOT NULL | Payment amount |
| `failure_reason` | VARCHAR(500) | NULLABLE | Reason for payment failure if failed |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- One-to-One with `bookings`

**Indexes:**
- `booking_id` (UNIQUE)
- `transaction_reference` (UNIQUE)
- `status`
- `created_at`

---

### 17. User Wallets Table

**Table Name:** `user_wallets`

**Purpose:** Stores wallet balance for each user.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique wallet identifier |
| `user_id` | BIGINT | NOT NULL, FK -> users.id, UNIQUE | Reference to user |
| `balance` | DECIMAL(12,2) | NOT NULL | Wallet balance |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- One-to-One with `users`

**Indexes:**
- `user_id` (UNIQUE)

---

## Ticket Tables

### 18. Tickets Table

**Table Name:** `tickets`

**Purpose:** Stores ticket information for confirmed bookings.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique ticket identifier |
| `booking_id` | BIGINT | NOT NULL, FK -> bookings.id, UNIQUE | Reference to booking |
| `ticket_number` | VARCHAR(30) | NOT NULL, UNIQUE | Ticket number (e.g., TICK-20241225-001) |
| `status` | ENUM | NOT NULL | Ticket status (ACTIVE, EXPIRED, CANCELLED) |
| `issued_at` | TIMESTAMP | NOT NULL | When ticket was issued |
| `expires_at` | TIMESTAMP | NOT NULL | When ticket expires |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- One-to-One with `bookings`

**Indexes:**
- `booking_id` (UNIQUE)
- `ticket_number` (UNIQUE)
- `expires_at`
- `status`

---

### 19. Cancellations Table

**Table Name:** `cancellations`

**Purpose:** Tracks booking cancellations and refunds.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique cancellation identifier |
| `booking_id` | BIGINT | NOT NULL, FK -> bookings.id, UNIQUE | Reference to cancelled booking |
| `reason` | VARCHAR(500) | NULLABLE | Cancellation reason |
| `refund_amount` | DECIMAL(10,2) | NOT NULL | Refund amount processed |
| `cancelled_at` | TIMESTAMP | NOT NULL | When cancellation was processed |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- One-to-One with `bookings`

**Indexes:**
- `booking_id` (UNIQUE)
- `cancelled_at`

---

## Authentication Tables

### 20. OTP Verifications Table

**Table Name:** `otp_verifications`

**Purpose:** Stores OTP codes for email verification and password resets.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique OTP record identifier |
| `email` | VARCHAR(255) | NOT NULL | Email address for verification |
| `otp_hash` | VARCHAR(255) | NOT NULL | Hashed OTP code |
| `purpose` | ENUM | NOT NULL | OTP purpose (REGISTRATION, PASSWORD_RESET, EMAIL_CHANGE) |
| `status` | ENUM | NOT NULL | OTP status (ACTIVE, VERIFIED, EXPIRED) |
| `expires_at` | TIMESTAMP | NOT NULL | When OTP expires |
| `verified_at` | TIMESTAMP | NULLABLE | When OTP was verified |
| `attempts` | INT | NOT NULL | Number of verification attempts |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |

**Indexes:**
- `email, purpose` (Composite index for quick lookups)
- `expires_at`

---

### 21. User Google Credentials Table

**Table Name:** `user_google_credentials`

**Purpose:** Stores Google OAuth credentials for users.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `google_sub` | VARCHAR(128) | NOT NULL, UNIQUE | Google's immutable user ID |
| `google_email` | VARCHAR(255) | NOT NULL | Email from Google account |
| `display_name` | VARCHAR(255) | NULLABLE | Display name from Google |
| `picture_url` | VARCHAR(512) | NULLABLE | Profile picture URL |
| `user_id` | BIGINT | NOT NULL, FK -> users.id, UNIQUE | Reference to bus booking user |
| `created_at` | TIMESTAMP | NOT NULL, IMMUTABLE | Creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Relationships:**
- One-to-One with `users`

**Indexes:**
- `google_sub` (UNIQUE)
- `user_id` (UNIQUE)

---

### 22. Backup Codes Table

**Table Name:** `backup_codes`

**Purpose:** Stores backup codes for 2FA recovery.

**Columns:**

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `user_id` | BIGINT | NOT NULL, FK -> users.id | Reference to user |
| `code_hash` | VARCHAR(255) | NOT NULL | Hashed backup code |
| `used` | BOOLEAN | NOT NULL, DEFAULT: false | Whether code has been used |
| `used_at` | TIMESTAMP | NULLABLE | When code was used |
| `created_at` | TIMESTAMP | NOT NULL | Creation time |

**Relationships:**
- Many-to-One with `users`

**Indexes:**
- `user_id`

---

---

## Enumeration Types

### User Status

- `ACTIVE` - User account is active
- `INACTIVE` - User account is inactive
- `PENDING_VERIFICATION` - Email not yet verified

### Role Names

- `ADMIN` - Administrator with full system access
- `OPERATOR` - Bus operator/transport company
- `PASSENGER` - Regular bus ticket customer

### Operator Status

- `ACTIVE` - Operator is active
- `DEACTIVE` - Operator is deactivated
- `SUSPENDED` - Operator account suspended

### Bus Type

- `AC` - Air-conditioned bus
- `NON_AC` - Non air-conditioned bus
- `SLEEPER` - Sleeper bus
- `SEMI_SLEEPER` - Semi-sleeper bus

### Bus Status

- `ACTIVE` - Bus is operational
- `INACTIVE` - Bus is not operational
- `MAINTENANCE` - Bus is under maintenance

### Seat Type

- `NORMAL` - Standard seat
- `UPPER` - Upper deck seat
- `SLEEPER` - Sleeper seat
- `RECLINER` - Reclining seat

### Seat Position

- `WINDOW` - Window side seat
- `AISLE` - Aisle side seat
- `MIDDLE` - Middle seat

### Seat Gender Policy

- `MALE_ONLY` - Reserved for males only
- `FEMALE_ONLY` - Reserved for females only
- `NEUTRAL` - No gender restriction

### Route Status

- `ACTIVE` - Route is operational
- `INACTIVE` - Route is not operational
- `SUSPENDED` - Route is suspended

### Schedule Status

- `ACTIVE` - Schedule is active
- `INACTIVE` - Schedule is inactive

### Trip Status

- `SCHEDULED` - Trip is scheduled
- `DEPARTED` - Bus has departed
- `COMPLETED` - Trip is completed
- `CANCELLED` - Trip is cancelled

### Trip Seat Status

- `AVAILABLE` - Seat is available for booking
- `BOOKED` - Seat is booked
- `HELD` - Seat is on hold
- `BLOCKED` - Seat is blocked/unavailable

### Booking Status

- `PENDING` - Booking is pending payment
- `CONFIRMED` - Booking is confirmed and paid
- `CANCELLED` - Booking is cancelled

### Seat Hold Status

- `ACTIVE` - Seat hold is active
- `EXPIRED` - Seat hold has expired
- `RELEASED` - Seat hold has been released

### Payment Status

- `INITIATED` - Payment initiated
- `SUCCESS` - Payment successful
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

### Payment Method

- `CARD` - Credit/Debit card
- `UPI` - UPI payment
- `WALLET` - Wallet payment
- `NET_BANKING` - Net banking

### Ticket Status

- `ACTIVE` - Ticket is valid
- `EXPIRED` - Ticket has expired
- `CANCELLED` - Ticket is cancelled

### OTP Purpose

- `REGISTRATION` - For email verification during registration
- `PASSWORD_RESET` - For password reset
- `EMAIL_CHANGE` - For email change verification

### OTP Status

- `ACTIVE` - OTP is valid
- `VERIFIED` - OTP has been verified
- `EXPIRED` - OTP has expired

### Gender

- `MALE` - Male
- `FEMALE` - Female
- `OTHER` - Other

---

## Database Relationships

### Entity Relationship Diagram (Text Format)

```
Users (1) ──── (Many) Bookings
Users (1) ──── (Many) Seat Holds
Users (1) ──── (1) User Wallets
Users (1) ──── (Many) User Roles
Users (1) ──── (1) Operators
Users (1) ──── (1) User Google Credentials

Roles (1) ──── (Many) User Roles

Operators (1) ──── (Many) Buses

Buses (1) ──── (Many) Seats
Buses (1) ──── (Many) Schedules
Buses (1) ──── (Many) Trips

Locations (1) ──── (Many) Route Stops
Locations (1) ──── (Many) Bookings (as pickup/drop)

Routes (1) ──── (Many) Route Stops
Routes (1) ──── (Many) Schedules
Routes (1) ──── (Many) Trips

Route Stops (Many) ──── (1) Route
Route Stops (Many) ──── (1) Location

Schedules (1) ──── (Many) Trips

Seats (1) ──── (Many) Trip Seats

Trips (1) ──── (Many) Trip Seats
Trips (1) ──── (Many) Bookings

Trip Seats (1) ──── (Many) Seat Holds
Trip Seats (1) ──── (Many) Booking Passengers

Bookings (1) ──── (1) Payments
Bookings (1) ──── (1) Tickets
Bookings (1) ──── (1) Cancellations
Bookings (1) ──── (Many) Booking Passengers

Seat Holds (1) ──── (Many) Booking Passengers
```

### Key Relationships Explained

1. **User to Booking**: One passenger can have many bookings. One booking belongs to one user.

2. **Booking to Trip**: One trip can have many bookings. One booking is for one trip.

3. **Trip to Trip Seats**: One trip has multiple trip seats (one per bus seat). Trip seats track availability status.

4. **Trip Seats to Seat Holds**: A trip seat can have multiple holds (history), but only one active hold at a time.

5. **Trip Seats to Booking Passengers**: When a booking is confirmed, booking passengers reference specific trip seats.

6. **Booking to Payments**: One booking has exactly one payment record (one-to-one).

7. **Booking to Tickets**: One confirmed booking has exactly one ticket (one-to-one).

8. **Bookings to Booking Passengers**: One booking can have multiple passengers (one booking per multi-passenger trip).

9. **Route to Route Stops**: One route has multiple stops defining the journey sequence.

10. **Bus to Trips**: One bus operates multiple trips on different schedules/dates.

11. **Schedule to Trips**: A schedule can have multiple trip instances (one per operating date).

---

## Indexes & Constraints

### Primary Keys

All tables have surrogate `id` (BIGINT) as the primary key with auto-increment.

### Unique Constraints

| Table | Columns | Purpose |
|---|---|---|
| `users` | `email` | Email uniqueness |
| `operators` | `user_id`, `registration_number` | Operator uniqueness |
| `buses` | `registration_number` | Vehicle registration uniqueness |
| `seats` | `(bus_id, seat_number)` | Seat uniqueness per bus |
| `route_stops` | `(route_id, stop_order)` | Stop sequence uniqueness per route |
| `trips` | `(schedule_id, trip_date)` | Trip uniqueness per date |
| `trip_seats` | `(trip_id, seat_id)` | Seat uniqueness per trip |
| `bookings` | `booking_reference` | Booking reference uniqueness |
| `payments` | `booking_id`, `transaction_reference` | Payment uniqueness |
| `tickets` | `booking_id`, `ticket_number` | Ticket uniqueness |
| `cancellations` | `booking_id` | Cancellation uniqueness |
| `user_google_credentials` | `google_sub`, `user_id` | Google credential uniqueness |
| `user_roles` | `(user_id, role_id)` | Role assignment uniqueness |

### Foreign Keys

All relationships are enforced through foreign key constraints with:
- `ON DELETE CASCADE` for dependent entities (e.g., deleting a bus deletes its seats)
- `ON DELETE RESTRICT` for important references (e.g., cannot delete a booked trip)

### Performance Indexes

| Table | Indexed Columns | Type | Purpose |
|---|---|---|---|
| `users` | `email` | UNIQUE | Quick lookup by email |
| `users` | `status` | INDEX | Filter by user status |
| `bookings` | `user_id` | INDEX | Find user's bookings |
| `bookings` | `trip_id` | INDEX | Find bookings for a trip |
| `bookings` | `created_at` | INDEX | Time-based queries |
| `trip_seats` | `trip_id, status` | COMPOSITE | Find available seats in trip |
| `seat_holds` | `expires_at` | INDEX | Find expired holds |
| `trips` | `trip_date` | INDEX | Find trips by date |
| `trips` | `status` | INDEX | Filter by trip status |
| `otp_verifications` | `email, purpose` | COMPOSITE | Quick OTP lookup |

---

## Data Integrity Rules

### Constraints

1. **Booking Validation**: 
   - Pickup and drop locations must be different
   - Booking date cannot be in the past
   - Total amount must match sum of seat fares

2. **Seat Hold Expiry**: 
   - Seat holds automatically expire after configured duration (typically 15-30 minutes)
   - A seat can only have one active hold at a time

3. **Trip Seat Status**: 
   - Only AVAILABLE seats can be booked
   - HELD seats expire after hold duration
   - BOOKED seats cannot be modified

4. **Payment Processing**:
   - Payment must be completed before booking can be confirmed
   - Refunds reduce wallet balance

5. **Ticket Generation**:
   - Tickets are generated only for CONFIRMED bookings
   - Tickets expire after configured duration (typically 24 hours after trip departure)

---

## Scalability Considerations

### Partitioning Strategy

For high-volume systems, consider partitioning:
- `bookings` by `trip_date` (monthly or quarterly)
- `trips` by `trip_date`
- `trip_seats` by `trip_id`

### Archive Strategy

- Archive completed/cancelled bookings older than 1 year
- Archive expired OTP records
- Archive expired tickets

### Backup & Recovery

- Daily incremental backups
- Weekly full backups
- Point-in-time recovery capability
- Maintain 30-day backup retention

---

## Security Considerations

1. **Password Storage**: All passwords stored as hashes using bcrypt/scrypt
2. **Sensitive Data**: Transaction IDs and payment details encrypted at rest
3. **OTP Hashing**: All OTP codes stored as hashes
4. **Audit Logging**: Critical operations logged with timestamps and user IDs
5. **Data Masking**: PII masked in logs and reports

---
