#!/usr/bin/env bash
set -Eeuo pipefail

###############################################################################
# Bus Booking API - Synthetic Data Seeder
#
# Purpose:
#   Populate a local/dev Bus Booking Spring Boot API with coherent synthetic
#   transport data and realistic transaction scenarios.
#
# Requirements:
#   - bash
#   - curl
#   - jq
#   - date (GNU coreutils; Fedora/Linux)
#
# Authentication:
#   Admin credentials are read from ENV_FILE (default: .env):
#       ADMIN_USERNAME=...
#       ADMIN_PASSWORD=...
#
# Important:
#   This script is intended for local/development environments. It stores
#   synthetic passenger/operator passwords in .seed/state.json so that the
#   script can resume safely.
###############################################################################

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

###############################################################################
# Configuration
###############################################################################

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
ENV_FILE="${ENV_FILE:-"$SCRIPT_DIR/.env"}"

SEED_PREFIX="${SEED_PREFIX:-synthetic}"
STATE_DIR="${STATE_DIR:-"$SCRIPT_DIR/.seed"}"
STATE_FILE="${STATE_FILE:-"$STATE_DIR/state.json"}"
LOCK_DIR="${LOCK_DIR:-"$STATE_DIR/.lock"}"

PASSENGER_COUNT="${PASSENGER_COUNT:-20}"
OPERATOR_COUNT="${OPERATOR_COUNT:-5}"
BUSES_PER_OPERATOR="${BUSES_PER_OPERATOR:-3}"

TRIP_HORIZON_DAYS="${TRIP_HORIZON_DAYS:-30}"
SCHEDULE_EFFECTIVE_DAYS="${SCHEDULE_EFFECTIVE_DAYS:-30}"

TARGET_BOOKINGS="${TARGET_BOOKINGS:-50}"
TARGET_SEAT_HOLDS="${TARGET_SEAT_HOLDS:-10}"

GENERATE_TRANSACTIONS="${GENERATE_TRANSACTIONS:-true}"
GENERATE_CANCELLATIONS="${GENERATE_CANCELLATIONS:-true}"
CANCELLATION_PERCENT="${CANCELLATION_PERCENT:-10}"

SEED_OPERATOR_PASSWORD="${SEED_OPERATOR_PASSWORD:-Seed@12345}"
SEED_PASSENGER_PASSWORD="${SEED_PASSENGER_PASSWORD:-Passenger@12345}"

# Seat layouts used by the synthetic fleet.
SEMI_SLEEPER_ROWS="${SEMI_SLEEPER_ROWS:-10}"  # 40 seats
SLEEPER_ROWS="${SLEEPER_ROWS:-10}"            # 20 berths
SEATER_ROWS="${SEATER_ROWS:-10}"              # 40 seats

HTTP_TIMEOUT="${HTTP_TIMEOUT:-30}"

###############################################################################
# Logging
###############################################################################

log()      { printf '[INFO] %s\n' "$*"; }
log_ok()   { printf '[ OK ] %s\n' "$*"; }
log_warn() { printf '[WARN] %s\n' "$*" >&2; }
log_error(){ printf '[ERROR] %s\n' "$*" >&2; }
die()      { log_error "$*"; exit 1; }

###############################################################################
# Temporary files / cleanup
###############################################################################

RESPONSE_FILE=""
API_STATUS=0
API_RESPONSE=""

cleanup() {
    [[ -n "$RESPONSE_FILE" && -f "$RESPONSE_FILE" ]] && rm -f "$RESPONSE_FILE"
    [[ -d "$LOCK_DIR" ]] && rm -rf "$LOCK_DIR"
}

trap cleanup EXIT
trap 'die "Seeder interrupted."' INT TERM

###############################################################################
# Requirements / validation
###############################################################################

require_command() {
    command -v "$1" >/dev/null 2>&1 ||
        die "Required command not found: $1"
}

check_requirements() {
    require_command bash
    require_command curl
    require_command jq
    require_command sed
    require_command date
    require_command awk
    require_command sort
    require_command head
    require_command tr
}

validate_positive_int() {
    local name="$1"
    local value="$2"
    [[ "$value" =~ ^[0-9]+$ ]] && (( value > 0 )) ||
        die "$name must be a positive integer: $value"
}

validate_config() {
    [[ -n "$API_BASE_URL" ]] || die "API_BASE_URL cannot be empty."
    [[ -n "$SEED_PREFIX" ]] || die "SEED_PREFIX cannot be empty."
    [[ "$SEED_PREFIX" =~ ^[a-zA-Z0-9_-]+$ ]] ||
        die "SEED_PREFIX contains invalid characters: $SEED_PREFIX"

    validate_positive_int PASSENGER_COUNT "$PASSENGER_COUNT"
    validate_positive_int OPERATOR_COUNT "$OPERATOR_COUNT"
    validate_positive_int BUSES_PER_OPERATOR "$BUSES_PER_OPERATOR"
    validate_positive_int TRIP_HORIZON_DAYS "$TRIP_HORIZON_DAYS"
    validate_positive_int SCHEDULE_EFFECTIVE_DAYS "$SCHEDULE_EFFECTIVE_DAYS"

    [[ "$GENERATE_TRANSACTIONS" == "true" || "$GENERATE_TRANSACTIONS" == "false" ]] ||
        die "GENERATE_TRANSACTIONS must be true or false."

    [[ "$GENERATE_CANCELLATIONS" == "true" || "$GENERATE_CANCELLATIONS" == "false" ]] ||
        die "GENERATE_CANCELLATIONS must be true or false."
}

###############################################################################
# Environment
###############################################################################

ADMIN_USERNAME=""
ADMIN_PASSWORD=""

load_env() {
    [[ -f "$ENV_FILE" ]] || die "$ENV_FILE not found."

    ADMIN_USERNAME="$(
        sed -n 's/^[[:space:]]*ADMIN_USERNAME[[:space:]]*=[[:space:]]*//p' "$ENV_FILE" |
            tail -n 1
    )"

    ADMIN_PASSWORD="$(
        sed -n 's/^[[:space:]]*ADMIN_PASSWORD[[:space:]]*=[[:space:]]*//p' "$ENV_FILE" |
            tail -n 1
    )"

    ADMIN_USERNAME="${ADMIN_USERNAME%$'\r'}"
    ADMIN_PASSWORD="${ADMIN_PASSWORD%$'\r'}"

    [[ -n "$ADMIN_USERNAME" ]] || die "ADMIN_USERNAME is missing in $ENV_FILE."
    [[ -n "$ADMIN_PASSWORD" ]] || die "ADMIN_PASSWORD is missing in $ENV_FILE."
}

###############################################################################
# Lock
###############################################################################

acquire_lock() {
    mkdir -p "$STATE_DIR"

    if mkdir "$LOCK_DIR" 2>/dev/null; then
        printf '%s\n' "$$" > "$LOCK_DIR/pid"
        return
    fi

    local pid=""
    if [[ -f "$LOCK_DIR/pid" ]]; then
        pid="$(cat "$LOCK_DIR/pid" 2>/dev/null || true)"
    fi

    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        die "Another seeder is already running (PID $pid)."
    fi

    log_warn "Removing stale seed lock."
    rm -rf "$LOCK_DIR"
    mkdir "$LOCK_DIR"
    printf '%s\n' "$$" > "$LOCK_DIR/pid"
}

###############################################################################
# State
###############################################################################

initialize_state() {
    mkdir -p "$STATE_DIR"

    if [[ ! -f "$STATE_FILE" ]]; then
        cat > "$STATE_FILE" <<EOF
{
  "version": 1,
  "seedPrefix": "$SEED_PREFIX",
  "users": {
    "passengers": {},
    "operators": {}
  },
  "locations": {},
  "routes": {},
  "routeStops": {},
  "operators": {},
  "buses": {},
  "seats": {},
  "schedules": {},
  "trips": {},
  "seatHolds": {},
  "bookings": {},
  "payments": {},
  "tickets": {}
}
EOF
    fi

    jq empty "$STATE_FILE" >/dev/null 2>&1 ||
        die "Invalid state file: $STATE_FILE"

    # Preserve a state file created by an older version while ensuring all
    # expected top-level objects exist.
    local tmp="${STATE_FILE}.tmp.$$"
    jq '
      .version = (.version // 1) |
      .seedPrefix = (.seedPrefix // "synthetic") |
      .users = (.users // {}) |
      .users.passengers = (.users.passengers // {}) |
      .users.operators = (.users.operators // {}) |
      .locations = (.locations // {}) |
      .routes = (.routes // {}) |
      .routeStops = (.routeStops // {}) |
      .operators = (.operators // {}) |
      .buses = (.buses // {}) |
      .seats = (.seats // {}) |
      .schedules = (.schedules // {}) |
      .trips = (.trips // {}) |
      .seatHolds = (.seatHolds // {}) |
      .bookings = (.bookings // {}) |
      .payments = (.payments // {}) |
      .tickets = (.tickets // {})
    ' "$STATE_FILE" > "$tmp"
    mv "$tmp" "$STATE_FILE"
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
    local value="$2"
    local tmp="${STATE_FILE}.tmp.$$"

    jq --argjson value "$value" "$path = \$value" "$STATE_FILE" > "$tmp"
    mv "$tmp" "$STATE_FILE"
}

###############################################################################
# HTTP
#
# api_call METHOD ENDPOINT [BODY]
#
# Results:
#   API_STATUS   = HTTP status or 0 for curl/network failure
#   API_RESPONSE = response body
#
# The function deliberately does not use curl --fail. This lets callers
# distinguish "already exists" responses from genuine server failures.
###############################################################################

api_call() {
    local method="$1"
    local endpoint="$2"
    local body="${3:-}"

    RESPONSE_FILE="${RESPONSE_FILE:-"$STATE_DIR/.response.$$"}"

    local url="${API_BASE_URL}${endpoint}"
    local status

    local args=(
        --silent
        --show-error
        --request "$method"
        --connect-timeout "$HTTP_TIMEOUT"
        --max-time "$HTTP_TIMEOUT"
        "$url"
        --header "Content-Type: application/json"
    )

    if [[ -n "$ACCESS_TOKEN" ]]; then
        args+=(--header "Authorization: Bearer $ACCESS_TOKEN")
    fi

    if [[ -n "$body" ]]; then
        args+=(--data "$body")
    fi

    : > "$RESPONSE_FILE"

    if ! status="$(curl "${args[@]}" -o "$RESPONSE_FILE" -w '%{http_code}')"; then
        API_STATUS=0
        API_RESPONSE="$(cat "$RESPONSE_FILE" 2>/dev/null || true)"
        return 1
    fi

    API_STATUS="$status"
    API_RESPONSE="$(cat "$RESPONSE_FILE")"

    [[ "$API_STATUS" =~ ^2[0-9][0-9]$ ]]
}

api_get() {
    api_call GET "$1"
}

api_post() {
    api_call POST "$1" "${2:-}"
}

api_put() {
    api_call PUT "$1" "${2:-}"
}

api_delete() {
    api_call DELETE "$1"
}

require_success() {
    local operation="$1"

    if (( API_STATUS < 200 || API_STATUS >= 300 )); then
        die "$operation failed (HTTP $API_STATUS): $(printf '%s' "$API_RESPONSE" | jq -c . 2>/dev/null || printf '%s' "$API_RESPONSE")"
    fi
}

###############################################################################
# Authentication
###############################################################################

ACCESS_TOKEN=""

login() {
    local email="$1"
    local password="$2"

    local body
    body="$(
        jq -cn \
            --arg email "$email" \
            --arg password "$password" \
            '{email: $email, password: $password}'
    )"

    api_post "/auth/login" "$body" ||
        die "Login failed for $email (HTTP $API_STATUS): $API_RESPONSE"

    ACCESS_TOKEN="$(
        jq -r '.accessToken // .token // empty' <<< "$API_RESPONSE"
    )"

    [[ -n "$ACCESS_TOKEN" ]] ||
        die "Login succeeded for $email but no accessToken was returned."
}

use_admin_auth() {
    login "$ADMIN_USERNAME" "$ADMIN_PASSWORD"
}

passenger_key() {
    printf '%s-passenger-%d' "$SEED_PREFIX" "$1"
}

operator_key() {
    printf '%s-operator-%d' "$SEED_PREFIX" "$1"
}

bus_key() {
    printf '%s-bus-%d' "$SEED_PREFIX" "$1"
}

use_passenger_auth() {
    local number="$1"
    local key
    local email
    local password

    key="$(passenger_key "$number")"
    email="$(state_get ".users.passengers[\"$key\"].email")"
    password="$(state_get ".users.passengers[\"$key\"].password")"

    [[ -n "$email" && -n "$password" ]] ||
        die "Passenger credentials missing from state: $key"

    login "$email" "$password"
}

use_operator_auth() {
    local number="$1"
    local key
    local email
    local password

    key="$(operator_key "$number")"
    email="$(state_get ".users.operators[\"$key\"].email")"
    password="$(state_get ".users.operators[\"$key\"].password")"

    [[ -n "$email" && -n "$password" ]] ||
        die "Operator credentials missing from state: $key"

    login "$email" "$password"
}

###############################################################################
# Synthetic network definition
###############################################################################

LOCATIONS=(
    "Chennai Central|Chennai|Tamil Nadu|India|13.0827|80.2707"
    "Tambaram|Chennai|Tamil Nadu|India|12.9249|80.1000"
    "Mahabalipuram|Mahabalipuram|Tamil Nadu|India|12.6208|80.1945"
    "Pondicherry Bus Stand|Puducherry|Puducherry|India|11.9416|79.8083"
    "Villupuram|Villupuram|Tamil Nadu|India|11.9401|79.4861"
    "Cuddalore|Cuddalore|Tamil Nadu|India|11.7480|79.7714"
    "Chidambaram|Chidambaram|Tamil Nadu|India|11.3993|79.6917"
    "Kumbakonam|Kumbakonam|Tamil Nadu|India|10.9602|79.3780"
    "Thanjavur|Thanjavur|Tamil Nadu|India|10.7870|79.1378"
    "Tiruchirappalli Central|Tiruchirappalli|Tamil Nadu|India|10.7905|78.7047"
    "Salem Central|Salem|Tamil Nadu|India|11.6643|78.1460"
    "Erode|Erode|Tamil Nadu|India|11.3410|77.7172"
    "Coimbatore|Coimbatore|Tamil Nadu|India|11.0168|76.9558"
    "Mettupalayam|Mettupalayam|Tamil Nadu|India|11.2990|76.9400"
    "Coonoor|Coonoor|Tamil Nadu|India|11.3530|76.7950"
    "Ooty|Udhagamandalam|Tamil Nadu|India|11.4064|76.6932"
    "Vellore|Vellore|Tamil Nadu|India|12.9165|79.1325"
    "Ranipet|Ranipet|Tamil Nadu|India|12.9249|79.3330"
    "Hosur|Hosur|Tamil Nadu|India|12.7409|77.8253"
    "Krishnagiri|Krishnagiri|Tamil Nadu|India|12.5186|78.2137"
    "Bengaluru Majestic|Bengaluru|Karnataka|India|12.9771|77.5725"
)

# Route topology is explicit. Route stops are not generated through arbitrary
# modulo/index relationships.
ROUTE_DEFINITIONS=(
    "Chennai - Pondicherry|Chennai Central>Tambaram>Mahabalipuram>Pondicherry Bus Stand"
    "Chennai - Cuddalore|Chennai Central>Tambaram>Mahabalipuram>Pondicherry Bus Stand>Cuddalore"
    "Chennai - Villupuram|Chennai Central>Tambaram>Mahabalipuram>Pondicherry Bus Stand>Villupuram"
    "Chennai - Chidambaram|Chennai Central>Tambaram>Mahabalipuram>Pondicherry Bus Stand>Cuddalore>Chidambaram"
    "Chennai - Kumbakonam|Chennai Central>Tambaram>Mahabalipuram>Pondicherry Bus Stand>Villupuram>Kumbakonam"
    "Chennai - Trichy|Chennai Central>Tambaram>Villupuram>Kumbakonam>Thanjavur>Tiruchirappalli Central"
    "Chennai - Salem|Chennai Central>Vellore>Ranipet>Salem Central"
    "Chennai - Coimbatore|Chennai Central>Vellore>Salem Central>Erode>Coimbatore"
    "Coimbatore - Ooty|Coimbatore>Mettupalayam>Coonoor>Ooty"
    "Bengaluru - Chennai|Bengaluru Majestic>Hosur>Krishnagiri>Vellore>Chennai Central"
)

# Distance from origin for each route stop, in km.
ROUTE_DISTANCES=(
    "Chennai - Pondicherry|0,25,55,150"
    "Chennai - Cuddalore|0,25,55,150,185"
    "Chennai - Villupuram|0,25,55,150,165"
    "Chennai - Chidambaram|0,25,55,150,185,220"
    "Chennai - Kumbakonam|0,25,55,150,165,285"
    "Chennai - Trichy|0,25,165,285,320,335"
    "Chennai - Salem|0,130,140,335"
    "Chennai - Coimbatore|0,130,335,400,500"
    "Coimbatore - Ooty|0,40,70,85"
    "Bengaluru - Chennai|0,40,90,190,310"
)

###############################################################################
# Location helpers / seeding
###############################################################################

location_id_by_name() {
    local name="$1"
    local entry
    local index=0

    for entry in "${LOCATIONS[@]}"; do
        index=$((index + 1))
        IFS='|' read -r loc_name _ <<< "$entry"

        if [[ "$loc_name" == "$name" ]]; then
            state_get ".locations[\"$SEED_PREFIX-location-$index\"]"
            return 0
        fi
    done

    return 1
}

find_existing_location_id() {
    local name="$1"
    local city="$2"

    api_get "/locations" || return 1

    jq -r \
        --arg name "$name" \
        --arg city "$city" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(.name == $name and .city == $city)
        | (.id // .locationId)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

seed_locations() {
    log "Seeding locations..."
    use_admin_auth

    local index=0
    local entry
    local name city state country latitude longitude
    local key location_id

    for entry in "${LOCATIONS[@]}"; do
        index=$((index + 1))
        IFS='|' read -r name city state country latitude longitude <<< "$entry"

        key="$SEED_PREFIX-location-$index"
        location_id="$(state_get ".locations[\"$key\"]")"

        if [[ -n "$location_id" ]]; then
            log_ok "Location exists: $name ($location_id)"
            continue
        fi

        api_post "/locations" "$(
            jq -cn \
                --arg name "$name" \
                --arg city "$city" \
                --arg state "$state" \
                --arg country "$country" \
                --argjson latitude "$latitude" \
                --argjson longitude "$longitude" \
                '{
                    name: $name,
                    city: $city,
                    state: $state,
                    country: $country,
                    latitude: $latitude,
                    longitude: $longitude
                }'
        )"

        if (( API_STATUS >= 200 && API_STATUS < 300 )); then
            location_id="$(jq -r '.id // .locationId // empty' <<< "$API_RESPONSE")"
        elif (( API_STATUS == 409 )); then
            location_id="$(find_existing_location_id "$name" "$city" || true)"
        else
            die "Location creation failed: $name (HTTP $API_STATUS): $API_RESPONSE"
        fi

        [[ -n "$location_id" ]] ||
            die "Unable to create/recover location: $name"

        state_set ".locations[\"$key\"]" "$location_id"
        log_ok "$name → $location_id"
    done

    log_ok "Locations seeded: ${#LOCATIONS[@]}"
}

###############################################################################
# Routes / route stops
###############################################################################

route_id_by_index() {
    local index="$1"
    state_get ".routes[\"$SEED_PREFIX-route-$index\"]"
}

route_id_by_name() {
    local route_name="$1"
    local index=0
    local definition name

    for definition in "${ROUTE_DEFINITIONS[@]}"; do
        index=$((index + 1))
        IFS='|' read -r name _ <<< "$definition"

        if [[ "$name" == "$route_name" ]]; then
            route_id_by_index "$index"
            return 0
        fi
    done

    return 1
}

find_existing_route_id() {
    local name="$1"

    api_get "/routes" || return 1

    jq -r \
        --arg name "$name" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(.name == $name)
        | (.id // .routeId)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

route_distances_by_index() {
    local index="$1"
    local definition route_name distances

    definition="${ROUTE_DISTANCES[$((index - 1))]}"
    IFS='|' read -r route_name distances <<< "$definition"
    echo "$distances"
}

seed_routes() {
    log "Seeding routes..."
    use_admin_auth

    local index=0
    local definition route_name stops
    local key route_id

    for definition in "${ROUTE_DEFINITIONS[@]}"; do
        index=$((index + 1))
        IFS='|' read -r route_name stops <<< "$definition"

        key="$SEED_PREFIX-route-$index"
        route_id="$(state_get ".routes[\"$key\"]")"

        if [[ -n "$route_id" ]]; then
            log_ok "Route exists: $route_name ($route_id)"
            continue
        fi

        api_post "/routes" "$(
            jq -cn --arg name "$route_name" '{
                name: $name,
                status: "ACTIVE"
            }'
        )"

        if (( API_STATUS >= 200 && API_STATUS < 300 )); then
            route_id="$(jq -r '.id // .routeId // empty' <<< "$API_RESPONSE")"
        elif (( API_STATUS == 409 )); then
            route_id="$(find_existing_route_id "$route_name" || true)"
        else
            die "Route creation failed: $route_name (HTTP $API_STATUS): $API_RESPONSE"
        fi

        [[ -n "$route_id" ]] ||
            die "Unable to create/recover route: $route_name"

        state_set ".routes[\"$key\"]" "$route_id"
        log_ok "$route_name → $route_id"
    done

    log_ok "Routes seeded: ${#ROUTE_DEFINITIONS[@]}"
}

get_route_stops() {
    local route_id="$1"

    api_get "/route-stops/route/${route_id}" ||
        die "Unable to retrieve route stops for route $route_id (HTTP $API_STATUS): $API_RESPONSE"

    jq -c '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | sort_by(.stopOrder // 0)
    ' <<< "$API_RESPONSE"
}

find_existing_route_stop_id() {
    local route_id="$1"
    local location_id="$2"
    local stop_order="$3"

    api_get "/route-stops/route/${route_id}" || return 1

    jq -r \
        --arg locationId "$location_id" \
        --argjson stopOrder "$stop_order" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(
            ((.locationId // .location?.id // empty | tostring) == $locationId)
            and
            ((.stopOrder // -1) == $stopOrder)
        )
        | (.id // .routeStopId // empty)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

seed_route_stops() {
    log "Seeding route stops..."
    use_admin_auth

    local route_index=0
    local definition route_name stop_names
    local route_id distances_csv
    local stop_index stop_name location_id distance
    local arrival_offset departure_offset
    local key stop_id
    local response_json

    for definition in "${ROUTE_DEFINITIONS[@]}"; do
        route_index=$((route_index + 1))
        IFS='|' read -r route_name stop_names <<< "$definition"

        route_id="$(route_id_by_index "$route_index")"
        [[ -n "$route_id" ]] || die "No route ID for $route_name"

        distances_csv="$(route_distances_by_index "$route_index")"

        local -a stops distances
        IFS='>' read -ra stops <<< "$stop_names"
        IFS=',' read -ra distances <<< "$distances_csv"

        (( ${#stops[@]} == ${#distances[@]} )) ||
            die "Stop/distance count mismatch for route $route_name"

        log "Processing route stops: $route_name"

        for ((stop_index = 0; stop_index < ${#stops[@]}; stop_index++)); do
            stop_name="${stops[$stop_index]}"
            distance="${distances[$stop_index]}"
            location_id="$(location_id_by_name "$stop_name" || true)"

            [[ -n "$location_id" ]] ||
                die "Location not found for route stop: $stop_name"

            # Approximate travel time at 45 km/h. This is synthetic seed data,
            # not a timetable derived from real traffic.
            arrival_offset="$(awk -v km="$distance" 'BEGIN {
                if (km == 0) print 0;
                else print int((km / 45.0) * 60 + 0.999999);
            }')"

            if (( stop_index == 0 )); then
                arrival_offset=0
                departure_offset=10
            elif (( stop_index == ${#stops[@]} - 1 )); then
                departure_offset="$arrival_offset"
            else
                departure_offset=$((arrival_offset + 10))
            fi

            key="$SEED_PREFIX-route-$route_index-stop-$((stop_index + 1))"

            if [[ -n "$(state_get ".routeStops[\"$key\"]")" ]]; then
                log_ok "Route stop exists in state: $route_name / $stop_name"
                continue
            fi

            # Recover first from the API. This makes the seeder safe even if it
            # was terminated after the server created the stop but before the
            # local state file was updated.
            stop_id="$(find_existing_route_stop_id "$route_id" "$location_id" "$((stop_index + 1))" || true)"
            if [[ -n "$stop_id" ]]; then
                state_set ".routeStops[\"$key\"]" "$stop_id"
                log_ok "Recovered route stop: $route_name / $stop_name ($stop_id)"
                continue
            fi

            log "  Adding stop: $stop_name | location=$location_id | order=$((stop_index + 1)) | distance=${distance}km"

            api_post "/route-stops" "$(
                jq -cn \
                    --arg routeId "$route_id" \
                    --arg locationId "$location_id" \
                    --argjson stopOrder "$((stop_index + 1))" \
                    --argjson arrivalOffsetMinutes "$arrival_offset" \
                    --argjson departureOffsetMinutes "$departure_offset" \
                    --argjson distanceFromOriginKm "$distance" \
                    '{
                        routeId: ($routeId | tonumber),
                        locationId: ($locationId | tonumber),
                        stopOrder: $stopOrder,
                        arrivalOffsetMinutes: $arrivalOffsetMinutes,
                        departureOffsetMinutes: $departureOffsetMinutes,
                        distanceFromOriginKm: $distanceFromOriginKm
                    }'
            )"

            if (( API_STATUS >= 200 && API_STATUS < 300 )); then
                stop_id="$(jq -r '.id // .routeStopId // empty' <<< "$API_RESPONSE")"
            elif (( API_STATUS == 409 )); then
                stop_id="$(
                    get_route_stops "$route_id" |
                        jq -r \
                            --arg locationId "$location_id" \
                            --argjson order "$((stop_index + 1))" '
                            .[]
                            | select(
                                ((.locationId // .location?.id | tostring) == $locationId)
                                and
                                ((.stopOrder // -1) == $order)
                            )
                            | (.id // .routeStopId)
                            ' |
                        head -n 1
                )"
            else
                die "Route stop creation failed: $route_name / $stop_name (HTTP $API_STATUS): $API_RESPONSE"
            fi

            [[ -n "$stop_id" ]] ||
                die "Unable to create/recover route stop: $route_name / $stop_name"

            state_set ".routeStops[\"$key\"]" "$stop_id"
            log_ok "$route_name: stop $((stop_index + 1)) = $stop_name ($stop_id)"
        done
    done

    log_ok "Route stops seeded."
}

###############################################################################
# Operators
###############################################################################

OPERATOR_DEFINITIONS=(
    "operator1@seed.local|Seed Operator 1|+919900000001|Seed Travels South"
    "operator2@seed.local|Seed Operator 2|+919900000002|Tamil Express"
    "operator3@seed.local|Seed Operator 3|+919900000003|Coastal Travels"
    "operator4@seed.local|Seed Operator 4|+919900000004|Kongu Bus Lines"
    "operator5@seed.local|Seed Operator 5|+919900000005|South Connect"
)

find_existing_operator() {
    local email="$1"

    api_get "/operators" || return 1

    jq -c \
        --arg email "$email" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(
            (.email == $email) or
            (.user.email == $email)
        )
        ' <<< "$API_RESPONSE" |
        head -n 1
}

seed_operators() {
    log "Seeding operators..."

    local index=0
    local definition email first_name phone company_name
    local registration_number password
    local key user_id operator_id existing

    for definition in "${OPERATOR_DEFINITIONS[@]}"; do
        index=$((index + 1))

        IFS='|' read -r email first_name phone company_name <<< "$definition"

        key="$(operator_key "$index")"

        operator_id="$(state_get ".users.operators[\"$key\"].operatorId")"

        if [[ -n "$operator_id" ]]; then
            log_ok "Operator exists: $company_name ($operator_id)"
            continue
        fi

        # Values required by OperatorRegistrationRequest
        registration_number="SEED-OP-${index}"
        password="$SEED_OPERATOR_PASSWORD"

        log "Registering operator: $company_name ($email)"

        # IMPORTANT:
        # /auth/operator/register is a public endpoint.
        # Do NOT use admin authentication here.
        ACCESS_TOKEN=""

        api_post "/auth/operator/register" "$(
            jq -cn \
                --arg email "$email" \
                --arg password "$password" \
                --arg firstName "$first_name" \
                --arg registrationNumber "$registration_number" \
                --arg contactPhone "$phone" \
                --arg operatorName "$company_name" \
                '{
                    email: $email,
                    password: $password,
                    firstName: $firstName,
                    registrationNumber: $registrationNumber,
                    contactPhone: $contactPhone,
                    operatorName: $operatorName
                }'
        )"

        if (( API_STATUS >= 200 && API_STATUS < 300 )); then
            user_id="$(
                jq -r \
                    '.userId // .user?.id // .user?.userId // empty' \
                    <<< "$API_RESPONSE"
            )"

            operator_id="$(
                jq -r \
                    '.operatorId // .operator?.id // .operator?.operatorId // empty' \
                    <<< "$API_RESPONSE"
            "

        elif (( API_STATUS == 409 )); then
            log_warn "Operator already exists: $email"

            # Existing operator recovery.
            # Authenticate as this operator, NOT as admin.
            login "$email" "$password"

            existing="$(find_existing_operator "$email" || true)"

            user_id="$(
                jq -r \
                    '.userId // .user?.id // .user?.userId // empty' \
                    <<< "$existing"
            )"

            operator_id="$(
                jq -r \
                    '.id // .operatorId // .operator?.id // .operator?.operatorId // empty' \
                    <<< "$existing"
            )"

        else
            die "Operator registration failed: $company_name (HTTP $API_STATUS): $API_RESPONSE"
        fi

        [[ -n "$operator_id" ]] ||
            die "Unable to create/recover operator: $company_name"

        # If registration response did not expose userId, try to preserve
        # an already-known value from state.
        if [[ -z "$user_id" ]]; then
            user_id="$(
                jq -r \
                    --arg email "$email" '
                    .users.operators
                    | to_entries[]
                    | select(.value.email == $email)
                    | .value.userId // empty
                    ' "$STATE_FILE" |
                head -n 1
            )"
        fi

        [[ -n "$user_id" ]] ||
            die "Operator recovered without a user ID: $company_name"

        jq \
            --arg key "$key" \
            --arg email "$email" \
            --arg password "$password" \
            --arg name "$first_name" \
            --arg phone "$phone" \
            --arg companyName "$company_name" \
            --arg userId "$user_id" \
            --arg operatorId "$operator_id" '
            .users.operators[$key] = {
                userId: ($userId | tonumber),
                operatorId: ($operatorId | tonumber),
                email: $email,
                password: $password,
                name: $name,
                phone: $phone,
                companyName: $companyName
            }
            ' "$STATE_FILE" > "${STATE_FILE}.tmp"
        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        state_set_json ".operators[\"$key\"]" "$(
            jq -cn \
                --arg userId "$user_id" \
                --arg operatorId "$operator_id" \
                --arg email "$email" \
                --arg name "$first_name" \
                --arg companyName "$company_name" \
                '{
                    userId: ($userId | tonumber),
                    id: ($operatorId | tonumber),
                    email: $email,
                    name: $name,
                    companyName: $companyName
                }'
        )"

        log_ok "$company_name → user=$user_id operator=$operator_id"
    done

    log_ok "Operators seeded: ${#OPERATOR_DEFINITIONS[@]}"
}

###############################################################################
# Buses / seats
###############################################################################

BUS_MODELS=(
    "Ashok Leyland Viking"
    "Volvo B11R"
    "Scania K410"
    "BharatBenz 1624"
)

BUS_TYPES=(
    "SEMI_SLEEPER"
    "SLEEPER"
    "SEATER"
)

generate_semi_sleeper_seats() {
    local row seat_number
    for ((row = 1; row <= SEMI_SLEEPER_ROWS; row++)); do
        seat_number="$(printf 'A%02d' "$((row * 4 - 3))")"; printf '%s|SEAT|WINDOW\n' "$seat_number"
        seat_number="$(printf 'A%02d' "$((row * 4 - 2))")"; printf '%s|SEAT|AISLE\n' "$seat_number"
        seat_number="$(printf 'A%02d' "$((row * 4 - 1))")"; printf '%s|SEAT|AISLE\n' "$seat_number"
        seat_number="$(printf 'A%02d' "$((row * 4))")";     printf '%s|SEAT|WINDOW\n' "$seat_number"
    done
}

generate_sleeper_seats() {
    local row
    for ((row = 1; row <= SLEEPER_ROWS; row++)); do
        printf 'L%02d|SLEEPER|WINDOW\n' "$row"
        printf 'R%02d|SLEEPER|WINDOW\n' "$row"
    done
}

generate_seater_seats() {
    local row seat_number
    for ((row = 1; row <= SEATER_ROWS; row++)); do
        seat_number="$(printf 'S%02d' "$((row * 4 - 3))")"; printf '%s|SEAT|WINDOW\n' "$seat_number"
        seat_number="$(printf 'S%02d' "$((row * 4 - 2))")"; printf '%s|SEAT|AISLE\n' "$seat_number"
        seat_number="$(printf 'S%02d' "$((row * 4 - 1))")"; printf '%s|SEAT|AISLE\n' "$seat_number"
        seat_number="$(printf 'S%02d' "$((row * 4))")";     printf '%s|SEAT|WINDOW\n' "$seat_number"
    done
}

generate_bus_seats() {
    case "$1" in
        SEMI_SLEEPER) generate_semi_sleeper_seats ;;
        SLEEPER)      generate_sleeper_seats ;;
        SEATER)       generate_seater_seats ;;
        *) die "Unsupported bus type: $1" ;;
    esac
}

find_existing_seat_id() {
    local bus_id="$1"
    local seat_number="$2"

    api_get "/seats/bus/${bus_id}" || return 1

    jq -r \
        --arg seatNumber "$seat_number" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(.seatNumber == $seatNumber)
        | (.id // .seatId)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

seed_bus_seats() {
    local bus_num="$1"
    local bus_id="$2"
    local bus_type="$3"

    local seat_definition seat_number seat_type position
    local seat_index=0 seat_id key

    while IFS= read -r seat_definition; do
        [[ -z "$seat_definition" ]] && continue

        IFS='|' read -r seat_number seat_type position <<< "$seat_definition"
        seat_index=$((seat_index + 1))
        key="$SEED_PREFIX-bus-$bus_num-seat-$seat_number"

        seat_id="$(state_get ".seats[\"$key\"]")"
        if [[ -n "$seat_id" ]]; then
            continue
        fi

        api_post "/seats" "$(
            jq -cn \
                --arg busId "$bus_id" \
                --arg seatNumber "$seat_number" \
                --arg seatType "$seat_type" \
                --arg position "$position" '{
                    busId: ($busId | tonumber),
                    seatNumber: $seatNumber,
                    seatType: $seatType,
                    position: $position
                }'
        )"

        if (( API_STATUS >= 200 && API_STATUS < 300 )); then
            seat_id="$(jq -r '.id // .seatId // empty' <<< "$API_RESPONSE")"
        elif (( API_STATUS == 409 )); then
            seat_id="$(find_existing_seat_id "$bus_id" "$seat_number" || true)"
        else
            die "Seat creation failed: bus=$bus_id seat=$seat_number (HTTP $API_STATUS): $API_RESPONSE"
        fi

        [[ -n "$seat_id" ]] ||
            die "Unable to create/recover seat: bus=$bus_id seat=$seat_number"

        state_set ".seats[\"$key\"]" "$seat_id"
    done < <(generate_bus_seats "$bus_type")

    log_ok "Seat inventory ready: bus=$bus_id type=$bus_type"
}

seed_buses() {
    log "Seeding buses..."

    local operator_num local_bus bus_num=0
    local operator_id registration_number model bus_type
    local key bus_id

    for ((operator_num = 1; operator_num <= OPERATOR_COUNT; operator_num++)); do
        use_operator_auth "$operator_num"

        operator_id="$(
            state_get ".users.operators[\"$(operator_key "$operator_num")\"].operatorId"
        )"
        [[ -n "$operator_id" ]] || die "Operator ID missing: $operator_num"

        for ((local_bus = 1; local_bus <= BUSES_PER_OPERATOR; local_bus++)); do
            bus_num=$((bus_num + 1))

            registration_number="$(printf 'TN%02dSE%04d' "$operator_num" "$bus_num")"
            model="${BUS_MODELS[$(((bus_num - 1) % ${#BUS_MODELS[@]}))]}"
            bus_type="${BUS_TYPES[$(((bus_num - 1) % ${#BUS_TYPES[@]}))]}"
            key="$(bus_key "$bus_num")"

            bus_id="$(state_get ".buses[\"$key\"].id")"

            if [[ -z "$bus_id" ]]; then
                api_post "/buses" "$(
                    jq -cn \
                        --arg registrationNumber "$registration_number" \
                        --arg model "$model" \
                        --arg busType "$bus_type" \
                        '{
                            registrationNumber: $registrationNumber,
                            model: $model,
                            busType: $busType,
                            status: "ACTIVE"
                        }'
                )"

                if (( API_STATUS >= 200 && API_STATUS < 300 )); then
                    bus_id="$(jq -r '.id // .busId // empty' <<< "$API_RESPONSE")"
                elif (( API_STATUS == 409 )); then
                    api_get "/buses" ||
                        die "Unable to recover existing bus: $registration_number"

                    bus_id="$(
                        jq -r \
                            --arg reg "$registration_number" '
                            if type == "array" then .
                            elif .content then .content
                            else []
                            end
                            | .[]
                            | select(.registrationNumber == $reg)
                            | (.id // .busId)
                            ' <<< "$API_RESPONSE" |
                            head -n 1
                    )"
                else
                    die "Bus creation failed: $registration_number (HTTP $API_STATUS): $API_RESPONSE"
                fi
            fi

            [[ -n "$bus_id" ]] || die "Unable to create/recover bus: $registration_number"

            state_set_json ".buses[\"$key\"]" "$(
                jq -cn \
                    --arg id "$bus_id" \
                    --arg operatorId "$operator_id" \
                    --arg registration "$registration_number" \
                    --arg model "$model" \
                    --arg busType "$bus_type" '{
                        id: ($id | tonumber),
                        operatorId: ($operatorId | tonumber),
                        registrationNumber: $registration,
                        model: $model,
                        busType: $busType
                    }'
            )"

            # IMPORTANT: seats are generated for every bus immediately, not
            # only for the last bus in the loop.
            seed_bus_seats "$bus_num" "$bus_id" "$bus_type"
        done
    done

    log_ok "Buses seeded: $bus_num"
}

###############################################################################
# Schedules
###############################################################################

SCHEDULE_DEFINITIONS=(
    "Chennai - Pondicherry|1|06:30|ALL|450|2.50"
    "Chennai - Pondicherry|2|14:00|ALL|500|2.75"
    "Chennai - Cuddalore|3|07:00|WEEKDAYS|550|2.80"
    "Chennai - Villupuram|4|21:30|ALL|600|2.90"
    "Chennai - Chidambaram|5|22:00|WEEKEND|700|3.00"
    "Chennai - Kumbakonam|6|05:30|ALL|750|2.70"
    "Chennai - Trichy|7|22:30|ALL|850|2.60"
    "Chennai - Salem|8|06:00|WEEKDAYS|700|2.40"
    "Chennai - Coimbatore|9|21:00|ALL|950|2.30"
    "Coimbatore - Ooty|10|07:30|ALL|400|4.00"
    "Bengaluru - Chennai|11|23:00|ALL|1000|2.50"
)

operating_days_json() {
    case "$1" in
        ALL)
            echo '["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]'
            ;;
        WEEKDAYS)
            echo '["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]'
            ;;
        WEEKEND)
            echo '["SATURDAY","SUNDAY"]'
            ;;
        *)
            die "Unknown operating day group: $1"
            ;;
    esac
}

schedule_effective_from() {
    date -d "tomorrow" '+%Y-%m-%d'
}

schedule_effective_until() {
    date -d "+${SCHEDULE_EFFECTIVE_DAYS} days" '+%Y-%m-%d'
}

bus_id_by_number() {
    state_get ".buses[\"$(bus_key "$1")\"].id"
}

bus_operator_id_by_number() {
    state_get ".buses[\"$(bus_key "$1")\"].operatorId"
}

operator_number_by_id() {
    local operator_id="$1"

    jq -r \
        --arg operatorId "$operator_id" '
        .users.operators
        | to_entries[]
        | select((.value.operatorId | tostring) == $operatorId)
        | (.key | capture("-(?<n>[0-9]+)$").n)
        ' "$STATE_FILE" |
        head -n 1
}

find_existing_schedule_id() {
    local route_id="$1"
    local bus_id="$2"
    local departure_time="$3"

    api_get "/schedules" || return 1

    jq -r \
        --arg routeId "$route_id" \
        --arg busId "$bus_id" \
        --arg departureTime "$departure_time" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(
            ((.routeId // .route?.id | tostring) == $routeId)
            and
            ((.busId // .bus?.id | tostring) == $busId)
            and
            (.departureTime == $departureTime)
        )
        | (.id // .scheduleId)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

seed_schedules() {
    log "Seeding schedules..."

    local index=0
    local definition route_name bus_num departure_time day_group base_fare price_per_km
    local route_id bus_id operator_id operator_num
    local effective_from effective_until
    local key schedule_id operating_days

    effective_from="$(schedule_effective_from)"
    effective_until="$(schedule_effective_until)"

    for definition in "${SCHEDULE_DEFINITIONS[@]}"; do
        index=$((index + 1))

        IFS='|' read -r \
            route_name \
            bus_num \
            departure_time \
            day_group \
            base_fare \
            price_per_km <<< "$definition"

        route_id="$(route_id_by_name "$route_name")"
        bus_id="$(bus_id_by_number "$bus_num")"
        operator_id="$(bus_operator_id_by_number "$bus_num")"

        [[ -n "$route_id" ]] || die "Route not found: $route_name"
        [[ -n "$bus_id" ]] || die "Bus not found: $bus_num"
        [[ -n "$operator_id" ]] || die "Bus operator missing: $bus_num"

        operating_days="$(operating_days_json "$day_group")"
        key="$SEED_PREFIX-schedule-$index"
        schedule_id="$(state_get ".schedules[\"$key\"].id")"

        if [[ -n "$schedule_id" ]]; then
            log_ok "Schedule exists: $route_name / bus $bus_num ($schedule_id)"
            continue
        fi

        operator_num="$(operator_number_by_id "$operator_id")"
        [[ -n "$operator_num" ]] ||
            die "Unable to determine operator account for operator $operator_id"

        use_operator_auth "$operator_num"

        api_post "/schedules" "$(
            jq -cn \
                --arg routeId "$route_id" \
                --arg busId "$bus_id" \
                --arg departureTime "$departure_time" \
                --arg effectiveFrom "$effective_from" \
                --arg effectiveUntil "$effective_until" \
                --argjson operatingDays "$operating_days" \
                --argjson baseFare "$base_fare" \
                --argjson pricePerKm "$price_per_km" '{
                    routeId: ($routeId | tonumber),
                    busId: ($busId | tonumber),
                    departureTime: $departureTime,
                    effectiveFrom: $effectiveFrom,
                    effectiveUntil: $effectiveUntil,
                    operatingDays: $operatingDays,
                    baseFare: $baseFare,
                    pricePerKm: $pricePerKm,
                    status: "ACTIVE"
                }'
        )"

        if (( API_STATUS >= 200 && API_STATUS < 300 )); then
            schedule_id="$(jq -r '.id // .scheduleId // empty' <<< "$API_RESPONSE")"
        elif (( API_STATUS == 409 )); then
            schedule_id="$(find_existing_schedule_id "$route_id" "$bus_id" "$departure_time" || true)"
        else
            die "Schedule creation failed: $route_name / bus $bus_num (HTTP $API_STATUS): $API_RESPONSE"
        fi

        [[ -n "$schedule_id" ]] ||
            die "Unable to create/recover schedule: $route_name / bus $bus_num"

        state_set_json ".schedules[\"$key\"]" "$(
            jq -cn \
                --arg id "$schedule_id" \
                --arg routeId "$route_id" \
                --arg busId "$bus_id" \
                --arg operatorId "$operator_id" \
                --arg departureTime "$departure_time" \
                --arg effectiveFrom "$effective_from" \
                --arg effectiveUntil "$effective_until" \
                --argjson operatingDays "$operating_days" \
                --argjson baseFare "$base_fare" \
                --argjson pricePerKm "$price_per_km" '{
                    id: ($id | tonumber),
                    routeId: ($routeId | tonumber),
                    busId: ($busId | tonumber),
                    operatorId: ($operatorId | tonumber),
                    departureTime: $departureTime,
                    effectiveFrom: $effectiveFrom,
                    effectiveUntil: $effectiveUntil,
                    operatingDays: $operatingDays,
                    baseFare: $baseFare,
                    pricePerKm: $pricePerKm
                }'
        )"

        log_ok "$route_name / bus $bus_num → schedule=$schedule_id"
    done

    log_ok "Schedules seeded: $index"
}

###############################################################################
# Trips
###############################################################################

date_after_days() {
    date -d "+$1 days" '+%Y-%m-%d'
}

day_of_week() {
    date -d "$1" '+%A' | tr '[:lower:]' '[:upper:]'
}

schedule_operates_on() {
    local operating_days="$1"
    local trip_date="$2"
    local day
    day="$(day_of_week "$trip_date")"

    jq -e --arg day "$day" '. | index($day) != null' <<< "$operating_days" >/dev/null
}

date_within_range() {
    local value="$1"
    local start="$2"
    local end="$3"

    [[ "$value" > "$start" || "$value" == "$start" ]] &&
    [[ "$value" < "$end" || "$value" == "$end" ]]
}

trip_state_key() {
    local schedule_id="$1"
    local trip_date="$2"
    printf '%s-schedule-%s-%s' "$SEED_PREFIX" "$schedule_id" "$trip_date"
}

find_existing_trip_id() {
    local schedule_id="$1"
    local trip_date="$2"

    api_get "/trips" || return 1

    jq -r \
        --arg scheduleId "$schedule_id" \
        --arg tripDate "$trip_date" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(
            ((.scheduleId // .schedule?.id | tostring) == $scheduleId)
            and
            (.tripDate == $tripDate)
        )
        | (.id // .tripId)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

validate_trip_seats() {
    local trip_id="$1"
    local bus_id="$2"
    local trip_count physical_count

    api_get "/trip-seats/trip/${trip_id}" ||
        die "Unable to retrieve TripSeats for trip $trip_id"

    trip_count="$(
        jq '
            if type == "array" then length
            elif .content then (.content | length)
            else 0
            end
        ' <<< "$API_RESPONSE"
    )"

    api_get "/seats/bus/${bus_id}" ||
        die "Unable to retrieve physical seats for bus $bus_id"

    physical_count="$(
        jq '
            if type == "array" then length
            elif .content then (.content | length)
            else 0
            end
        ' <<< "$API_RESPONSE"
    )"

    (( trip_count == physical_count )) ||
        die "TripSeat count mismatch: trip=$trip_id expected=$physical_count actual=$trip_count"
}

validate_trip_seat_mapping() {
    local trip_id="$1"
    local bus_id="$2"
    local physical_numbers trip_numbers

    api_get "/seats/bus/${bus_id}" ||
        die "Unable to retrieve physical seats for bus $bus_id"

    physical_numbers="$(
        jq -r '
            if type == "array" then .
            elif .content then .content
            else []
            end
            | .[]
            | .seatNumber
        ' <<< "$API_RESPONSE" |
        sort
    )"

    api_get "/trip-seats/trip/${trip_id}" ||
        die "Unable to retrieve TripSeats for trip $trip_id"

    trip_numbers="$(
        jq -r '
            if type == "array" then .
            elif .content then .content
            else []
            end
            | .[]
            | (.seatNumber // .seat?.seatNumber // .seat?.number)
        ' <<< "$API_RESPONSE" |
        sort
    )"

    [[ "$physical_numbers" == "$trip_numbers" ]] ||
        die "TripSeat physical-seat mapping mismatch for trip $trip_id"
}

seed_trips() {
    log "Seeding calendar-valid trips..."

    local schedule_key
    local schedule_id route_id bus_id
    local operating_days effective_from effective_until
    local trip_date state_key trip_id operator_id operator_num
    local created=0 existing=0

    while read -r schedule_key; do
        [[ -z "$schedule_key" ]] && continue

        schedule_id="$(state_get ".schedules[\"$schedule_key\"].id")"
        route_id="$(state_get ".schedules[\"$schedule_key\"].routeId")"
        bus_id="$(state_get ".schedules[\"$schedule_key\"].busId")"
        operator_id="$(state_get ".schedules[\"$schedule_key\"].operatorId")"
        operating_days="$(jq -c ".schedules[\"$schedule_key\"].operatingDays" "$STATE_FILE")"
        effective_from="$(state_get ".schedules[\"$schedule_key\"].effectiveFrom")"
        effective_until="$(state_get ".schedules[\"$schedule_key\"].effectiveUntil")"

        [[ -n "$schedule_id" && -n "$bus_id" ]] ||
            die "Invalid schedule state: $schedule_key"

        operator_num="$(operator_number_by_id "$operator_id")"
        [[ -n "$operator_num" ]] ||
            die "Unable to determine operator for schedule $schedule_id"

        use_operator_auth "$operator_num"

        for ((day_offset = 1; day_offset <= TRIP_HORIZON_DAYS; day_offset++)); do
            trip_date="$(date_after_days "$day_offset")"

            if ! date_within_range "$trip_date" "$effective_from" "$effective_until"; then
                continue
            fi

            if ! schedule_operates_on "$operating_days" "$trip_date"; then
                continue
            fi

            state_key="$(trip_state_key "$schedule_id" "$trip_date")"
            trip_id="$(state_get ".trips[\"$state_key\"].id")"

            if [[ -n "$trip_id" ]]; then
                existing=$((existing + 1))
                continue
            fi

            api_post "/trips" "$(
                jq -cn \
                    --arg scheduleId "$schedule_id" \
                    --arg tripDate "$trip_date" '{
                        scheduleId: ($scheduleId | tonumber),
                        tripDate: $tripDate
                    }'
            )"

            if (( API_STATUS >= 200 && API_STATUS < 300 )); then
                trip_id="$(jq -r '.id // .tripId // empty' <<< "$API_RESPONSE")"
            elif (( API_STATUS == 409 )); then
                trip_id="$(find_existing_trip_id "$schedule_id" "$trip_date" || true)"
            else
                die "Trip creation failed: schedule=$schedule_id date=$trip_date (HTTP $API_STATUS): $API_RESPONSE"
            fi

            [[ -n "$trip_id" ]] ||
                die "Unable to create/recover trip: schedule=$schedule_id date=$trip_date"

            state_set_json ".trips[\"$state_key\"]" "$(
                jq -cn \
                    --arg id "$trip_id" \
                    --arg scheduleId "$schedule_id" \
                    --arg routeId "$route_id" \
                    --arg busId "$bus_id" \
                    --arg tripDate "$trip_date" '{
                        id: ($id | tonumber),
                        scheduleId: ($scheduleId | tonumber),
                        routeId: ($routeId | tonumber),
                        busId: ($busId | tonumber),
                        tripDate: $tripDate
                    }'
            )"

            validate_trip_seats "$trip_id" "$bus_id"
            validate_trip_seat_mapping "$trip_id" "$bus_id"

            created=$((created + 1))
        done
    done < <(jq -r '.schedules | keys[]' "$STATE_FILE")

    log_ok "Trips ready: created=$created existing=$existing"
}

###############################################################################
# Passengers
###############################################################################

passenger_email() {
    printf 'passenger%02d@seed.local' "$1"
}

passenger_name() {
    printf 'Seed Passenger %02d' "$1"
}

passenger_phone() {
    printf '+91980000%04d' "$1"
}

find_existing_passenger_id() {
    local email="$1"

    api_get "/users" || return 1

    jq -r \
        --arg email "$email" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(.email == $email)
        | (.id // .userId)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

seed_passengers() {
    log "Seeding passengers..."
    use_admin_auth

    local number email name phone key user_id

    for ((number = 1; number <= PASSENGER_COUNT; number++)); do
        email="$(passenger_email "$number")"
        name="$(passenger_name "$number")"
        phone="$(passenger_phone "$number")"
        key="$(passenger_key "$number")"

        user_id="$(state_get ".users.passengers[\"$key\"].userId")"

        if [[ -n "$user_id" ]]; then
            log_ok "Passenger exists: $email ($user_id)"
            continue
        fi

        # Passenger registration is intentionally through /auth/register,
        # not through the admin /users resource.
        api_post "/auth/register" "$(
            jq -cn \
                --arg email "$email" \
                --arg password "$SEED_PASSENGER_PASSWORD" \
                --arg name "$name" \
                --arg phone "$phone" '{
                    email: $email,
                    password: $password,
                    name: $name,
                    phone: $phone
                }'
        )"

        if (( API_STATUS >= 200 && API_STATUS < 300 )); then
            user_id="$(jq -r '.id // .userId // .user?.id // empty' <<< "$API_RESPONSE")"
        elif (( API_STATUS == 409 )); then
            user_id="$(find_existing_passenger_id "$email" || true)"
        else
            die "Passenger registration failed: $email (HTTP $API_STATUS): $API_RESPONSE"
        fi

        [[ -n "$user_id" ]] ||
            die "Unable to create/recover passenger: $email"

        state_set_json ".users.passengers[\"$key\"]" "$(
            jq -cn \
                --arg userId "$user_id" \
                --arg email "$email" \
                --arg password "$SEED_PASSENGER_PASSWORD" \
                --arg name "$name" \
                --arg phone "$phone" '{
                    userId: ($userId | tonumber),
                    email: $email,
                    password: $password,
                    name: $name,
                    phone: $phone
                }'
        )"

        log_ok "$email → $user_id"
    done

    log_ok "Passengers seeded: $PASSENGER_COUNT"
}

###############################################################################
# Transaction helpers
###############################################################################

trip_keys() {
    jq -r '.trips | keys[]' "$STATE_FILE"
}

trip_id_from_key() {
    state_get ".trips[\"$1\"].id"
}

trip_route_id_from_key() {
    state_get ".trips[\"$1\"].routeId"
}

trip_bus_id_from_key() {
    state_get ".trips[\"$1\"].busId"
}

get_available_trip_seats() {
    local trip_id="$1"

    api_get "/trip-seats/trip/${trip_id}" ||
        return 1

    jq -r '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(.status == "AVAILABLE")
        | (.id // .tripSeatId)
    ' <<< "$API_RESPONSE"
}

pick_available_seats() {
    local trip_id="$1"
    local count="$2"

    get_available_trip_seats "$trip_id" |
        head -n "$count"
}

###############################################################################
# Seat holds
#
# Successful bookings need fresh holds because the API hold duration is
# currently 10 minutes. Therefore booking seeding creates a hold immediately
# before creating its booking.
#
# TARGET_SEAT_HOLDS represents additional ACTIVE holds, not the holds consumed
# by successful bookings.
###############################################################################

find_existing_seat_hold_id() {
    local trip_id="$1"
    local passenger_id="$2"

    api_get "/seat-holds" || return 1

    jq -r \
        --arg tripId "$trip_id" \
        --arg passengerId "$passenger_id" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(((.tripId // .trip?.id | tostring) == $tripId))
        | select(((.userId // .user?.id // .passengerId | tostring) == $passengerId))
        | (.id // .seatHoldId)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

create_hold_for_passenger() {
    local trip_id="$1"
    local passenger_num="$2"
    local hold_sequence="$3"

    local passenger_id seat_id hold_id hold_key

    passenger_id="$(
        state_get ".users.passengers[\"$(passenger_key "$passenger_num")\"].userId"
    )"

    [[ -n "$passenger_id" ]] || die "Passenger ID missing: $passenger_num"

    use_passenger_auth "$passenger_num"

    seat_id="$(pick_available_seats "$trip_id" 1 | head -n 1)"

    if [[ -z "$seat_id" ]]; then
        return 1
    fi

    api_post "/seat-holds" "$(
        jq -cn \
            --arg tripId "$trip_id" \
            --arg seatId "$seat_id" '{
                tripId: ($tripId | tonumber),
                seatIds: [($seatId | tonumber)]
            }'
    )"

    if (( API_STATUS >= 200 && API_STATUS < 300 )); then
        hold_id="$(jq -r '.id // .seatHoldId // empty' <<< "$API_RESPONSE")"
    elif (( API_STATUS == 409 )); then
        hold_id="$(find_existing_seat_hold_id "$trip_id" "$passenger_id" || true)"
    else
        log_warn "Seat hold failed: trip=$trip_id passenger=$passenger_num HTTP=$API_STATUS"
        return 1
    fi

    [[ -n "$hold_id" ]] || return 1

    hold_key="$SEED_PREFIX-hold-$hold_sequence"

    state_set_json ".seatHolds[\"$hold_key\"]" "$(
        jq -cn \
            --arg id "$hold_id" \
            --arg tripId "$trip_id" \
            --arg passengerId "$passenger_id" \
            --arg seatId "$seat_id" '{
                id: ($id | tonumber),
                tripId: ($tripId | tonumber),
                passengerId: ($passengerId | tonumber),
                seatIds: [($seatId | tonumber)],
                purpose: "ACTIVE_HOLD"
            }'
    )"

    printf '%s\n' "$hold_id"
}

seed_seat_holds() {
    log "Creating additional active seat holds..."

    local created=0 trip_key trip_id passenger_num hold_id

    while read -r trip_key; do
        (( created >= TARGET_SEAT_HOLDS )) && break

        trip_id="$(trip_id_from_key "$trip_key")"
        [[ -n "$trip_id" ]] || continue

        passenger_num=$((created % PASSENGER_COUNT + 1))

        if hold_id="$(create_hold_for_passenger "$trip_id" "$passenger_num" "$created")"; then
            created=$((created + 1))
            log_ok "Active hold $hold_id created: trip=$trip_id passenger=$passenger_num"
        else
            log_warn "Could not create active hold on trip $trip_id"
        fi
    done < <(trip_keys)

    log_ok "Additional active holds created: $created"
}

###############################################################################
# Booking location selection
###############################################################################

get_route_stops() {
    local route_id="$1"

    api_get "/route-stops/route/${route_id}" ||
        die "Unable to retrieve route stops for route $route_id"

    jq -c '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | sort_by(.stopOrder // 0)
    ' <<< "$API_RESPONSE"
}

get_booking_locations() {
    local route_id="$1"
    local scenario="$2"

    local stops
    stops="$(get_route_stops "$route_id")"

    case "$scenario" in
        FULL_ROUTE)
            jq -c '[.[0], .[-1]]' <<< "$stops"
            ;;
        SHORT_ROUTE)
            jq -c '
                if length >= 4 then [.[1], .[-2]]
                elif length >= 3 then [.[1], .[2]]
                else [.[0], .[-1]]
                end
            ' <<< "$stops"
            ;;
        MID_ROUTE)
            jq -c '
                if length >= 4 then [.[1], .[2]]
                else [.[0], .[-1]]
                end
            ' <<< "$stops"
            ;;
        *)
            jq -c '[.[0], .[-1]]' <<< "$stops"
            ;;
    esac
}

###############################################################################
# Bookings
###############################################################################

booking_count_from_state() {
    jq '.bookings | length' "$STATE_FILE"
}

find_existing_booking_id() {
    local trip_id="$1"
    local passenger_id="$2"

    api_get "/bookings" || return 1

    jq -r \
        --arg tripId "$trip_id" \
        --arg passengerId "$passenger_id" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(
            ((.tripId // .trip?.id | tostring) == $tripId)
            and
            ((.userId // .passengerId // .user?.id | tostring) == $passengerId)
        )
        | (.id // .bookingId)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

create_booking() {
    local booking_sequence="$1"
    local trip_key="$2"

    local trip_id route_id passenger_num passenger_id
    local seat_id hold_id
    local locations pickup_location_id drop_location_id
    local scenario booking_id booking_key

    trip_id="$(trip_id_from_key "$trip_key")"
    route_id="$(trip_route_id_from_key "$trip_key")"

    passenger_num=$(((booking_sequence - 1) % PASSENGER_COUNT + 1))
    passenger_id="$(
        state_get ".users.passengers[\"$(passenger_key "$passenger_num")\"].userId"
    )"

    use_passenger_auth "$passenger_num"

    # Fresh hold immediately before booking.
    seat_id="$(pick_available_seats "$trip_id" 1 | head -n 1)"
    [[ -n "$seat_id" ]] || return 1

    api_post "/seat-holds" "$(
        jq -cn \
            --arg tripId "$trip_id" \
            --arg seatId "$seat_id" '{
                tripId: ($tripId | tonumber),
                seatIds: [($seatId | tonumber)]
            }'
    )"

    if (( API_STATUS < 200 || API_STATUS >= 300 )); then
        log_warn "Unable to create booking hold: trip=$trip_id passenger=$passenger_num HTTP=$API_STATUS"
        return 1
    fi

    hold_id="$(jq -r '.id // .seatHoldId // empty' <<< "$API_RESPONSE")"
    [[ -n "$hold_id" ]] || return 1

    scenario="$(
        case $((booking_sequence % 3)) in
            0) echo SHORT_ROUTE ;;
            1) echo FULL_ROUTE ;;
            *) echo MID_ROUTE ;;
        esac
    )"

    locations="$(get_booking_locations "$route_id" "$scenario")"

    pickup_location_id="$(jq -r '.[0].locationId // .[0].location?.id // empty' <<< "$locations")"
    drop_location_id="$(jq -r '.[1].locationId // .[1].location?.id // empty' <<< "$locations")"

    [[ -n "$pickup_location_id" && -n "$drop_location_id" ]] ||
        die "Unable to choose pickup/drop locations for route=$route_id"

    api_post "/bookings" "$(
        jq -cn \
            --arg tripId "$trip_id" \
            --arg holdId "$hold_id" \
            --arg pickup "$pickup_location_id" \
            --arg drop "$drop_location_id" '{
                tripId: ($tripId | tonumber),
                seatHoldIds: [($holdId | tonumber)],
                pickupLocationId: ($pickup | tonumber),
                dropLocationId: ($drop | tonumber)
            }'
    )"

    if (( API_STATUS >= 200 && API_STATUS < 300 )); then
        booking_id="$(jq -r '.id // .bookingId // empty' <<< "$API_RESPONSE")"
    elif (( API_STATUS == 409 )); then
        booking_id="$(find_existing_booking_id "$trip_id" "$passenger_id" || true)"
    else
        log_warn "Booking failed: trip=$trip_id passenger=$passenger_num HTTP=$API_STATUS"
        return 1
    fi

    [[ -n "$booking_id" ]] || return 1

    booking_key="$SEED_PREFIX-booking-$booking_sequence"

    state_set_json ".bookings[\"$booking_key\"]" "$(
        jq -cn \
            --arg id "$booking_id" \
            --arg tripId "$trip_id" \
            --arg passengerId "$passenger_id" \
            --arg holdId "$hold_id" \
            --arg pickup "$pickup_location_id" \
            --arg drop "$drop_location_id" '{
                id: ($id | tonumber),
                tripId: ($tripId | tonumber),
                passengerId: ($passengerId | tonumber),
                seatHoldIds: [($holdId | tonumber)],
                pickupLocationId: ($pickup | tonumber),
                dropLocationId: ($drop | tonumber),
                cancelled: false
            }'
    )"

    # Keep the consumed hold in state for traceability.
    state_set_json ".seatHolds[\"$SEED_PREFIX-booking-hold-$booking_sequence\"]" "$(
        jq -cn \
            --arg id "$hold_id" \
            --arg tripId "$trip_id" \
            --arg passengerId "$passenger_id" \
            --arg seatId "$seat_id" '{
                id: ($id | tonumber),
                tripId: ($tripId | tonumber),
                passengerId: ($passengerId | tonumber),
                seatIds: [($seatId | tonumber)],
                purpose: "BOOKING_HOLD"
            }'
    )"

    printf '%s\n' "$booking_id"
}

seed_bookings() {
    log "Seeding bookings..."

    local existing target created=0
    local trip_key booking_id
    local -a keys

    existing="$(booking_count_from_state)"
    target="$TARGET_BOOKINGS"

    if (( existing >= target )); then
        log_ok "Booking target already satisfied: $existing"
        return
    fi

    mapfile -t keys < <(trip_keys)

    # Several passes allow the script to skip trips whose seats are already
    # occupied/held while still reaching the target when enough inventory exists.
    local pass=0
    local max_passes=5

    while (( existing < target && pass < max_passes )); do
        pass=$((pass + 1))

        for trip_key in "${keys[@]}"; do
            (( existing >= target )) && break

            booking_id="$(create_booking "$((existing + 1))" "$trip_key" || true)"

            if [[ -n "$booking_id" ]]; then
                existing=$((existing + 1))
                created=$((created + 1))
                log_ok "Booking $booking_id created ($existing/$target)"
            fi
        done
    done

    if (( existing < target )); then
        die "Unable to reach TARGET_BOOKINGS=$target. Created/recovered=$existing. Increase trip horizon or inventory."
    fi

    log_ok "Bookings ready: created_this_run=$created total=$existing"
}

###############################################################################
# Payments
###############################################################################

PAYMENT_METHODS=("UPI" "CARD" "NET_BANKING" "WALLET")

find_existing_payment_id() {
    local booking_id="$1"

    api_get "/payments" || return 1

    jq -r \
        --arg bookingId "$booking_id" '
        if type == "array" then .
        elif .content then .content
        else []
        end
        | .[]
        | select(((.bookingId // .booking?.id | tostring) == $bookingId))
        | (.id // .paymentId)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

seed_payments() {
    log "Processing payments..."

    local index=0
    local booking_key booking_id passenger_id passenger_num
    local method payment_id

    while read -r booking_key; do
        index=$((index + 1))

        payment_id="$(state_get ".payments[\"$SEED_PREFIX-payment-$index\"].id")"
        if [[ -n "$payment_id" ]]; then
            continue
        fi

        booking_id="$(state_get ".bookings[\"$booking_key\"].id")"
        passenger_id="$(state_get ".bookings[\"$booking_key\"].passengerId")"

        passenger_num="$(
            jq -r \
                --arg passengerId "$passenger_id" '
                .users.passengers
                | to_entries[]
                | select((.value.userId | tostring) == $passengerId)
                | (.key | capture("-(?<n>[0-9]+)$").n)
                ' "$STATE_FILE" |
                head -n 1
        )"

        use_passenger_auth "$passenger_num"

        method="${PAYMENT_METHODS[$(((index - 1) % ${#PAYMENT_METHODS[@]}))]}"

        api_post "/payments" "$(
            jq -cn \
                --arg bookingId "$booking_id" \
                --arg paymentMethod "$method" '{
                    bookingId: ($bookingId | tonumber),
                    paymentMethod: $paymentMethod
                }'
        )"

        if (( API_STATUS >= 200 && API_STATUS < 300 )); then
            payment_id="$(jq -r '.id // .paymentId // empty' <<< "$API_RESPONSE")"
        elif (( API_STATUS == 409 )); then
            payment_id="$(find_existing_payment_id "$booking_id" || true)"
        else
            log_warn "Payment failed: booking=$booking_id HTTP=$API_STATUS"
            continue
        fi

        if [[ -z "$payment_id" ]]; then
            log_warn "No payment ID returned for booking $booking_id"
            continue
        fi

        state_set_json ".payments[\"$SEED_PREFIX-payment-$index\"]" "$(
            jq -cn \
                --arg id "$payment_id" \
                --arg bookingId "$booking_id" \
                --arg method "$method" '{
                    id: ($id | tonumber),
                    bookingId: ($bookingId | tonumber),
                    paymentMethod: $method
                }'
        )"

        log_ok "Payment $payment_id → booking $booking_id ($method)"
    done < <(jq -r '.bookings | keys[]' "$STATE_FILE")
}

###############################################################################
# Tickets
###############################################################################

find_ticket_by_booking() {
    local booking_id="$1"

    api_get "/tickets/booking/${booking_id}" || return 1

    jq -r '.id // .ticketId // empty' <<< "$API_RESPONSE"
}

validate_tickets() {
    log "Validating tickets..."

    local booking_key booking_id ticket_id key

    while read -r booking_key; do
        booking_id="$(state_get ".bookings[\"$booking_key\"].id")"
        key="$SEED_PREFIX-ticket-$booking_id"

        ticket_id="$(state_get ".tickets[\"$key\"].id")"

        if [[ -n "$ticket_id" ]]; then
            continue
        fi

        ticket_id="$(find_ticket_by_booking "$booking_id" || true)"

        if [[ -z "$ticket_id" ]]; then
            log_warn "No ticket found yet for booking $booking_id"
            continue
        fi

        state_set_json ".tickets[\"$key\"]" "$(
            jq -cn \
                --arg id "$ticket_id" \
                --arg bookingId "$booking_id" '{
                    id: ($id | tonumber),
                    bookingId: ($bookingId | tonumber)
                }'
        )"

        log_ok "Ticket $ticket_id verified for booking $booking_id"
    done < <(jq -r '.bookings | keys[]' "$STATE_FILE")
}

###############################################################################
# Cancellations
###############################################################################

booking_passenger_number() {
    local passenger_id="$1"

    jq -r \
        --arg passengerId "$passenger_id" '
        .users.passengers
        | to_entries[]
        | select((.value.userId | tostring) == $passengerId)
        | (.key | capture("-(?<n>[0-9]+)$").n)
        ' "$STATE_FILE" |
        head -n 1
}

seed_cancellations() {
    log "Creating cancellation scenarios..."

    local total index=0 booking_key booking_id passenger_id passenger_num response

    total="$(booking_count_from_state)"
    (( total > 0 )) || {
        log_warn "No bookings available for cancellation scenarios."
        return
    }

    while read -r booking_key; do
        index=$((index + 1))

        # Roughly CANCELLATION_PERCENT percent.
        (( (index * 100 / total) <= CANCELLATION_PERCENT )) || continue

        if [[ "$(state_get ".bookings[\"$booking_key\"].cancelled")" == "true" ]]; then
            continue
        fi

        booking_id="$(state_get ".bookings[\"$booking_key\"].id")"
        passenger_id="$(state_get ".bookings[\"$booking_key\"].passengerId")"
        passenger_num="$(booking_passenger_number "$passenger_id")"

        [[ -n "$passenger_num" ]] || continue

        use_passenger_auth "$passenger_num"

        api_post "/bookings/${booking_id}/cancel" "{}"

        if (( API_STATUS >= 200 && API_STATUS < 300 )); then
            state_set ".bookings[\"$booking_key\"].cancelled" "true"
            log_ok "Booking cancelled: $booking_id"
        elif (( API_STATUS == 409 )); then
            # If the booking was already cancelled, keep local state consistent.
            state_set ".bookings[\"$booking_key\"].cancelled" "true"
            log_ok "Booking already cancelled: $booking_id"
        else
            log_warn "Cancellation failed: booking=$booking_id HTTP=$API_STATUS"
        fi
    done < <(jq -r '.bookings | keys[]' "$STATE_FILE")
}

###############################################################################
# Validation / summary
###############################################################################

validate_state_integrity() {
    log "Validating local seed state..."

    jq empty "$STATE_FILE" >/dev/null ||
        die "State file became invalid."

    local locations routes route_stops buses seats schedules trips bookings

    locations="$(jq '.locations | length' "$STATE_FILE")"
    routes="$(jq '.routes | length' "$STATE_FILE")"
    route_stops="$(jq '.routeStops | length' "$STATE_FILE")"
    buses="$(jq '.buses | length' "$STATE_FILE")"
    seats="$(jq '.seats | length' "$STATE_FILE")"
    schedules="$(jq '.schedules | length' "$STATE_FILE")"
    trips="$(jq '.trips | length' "$STATE_FILE")"
    bookings="$(jq '.bookings | length' "$STATE_FILE")"

    (( locations == ${#LOCATIONS[@]} )) ||
        die "State location count mismatch: $locations"

    (( routes == ${#ROUTE_DEFINITIONS[@]} )) ||
        die "State route count mismatch: $routes"

    (( route_stops > 0 )) ||
        die "No route stops were seeded."

    (( buses == OPERATOR_COUNT * BUSES_PER_OPERATOR )) ||
        die "Bus count mismatch: expected=$((OPERATOR_COUNT * BUSES_PER_OPERATOR)) actual=$buses"

    (( seats > 0 )) ||
        die "No seats were seeded."

    (( schedules == ${#SCHEDULE_DEFINITIONS[@]} )) ||
        die "Schedule count mismatch: expected=${#SCHEDULE_DEFINITIONS[@]} actual=$schedules"

    (( trips > 0 )) ||
        die "No trips were seeded."

    if [[ "$GENERATE_TRANSACTIONS" == "true" ]]; then
        (( bookings >= TARGET_BOOKINGS )) ||
            die "Booking target not satisfied: expected>=$TARGET_BOOKINGS actual=$bookings"
    fi

    log_ok "Local state integrity checks passed."
}

print_summary() {
    echo
    echo "============================================================"
    echo "                 BUS BOOKING SEED SUMMARY"
    echo "============================================================"
    printf "%-20s : %s\n" "API" "$API_BASE_URL"
    printf "%-20s : %s\n" "State" "$STATE_FILE"
    printf "%-20s : %s\n" "Seed prefix" "$SEED_PREFIX"
    echo "------------------------------------------------------------"
    printf "%-20s : %s\n" "Passengers" "$(jq '.users.passengers | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Operators" "$(jq '.users.operators | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Locations" "$(jq '.locations | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Routes" "$(jq '.routes | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Route stops" "$(jq '.routeStops | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Buses" "$(jq '.buses | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Seats" "$(jq '.seats | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Schedules" "$(jq '.schedules | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Trips" "$(jq '.trips | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Seat holds" "$(jq '.seatHolds | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Bookings" "$(jq '.bookings | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Payments" "$(jq '.payments | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Tickets" "$(jq '.tickets | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Cancelled bookings" "$(jq '[.bookings[] | select(.cancelled == true)] | length' "$STATE_FILE")"
    echo "============================================================"
}

###############################################################################
# Main
###############################################################################

main() {
    check_requirements
    validate_config
    load_env
    acquire_lock
    initialize_state

    log "Bus Booking API synthetic seeder"
    log "API:   $API_BASE_URL"
    log "State: $STATE_FILE"
    echo

    # Foundation / topology.
    seed_locations
    seed_routes
    seed_route_stops

    # Operators own buses, seats, schedules and trips.
    seed_operators
    seed_buses
    seed_schedules
    seed_trips

    # Passenger accounts.
    seed_passengers

    if [[ "$GENERATE_TRANSACTIONS" == "true" ]]; then
        # Successful bookings create fresh holds immediately before booking.
        seed_bookings

        # These are additional active holds, separate from booking holds.
        seed_seat_holds

        seed_payments
        validate_tickets

        if [[ "$GENERATE_CANCELLATIONS" == "true" ]]; then
            seed_cancellations
        fi
    else
        log "Transaction generation disabled."
    fi

    validate_state_integrity
    print_summary

    log_ok "Seed completed successfully."
}

main "$@"
