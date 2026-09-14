#!/bin/bash

BASE_URL="http://localhost:8080/api/v1"

PASS=0
FAIL=0

# --------------------------------------------------
# Helpers
# --------------------------------------------------

print_test() {
    echo
    echo "=================================================="
    echo "TEST: $1"
    echo "=================================================="
}

pass() {
    echo "✅ PASS: $1"
    ((PASS++))
}

fail() {
    echo "❌ FAIL: $1"
    ((FAIL++))
    exit 1
}

check_http() {
    if [ "$1" -ge 200 ] && [ "$1" -lt 300 ]; then
        pass "$2"
    else
        fail "$2 (HTTP $1)"
    fi
}

# --------------------------------------------------
# 1. Create User
# --------------------------------------------------

print_test "Create User"

USER_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "testuser_'$(date +%s)'@example.com",
        "password": "password123",
        "firstName": "Test",
        "lastName": "User",
        "phone": "9876543210"
    }')

USER_HTTP=$(echo "$USER_RESPONSE" | tail -n1)
USER_JSON=$(echo "$USER_RESPONSE" | sed '$d')

check_http "$USER_HTTP" "User created"

USER_ID=$(echo "$USER_JSON" | jq -r '.id')

echo "User ID: $USER_ID"


# --------------------------------------------------
# 2. Create Operator
# --------------------------------------------------

print_test "Create Operator"

OPERATOR_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/operators" \
    -H "Content-Type: application/json" \
    -d '{
        "userId": '"$USER_ID"',
        "name": "Test Travels",
        "registrationNumber": "OP-'$(date +%s)'",
        "contactEmail": "operator@example.com",
        "contactPhone": "9876543211",
        "status": "ACTIVE"
    }')

OPERATOR_HTTP=$(echo "$OPERATOR_RESPONSE" | tail -n1)
OPERATOR_JSON=$(echo "$OPERATOR_RESPONSE" | sed '$d')

check_http "$OPERATOR_HTTP" "Operator created"

OPERATOR_ID=$(echo "$OPERATOR_JSON" | jq -r '.id')

echo "Operator ID: $OPERATOR_ID"


# --------------------------------------------------
# 3. Create Locations
# --------------------------------------------------

print_test "Create Origin"

ORIGIN_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/locations" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Chennai Central",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "country": "India"
    }')

ORIGIN_HTTP=$(echo "$ORIGIN_RESPONSE" | tail -n1)
ORIGIN_JSON=$(echo "$ORIGIN_RESPONSE" | sed '$d')

check_http "$ORIGIN_HTTP" "Origin created"

ORIGIN_ID=$(echo "$ORIGIN_JSON" | jq -r '.id')


print_test "Create Intermediate Location"

MID_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/locations" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Vellore",
        "city": "Vellore",
        "state": "Tamil Nadu",
        "country": "India"
    }')

MID_HTTP=$(echo "$MID_RESPONSE" | tail -n1)
MID_JSON=$(echo "$MID_RESPONSE" | sed '$d')

check_http "$MID_HTTP" "Intermediate location created"

MID_ID=$(echo "$MID_JSON" | jq -r '.id')


print_test "Create Destination"

DEST_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/locations" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Bangalore",
        "city": "Bangalore",
        "state": "Karnataka",
        "country": "India"
    }')

DEST_HTTP=$(echo "$DEST_RESPONSE" | tail -n1)
DEST_JSON=$(echo "$DEST_RESPONSE" | sed '$d')

check_http "$DEST_HTTP" "Destination created"

DEST_ID=$(echo "$DEST_JSON" | jq -r '.id')

echo "Origin: $ORIGIN_ID"
echo "Vellore: $MID_ID"
echo "Destination: $DEST_ID"


# --------------------------------------------------
# 4. Create Route
# --------------------------------------------------

print_test "Create Route"

ROUTE_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/routes" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Chennai - Bangalore",
        "status": "ACTIVE"
    }')

ROUTE_HTTP=$(echo "$ROUTE_RESPONSE" | tail -n1)
ROUTE_JSON=$(echo "$ROUTE_RESPONSE" | sed '$d')

check_http "$ROUTE_HTTP" "Route created"

ROUTE_ID=$(echo "$ROUTE_JSON" | jq -r '.id')

echo "Route ID: $ROUTE_ID"


# --------------------------------------------------
# 5. Add Route Stops
# --------------------------------------------------

print_test "Add Route Stops"

create_stop() {
    local LOCATION_ID=$1
    local ORDER=$2
    local DISTANCE=$3

    curl -s -w "%{http_code}" \
        -o /tmp/route-stop-response.json \
        -X POST "$BASE_URL/route-stops" \
        -H "Content-Type: application/json" \
        -d '{
            "routeId": '"$ROUTE_ID"',
            "locationId": '"$LOCATION_ID"',
            "stopOrder": '"$ORDER"',
            "arrivalOffsetMinutes": 0,
            "departureOffsetMinutes": 0,
            "distanceFromOriginKm": '"$DISTANCE"'
        }'
}

STATUS=$(create_stop "$ORIGIN_ID" 1 0)
check_http "$STATUS" "Origin route stop created"

STATUS=$(create_stop "$MID_ID" 2 130)
check_http "$STATUS" "Vellore route stop created"

STATUS=$(create_stop "$DEST_ID" 3 350)
check_http "$STATUS" "Destination route stop created"


# --------------------------------------------------
# 6. Create Bus
# --------------------------------------------------

print_test "Create Bus"

BUS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/buses" \
    -H "Content-Type: application/json" \
    -d '{
        "operatorId": '"$OPERATOR_ID"',
        "registrationNumber": "TN-'$(date +%s)'",
        "model": "Volvo B11R",
        "busType": "SEATER",
        "status": "ACTIVE"
    }')

BUS_HTTP=$(echo "$BUS_RESPONSE" | tail -n1)
BUS_JSON=$(echo "$BUS_RESPONSE" | sed '$d')

check_http "$BUS_HTTP" "Bus created"

BUS_ID=$(echo "$BUS_JSON" | jq -r '.id')

echo "Bus ID: $BUS_ID"


# --------------------------------------------------
# 7. Create Seats
# --------------------------------------------------

print_test "Create Seats"

create_seat() {
    local NUMBER=$1

    curl -s -w "%{http_code}" \
        -o /tmp/seat-response.json \
        -X POST "$BASE_URL/seats" \
        -H "Content-Type: application/json" \
        -d '{
            "busId": '"$BUS_ID"',
            "seatNumber": "'"$NUMBER"'",
            "seatType": "SEAT",
            "position": "WINDOW"
        }'
}

STATUS=$(create_seat "A1")
check_http "$STATUS" "Seat A1 created"

STATUS=$(create_seat "A2")
check_http "$STATUS" "Seat A2 created"

STATUS=$(create_seat "A3")
check_http "$STATUS" "Seat A3 created"


# --------------------------------------------------
# 8. Create Schedule
# --------------------------------------------------

print_test "Create Schedule"

SCHEDULE_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/schedules" \
    -H "Content-Type: application/json" \
    -d '{
        "routeId": '"$ROUTE_ID"',
        "busId": '"$BUS_ID"',
        "departureTime": "21:00:00",
        "effectiveFrom": "2026-09-01",
        "operatingDays": "MON,TUE,WED,THU,FRI,SAT,SUN",
        "baseFare": 200.00,
        "pricePerKm": 2.50,
        "status": "ACTIVE"
    }')

SCHEDULE_HTTP=$(echo "$SCHEDULE_RESPONSE" | tail -n1)
SCHEDULE_JSON=$(echo "$SCHEDULE_RESPONSE" | sed '$d')

check_http "$SCHEDULE_HTTP" "Schedule created"

SCHEDULE_ID=$(echo "$SCHEDULE_JSON" | jq -r '.id')

echo "Schedule ID: $SCHEDULE_ID"


# --------------------------------------------------
# 9. Create Trip
# --------------------------------------------------

print_test "Create Trip"

TRIP_DATE=$(date -d "+1 day" +%Y-%m-%d)

TRIP_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/trips" \
    -H "Content-Type: application/json" \
    -d '{
        "scheduleId": '"$SCHEDULE_ID"',
        "tripDate": "'"$TRIP_DATE"'",
        "departureTime": "21:00:00",
        "status": "SCHEDULED"
    }')

TRIP_HTTP=$(echo "$TRIP_RESPONSE" | tail -n1)
TRIP_JSON=$(echo "$TRIP_RESPONSE" | sed '$d')

check_http "$TRIP_HTTP" "Trip created"

TRIP_ID=$(echo "$TRIP_JSON" | jq -r '.id')

echo "Trip ID: $TRIP_ID"


# --------------------------------------------------
# 10. Get Trip Seats
# --------------------------------------------------

print_test "Get Trip Seats"

SEATS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    "$BASE_URL/trip-seats/trip/$TRIP_ID")

SEATS_HTTP=$(echo "$SEATS_RESPONSE" | tail -n1)
SEATS_JSON=$(echo "$SEATS_RESPONSE" | sed '$d')

check_http "$SEATS_HTTP" "Trip seats retrieved"

TRIP_SEAT_1=$(echo "$SEATS_JSON" | jq -r '.[0].id')
TRIP_SEAT_2=$(echo "$SEATS_JSON" | jq -r '.[1].id')

echo "Trip Seat 1: $TRIP_SEAT_1"
echo "Trip Seat 2: $TRIP_SEAT_2"


# --------------------------------------------------
# 11. Hold Seats
# --------------------------------------------------

print_test "Hold Seats"

HOLD_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/seat-holds?userId=$USER_ID" \
    -H "Content-Type: application/json" \
    -d '{
        "tripId": '"$TRIP_ID"',
        "tripSeatIds": [
            '"$TRIP_SEAT_1"',
            '"$TRIP_SEAT_2"'
        ]
    }')

HOLD_HTTP=$(echo "$HOLD_RESPONSE" | tail -n1)
HOLD_JSON=$(echo "$HOLD_RESPONSE" | sed '$d')

check_http "$HOLD_HTTP" "Seats held"

echo "$HOLD_JSON" | jq .


# --------------------------------------------------
# 12. Create Booking
# --------------------------------------------------

print_test "Create Booking"

BOOKING_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/bookings?userId=$USER_ID" \
    -H "Content-Type: application/json" \
    -d '{
        "tripId": '"$TRIP_ID"',
        "pickupLocationId": '"$ORIGIN_ID"',
        "dropLocationId": '"$MID_ID"',
        "passengers": [
            {
                "tripSeatId": '"$TRIP_SEAT_1"',
                "firstName": "John",
                "lastName": "Doe",
                "age": 25,
                "gender": "MALE"
            },
            {
                "tripSeatId": '"$TRIP_SEAT_2"',
                "firstName": "Jane",
                "lastName": "Doe",
                "age": 24,
                "gender": "FEMALE"
            }
        ]
    }')

BOOKING_HTTP=$(echo "$BOOKING_RESPONSE" | tail -n1)
BOOKING_JSON=$(echo "$BOOKING_RESPONSE" | sed '$d')

check_http "$BOOKING_HTTP" "Booking created"

BOOKING_ID=$(echo "$BOOKING_JSON" | jq -r '.id')

echo "Booking ID: $BOOKING_ID"
echo "$BOOKING_JSON" | jq .


# --------------------------------------------------
# 13. Verify Booking Amount
# --------------------------------------------------

print_test "Verify Booking Amount"

EXPECTED_AMOUNT="1050.00"

ACTUAL_AMOUNT=$(echo "$BOOKING_JSON" | jq -r '.totalAmount')

if [ "$ACTUAL_AMOUNT" = "$EXPECTED_AMOUNT" ]; then
    pass "Booking amount is $ACTUAL_AMOUNT"
else
    fail "Expected $EXPECTED_AMOUNT but got $ACTUAL_AMOUNT"
fi


# --------------------------------------------------
# 14. Process Payment
# --------------------------------------------------

print_test "Process Payment"

PAYMENT_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$BASE_URL/payments" \
    -H "Content-Type: application/json" \
    -d '{
        "bookingId": '"$BOOKING_ID"',
        "paymentMethod": "UPI"
    }')

PAYMENT_HTTP=$(echo "$PAYMENT_RESPONSE" | tail -n1)
PAYMENT_JSON=$(echo "$PAYMENT_RESPONSE" | sed '$d')

check_http "$PAYMENT_HTTP" "Payment processed"

echo "$PAYMENT_JSON" | jq .


# --------------------------------------------------
# 15. Get Ticket
# --------------------------------------------------

print_test "Get Ticket"

TICKET_RESPONSE=$(curl -s -w "\n%{http_code}" \
    "$BASE_URL/tickets/booking/$BOOKING_ID")

TICKET_HTTP=$(echo "$TICKET_RESPONSE" | tail -n1)
TICKET_JSON=$(echo "$TICKET_RESPONSE" | sed '$d')

check_http "$TICKET_HTTP" "Ticket retrieved"

TICKET_NUMBER=$(echo "$TICKET_JSON" | jq -r '.ticketNumber')

echo
echo "🎫 Ticket Number: $TICKET_NUMBER"
echo "$TICKET_JSON" | jq .


# --------------------------------------------------
# Final result
# --------------------------------------------------

echo
echo "=================================================="
echo "FINAL RESULT"
echo "=================================================="
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo "=================================================="

if [ "$FAIL" -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED"
else
    echo "❌ SOME TESTS FAILED"
    exit 1
fi