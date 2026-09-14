#!/usr/bin/env bash
#
# Production-oriented synthetic data seeder for the Bus Booking API.
#
# Requirements:
#   - bash 4+
#   - curl
#   - jq
#
# Usage:
#   chmod +x seed.sh
#   ./seed.sh
#
# Optional:
#   API_BASE_URL=http://localhost:8080/api/v1 ./seed.sh
#   PASSENGER_COUNT=50 OPERATOR_COUNT=8 ./seed.sh
#
# The script is restart-safe:
#   - It stores discovered resource IDs in SEED_STATE_DIR.
#   - It never assumes database IDs are contiguous.
#   - Existing deterministic seed records are reused.
#   - Ctrl-C/termination is trapped and state is flushed before exit.
#   - Re-running the script continues from missing resources.
#
# IMPORTANT:
# The supplied API documentation does not define a realtime-location endpoint.
# "Realtime locations" in this seed are therefore represented by realistic static
# geographic Location records (cities/stations/terminals), which can be used as
# route-stop locations.
#
# The documented API does not expose a separate route-stop count semantic, so this
# script uses STOPS_PER_ROUTE.
#

set -Eeuo pipefail
IFS=$'\n\t'

###############################################################################
# Configuration
###############################################################################

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
ENV_FILE="${ENV_FILE:-.env}"

PASSENGER_COUNT="${PASSENGER_COUNT:-30}" # 30
OPERATOR_COUNT="${OPERATOR_COUNT:-10}" # 6
BUS_COUNT="${BUS_COUNT:-100}" # 50
SEATS_PER_BUS="${SEATS_PER_BUS:-40}" # 50

LOCATION_COUNT="${LOCATION_COUNT:-32}" # 32
ROUTE_COUNT="${ROUTE_COUNT:-18}" #18
STOPS_PER_ROUTE="${STOPS_PER_ROUTE:-4}" # 4
SCHEDULE_COUNT="${SCHEDULE_COUNT:-100}" # 50
TRIP_COUNT="${TRIP_COUNT:-600}" # 300

# How far into the future trips should be spread.
TRIP_HORIZON_DAYS="${TRIP_HORIZON_DAYS:-30}"

# Requests are retried on transient HTTP/network failures.
MAX_RETRIES="${MAX_RETRIES:-5}"
RETRY_BASE_SECONDS="${RETRY_BASE_SECONDS:-1}"

# Keep the generated state outside the source tree by default.
SEED_STATE_DIR="${SEED_STATE_DIR:-.seed-state}"
STATE_FILE="$SEED_STATE_DIR/state.json"
LOCK_FILE="$SEED_STATE_DIR/.lock"

# Deterministic seed prefix. Change this if you intentionally want a completely
# new synthetic dataset rather than continuing the existing one.
SEED_PREFIX="${SEED_PREFIX:-synthetic-2026}"

###############################################################################
# Runtime state
###############################################################################

AUTH_TOKEN=""
AUTH_ROLE="none"
INTERRUPTED=0
STATE_TMP=""

cleanup() {
    local rc=$?
    if [[ -n "${STATE_TMP:-}" && -f "$STATE_TMP" ]]; then
        rm -f "$STATE_TMP" || true
    fi

    if [[ -f "$LOCK_FILE" ]]; then
        rm -f "$LOCK_FILE" || true
    fi

    if (( INTERRUPTED )); then
        log_warn "Seeder interrupted. State has been retained; run it again to continue."
        exit 130
    fi

    exit "$rc"
}

trap cleanup EXIT
trap 'INTERRUPTED=1; log_warn "Interrupt received; finishing current operation..."' INT TERM

###############################################################################
# Logging
###############################################################################

timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

log() {
    printf '[%s] %s\n' "$(timestamp)" "$*"
}

log_ok() {
    printf '[%s] [OK] %s\n' "$(timestamp)" "$*"
}

log_warn() {
    printf '[%s] [WARN] %s\n' "$(timestamp)" "$*" >&2
}

log_error() {
    printf '[%s] [ERROR] %s\n' "$(timestamp)" "$*" >&2
}

die() {
    log_error "$*"
    exit 1
}

###############################################################################
# Dependency / configuration validation
###############################################################################

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

require_positive_int() {
    local name="$1"
    local value="$2"
    [[ "$value" =~ ^[1-9][0-9]*$ ]] || die "$name must be a positive integer, got: $value"
}

validate_config() {
    require_positive_int PASSENGER_COUNT "$PASSENGER_COUNT"
    require_positive_int OPERATOR_COUNT "$OPERATOR_COUNT"
    require_positive_int BUS_COUNT "$BUS_COUNT"
    require_positive_int SEATS_PER_BUS "$SEATS_PER_BUS"
    require_positive_int LOCATION_COUNT "$LOCATION_COUNT"
    require_positive_int ROUTE_COUNT "$ROUTE_COUNT"
    require_positive_int STOPS_PER_ROUTE "$STOPS_PER_ROUTE"
    require_positive_int SCHEDULE_COUNT "$SCHEDULE_COUNT"
    require_positive_int TRIP_COUNT "$TRIP_COUNT"
    require_positive_int TRIP_HORIZON_DAYS "$TRIP_HORIZON_DAYS"
    require_positive_int MAX_RETRIES "$MAX_RETRIES"
}

###############################################################################
# .env loader
###############################################################################

load_env() {
    [[ -f "$ENV_FILE" ]] || die "$ENV_FILE not found. ADMIN_USERNAME and ADMIN_PASSWORD are required."

    # Extract only the two required variables. This avoids blindly sourcing an
    # arbitrary .env file into the seeder shell.
    ADMIN_USERNAME="$(sed -n 's/^[[:space:]]*ADMIN_USERNAME[[:space:]]*=[[:space:]]*//p' "$ENV_FILE" | tail -n 1)"
    ADMIN_PASSWORD="$(sed -n 's/^[[:space:]]*ADMIN_PASSWORD[[:space:]]*=[[:space:]]*//p' "$ENV_FILE" | tail -n 1)"

    ADMIN_USERNAME="${ADMIN_USERNAME%$'\r'}"
    ADMIN_PASSWORD="${ADMIN_PASSWORD%$'\r'}"

    # Remove matching single/double quotes if present.
    if [[ "$ADMIN_USERNAME" =~ ^\".*\"$ || "$ADMIN_USERNAME" =~ ^\'.*\'$ ]]; then
        ADMIN_USERNAME="${ADMIN_USERNAME:1:${#ADMIN_USERNAME}-2}"
    fi
    if [[ "$ADMIN_PASSWORD" =~ ^\".*\"$ || "$ADMIN_PASSWORD" =~ ^\'.*\'$ ]]; then
        ADMIN_PASSWORD="${ADMIN_PASSWORD:1:${#ADMIN_PASSWORD}-2}"
    fi

    [[ -n "$ADMIN_USERNAME" ]] || die "ADMIN_USERNAME is missing from $ENV_FILE"
    [[ -n "$ADMIN_PASSWORD" ]] || die "ADMIN_PASSWORD is missing from $ENV_FILE"
}

###############################################################################
# State
###############################################################################

init_state() {
    mkdir -p "$SEED_STATE_DIR"

    if [[ ! -f "$STATE_FILE" ]]; then
        cat > "$STATE_FILE" <<EOF
{
  "seedPrefix": $(jq -Rn --arg v "$SEED_PREFIX" '$v'),
  "passengers": {},
  "operators": {},
  "buses": {},
  "seats": {},
  "locations": {},
  "routes": {},
  "routeStops": {},
  "schedules": {},
  "trips": {}
}
EOF
    fi

    jq empty "$STATE_FILE" >/dev/null 2>&1 || die "Invalid state file: $STATE_FILE"
}

state_get() {
    local path="$1"
    jq -r "$path // empty" "$STATE_FILE"
}

state_set() {
    local path="$1"
    local value="$2"
    local tmp="${STATE_FILE}.tmp.$$"

    jq --arg value "$value" "$path = \$value" "$STATE_FILE" > "$tmp"
    mv "$tmp" "$STATE_FILE"
}

state_set_json() {
    local path="$1"
    local json="$2"
    local tmp="${STATE_FILE}.tmp.$$"

    jq --argjson value "$json" "$path = \$value" "$STATE_FILE" > "$tmp"
    mv "$tmp" "$STATE_FILE"
}

acquire_lock() {
    if mkdir "$LOCK_FILE" 2>/dev/null; then
        printf '%s\n' "$$" > "$LOCK_FILE/pid"
        return
    fi

    local pid=""
    [[ -f "$LOCK_FILE/pid" ]] && pid="$(cat "$LOCK_FILE/pid" 2>/dev/null || true)"

    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        die "Another seeder appears to be running (PID $pid)."
    fi

    log_warn "Removing stale seed lock."
    rm -rf "$LOCK_FILE"
    mkdir "$LOCK_FILE"
    printf '%s\n' "$$" > "$LOCK_FILE/pid"
}

###############################################################################
# HTTP
###############################################################################

http_request() {
    local method="$1"
    local endpoint="$2"
    local body="${3:-}"
    local auth="${4:-yes}"

    local attempt=1
    local response=""
    local status=""
    local curl_rc=0

    while (( attempt <= MAX_RETRIES )); do
        if [[ "$auth" == "yes" && -z "$AUTH_TOKEN" ]]; then
            login_admin
        fi

        local -a curl_args=(
            --silent
            --show-error
            --location
            --connect-timeout 10
            --max-time 60
            --request "$method"
            --header 'Accept: application/json'
            --header 'Content-Type: application/json'
            --write-out $'\n%{http_code}'
        )

        if [[ "$auth" == "yes" ]]; then
            curl_args+=(--header "Authorization: Bearer $AUTH_TOKEN")
        fi

        if [[ -n "$body" ]]; then
            curl_args+=(--data "$body")
        fi

        set +e
        response="$(curl "${curl_args[@]}" "${API_BASE_URL}${endpoint}")"
        curl_rc=$?
        set -e

        if (( curl_rc != 0 )); then
            log_warn "HTTP/network failure on $method $endpoint (attempt $attempt/$MAX_RETRIES)"
        else
            status="${response##*$'\n'}"
            response="${response%$'\n'*}"

            # Expired/invalid JWT: authenticate once and retry.
            if [[ "$status" == "401" && "$auth" == "yes" ]]; then
                AUTH_TOKEN=""
                login_admin
                attempt=$((attempt + 1))
                continue
            fi

            # Retry common transient responses.
            if [[ "$status" =~ ^(408|425|429|500|502|503|504)$ ]]; then
                log_warn "Transient HTTP $status on $method $endpoint (attempt $attempt/$MAX_RETRIES)"
            elif [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
                printf '%s' "$response"
                return 0
            else
                log_error "HTTP $status on $method $endpoint"
                [[ -n "$response" ]] && printf '%s\n' "$response" >&2
                return 1
            fi
        fi

        if (( attempt < MAX_RETRIES )); then
            sleep_seconds=$(( RETRY_BASE_SECONDS * (2 ** (attempt - 1)) ))
            (( sleep_seconds > 30 )) && sleep_seconds=30
            sleep "$sleep_seconds"
        fi

        attempt=$((attempt + 1))
    done

    return 1
}

login_admin() {
    local body response token

    body="$(jq -cn \
        --arg email "$ADMIN_USERNAME" \
        --arg password "$ADMIN_PASSWORD" \
        '{email:$email,password:$password}')"

    response="$(http_request POST /auth/login "$body" no)" ||
        die "Admin login failed."

    token="$(jq -r '.accessToken // .token // empty' <<<"$response")"
    [[ -n "$token" ]] || die "Admin login succeeded but no accessToken was returned."

    AUTH_TOKEN="$token"
    AUTH_ROLE="admin"
    log_ok "Authenticated as admin."
}

###############################################################################
# Authentication context
###############################################################################

login_operator() {
    local operator_num="$1"
    local email password body response token

    email="$(synthetic_email operator "$operator_num")"
    password='Operator@123'

    body="$(jq -cn \
        --arg email "$email" \
        --arg password "$password" \
        '{email:$email,password:$password}')"

    response="$(http_request POST /auth/login "$body" no)" ||
        die "Operator $operator_num login failed ($email)."

    token="$(jq -r '.accessToken // .token // empty' <<<"$response")"
    [[ -n "$token" ]] || die "Operator $operator_num login returned no accessToken."

    AUTH_TOKEN="$token"
    AUTH_ROLE="operator:$operator_num"

    # Persisting credentials is intentionally avoided; the credentials are
    # deterministic and the password is already defined by this script.
    
    # state_set ".operators[\"$email\"].authVerified" "true"
    # log_ok "Authenticated as operator $operator_num ($email)."
}

use_admin_auth() {
    if [[ "$AUTH_ROLE" != "admin" ]]; then
        AUTH_TOKEN=""
        login_admin
    fi
}

use_operator_auth() {
    local operator_num="$1"
    local wanted="operator:$operator_num"

    if [[ "$AUTH_ROLE" != "$wanted" ]]; then
        AUTH_TOKEN=""
        login_operator "$operator_num"
    fi
}

###############################################################################
# Generic API helpers
###############################################################################

api_create() {
    local endpoint="$1"
    local body="$2"
    http_request POST "$endpoint" "$body"
}

api_get() {
    local endpoint="$1"
    http_request GET "$endpoint"
}

extract_id() {
    jq -r '
        .id //
        .userId //
        .operatorId //
        .busId //
        .seatId //
        .locationId //
        .routeId //
        .routeStopId //
        .scheduleId //
        .tripId //
        empty
    ' 2>/dev/null
}

###############################################################################
# Deterministic synthetic data
###############################################################################

FIRST_NAMES=(
    Aarav Aditi Aditya Akash Akhil Amara Ananya Arjun Arya Ashwin
    Bhavya Chetan Deepa Dev Dhruv Divya Esha Gaurav Harish Isha
    Jai Janani Karan Kavya Kiran Lakshmi Madhav Meera Mohan Nandini
    Naveen Neha Nikhil Nisha Pranav Priya Rahul Rakesh Rhea Rohan
    Sahana Sameer Sanjana Shreya Siddharth Sneha Surya Tanvi Varun
)

LAST_NAMES=(
    Iyer Kumar Nair Menon Rao Reddy Pillai Singh Sharma Gupta
    Das Bose Chatterjee Krishnan Narayanan Subramanian Srinivasan
    Venkatesan Murugan Balaji Prasad Joshi Patel Shah Verma
    Malhotra Kapoor Bhat Babu Thomas Fernandes Mathew Joseph
)

# Real Indian cities/transport hubs with approximate coordinates.
LOCATION_NAMES=(
    "Chennai Central|Chennai|Tamil Nadu|13.0827|80.2707"
    "Chennai Airport|Chennai|Tamil Nadu|12.9941|80.1709"
    "Tambaram|Chennai|Tamil Nadu|12.9249|80.1000"
    "Mahabalipuram|Mahabalipuram|Tamil Nadu|12.6208|80.1945"
    "Pondicherry Bus Stand|Puducherry|Puducherry|11.9416|79.8083"
    "Villupuram|Villupuram|Tamil Nadu|11.9401|79.4861"
    "Cuddalore|Cuddalore|Tamil Nadu|11.7480|79.7714"
    "Chidambaram|Chidambaram|Tamil Nadu|11.3993|79.6917"
    "Mayiladuthurai|Mayiladuthurai|Tamil Nadu|11.1035|79.6550"
    "Kumbakonam|Kumbakonam|Tamil Nadu|10.9602|79.3780"
    "Thanjavur|Thanjavur|Tamil Nadu|10.7870|79.1378"
    "Tiruchirappalli Central|Tiruchirappalli|Tamil Nadu|10.7905|78.7047"
    "Karur|Karur|Tamil Nadu|10.9601|78.0766"
    "Salem Central|Salem|Tamil Nadu|11.6643|78.1460"
    "Erode|Erode|Tamil Nadu|11.3410|77.7172"
    "Coimbatore|Coimbatore|Tamil Nadu|11.0168|76.9558"
    "Tiruppur|Tiruppur|Tamil Nadu|11.1085|77.3411"
    "Ooty|Udhagamandalam|Tamil Nadu|11.4064|76.6932"
    "Madurai|Madurai|Tamil Nadu|9.9252|78.1198"
    "Dindigul|Dindigul|Tamil Nadu|10.3673|77.9803"
    "Rameswaram|Rameswaram|Tamil Nadu|9.2881|79.3129"
    "Tirunelveli|Tirunelveli|Tamil Nadu|8.7139|77.7567"
    "Nagercoil|Nagercoil|Tamil Nadu|8.1833|77.4119"
    "Kanyakumari|Kanyakumari|Tamil Nadu|8.0883|77.5385"
    "Bengaluru Majestic|Bengaluru|Karnataka|12.9771|77.5725"
    "Hosur|Hosur|Tamil Nadu|12.7409|77.8253"
    "Krishnagiri|Krishnagiri|Tamil Nadu|12.5186|78.2137"
    "Dharmapuri|Dharmapuri|Tamil Nadu|12.1211|78.1582"
    "Vellore|Vellore|Tamil Nadu|12.9165|79.1325"
    "Ranipet|Ranipet|Tamil Nadu|12.9249|79.3333"
    "Tiruvannamalai|Tiruvannamalai|Tamil Nadu|12.2253|79.0747"
    "Kanchipuram|Kanchipuram|Tamil Nadu|12.8342|79.7036"
)

OPERATOR_NAMES=(
    "Chennai Express"
    "Southern Star Travels"
    "Tamil Transit"
    "Coastal Roadways"
    "Kaveri Travels"
    "Blue Horizon Bus Lines"
    "Cauvery Connect"
    "MetroLink Coaches"
    "Sangam Roadways"
    "Green Route Travels"
)

# Natural route pairs. Route names are deliberately human-facing rather than
# synthetic labels such as "Route #1".
ROUTE_PAIRS=(
    "Chennai Central|Cuddalore"
    "Chennai Central|Pondicherry Bus Stand"
    "Chennai Central|Vellore"
    "Chennai Central|Tiruvannamalai"
    "Chennai Central|Salem Central"
    "Chennai Central|Coimbatore"
    "Chennai Central|Madurai"
    "Chennai Central|Tiruchirappalli Central"
    "Chennai Central|Kanchipuram"
    "Bengaluru Majestic|Hosur"
    "Bengaluru Majestic|Chennai Central"
    "Salem Central|Coimbatore"
    "Coimbatore|Ooty"
    "Madurai|Rameswaram"
    "Madurai|Tirunelveli"
    "Tirunelveli|Nagercoil"
    "Thanjavur|Kumbakonam"
    "Chidambaram|Mayiladuthurai"
    "Vellore|Kanchipuram"
    "Chennai Airport|Tambaram"
)

route_pair_for() {
    local n="$1"
    local idx=$(( (n - 1) % ${#ROUTE_PAIRS[@]} ))
    local pair="${ROUTE_PAIRS[$idx]}"
    printf '%s' "$pair"
}

BUS_MODELS=(
    "Volvo B11R"
    "Scania Metrolink"
    "Ashok Leyland Viking"
    "Ashok Leyland Oyster"
    "Tata Starbus Ultra"
    "Volvo 9400"
)

BUS_TYPES=(
    "SEMI_SLEEPER"
    "SEMI_SLEEPER"
    "SEMI_SLEEPER"
    "SLEEPER"
)

PHONE_PREFIXES=(900 901 902 903 904 905 906 907 908 909 910 911 912 913 914 915 916 917 918 919 920 921 922 923 924 925 926 927 928 929)

weekday_csv() {
    local n="$1"
    case "$((n % 7))" in
        0) printf 'MON,TUE,WED,THU,FRI' ;;
        1) printf 'MON,TUE,WED,THU,FRI,SAT' ;;
        2) printf 'MON,TUE,WED,THU,FRI,SAT,SUN' ;;
        3) printf 'MON,WED,FRI,SAT,SUN' ;;
        4) printf 'TUE,THU,SAT,SUN' ;;
        5) printf 'MON,TUE,THU,FRI,SUN' ;;
        6) printf 'MON,WED,THU,SAT,SUN' ;;
    esac
}

synthetic_email() {
    local kind="$1"
    local i="$2"
    printf '%s-%s-%04d@example.test' "$SEED_PREFIX" "$kind" "$i"
}

synthetic_phone() {
    local i="$1"
    local prefix="${PHONE_PREFIXES[$((i % ${#PHONE_PREFIXES[@]}))]}"
    printf '%s%07d' "$prefix" "$((1000000 + i))"
}

name_for() {
    local i="$1"
    local f="${FIRST_NAMES[$((i % ${#FIRST_NAMES[@]}))]}"
    local l="${LAST_NAMES[$(((i * 7) % ${#LAST_NAMES[@]}))]}"
    printf '%s|%s' "$f" "$l"
}

###############################################################################
# Date helpers -- pure shell/date, no Python.
###############################################################################

date_add_days() {
    local days="$1"
    date -d "+${days} days" '+%Y-%m-%d'
}

date_minus_days() {
    local days="$1"
    date -d "-${days} days" '+%Y-%m-%d'
}

date_day_of_week() {
    local d="$1"
    date -d "$d" '+%u'
}

###############################################################################
# Resource creation
###############################################################################

seed_passengers() {
    log "Seeding $PASSENGER_COUNT passengers..."

    use_admin_auth

    local i email password names first last phone body response id
    for ((i=1; i<=PASSENGER_COUNT; i++)); do
        email="$(synthetic_email passenger "$i")"
        id="$(state_get ".passengers[\"$email\"]")"

        if [[ -n "$id" ]]; then
            continue
        fi

        names="$(name_for "$((i + 100))")"
        first="${names%%|*}"
        last="${names#*|}"
        phone="$(synthetic_phone "$((i + 1000))")"
        password='Passenger@123'

        body="$(jq -cn \
            --arg email "$email" \
            --arg password "$password" \
            --arg firstName "$first" \
            --arg lastName "$last" \
            --arg phone "$phone" \
            '{
                email:$email,
                password:$password,
                firstName:$firstName,
                lastName:$lastName,
                phone:$phone
            }')"

        if response="$(api_create /auth/register "$body" 2>/dev/null)"; then
            id="$(extract_id <<<"$response")"
        else
            # A previous interrupted run may have created the user but failed
            # before checkpointing. Re-running should discover it through the
            # administrative user list.
            id="$(find_existing_user_id "$email" || true)"
        fi

        [[ -n "$id" ]] || die "Could not create or locate passenger $email"
        state_set ".passengers[\"$email\"]" "$id"
        log_ok "Passenger $i/$PASSENGER_COUNT -> user $id"
    done
}

find_existing_user_id() {
    local email="$1"
    local response

    response="$(api_get "/users" 2>/dev/null)" || return 1

    jq -r --arg email "$email" '
        if type == "array" then
            .[] | select(.email == $email) | (.id // .userId)
        elif (.content? | type) == "array" then
            .content[] | select(.email == $email) | (.id // .userId)
        else empty end
    ' <<<"$response" | head -n 1
}

seed_operators() {
    log "Seeding $OPERATOR_COUNT operators..."

    use_admin_auth

    local i email password names first last phone op_name reg body response id
    for ((i=1; i<=OPERATOR_COUNT; i++)); do
        email="$(synthetic_email operator "$i")"
        id="$(state_get ".operators[\"$email\"]")"

        if [[ -n "$id" ]]; then
            continue
        fi

        names="$(name_for "$((i + 200))")"
        first="${names%%|*}"
        last="${names#*|}"
        phone="$(synthetic_phone "$((i + 2000))")"
        password='Operator@123'
        op_name="${OPERATOR_NAMES[$(((i - 1) % ${#OPERATOR_NAMES[@]}))]}"
        reg="$(printf 'TN-SYN-%03d' "$i")"

        body="$(jq -cn \
            --arg email "$email" \
            --arg password "$password" \
            --arg firstName "$first" \
            --arg lastName "$last" \
            --arg phone "$phone" \
            --arg operatorName "$op_name" \
            --arg registrationNumber "$reg" \
            --arg contactPhone "$phone" \
            '{
                email:$email,
                password:$password,
                firstName:$firstName,
                lastName:$lastName,
                phone:$phone,
                operatorName:$operatorName,
                registrationNumber:$registrationNumber,
                contactPhone:$contactPhone
            }')"

        if response="$(api_create /auth/operator/register "$body" 2>/dev/null)"; then
            id="$(extract_id <<<"$response")"
            [[ -n "$id" ]] || id="$(jq -r '.operatorId // empty' <<<"$response")"
        else
            id="$(find_existing_operator_id "$email" || true)"
        fi

        [[ -n "$id" ]] || die "Could not create or locate operator $email"
        state_set ".operators[\"$email\"]" "$id"
        log_ok "Operator $i/$OPERATOR_COUNT -> operator $id"
    done
}

find_existing_operator_id() {
    local email="$1"
    local response
    response="$(api_get "/operators" 2>/dev/null)" || return 1

    jq -r --arg email "$email" '
        if type == "array" then
            .[] | select((.contactEmail // .email // "") == $email) |
            (.id // .operatorId)
        elif (.content? | type) == "array" then
            .content[] | select((.contactEmail // .email // "") == $email) |
            (.id // .operatorId)
        else empty end
    ' <<<"$response" | head -n 1
}

seed_locations() {
    log "Seeding $LOCATION_COUNT geographic locations..."

    use_admin_auth

    local i entry name city state lat lon body response id key
    local total="${#LOCATION_NAMES[@]}"

    for ((i=1; i<=LOCATION_COUNT; i++)); do
        entry="${LOCATION_NAMES[$(((i - 1) % total))]}"
        name="${entry%%|*}"
        entry="${entry#*|}"
        city="${entry%%|*}"
        entry="${entry#*|}"
        state="${entry%%|*}"
        entry="${entry#*|}"
        lat="${entry%%|*}"
        lon="${entry#*|}"

        # If LOCATION_COUNT exceeds the canonical list, make deterministic
        # variants rather than duplicating the exact same location.
        if (( i > total )); then
            name="${name} Terminal $(( (i - 1) / total + 1 ))"
            # For counts beyond the canonical city list, keep the location
            # natural and deterministic. Coordinates remain those of the base
            # transport hub rather than introducing a fake precision calculation.
        fi

        key="${SEED_PREFIX}-location-${i}"
        id="$(state_get ".locations[\"$key\"]")"
        [[ -n "$id" ]] && continue

        body="$(jq -cn \
            --arg name "$name" \
            --arg city "$city" \
            --arg state "$state" \
            --arg country "India" \
            --argjson latitude "$lat" \
            --argjson longitude "$lon" \
            '{
                name:$name,
                city:$city,
                state:$state,
                country:$country,
                latitude:$latitude,
                longitude:$longitude
            }')"

        if response="$(api_create /locations "$body" 2>/dev/null)"; then
            id="$(extract_id <<<"$response")"
        else
            id="$(find_existing_location_id "$name" || true)"
        fi

        [[ -n "$id" ]] || die "Could not create or locate location $name"
        state_set ".locations[\"$key\"]" "$id"
        log_ok "Location $i/$LOCATION_COUNT -> $id ($name)"
    done
}

find_existing_location_id() {
    local name="$1"
    local response
    response="$(api_get "/locations" 2>/dev/null)" || return 1

    jq -r --arg name "$name" '
        if type == "array" then
            .[] | select(.name == $name) | (.id // .locationId)
        elif (.content? | type) == "array" then
            .content[] | select(.name == $name) | (.id // .locationId)
        else empty end
    ' <<<"$response" | head -n 1
}

seed_routes() {
    log "Seeding $ROUTE_COUNT routes..."

    local i body response id key pair from_name to_name
    local route_name

    use_admin_auth

    for ((i=1; i<=ROUTE_COUNT; i++)); do
        key="${SEED_PREFIX}-route-${i}"
        id="$(state_get ".routes[\"$key\"]")"
        [[ -n "$id" ]] && continue

        pair="$(route_pair_for "$i")"
        from_name="${pair%%|*}"
        to_name="${pair#*|}"
        route_name="${from_name} - ${to_name}"

        body="$(jq -cn \
            --arg name "$route_name" \
            --arg status "ACTIVE" \
            '{name:$name,status:$status}')"

        if response="$(api_create /routes "$body" 2>/dev/null)"; then
            id="$(extract_id <<<"$response")"
        else
            id="$(find_existing_route_id "$route_name" || true)"
        fi

        [[ -n "$id" ]] || die "Could not create or locate route $route_name"
        state_set ".routes[\"$key\"]" "$id"
        log_ok "Route $i/$ROUTE_COUNT -> $id ($route_name)"
    done
}
find_existing_route_id() {
    local name="$1"
    local response
    response="$(api_get "/routes" 2>/dev/null)" || return 1

    jq -r --arg name "$name" '
        if type == "array" then
            .[] | select(.name == $name) | (.id // .routeId)
        elif (.content? | type) == "array" then
            .content[] | select(.name == $name) | (.id // .routeId)
        else empty end
    ' <<<"$response" | head -n 1
}

seed_route_stops() {
    log "Seeding $((ROUTE_COUNT * STOPS_PER_ROUTE)) route stops..."

    use_admin_auth

    local r s route_id location_index location_id key body response id
    local arrival departure distance

    for ((r=1; r<=ROUTE_COUNT; r++)); do
        route_id="$(state_get ".routes[\"${SEED_PREFIX}-route-${r}\"]")"
        [[ -n "$route_id" ]] || die "Route $r has no ID."

        for ((s=1; s<=STOPS_PER_ROUTE; s++)); do
            key="${SEED_PREFIX}-route-${r}-stop-${s}"
            id="$(state_get ".routeStops[\"$key\"]")"
            [[ -n "$id" ]] && continue

            # Spread locations deterministically across each route. The route
            # is allowed to share locations with other routes.
            location_index=$(( ((r - 1) * 2 + s - 1) % LOCATION_COUNT + 1 ))
            location_id="$(state_get ".locations[\"${SEED_PREFIX}-location-${location_index}\"]")"

            arrival=$(( (s - 1) * 75 ))
            departure=$(( arrival + 5 ))
            distance=$(( (s - 1) * (35 + (r % 6) * 7) ))

            body="$(jq -cn \
                --argjson routeId "$route_id" \
                --argjson locationId "$location_id" \
                --argjson stopOrder "$s" \
                --argjson arrivalOffsetMinutes "$arrival" \
                --argjson departureOffsetMinutes "$departure" \
                --argjson distanceFromOriginKm "$distance" \
                '{
                    routeId:$routeId,
                    locationId:$locationId,
                    stopOrder:$stopOrder,
                    arrivalOffsetMinutes:$arrivalOffsetMinutes,
                    departureOffsetMinutes:$departureOffsetMinutes,
                    distanceFromOriginKm:$distanceFromOriginKm
                }')"

            if response="$(api_create /route-stops "$body" 2>/dev/null)"; then
                id="$(extract_id <<<"$response")"
            else
                id="$(find_existing_route_stop_id "$route_id" "$s" || true)"
            fi

            [[ -n "$id" ]] || die "Could not create or locate route stop $r/$s"
            state_set ".routeStops[\"$key\"]" "$id"
        done

        log_ok "Route $r/$ROUTE_COUNT stops seeded."
    done
}

find_existing_route_stop_id() {
    local route_id="$1"
    local stop_order="$2"
    local response

    response="$(api_get "/route-stops/route/$route_id" 2>/dev/null)" || return 1

    jq -r --argjson n "$stop_order" '
        if type == "array" then
            .[] | select((.stopOrder // -1) == $n) | (.id // .routeStopId)
        elif (.content? | type) == "array" then
            .content[] | select((.stopOrder // -1) == $n) | (.id // .routeStopId)
        else empty end
    ' <<<"$response" | head -n 1
}

seed_buses() {
    log "Seeding $BUS_COUNT buses with $SEATS_PER_BUS seats each..."

    local i operator_num operator_id reg model bus_type body response id key
    local existing_owner

    for ((i=1; i<=BUS_COUNT; i++)); do
        operator_num=$(( ((i - 1) % OPERATOR_COUNT) + 1 ))
        operator_id="$(state_get ".operators[\"$(synthetic_email operator "$operator_num")\"]")"
        [[ -n "$operator_id" ]] || die "Operator $operator_num has no ID."

        # Every bus operation is authenticated as its owning operator.
        use_operator_auth "$operator_num"

        key="${SEED_PREFIX}-bus-${i}"
        id="$(state_get ".buses[\"$key\"]")"

        if [[ -z "$id" ]]; then
            reg="$(printf 'TN-%02d-SY-%04d' "$((operator_num + 10))" "$i")"
            model="${BUS_MODELS[$(((i - 1) % ${#BUS_MODELS[@]}))]}"
            bus_type="${BUS_TYPES[$(((i - 1) % ${#BUS_TYPES[@]}))]}"

            body="$(jq -cn \
                --arg registrationNumber "$reg" \
                --arg model "$model" \
                --arg busType "$bus_type" \
                --arg status "ACTIVE" \
                '{
                    registrationNumber:$registrationNumber,
                    model:$model,
                    busType:$busType,
                    status:$status
                }')"

            if response="$(api_create /buses "$body" 2>/dev/null)"; then
                id="$(extract_id <<<"$response")"
            else
                id="$(find_existing_bus_id "$reg" || true)"
            fi

            [[ -n "$id" ]] || die "Could not create or locate bus $reg for operator $operator_num"
            state_set ".buses[\"$key\"]" "$id"
        fi

        seed_bus_seats "$i" "$id" "$operator_num"

        if (( i % 5 == 0 || i == BUS_COUNT )); then
            log_ok "Buses $i/$BUS_COUNT complete."
        fi
    done
}
find_existing_bus_id() {
    local reg="$1"
    local response
    response="$(api_get "/buses" 2>/dev/null)" || return 1

    jq -r --arg reg "$reg" '
        if type == "array" then
            .[] | select(.registrationNumber == $reg) | (.id // .busId)
        elif (.content? | type) == "array" then
            .content[] | select(.registrationNumber == $reg) | (.id // .busId)
        else empty end
    ' <<<"$response" | head -n 1
}

seed_bus_seats() {
    local bus_num="$1"
    local bus_id="$2"
    local operator_num="$3"

    use_operator_auth "$operator_num"

    local seat key seat_num seat_type position body response id

    for ((seat=1; seat<=SEATS_PER_BUS; seat++)); do
        key="${SEED_PREFIX}-bus-${bus_num}-seat-${seat}"
        id="$(state_get ".seats[\"$key\"]")"
        [[ -n "$id" ]] && continue

        printf -v seat_num '%02d' "$seat"

        # Five seats per row. Alternate aisle/window/seat semantics to keep
        # the generated layout plausible.
        case "$((seat % 5))" in
            1|3) position="WINDOW" ;;
            2|4) position="AISLE" ;;
            *)   position="AISLE" ;;
        esac

        if (( seat % 10 == 0 )); then
            seat_type="SLEEPER"
        else
            seat_type="SEAT"
        fi

        body="$(jq -cn \
            --argjson busId "$bus_id" \
            --arg seatNumber "$seat_num" \
            --arg seatType "$seat_type" \
            --arg position "$position" \
            '{
                busId:$busId,
                seatNumber:$seatNumber,
                seatType:$seatType,
                position:$position
            }')"

        if response="$(api_create /seats "$body" 2>/dev/null)"; then
            id="$(extract_id <<<"$response")"
        else
            id="$(find_existing_seat_id "$bus_id" "$seat_num" || true)"
        fi

        [[ -n "$id" ]] || die "Could not create or locate seat $bus_num/$seat_num"
        state_set ".seats[\"$key\"]" "$id"
    done
}

find_existing_seat_id() {
    local bus_id="$1"
    local seat_num="$2"
    local response
    response="$(api_get "/seats/bus/$bus_id" 2>/dev/null)" || return 1

    jq -r --arg n "$seat_num" '
        if type == "array" then
            .[] | select(.seatNumber == $n) | (.id // .seatId)
        elif (.content? | type) == "array" then
            .content[] | select(.seatNumber == $n) | (.id // .seatId)
        else empty end
    ' <<<"$response" | head -n 1
}

seed_schedules() {
    log "Seeding $SCHEDULE_COUNT schedules..."

    local i route_num bus_num operator_num route_id bus_id key body response id
    local departure_hour departure_minute days effective_from effective_until
    local base_fare price_per_km departure

    effective_from="$(date -d '+1 day' '+%Y-%m-%d')"
    effective_until="$(date -d "+${TRIP_HORIZON_DAYS} days" '+%Y-%m-%d')"

    for ((i=1; i<=SCHEDULE_COUNT; i++)); do
        key="${SEED_PREFIX}-schedule-${i}"
        id="$(state_get ".schedules[\"$key\"]")"
        [[ -n "$id" ]] && continue

        route_num=$(( ((i - 1) % ROUTE_COUNT) + 1 ))
        bus_num=$(( ((i * 7 - 1) % BUS_COUNT) + 1 ))
        operator_num=$(( ((bus_num - 1) % OPERATOR_COUNT) + 1 ))

        route_id="$(state_get ".routes[\"${SEED_PREFIX}-route-${route_num}\"]")"
        bus_id="$(state_get ".buses[\"${SEED_PREFIX}-bus-${bus_num}\"]")"

        use_operator_auth "$operator_num"

        departure_hour=$(( 5 + ((i * 3) % 16) ))
        departure_minute=$(( ((i * 17) % 4) * 15 ))
        printf -v departure '%02d:%02d:00' "$departure_hour" "$departure_minute"

        days="$(weekday_csv "$i")"
        base_fare=$(( 180 + (i % 8) * 25 ))

        # Pure Bash decimal representation: 1.75, 2.00, ... 3.00
        local fare_tenths
        fare_tenths=$(( 175 + (i % 6) * 25 ))
        price_per_km="$(printf '%d.%02d' "$((fare_tenths / 100))" "$((fare_tenths % 100))")"

        body="$(jq -cn \
            --argjson routeId "$route_id" \
            --argjson busId "$bus_id" \
            --arg departureTime "$departure" \
            --arg effectiveFrom "$effective_from" \
            --arg effectiveUntil "$effective_until" \
            --arg operatingDays "$days" \
            --argjson baseFare "$base_fare" \
            --argjson pricePerKm "$price_per_km" \
            --arg status "ACTIVE" \
            '{
                routeId:$routeId,
                busId:$busId,
                departureTime:$departureTime,
                effectiveFrom:$effectiveFrom,
                effectiveUntil:$effectiveUntil,
                operatingDays:$operatingDays,
                baseFare:$baseFare,
                pricePerKm:$pricePerKm,
                status:$status
            }')"

        if response="$(api_create /schedules "$body" 2>/dev/null)"; then
            id="$(extract_id <<<"$response")"
        else
            id="$(find_existing_schedule_id "$route_id" "$bus_id" "$departure" || true)"
        fi

        [[ -n "$id" ]] || die "Could not create or locate schedule $i for operator $operator_num"
        state_set ".schedules[\"$key\"]" "$id"

        if (( i % 10 == 0 || i == SCHEDULE_COUNT )); then
            log_ok "Schedules $i/$SCHEDULE_COUNT complete."
        fi
    done
}
find_existing_schedule_id() {
    local route_id="$1"
    local bus_id="$2"
    local departure="$3"
    local response

    response="$(api_get "/schedules" 2>/dev/null)" || return 1

    jq -r --argjson route "$route_id" --argjson bus "$bus_id" --arg dep "$departure" '
        def items:
            if type == "array" then .
            elif (.content? | type) == "array" then .content
            else [] end;

        items[]
        | select((.routeId // -1) == $route)
        | select((.busId // -1) == $bus)
        | select((.departureTime // "") == $dep)
        | (.id // .scheduleId)
    ' <<<"$response" | head -n 1
}

seed_trips() {
    log "Seeding $TRIP_COUNT trips..."

    local i schedule_num schedule_id bus_id bus_num operator_num key body response id trip_date
    local created=0 attempts=0 max_attempts=$((TRIP_COUNT * 30))

    log "0"

    while (( created < TRIP_COUNT )); do
        log "1"
        attempts=$((attempts + 1))
        (( attempts > max_attempts )) && die "Unable to generate enough valid trips."
        log "2"
        i=$((created + 1))
        schedule_num=$(( ((i - 1) % SCHEDULE_COUNT) + 1 ))
        schedule_id="$(state_get ".schedules[\"${SEED_PREFIX}-schedule-${schedule_num}\"]")"
        log "3"
        bus_num=$(( ((schedule_num * 7 - 1) % BUS_COUNT) + 1 ))
        operator_num=$(( ((bus_num - 1) % OPERATOR_COUNT) + 1 ))
        log "4"
        use_operator_auth "$operator_num"
        log "5"
        trip_date="$(date -d "+$((1 + ((i - 1) % TRIP_HORIZON_DAYS))) days" '+%Y-%m-%d')"
        log "6"
        key="${SEED_PREFIX}-trip-${i}"
        id="$(state_get ".trips[\"$key\"]")"
        log "7"
        if [[ -n "$id" ]]; then
            created=$((created + 1))
            continue
        fi
        log "8"
        body="$(jq -cn \
            --argjson scheduleId "$schedule_id" \
            --arg tripDate "$trip_date" \
            '{scheduleId:$scheduleId,tripDate:$tripDate}')"
        log "1"
        if response="$(api_create /trips "$body" 2>/dev/null)"; then
            id="$(extract_id <<<"$response")"
        else
            id="$(find_existing_trip_id "$schedule_id" "$trip_date" || true)"
        fi
        log "9"
        if [[ -n "$id" ]]; then
            state_set ".trips[\"$key\"]" "$id"
            created=$((created + 1))
            if (( created % 25 == 0 || created == TRIP_COUNT )); then
                log_ok "Trips $created/$TRIP_COUNT complete."
            fi
        else
            # Try the next date/schedule combination. The operation is made
            # using the owning operator's JWT.
            log_warn "Trip candidate rejected for schedule $schedule_num on $trip_date; trying another candidate."
        fi
        log "10"
    done
}
find_existing_trip_id() {
    local schedule_id="$1"
    local trip_date="$2"
    local response
    response="$(api_get "/trips" 2>/dev/null)" || return 1

    jq -r --argjson schedule "$schedule_id" --arg date "$trip_date" '
        def items:
            if type == "array" then .
            elif (.content? | type) == "array" then .content
            else [] end;

        items[]
        | select((.scheduleId // -1) == $schedule)
        | select((.tripDate // "") == $date)
        | (.id // .tripId)
    ' <<<"$response" | head -n 1
}

###############################################################################
# Summary / sanity checks
###############################################################################

count_state() {
    local section="$1"
    jq "(.${section} // {}) | length" "$STATE_FILE"
}

print_summary() {
    local expected_stops=$((ROUTE_COUNT * STOPS_PER_ROUTE))
    local expected_seats=$((BUS_COUNT * SEATS_PER_BUS))

    log "------------------------------------------------------------"
    log "Synthetic seed summary"
    log "------------------------------------------------------------"
    log "Passengers : $(count_state passengers) / $PASSENGER_COUNT"
    log "Operators  : $(count_state operators) / $OPERATOR_COUNT"
    log "Locations  : $(count_state locations) / $LOCATION_COUNT"
    log "Routes     : $(count_state routes) / $ROUTE_COUNT"
    log "Route stops: $(count_state routeStops) / $expected_stops"
    log "Buses      : $(count_state buses) / $BUS_COUNT"
    log "Seats      : $(count_state seats) / $expected_seats"
    log "Schedules  : $(count_state schedules) / $SCHEDULE_COUNT"
    log "Trips      : $(count_state trips) / $TRIP_COUNT"
    log "State file : $STATE_FILE"
    log "------------------------------------------------------------"
}

main() {
    require_cmd bash
    require_cmd curl
    require_cmd jq
    require_cmd sed
    require_cmd date

    validate_config
    load_env
    init_state
    acquire_lock

    log "Starting production-style synthetic seed."
    log "API: $API_BASE_URL"
    log "State: $STATE_FILE"

    login_admin

    seed_passengers
    seed_operators
    seed_locations
    seed_routes
    seed_route_stops
    seed_buses
    seed_schedules
    seed_trips

    print_summary
    log_ok "Synthetic seeding completed."
}

main "$@"
