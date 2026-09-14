#!/usr/bin/env bash

# ============================================================
# Bus Application - Test Data Seeder
# ============================================================
#
# Creates:
#   Users
#   Operators
#   Locations
#   Routes
#   Route Stops
#   Buses
#   Seats
#   Schedules
#   Trips
#
# Requirements:
#   - bash
#   - curl
#   - jq
#
# Usage:
#   chmod +x seed-data.sh
#   ./seed-data.sh
#
# Optional:
#   BASE_URL=http://localhost:8080/api/v1 ./seed-data.sh
#
# ============================================================

set -u

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------

USER_COUNT=20
OPERATOR_COUNT=10
BUSES_PER_OPERATOR=3
SEATS_PER_BUS=40
ROUTE_COUNT=10
SCHEDULES_PER_ROUTE=3
TRIPS_PER_SCHEDULE=3

PASSWORD="password123"

PASS=0
FAIL=0

# ------------------------------------------------------------
# Colors / formatting
# ------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------

print_section() {
    echo
    echo "============================================================"
    echo -e "${BLUE}$1${RESET}"
    echo "============================================================"
}

log_success() {
    echo -e "${GREEN}✓ $1${RESET}"
    ((PASS++))
}

log_failure() {
    echo -e "${RED}✗ $1${RESET}"
    ((FAIL++))
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo -e "${RED}ERROR: '$1' is required but not installed.${RESET}"
        exit 1
    fi
}

# ------------------------------------------------------------
# API helper
#
# Sets:
#   RESPONSE_BODY
#   RESPONSE_CODE
# ------------------------------------------------------------

api_post() {
    local endpoint="$1"
    local payload="$2"

    local response

    response=$(curl -sS \
        -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        -w $'\n%{http_code}')

    RESPONSE_CODE=$(echo "$response" | tail -n 1)
    RESPONSE_BODY=$(echo "$response" | sed '$d')

    if [[ "$RESPONSE_CODE" -ge 200 && "$RESPONSE_CODE" -lt 300 ]]; then
        return 0
    fi

    return 1
}

api_get() {
    local endpoint="$1"

    local response

    response=$(curl -sS \
        -X GET "$BASE_URL$endpoint" \
        -w $'\n%{http_code}')

    RESPONSE_CODE=$(echo "$response" | tail -n 1)
    RESPONSE_BODY=$(echo "$response" | sed '$d')

    if [[ "$RESPONSE_CODE" -ge 200 && "$RESPONSE_CODE" -lt 300 ]]; then
        return 0
    fi

    return 1
}

get_id() {
    echo "$RESPONSE_BODY" | jq -r '.id'
}

die() {
    echo
    echo -e "${RED}Seeder stopped.${RESET}"
    echo "HTTP: $RESPONSE_CODE"
    echo "Response:"
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    exit 1
}

# ------------------------------------------------------------
# Validate environment
# ------------------------------------------------------------

print_section "Checking requirements"

require_command curl
require_command jq

echo "BASE_URL: $BASE_URL"

# ------------------------------------------------------------
# Verify API is reachable
# ------------------------------------------------------------

print_section "Checking API"

if curl -sS "$BASE_URL/users" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ API is reachable${RESET}"
else
    echo -e "${YELLOW}WARNING: Could not verify $BASE_URL/users${RESET}"
    echo "The API may still be available; continuing..."
fi

# ------------------------------------------------------------
# Data containers
# ------------------------------------------------------------

declare -a USER_IDS
declare -a OPERATOR_IDS
declare -a LOCATION_IDS
declare -a ROUTE_IDS
declare -a BUS_IDS
declare -a SCHEDULE_IDS

# ------------------------------------------------------------
# Location master data
# ------------------------------------------------------------

LOCATION_NAMES=(
    "Chennai Central"
    "Vellore"
    "Katpadi"
    "Krishnagiri"
    "Hosur"
    "Bangalore"
    "Salem"
    "Coimbatore"
    "Madurai"
    "Trichy"
    "Pondicherry"
    "Tirunelveli"
    "Kanchipuram"
    "Tiruvannamalai"
    "Erode"
)

LOCATION_CITIES=(
    "Chennai"
    "Vellore"
    "Katpadi"
    "Krishnagiri"
    "Hosur"
    "Bangalore"
    "Salem"
    "Coimbatore"
    "Madurai"
    "Trichy"
    "Pondicherry"
    "Tirunelveli"
    "Kanchipuram"
    "Tiruvannamalai"
    "Erode"
)

LOCATION_STATES=(
    "Tamil Nadu"
    "Tamil Nadu"
    "Tamil Nadu"
    "Tamil Nadu"
    "Tamil Nadu"
    "Karnataka"
    "Tamil Nadu"
    "Tamil Nadu"
    "Tamil Nadu"
    "Tamil Nadu"
    "Puducherry"
    "Tamil Nadu"
    "Tamil Nadu"
    "Tamil Nadu"
    "Tamil Nadu"
)

# ------------------------------------------------------------
# 1. Create Users
# ------------------------------------------------------------

print_section "Creating $USER_COUNT users"

for ((i=1; i<=USER_COUNT; i++)); do

    EMAIL="seed.user.${i}.$(date +%s%N)@example.com"

    FIRST_NAME="TestUser"
    LAST_NAME="User${i}"

    PHONE="9$(printf '%09d' "$i")"

    PAYLOAD=$(jq -n \
        --arg email "$EMAIL" \
        --arg password "$PASSWORD" \
        --arg firstName "$FIRST_NAME" \
        --arg lastName "$LAST_NAME" \
        --arg phone "$PHONE" \
        '{
            email: $email,
            password: $password,
            firstName: $firstName,
            lastName: $lastName,
            phone: $phone
        }')

    if api_post "/users" "$PAYLOAD"; then

        ID=$(get_id)

        if [[ "$ID" == "null" || -z "$ID" ]]; then
            echo "Invalid user response:"
            echo "$RESPONSE_BODY" | jq .
            exit 1
        fi

        USER_IDS+=("$ID")

        log_success "User $i created → ID $ID"

    else
        log_failure "User $i failed"
        die
    fi

done

# ------------------------------------------------------------
# 2. Create Operators
# ------------------------------------------------------------

print_section "Creating $OPERATOR_COUNT operators"

for ((i=1; i<=OPERATOR_COUNT; i++)); do

    # Reuse users as operator owners.
    USER_INDEX=$((i - 1))
    USER_ID="${USER_IDS[$USER_INDEX]}"

    REGISTRATION="OP-SEED-$(printf '%04d' "$i")-$(date +%s)"

    PAYLOAD=$(jq -n \
        --argjson userId "$USER_ID" \
        --arg name "Seed Travels $i" \
        --arg registrationNumber "$REGISTRATION" \
        --arg contactEmail "operator${i}@example.com" \
        --arg contactPhone "9876543$(printf '%03d' "$i")" \
        '{
            userId: $userId,
            name: $name,
            registrationNumber: $registrationNumber,
            contactEmail: $contactEmail,
            contactPhone: $contactPhone,
            status: "ACTIVE"
        }')

    if api_post "/operators" "$PAYLOAD"; then

        ID=$(get_id)

        if [[ "$ID" == "null" || -z "$ID" ]]; then
            echo "Invalid operator response:"
            echo "$RESPONSE_BODY" | jq .
            exit 1
        fi

        OPERATOR_IDS+=("$ID")

        log_success "Operator $i created → ID $ID"

    else
        log_failure "Operator $i failed"
        die
    fi

done

# ------------------------------------------------------------
# 3. Create Locations
# ------------------------------------------------------------

print_section "Creating locations"

for ((i=0; i<${#LOCATION_NAMES[@]}; i++)); do

    PAYLOAD=$(jq -n \
        --arg name "${LOCATION_NAMES[$i]}" \
        --arg city "${LOCATION_CITIES[$i]}" \
        --arg state "${LOCATION_STATES[$i]}" \
        '{
            name: $name,
            city: $city,
            state: $state,
            country: "India"
        }')

    if api_post "/locations" "$PAYLOAD"; then

        ID=$(get_id)
        LOCATION_IDS+=("$ID")

        log_success "Location created: ${LOCATION_NAMES[$i]} → ID $ID"

    else
        log_failure "Location failed: ${LOCATION_NAMES[$i]}"
        die
    fi

done

# ------------------------------------------------------------
# 4. Create Buses
# ------------------------------------------------------------

print_section "Creating buses"

BUS_GLOBAL_INDEX=1

for ((operator_index=0; operator_index<OPERATOR_COUNT; operator_index++)); do

    OPERATOR_ID="${OPERATOR_IDS[$operator_index]}"

    for ((bus_number=1; bus_number<=BUSES_PER_OPERATOR; bus_number++)); do

        REGISTRATION="TN-SEED-$(printf '%05d' "$BUS_GLOBAL_INDEX")"

        PAYLOAD=$(jq -n \
            --argjson operatorId "$OPERATOR_ID" \
            --arg registrationNumber "$REGISTRATION" \
            --arg model "Volvo B11R" \
            '{
                operatorId: $operatorId,
                registrationNumber: $registrationNumber,
                model: $model,
                busType: "SEATER",
                status: "ACTIVE"
            }')

        if api_post "/buses" "$PAYLOAD"; then

            ID=$(get_id)

            BUS_IDS+=("$ID")

            log_success "Bus $BUS_GLOBAL_INDEX created → ID $ID"

        else
            log_failure "Bus $BUS_GLOBAL_INDEX failed"
            die
        fi

        ((BUS_GLOBAL_INDEX++))

    done

done

# ------------------------------------------------------------
# 5. Create Seats
# ------------------------------------------------------------

print_section "Creating seats"

SEAT_GLOBAL_INDEX=1

for BUS_ID in "${BUS_IDS[@]}"; do

    for ((seat=1; seat<=SEATS_PER_BUS; seat++)); do

        ROW=$(( (seat - 1) / 4 + 1 ))
        POSITION_IN_ROW=$(( (seat - 1) % 4 ))

        case "$POSITION_IN_ROW" in
            0) POSITION="WINDOW" ;;
            1) POSITION="AISLE" ;;
            2) POSITION="AISLE" ;;
            3) POSITION="WINDOW" ;;
        esac

        SEAT_NUMBER="R${ROW}S$((POSITION_IN_ROW + 1))"

        PAYLOAD=$(jq -n \
            --argjson busId "$BUS_ID" \
            --arg seatNumber "$SEAT_NUMBER" \
            --arg position "$POSITION" \
            '{
                busId: $busId,
                seatNumber: $seatNumber,
                seatType: "SEAT",
                position: $position
            }')

        if api_post "/seats" "$PAYLOAD"; then

            ((SEAT_GLOBAL_INDEX++))

        else
            echo -e "${RED}Failed creating seat $SEAT_NUMBER for bus $BUS_ID${RESET}"
            die
        fi

    done

    echo -e "${GREEN}✓ Created $SEATS_PER_BUS seats for bus $BUS_ID${RESET}"

done

# ------------------------------------------------------------
# 6. Create Routes
# ------------------------------------------------------------

print_section "Creating $ROUTE_COUNT routes"

# Route definitions.
#
# Each route contains 4 locations.
#
# Route 1: Chennai -> Vellore -> Hosur -> Bangalore
# Route 2: Chennai -> Kanchipuram -> Tiruvannamalai -> Salem
# Route 3: Chennai -> Pondicherry -> Trichy -> Madurai
# etc.

ROUTE_STOPS=(
    "0 1 4 5"
    "0 12 13 6"
    "0 10 9 8"
    "6 7 14 5"
    "8 9 6 7"
    "0 3 4 5"
    "0 1 2 5"
    "6 14 7 5"
    "8 9 7 5"
    "0 10 9 6"
)

ROUTE_NAMES=(
    "Chennai - Bangalore"
    "Chennai - Salem"
    "Chennai - Madurai"
    "Salem - Bangalore"
    "Madurai - Coimbatore"
    "Chennai - Hosur"
    "Chennai - Katpadi - Bangalore"
    "Salem - Coimbatore - Bangalore"
    "Madurai - Trichy - Bangalore"
    "Chennai - Pondicherry - Salem"
)

for ((r=0; r<ROUTE_COUNT; r++)); do

    ROUTE_NAME="${ROUTE_NAMES[$r]}"

    PAYLOAD=$(jq -n \
        --arg name "$ROUTE_NAME" \
        '{
            name: $name,
            status: "ACTIVE"
        }')

    if api_post "/routes" "$PAYLOAD"; then

        ROUTE_ID=$(get_id)
        ROUTE_IDS+=("$ROUTE_ID")

        log_success "Route $((r+1)) created: $ROUTE_NAME → ID $ROUTE_ID"

    else
        log_failure "Route $((r+1)) failed"
        die
    fi

done

# ------------------------------------------------------------
# 7. Create Route Stops
# ------------------------------------------------------------

print_section "Creating route stops"

for ((r=0; r<ROUTE_COUNT; r++)); do

    ROUTE_ID="${ROUTE_IDS[$r]}"

    read -r L1 L2 L3 L4 <<< "${ROUTE_STOPS[$r]}"

    STOP_LOCATIONS=("$L1" "$L2" "$L3" "$L4")

    # Approximate distances from origin.
    DISTANCES=(0 60 180 350)

    # Approximate arrival/departure offsets.
    ARRIVAL_OFFSETS=(0 75 210 360)
    DEPARTURE_OFFSETS=(10 85 220 370)

    for ((s=0; s<4; s++)); do

        LOCATION_ID="${LOCATION_IDS[${STOP_LOCATIONS[$s]}]}"

        STOP_ORDER=$((s + 1))
        DISTANCE="${DISTANCES[$s]}"
        ARRIVAL="${ARRIVAL_OFFSETS[$s]}"
        DEPARTURE="${DEPARTURE_OFFSETS[$s]}"

        PAYLOAD=$(jq -n \
            --argjson routeId "$ROUTE_ID" \
            --argjson locationId "$LOCATION_ID" \
            --argjson stopOrder "$STOP_ORDER" \
            --argjson arrivalOffsetMinutes "$ARRIVAL" \
            --argjson departureOffsetMinutes "$DEPARTURE" \
            --argjson distanceFromOriginKm "$DISTANCE" \
            '{
                routeId: $routeId,
                locationId: $locationId,
                stopOrder: $stopOrder,
                arrivalOffsetMinutes: $arrivalOffsetMinutes,
                departureOffsetMinutes: $departureOffsetMinutes,
                distanceFromOriginKm: $distanceFromOriginKm
            }')

        if api_post "/route-stops" "$PAYLOAD"; then

            echo -e "${GREEN}  ✓ Stop $STOP_ORDER created${RESET}"

        else
            echo -e "${RED}  ✗ Stop $STOP_ORDER failed${RESET}"
            die
        fi

    done

done

# ------------------------------------------------------------
# 8. Create Schedules
# ------------------------------------------------------------

print_section "Creating schedules"

DEPARTURE_TIMES=(
    "06:00:00"
    "14:00:00"
    "21:00:00"
)

SCHEDULE_GLOBAL_INDEX=1

for ((r=0; r<ROUTE_COUNT; r++)); do

    ROUTE_ID="${ROUTE_IDS[$r]}"

    # Assign buses to routes in a round-robin fashion.
    for ((s=0; s<SCHEDULES_PER_ROUTE; s++)); do

        BUS_INDEX=$(( (r * SCHEDULES_PER_ROUTE + s) % ${#BUS_IDS[@]} ))
        BUS_ID="${BUS_IDS[$BUS_INDEX]}"

        DEPARTURE_TIME="${DEPARTURE_TIMES[$s]}"

        # Effective date is today.
        EFFECTIVE_FROM=$(date +%Y-%m-%d)

        # Different fares for different schedules.
        BASE_FARE=$((200 + r * 20 + s * 25))
        PRICE_PER_KM="2.50"

        PAYLOAD=$(jq -n \
            --argjson routeId "$ROUTE_ID" \
            --argjson busId "$BUS_ID" \
            --arg departureTime "$DEPARTURE_TIME" \
            --arg effectiveFrom "$EFFECTIVE_FROM" \
            --arg baseFare "$BASE_FARE" \
            --arg pricePerKm "$PRICE_PER_KM" \
            '{
                routeId: $routeId,
                busId: $busId,
                departureTime: $departureTime,
                effectiveFrom: $effectiveFrom,
                operatingDays: "MON,TUE,WED,THU,FRI,SAT,SUN",
                baseFare: ($baseFare | tonumber),
                pricePerKm: ($pricePerKm | tonumber),
                status: "ACTIVE"
            }')

        if api_post "/schedules" "$PAYLOAD"; then

            SCHEDULE_ID=$(get_id)
            SCHEDULE_IDS+=("$SCHEDULE_ID")

            log_success "Schedule $SCHEDULE_GLOBAL_INDEX created → ID $SCHEDULE_ID"

        else
            log_failure "Schedule $SCHEDULE_GLOBAL_INDEX failed"
            die
        fi

        ((SCHEDULE_GLOBAL_INDEX++))

    done

done

# ------------------------------------------------------------
# 9. Create Trips
# ------------------------------------------------------------

print_section "Creating trips"

TRIP_GLOBAL_INDEX=1

for SCHEDULE_ID in "${SCHEDULE_IDS[@]}"; do

    # Create trips for the next few days.
    for ((day=1; day<=TRIPS_PER_SCHEDULE; day++)); do

        TRIP_DATE=$(date -d "+${day} day" +%Y-%m-%d)

        # Match schedule departure time based on schedule position.
        SCHEDULE_INDEX=$(( (TRIP_GLOBAL_INDEX - 1) % SCHEDULES_PER_ROUTE ))

        DEPARTURE_TIME="${DEPARTURE_TIMES[$SCHEDULE_INDEX]}"

        PAYLOAD=$(jq -n \
            --argjson scheduleId "$SCHEDULE_ID" \
            --arg tripDate "$TRIP_DATE" \
            --arg departureTime "$DEPARTURE_TIME" \
            '{
                scheduleId: $scheduleId,
                tripDate: $tripDate,
                departureTime: $departureTime,
                status: "SCHEDULED"
            }')

        if api_post "/trips" "$PAYLOAD"; then

            TRIP_ID=$(get_id)

            log_success "Trip $TRIP_GLOBAL_INDEX created → $TRIP_DATE → ID $TRIP_ID"

        else
            log_failure "Trip $TRIP_GLOBAL_INDEX failed"
            die
        fi

        ((TRIP_GLOBAL_INDEX++))

    done

done

# ------------------------------------------------------------
# Summary
# ------------------------------------------------------------

print_section "SEEDING COMPLETE"

echo
echo "Created:"
echo "------------------------------------------------------------"
echo "Users       : ${#USER_IDS[@]}"
echo "Operators   : ${#OPERATOR_IDS[@]}"
echo "Locations   : ${#LOCATION_IDS[@]}"
echo "Routes      : ${#ROUTE_IDS[@]}"
echo "Buses       : ${#BUS_IDS[@]}"
echo "Seats       : $(( ${#BUS_IDS[@]} * SEATS_PER_BUS ))"
echo "Schedules   : ${#SCHEDULE_IDS[@]}"
echo "Trips       : $(( ${#SCHEDULE_IDS[@]} * TRIPS_PER_SCHEDULE ))"
echo "------------------------------------------------------------"

echo
echo "API:"
echo "$BASE_URL"

echo
echo "PASS: $PASS"
echo "FAIL: $FAIL"

if [[ "$FAIL" -eq 0 ]]; then
    echo
    echo -e "${GREEN}🎉 Test data seeded successfully!${RESET}"
    exit 0
else
    echo
    echo -e "${RED}❌ Seeding completed with failures.${RESET}"
    exit 1
fi