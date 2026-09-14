#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
API="${BASE_URL}/api/v1"

# Database settings are only needed for assigning ADMIN to the first user.
DB_NAME="${DB_NAME:-bus_booking}"
DB_USER="${DB_USER:-root}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_PASSWORD="${DB_PASSWORD:-609471@SKy}"

command -v curl >/dev/null || { echo "curl is required"; exit 1; }
command -v jq >/dev/null || { echo "jq is required"; exit 1; }
command -v mysql >/dev/null || {
    echo "mysql client is required because ADMIN role assignment is not exposed by the current API."
    exit 1
}

echo "=============================================="
echo " Bus Booking Database Seeder"
echo "=============================================="
echo "API: ${API}"
echo

post_json() {
    local url="$1"
    local token="$2"
    local body="$3"

    if [[ -n "$token" ]]; then
        curl --fail-with-body -sS \
            -X POST "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "$body"
    else
        curl --fail-with-body -sS \
            -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$body"
    fi
}

get_json() {
    local url="$1"
    local token="$2"

    curl --fail-with-body -sS \
        -X GET "$url" \
        -H "Authorization: Bearer ${token}"
}

# ------------------------------------------------------------
# 1. USERS
# ------------------------------------------------------------

echo "[1/8] Creating 20 users..."

declare -a USER_IDS=()
declare -a USER_EMAILS=()
declare -a USER_PASSWORDS=()
declare -a USER_TOKENS=()

create_user() {
    local index="$1"
    local email="$2"
    local password="$3"
    local first="$4"

    local response
    response=$(post_json \
        "${API}/auth/register" \
        "" \
        "$(jq -n \
            --arg email "$email" \
            --arg password "$password" \
            --arg first "$first" \
            --arg phone "$(printf '90000%05d' "$index")" \
            '{
                email: $email,
                password: $password,
                firstName: $first,
                lastName: "Seed",
                phone: $phone
            }'
        )")

    local id
    id=$(echo "$response" | jq -r '.userId')

    if [[ -z "$id" || "$id" == "null" ]]; then
        echo "Failed to create ${email}:"
        echo "$response"
        exit 1
    fi

    USER_IDS+=("$id")
    USER_EMAILS+=("$email")
    USER_PASSWORDS+=("$password")

    echo "  user ${index}/20 -> id=${id}"
}

# First user is the admin account.
ADMIN_EMAIL="admin@busbooking.local"
ADMIN_PASSWORD="Admin@123456"

create_user 1 "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "System"

for i in $(seq 2 20); do
    create_user "$i" "user${i}@busbooking.local" "User@123456" "User${i}"
done

# ------------------------------------------------------------
# 2. LOGIN + ADMIN ROLE
# ------------------------------------------------------------

echo
echo "[2/8] Logging in users..."

for i in "${!USER_IDS[@]}"; do
    login=$(post_json \
        "${API}/auth/login" \
        "" \
        "$(jq -n \
            --arg email "${USER_EMAILS[$i]}" \
            --arg password "${USER_PASSWORDS[$i]}" \
            '{
                email: $email,
                password: $password
            }'
        )")

    token=$(echo "$login" | jq -r '.accessToken')

    if [[ -z "$token" || "$token" == "null" ]]; then
        echo "Login failed: ${USER_EMAILS[$i]}"
        echo "$login"
        exit 1
    fi

    USER_TOKENS+=("$token")
done

ADMIN_ID="${USER_IDS[0]}"
ADMIN_TOKEN="${USER_TOKENS[0]}"

echo "  Admin candidate: ${ADMIN_EMAIL} (id=${ADMIN_ID})"

echo "  Assigning ADMIN role to first user..."

MYSQL_ARGS=(-h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "-p${DB_PASSWORD}" "$DB_NAME")

mysql "${MYSQL_ARGS[@]}" -e "
INSERT INTO user_roles (user_id, role_id)
SELECT ${ADMIN_ID}, r.id
FROM roles r
WHERE r.name = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = ${ADMIN_ID}
        AND ur.role_id = r.id
  );
"

echo "  ADMIN role assigned."

# ------------------------------------------------------------
# 3. LOCATIONS - 50
# ------------------------------------------------------------

echo
echo "[3/8] Creating 50 locations..."

declare -a LOCATION_IDS=()

locations=(
    "Chennai Central|Chennai|Tamil Nadu|India"
    "Chennai CMBT|Chennai|Tamil Nadu|India"
    "Tambaram|Chennai|Tamil Nadu|India"
    "Mahabalipuram|Chengalpattu|Tamil Nadu|India"
    "Pondicherry Bus Stand|Puducherry|Puducherry|India"
    "Cuddalore|Cuddalore|Tamil Nadu|India"
    "Chidambaram|Cuddalore|Tamil Nadu|India"
    "Mayiladuthurai|Mayiladuthurai|Tamil Nadu|India"
    "Kumbakonam|Thanjavur|Tamil Nadu|India"
    "Thanjavur|Thanjavur|Tamil Nadu|India"
    "Trichy Central|Tiruchirappalli|Tamil Nadu|India"
    "Srirangam|Tiruchirappalli|Tamil Nadu|India"
    "Karur|Karur|Tamil Nadu|India"
    "Salem|Salem|Tamil Nadu|India"
    "Erode|Erode|Tamil Nadu|India"
    "Tiruppur|Tiruppur|Tamil Nadu|India"
    "Coimbatore Gandhipuram|Coimbatore|Tamil Nadu|India"
    "Pollachi|Coimbatore|Tamil Nadu|India"
    "Dindigul|Dindigul|Tamil Nadu|India"
    "Madurai Mattuthavani|Madurai|Tamil Nadu|India"
    "Virudhunagar|Virudhunagar|Tamil Nadu|India"
    "Sivakasi|Virudhunagar|Tamil Nadu|India"
    "Tirunelveli|Tirunelveli|Tamil Nadu|India"
    "Nagercoil|Kanniyakumari|Tamil Nadu|India"
    "Thoothukudi|Thoothukudi|Tamil Nadu|India"
    "Vellore|Vellore|Tamil Nadu|India"
    "Katpadi|Vellore|Tamil Nadu|India"
    "Ranipet|Ranipet|Tamil Nadu|India"
    "Kanchipuram|Kanchipuram|Tamil Nadu|India"
    "Arakkonam|Ranipet|Tamil Nadu|India"
    "Tiruvallur|Tiruvallur|Tamil Nadu|India"
    "Poonamallee|Chennai|Tamil Nadu|India"
    "Bengaluru Majestic|Bengaluru|Karnataka|India"
    "Hosur|Krishnagiri|Tamil Nadu|India"
    "Krishnagiri|Krishnagiri|Tamil Nadu|India"
    "Dharmapuri|Dharmapuri|Tamil Nadu|India"
    "Mysuru|Mysuru|Karnataka|India"
    "Kochi Vyttila|Kochi|Kerala|India"
    "Palakkad|Palakkad|Kerala|India"
    "Thrissur|Thrissur|Kerala|India"
    "Kozhikode|Kozhikode|Kerala|India"
    "Mangaluru|Dakshina Kannada|Karnataka|India"
    "Hyderabad MGBS|Hyderabad|Telangana|India"
    "Vijayawada|Vijayawada|Andhra Pradesh|India"
    "Visakhapatnam|Visakhapatnam|Andhra Pradesh|India"
    "Pune Swargate|Pune|Maharashtra|India"
    "Mumbai Central|Mumbai|Maharashtra|India"
    "Bhubaneswar|Bhubaneswar|Odisha|India"
    "Kolkata Esplanade|Kolkata|West Bengal|India"
    "New Delhi ISBT|New Delhi|Delhi|India"
)

for i in "${!locations[@]}"; do
    IFS='|' read -r name city state country <<< "${locations[$i]}"

    response=$(post_json \
        "${API}/locations" \
        "$ADMIN_TOKEN" \
        "$(jq -n \
            --arg name "$name" \
            --arg city "$city" \
            --arg state "$state" \
            --arg country "$country" \
            '{
                name: $name,
                city: $city,
                state: $state,
                country: $country
            }'
        )")

    id=$(echo "$response" | jq -r '.id')
    LOCATION_IDS+=("$id")

    printf "  location %2d/50 -> id=%s (%s)\n" "$((i+1))" "$id" "$name"
done

# ------------------------------------------------------------
# 4. OPERATORS - 5
# ------------------------------------------------------------

echo
echo "[4/8] Creating 5 operators..."

declare -a OPERATOR_IDS=()
declare -a OPERATOR_USER_IDS=()

# Users 2-6 are used as operator accounts.
for i in $(seq 2 6); do
    idx=$((i-1))
    user_id="${USER_IDS[$idx]}"

    response=$(post_json \
        "${API}/operators" \
        "$ADMIN_TOKEN" \
        "$(jq -n \
            --argjson userId "$user_id" \
            --arg name "Seed Operator ${idx}" \
            --arg registration "SEED-OP-${idx}" \
            --arg email "operator${idx}@busbooking.local" \
            --arg phone "$(printf '91000%05d' "$idx")" \
            '{
                userId: $userId,
                name: $name,
                registrationNumber: $registration,
                contactEmail: $email,
                contactPhone: $phone,
                status: "ACTIVE"
            }'
        )")

    operator_id=$(echo "$response" | jq -r '.id')

    OPERATOR_IDS+=("$operator_id")
    OPERATOR_USER_IDS+=("$user_id")

    echo "  operator ${idx}/5 -> id=${operator_id}, userId=${user_id}"
done

# ------------------------------------------------------------
# 5. ROUTES + ROUTE STOPS
#
# 50 locations are spread across 10 routes.
# Each route has 5 stops.
# Total route stops = 50.
# ------------------------------------------------------------

echo
echo "[5/8] Creating 10 routes and 50 route stops..."

declare -a ROUTE_IDS=()

for r in $(seq 0 9); do
    start_idx=$((r * 5))
    end_idx=$((start_idx + 4))

    origin_name="${locations[$start_idx]%%|*}"
    destination_name="${locations[$end_idx]%%|*}"

    route_response=$(post_json \
        "${API}/routes" \
        "$ADMIN_TOKEN" \
        "$(jq -n \
            --arg name "Seed Route $((r+1)): ${origin_name} - ${destination_name}" \
            '{
                name: $name,
                status: "ACTIVE"
            }'
        )")

    route_id=$(echo "$route_response" | jq -r '.id')
    ROUTE_IDS+=("$route_id")

    echo "  route $((r+1))/10 -> id=${route_id}"

    for s in $(seq 0 4); do
        loc_idx=$((start_idx + s))
        location_id="${LOCATION_IDS[$loc_idx]}"
        distance=$((s * 50 + r * 10))
        arrival=$((s * 60))
        departure=$((arrival + 5))

        stop_response=$(post_json \
            "${API}/route-stops" \
            "$ADMIN_TOKEN" \
            "$(jq -n \
                --argjson routeId "$route_id" \
                --argjson locationId "$location_id" \
                --argjson stopOrder "$((s+1))" \
                --argjson arrivalOffsetMinutes "$arrival" \
                --argjson departureOffsetMinutes "$departure" \
                --argjson distanceFromOriginKm "$distance" \
                '{
                    routeId: $routeId,
                    locationId: $locationId,
                    stopOrder: $stopOrder,
                    arrivalOffsetMinutes: $arrivalOffsetMinutes,
                    departureOffsetMinutes: $departureOffsetMinutes,
                    distanceFromOriginKm: $distanceFromOriginKm
                }'
            )")

        stop_id=$(echo "$stop_response" | jq -r '.id')
        echo "      stop $((s+1))/5 -> id=${stop_id}"
    done
done

# ------------------------------------------------------------
# 6. BUSES - 40
#
# 8 buses per operator.
# ------------------------------------------------------------

echo
echo "[6/8] Creating 40 buses..."

declare -a BUS_IDS=()

for b in $(seq 1 40); do
    operator_idx=$(((b - 1) % 5))
    operator_id="${OPERATOR_IDS[$operator_idx]}"
    operator_user_id="${OPERATOR_USER_IDS[$operator_idx]}"

    # Re-login operator user in case ADMIN token is not allowed
    # to create buses in the current authorization matrix.
    operator_token="${USER_TOKENS[$((operator_user_id - 1))]:-}"

    # More robustly locate the token by USER_IDS array.
    operator_token=""
    for i in "${!USER_IDS[@]}"; do
        if [[ "${USER_IDS[$i]}" == "$operator_user_id" ]]; then
            operator_token="${USER_TOKENS[$i]}"
            break
        fi
    done

    if [[ -z "$operator_token" ]]; then
        echo "Could not find token for operator user ${operator_user_id}"
        exit 1
    fi

    case $(((b - 1) % 4)) in
        0) bus_type="SEATER"; model="Ashok Leyland Viking" ;;
        1) bus_type="SLEEPER"; model="Scania K360" ;;
        2) bus_type="SEMI_SLEEPER"; model="Volvo B11R" ;;
        3) bus_type="SEATER"; model="Volvo B9R" ;;
    esac

    registration=$(printf "TN-SEED-%03d" "$b")

    response=$(post_json \
        "${API}/buses" \
        "$operator_token" \
        "$(jq -n \
            --argjson operatorId "$operator_id" \
            --arg registrationNumber "$registration" \
            --arg model "$model" \
            --arg busType "$bus_type" \
            '{
                operatorId: $operatorId,
                registrationNumber: $registrationNumber,
                model: $model,
                busType: $busType,
                status: "ACTIVE"
            }'
        )")

    bus_id=$(echo "$response" | jq -r '.id')
    BUS_IDS+=("$bus_id")

    printf "  bus %2d/40 -> id=%s operator=%s\n" "$b" "$bus_id" "$operator_id"
done

# ------------------------------------------------------------
# 7. SEATS - 40 PER BUS = 1600
# ------------------------------------------------------------

echo
echo "[7/8] Creating 1,600 seats (40 per bus)..."

for b in "${!BUS_IDS[@]}"; do
    bus_id="${BUS_IDS[$b]}"

    operator_idx=$((b % 5))
    operator_user_id="${OPERATOR_USER_IDS[$operator_idx]}"

    operator_token=""
    for i in "${!USER_IDS[@]}"; do
        if [[ "${USER_IDS[$i]}" == "$operator_user_id" ]]; then
            operator_token="${USER_TOKENS[$i]}"
            break
        fi
    done

    for s in $(seq 1 40); do
        if (( s <= 20 )); then
            seat_type="SEAT"
        else
            seat_type="SLEEPER"
        fi

        # 1, 5, 9, ... are WINDOW, the others alternate.
        case $(((s - 1) % 4)) in
            0|3) position="WINDOW" ;;
            *)   position="AISLE" ;;
        esac

        seat_number=$(printf "%02d" "$s")

        post_json \
            "${API}/seats" \
            "$operator_token" \
            "$(jq -n \
                --argjson busId "$bus_id" \
                --arg seatNumber "$seat_number" \
                --arg seatType "$seat_type" \
                --arg position "$position" \
                '{
                    busId: $busId,
                    seatNumber: $seatNumber,
                    seatType: $seatType,
                    position: $position
                }'
            )" >/dev/null

    done

    printf "  bus %2d/40 -> 40 seats created\n" "$((b+1))"
done

# ------------------------------------------------------------
# 8. SCHEDULES + TRIPS
#
# 40 schedules = one schedule per bus.
# 10 trips per schedule = 400 trips.
#
# Trip creation automatically generates TripSeat rows in the
# current TripService implementation.
# ------------------------------------------------------------

echo
echo "[8/8] Creating 40 schedules and 400 trips..."

declare -a SCHEDULE_IDS=()

for b in $(seq 0 39); do
    bus_id="${BUS_IDS[$b]}"

    route_idx=$((b % 10))
    route_id="${ROUTE_IDS[$route_idx]}"

    operator_idx=$((b % 5))
    operator_id="${OPERATOR_IDS[$operator_idx]}"
    operator_user_id="${OPERATOR_USER_IDS[$operator_idx]}"

    operator_token=""
    for i in "${!USER_IDS[@]}"; do
        if [[ "${USER_IDS[$i]}" == "$operator_user_id" ]]; then
            operator_token="${USER_TOKENS[$i]}"
            break
        fi
    done

    # Spread departure times through the day.
    hour=$((5 + (b % 12)))
    minute=$(( (b * 15) % 60 ))
    departure_time=$(printf "%02d:%02d:00" "$hour" "$minute")

    effective_from="2026-09-01"
    effective_until="2026-12-31"

    base_fare=$((180 + (route_idx * 20)))
    price_cents=$((200 + (route_idx % 5) * 25))
    price_per_km=$(printf '%d.%02d' $((price_cents / 100)) $((price_cents % 100)))

    schedule_response=$(post_json \
        "${API}/schedules" \
        "$operator_token" \
        "$(jq -n \
            --argjson routeId "$route_id" \
            --argjson busId "$bus_id" \
            --arg departureTime "$departure_time" \
            --arg effectiveFrom "$effective_from" \
            --arg effectiveUntil "$effective_until" \
            --arg operatingDays "MON,TUE,WED,THU,FRI,SAT,SUN" \
            --argjson baseFare "$base_fare" \
            --argjson pricePerKm "$price_per_km" \
            '{
                routeId: $routeId,
                busId: $busId,
                departureTime: $departureTime,
                effectiveFrom: $effectiveFrom,
                effectiveUntil: $effectiveUntil,
                operatingDays: $operatingDays,
                baseFare: $baseFare,
                pricePerKm: $pricePerKm,
                status: "ACTIVE"
            }'
        )")

    schedule_id=$(echo "$schedule_response" | jq -r '.id')
    SCHEDULE_IDS+=("$schedule_id")

    printf "  schedule %2d/40 -> id=%s\n" "$((b+1))" "$schedule_id"

    # 10 trips per schedule.
    for t in $(seq 1 10); do
        # Every trip is on a unique future date.
        # 2026-09-15 through 2026-09-24.
        trip_date=$(date -d "2026-09-14 + ${t} days" +%Y-%m-%d)

        trip_response=$(post_json \
            "${API}/trips" \
            "$operator_token" \
            "$(jq -n \
                --argjson scheduleId "$schedule_id" \
                --arg tripDate "$trip_date" \
                '{
                    scheduleId: $scheduleId,
                    tripDate: $tripDate
                }'
            )")

        trip_id=$(echo "$trip_response" | jq -r '.id')

        if (( t == 10 )); then
            echo "      10 trips created for schedule ${schedule_id}"
        fi
    done
done

echo
echo "=============================================="
echo " SEED COMPLETE"
echo "=============================================="
echo
echo "Users:          20"
echo "Admin users:    1"
echo "Passenger users:19"
echo "Operators:      5"
echo "Locations:      50"
echo "Routes:         10"
echo "Route stops:    50"
echo "Buses:          40"
echo "Seats:          1600 (40/bus)"
echo "Schedules:      40"
echo "Trips:          400 (10/schedule)"
echo "=============================================="
echo
echo "Admin email:    ${ADMIN_EMAIL}"
echo "Admin password: ${ADMIN_PASSWORD}"
echo
echo "Note: TripService should automatically create 40 TripSeat"
echo "records per trip, resulting in up to 16,000 TripSeat rows."
echo
