#!/usr/bin/env bash

set -Eeuo pipefail

###############################################################################
# Bus Booking API - Synthetic Data Seeder
###############################################################################

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

###############################################################################
# Configuration
###############################################################################

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"

SEED_PREFIX="${SEED_PREFIX:-synthetic}"

STATE_DIR="${STATE_DIR:-"$SCRIPT_DIR/.seed"}"
STATE_FILE="${STATE_FILE:-"$STATE_DIR/state.json"}"
LOCK_DIR="${LOCK_DIR:-"$STATE_DIR/.lock"}"


###############################################################################
# Seed configuration
###############################################################################

PASSENGER_COUNT="${PASSENGER_COUNT:-20}"
OPERATOR_COUNT="${OPERATOR_COUNT:-5}"

TRIP_HORIZON_DAYS="${TRIP_HORIZON_DAYS:-30}"

TARGET_BOOKINGS="${TARGET_BOOKINGS:-50}"
TARGET_SEAT_HOLDS="${TARGET_SEAT_HOLDS:-10}"

GENERATE_TRANSACTIONS="${GENERATE_TRANSACTIONS:-true}"


###############################################################################
# Logging
###############################################################################

log() {
    printf '[INFO] %s\n' "$*"
}

log_ok() {
    printf '[ OK ] %s\n' "$*"
}

log_warn() {
    printf '[WARN] %s\n' "$*" >&2
}

log_error() {
    printf '[ERROR] %s\n' "$*" >&2
}

die() {
    log_error "$*"
    exit 1
}

###############################################################################
# Requirements
###############################################################################

require_command() {
    local command="$1"

    command -v "$command" >/dev/null 2>&1 ||
        die "Required command not found: $command"
}

check_requirements() {
    require_command bash
    require_command curl
    require_command jq
    require_command sed
    require_command date
}

###############################################################################
# Configuration validation
###############################################################################

validate_config() {
    [[ -n "$API_BASE_URL" ]] ||
        die "API_BASE_URL cannot be empty."

    [[ -n "$SEED_PREFIX" ]] ||
        die "SEED_PREFIX cannot be empty."

    [[ "$SEED_PREFIX" =~ ^[a-zA-Z0-9_-]+$ ]] ||
        die "SEED_PREFIX contains invalid characters: $SEED_PREFIX"
}

###############################################################################
# Locking
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

release_lock() {
    rm -rf "$LOCK_DIR"
}

cleanup() {
    release_lock
}

trap cleanup EXIT
trap 'die "Seeder interrupted."' INT TERM


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
}

state_get() {
    local path="$1"

    jq -r "$path // empty" "$STATE_FILE"
}

state_set() {
    local path="$1"
    local value="$2"

    local tmp="${STATE_FILE}.tmp.$$"

    jq \
        --arg value "$value" \
        "$path = \$value" \
        "$STATE_FILE" > "$tmp"

    mv "$tmp" "$STATE_FILE"
}

state_set_json() {
    local path="$1"
    local value="$2"

    local tmp="${STATE_FILE}.tmp.$$"

    jq \
        --argjson value "$value" \
        "$path = \$value" \
        "$STATE_FILE" > "$tmp"

    mv "$tmp" "$STATE_FILE"
}

###############################################################################
# HTTP
###############################################################################

ACCESS_TOKEN=""

api_request() {
    local method="$1"
    local endpoint="$2"
    local body="${3:-}"

    local url="${API_BASE_URL}${endpoint}"

    local args=(
        --silent
        --show-error
        --fail-with-body
        --request "$method"
        "$url"
        --header "Content-Type: application/json"
    )

    if [[ -n "$ACCESS_TOKEN" ]]; then
        args+=(--header "Authorization: Bearer $ACCESS_TOKEN")
    fi

    if [[ -n "$body" ]]; then
        args+=(--data "$body")
    fi

    curl "${args[@]}"
}

api_get() {
    api_request GET "$1"
}

api_post() {
    api_request POST "$1" "${2:-}"
}

api_put() {
    api_request PUT "$1" "${2:-}"
}

api_delete() {
    api_request DELETE "$1"
}

###############################################################################
# Authentication
###############################################################################

ADMIN_USERNAME=""
ADMIN_PASSWORD=""

load_env() {
    local env_file="${ENV_FILE:-.env}"

    [[ -f "$env_file" ]] ||
        die "$env_file not found."

    ADMIN_USERNAME="$(
        sed -n \
            's/^[[:space:]]*ADMIN_USERNAME[[:space:]]*=[[:space:]]*//p' \
            "$env_file" |
        tail -n 1
    )"

    ADMIN_PASSWORD="$(
        sed -n \
            's/^[[:space:]]*ADMIN_PASSWORD[[:space:]]*=[[:space:]]*//p' \
            "$env_file" |
        tail -n 1
    )"

    ADMIN_USERNAME="${ADMIN_USERNAME%$'\r'}"
    ADMIN_PASSWORD="${ADMIN_PASSWORD%$'\r'}"

    [[ -n "$ADMIN_USERNAME" ]] ||
        die "ADMIN_USERNAME is missing."

    [[ -n "$ADMIN_PASSWORD" ]] ||
        die "ADMIN_PASSWORD is missing."
}

login() {
    local email="$1"
    local password="$2"

    local body
    local response

    body="$(
        jq -cn \
            --arg email "$email" \
            --arg password "$password" \
            '{
                email: $email,
                password: $password
            }'
    )"

    response="$(api_post "/auth/login" "$body")" ||
        die "Login failed for $email"

    ACCESS_TOKEN="$(
        jq -r '.accessToken // empty' <<< "$response"
    )"

    [[ -n "$ACCESS_TOKEN" ]] ||
        die "Login succeeded but no accessToken was returned."
}

use_admin_auth() {
    login "$ADMIN_USERNAME" "$ADMIN_PASSWORD"
}

use_passenger_auth() {
    local passenger_num="$1"

    local email
    local password

    email="$(
        state_get \
            ".users.passengers[\"${SEED_PREFIX}-passenger-${passenger_num}\"].email"
    )"

    password="$(
        state_get \
            ".users.passengers[\"${SEED_PREFIX}-passenger-${passenger_num}\"].password"
    )"

    [[ -n "$email" ]] ||
        die "Passenger $passenger_num has no email in state."

    [[ -n "$password" ]] ||
        die "Passenger $passenger_num has no password in state."

    login "$email" "$password"
}

use_operator_auth() {
    local operator_num="$1"

    local email
    local password

    email="$(
        state_get \
            ".users.operators[\"${SEED_PREFIX}-operator-${operator_num}\"].email"
    )"

    password="$(
        state_get \
            ".users.operators[\"${SEED_PREFIX}-operator-${operator_num}\"].password"
    )"

    [[ -n "$email" ]] ||
        die "Operator $operator_num has no email in state."

    [[ -n "$password" ]] ||
        die "Operator $operator_num has no password in state."

    login "$email" "$password"
}

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

find_existing_location_id() {
    local name="$1"
    local city="$2"

    local response

    response="$(api_get "/locations")" || return 1

    echo "$response" |
        jq -r --arg name "$name" --arg city "$city" '
            if type == "array" then .
            elif .content then .content
            else []
            end
            | .[]
            | select(.name == $name and .city == $city)
            | (.id // .locationId)
        ' |
        head -n 1
}

seed_locations() {
    log "Seeding locations..."

    use_admin_auth

    local index=0
    local entry

    local name
    local city
    local state
    local country
    local latitude
    local longitude

    local key
    local location_id
    local response

    for entry in "${LOCATIONS[@]}"; do
        index=$((index + 1))

        IFS='|' read -r \
            name \
            city \
            state \
            country \
            latitude \
            longitude <<< "$entry"

        key="${SEED_PREFIX}-location-${index}"

        location_id="$(
            jq -r \
                --arg key "$key" \
                '.locations[$key] // empty' \
                "$STATE_FILE"
        )"

        if [[ -n "$location_id" ]]; then
            log_ok "Location exists in state: $name ($location_id)"
            continue
        fi

        log "Creating location: $name"

        response="$(
            api_post "/locations" \
                "$(
                    jq -n \
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
        )" || true

        location_id="$(
            echo "$response" |
                jq -r '.id // .locationId // empty' 2>/dev/null
        )"

        if [[ -z "$location_id" ]]; then
            log_warn "Location creation did not return an ID: $name"
            log "Trying to recover existing location..."

            location_id="$(
                find_existing_location_id "$name" "$city" || true
            )"
        fi

        if [[ -z "$location_id" ]]; then
            die "Unable to create or find location: $name"
        fi

        jq \
            --arg key "$key" \
            --arg id "$location_id" \
            '.locations[$key] = $id' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        log_ok "$name → $location_id"
    done

    log_ok "Locations seeded: ${#LOCATIONS[@]}"
}

find_existing_route_id() {
    local name="$1"

    local response

    response="$(api_get "/routes")" || return 1

    echo "$response" |
        jq -r --arg name "$name" '
            if type == "array" then .
            elif .content then .content
            else []
            end
            | .[]
            | select(.name == $name)
            | (.id // .routeId)
        ' |
        head -n 1
}

seed_routes() {
    log "Seeding routes..."

    use_admin_auth

    local index=0
    local definition

    local route_name
    local stops

    local key
    local route_id
    local response

    for definition in "${ROUTE_DEFINITIONS[@]}"; do
        index=$((index + 1))

        IFS='|' read -r route_name stops <<< "$definition"

        key="${SEED_PREFIX}-route-${index}"

        route_id="$(
            jq -r \
                --arg key "$key" \
                '.routes[$key] // empty' \
                "$STATE_FILE"
        )"

        if [[ -n "$route_id" ]]; then
            log_ok "Route exists in state: $route_name ($route_id)"
            continue
        fi

        log "Creating route: $route_name"

        response="$(
            api_post "/routes" \
                "$(
                    jq -n \
                        --arg name "$route_name" \
                        '{
                            name: $name,
                            status: "ACTIVE"
                        }'
                )"
        )" || true

        route_id="$(
            echo "$response" |
                jq -r '.id // .routeId // empty' 2>/dev/null
        )"

        if [[ -z "$route_id" ]]; then
            log_warn "Route creation did not return an ID: $route_name"
            log "Trying to recover existing route..."

            route_id="$(
                find_existing_route_id "$route_name" || true
            )"
        fi

        if [[ -z "$route_id" ]]; then
            die "Unable to create or find route: $route_name"
        fi

        jq \
            --arg key "$key" \
            --arg id "$route_id" \
            '.routes[$key] = $id' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        log_ok "$route_name → $route_id"
    done

    log_ok "Routes seeded: ${#ROUTE_DEFINITIONS[@]}"
}

route_id_by_index() {
    local index="$1"

    jq -r \
        --arg key "${SEED_PREFIX}-route-${index}" \
        '.routes[$key] // empty' \
        "$STATE_FILE"
}

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

route_distances_by_index() {
    local index="$1"

    local definition
    local route_name

    definition="${ROUTE_DISTANCES[$((index - 1))]}"

    IFS='|' read -r route_name distances <<< "$definition"

    echo "$distances"
}

seed_route_stops() {
    log "Seeding route stops..."

    use_admin_auth

    local route_index=0
    local definition

    local route_name
    local stop_names

    local route_id
    local distances_csv

    local stop_index
    local stop_name
    local location_id

    local arrival_offset
    local departure_offset
    local distance

    local key
    local response

    for definition in "${ROUTE_DEFINITIONS[@]}"; do
        route_index=$((route_index + 1))

        IFS='|' read -r route_name stop_names <<< "$definition"

        route_id="$(route_id_by_index "$route_index")"

        if [[ -z "$route_id" ]]; then
            die "No route ID found for: $route_name"
        fi

        distances_csv="$(route_distances_by_index "$route_index")"

        IFS=',' read -ra distances <<< "$distances_csv"
        IFS='>' read -ra stops <<< "$stop_names"

        if (( ${#stops[@]} < 2 )); then
            die "Route must contain at least two stops: $route_name"
        fi

        if (( ${#stops[@]} != ${#distances[@]} )); then
            die "Stop/distance count mismatch for route: $route_name"
        fi

        log "Processing route: $route_name"

        for ((stop_index = 0; stop_index < ${#stops[@]}; stop_index++)); do

            stop_name="${stops[$stop_index]}"
            distance="${distances[$stop_index]}"

            location_id="$(location_id_by_name "$stop_name")"

            if [[ -z "$location_id" ]]; then
                die "Location not found: $stop_name"
            fi

            #
            # First stop:
            # arrival = 0
            # departure = 10
            #
            # Intermediate stops:
            # arrival = previous travel offset
            # departure = arrival + 10
            #
            # Final stop:
            # arrival = travel offset
            # departure = arrival
            #

            if (( stop_index == 0 )); then
                arrival_offset=0
                departure_offset=10

            elif (( stop_index == ${#stops[@]} - 1 )); then
                arrival_offset=$(( stop_index * 90 ))
                departure_offset="$arrival_offset"

            else
                arrival_offset=$(( stop_index * 90 ))
                departure_offset=$(( arrival_offset + 10 ))
            fi

            key="${SEED_PREFIX}-route-${route_index}-stop-$((stop_index + 1))"

            if jq -e \
                --arg key "$key" \
                '.routeStops[$key] != null' \
                "$STATE_FILE" >/dev/null; then

                log_ok "Route stop exists in state: $route_name / $stop_name"
                continue
            fi

            response="$(
                api_post "/routes/${route_id}/stops" \
                    "$(
                        jq -n \
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
            )" || true

            if [[ -z "$response" ]]; then
                die "Failed to create route stop: $route_name / $stop_name"
            fi

            local stop_id

            stop_id="$(
                echo "$response" |
                    jq -r '.id // .routeStopId // empty' 2>/dev/null
            )"

            if [[ -z "$stop_id" ]]; then
                die "Route stop creation returned no ID: $route_name / $stop_name"
            fi

            jq \
                --arg key "$key" \
                --arg id "$stop_id" \
                '.routeStops[$key] = $id' \
                "$STATE_FILE" > "${STATE_FILE}.tmp"

            mv "${STATE_FILE}.tmp" "$STATE_FILE"

            log_ok \
                "$route_name: stop $((stop_index + 1)) = $stop_name ($stop_id)"
        done
    done

    log_ok "Route stops seeded."
}

OPERATOR_COUNT=5

OPERATOR_DEFINITIONS=(
    "operator1@seed.local|Seed Operator 1|+919900000001|Seed Travels South"
    "operator2@seed.local|Seed Operator 2|+919900000002|Tamil Express"
    "operator3@seed.local|Seed Operator 3|+919900000003|Coastal Travels"
    "operator4@seed.local|Seed Operator 4|+919900000004|Kongu Bus Lines"
    "operator5@seed.local|Seed Operator 5|+919900000005|South Connect"
)

SEED_OPERATOR_PASSWORD="Seed@12345"

find_existing_operator() {
    local email="$1"

    local response

    response="$(api_get "/operators")" || return 1

    echo "$response" |
        jq -c --arg email "$email" '
            if type == "array" then .
            elif .content then .content
            else []
            end
            | .[]
            | select(
                (.email == $email) or
                (.user.email == $email)
            )
        ' |
        head -n 1
}

seed_operators() {
    log "Seeding operators..."

    use_admin_auth

    local index=0
    local definition

    local email
    local name
    local phone
    local company_name

    local key
    local user_id
    local operator_id
    local response

    for definition in "${OPERATOR_DEFINITIONS[@]}"; do
        index=$((index + 1))

        IFS='|' read -r \
            email \
            name \
            phone \
            company_name <<< "$definition"

        key="${SEED_PREFIX}-operator-${index}"

        operator_id="$(
            jq -r \
                --arg key "$key" \
                '.users.operators[$key].operatorId // empty' \
                "$STATE_FILE"
        )"

        if [[ -n "$operator_id" ]]; then
            log_ok "Operator exists in state: $company_name ($operator_id)"
            continue
        fi

        log "Registering operator: $company_name"

        response="$(
            api_post "/auth/register" \
                "$(
                    jq -n \
                        --arg email "$email" \
                        --arg password "$SEED_OPERATOR_PASSWORD" \
                        --arg firstName "$name" \
                        --arg phone "$phone" \
                        --arg operatorName "$company_name" \
                        --arg registrationNumber "SEED-OP-${index}" \
                        --arg contactPhone "$phone" \
                        '{
                            userType: "OPERATOR",
                            email: $email,
                            password: $password,
                            firstName: $firstName,
                            phone: $phone,
                            operatorName: $operatorName,
                            registrationNumber: $registrationNumber,
                            contactPhone: $contactPhone
                        }'
                )"
        )" || true

        user_id="$(
            echo "$response" |
                jq -r '.userId // .user?.id // empty' 2>/dev/null
        )"

        operator_id="$(
            echo "$response" |
                jq -r '.operatorId // .operator?.id // empty' 2>/dev/null
        )"

        if [[ -z "$operator_id" ]]; then
            log_warn "Operator registration returned no operator ID."

            existing="$(
                find_existing_operator "$email" || true
            )"

            if [[ -n "$existing" ]]; then
                user_id="$(
                    echo "$existing" |
                        jq -r '.userId // .user?.id // empty'
                )"

                operator_id="$(
                    echo "$existing" |
                        jq -r '.id // .operatorId // empty'
                )"
            fi
        fi

        if [[ -z "$operator_id" ]]; then
            die "Unable to create or recover operator: $company_name"
        fi

        jq \
            --arg key "$key" \
            --arg email "$email" \
            --arg password "$SEED_OPERATOR_PASSWORD" \
            --arg name "$name" \
            --arg phone "$phone" \
            --arg companyName "$company_name" \
            --arg userId "$user_id" \
            --arg operatorId "$operator_id" \
            '
            .users.operators[$key] = {
                userId: ($userId | tonumber),
                operatorId: ($operatorId | tonumber),
                email: $email,
                password: $password,
                name: $name,
                phone: $phone,
                companyName: $companyName
            }
            ' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        log_ok \
            "$company_name → user=$user_id operator=$operator_id"
    done

    log_ok "Operators seeded: ${#OPERATOR_DEFINITIONS[@]}"
}

use_operator_auth() {
    local operator_num="$1"

    local key
    local email
    local password

    key="${SEED_PREFIX}-operator-${operator_num}"

    email="$(
        jq -r \
            --arg key "$key" \
            '.users.operators[$key].email // empty' \
            "$STATE_FILE"
    )"

    password="$(
        jq -r \
            --arg key "$key" \
            '.users.operators[$key].password // empty' \
            "$STATE_FILE"
    )"

    if [[ -z "$email" || -z "$password" ]]; then
        die "Operator credentials not found in state: $operator_num"
    fi

    login "$email" "$password"
}

BUSES_PER_OPERATOR=3

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

seed_buses() {
    log "Seeding buses..."

    local operator_num
    local bus_num=0

    local operator_id
    local registration_number
    local model
    local bus_type

    local key
    local response
    local bus_id

    for ((operator_num = 1; operator_num <= OPERATOR_COUNT; operator_num++)); do

        use_operator_auth "$operator_num"

        operator_id="$(
            jq -r \
                --arg key "${SEED_PREFIX}-operator-${operator_num}" \
                '.users.operators[$key].operatorId // empty' \
                "$STATE_FILE"
        )"

        if [[ -z "$operator_id" ]]; then
            die "Operator ID missing: $operator_num"
        fi

        for ((local_bus = 1; local_bus <= BUSES_PER_OPERATOR; local_bus++)); do
            bus_num=$((bus_num + 1))

            registration_number="$(
                printf 'TN%02dSE%04d' "$operator_num" "$bus_num"
            )"

            model="${BUS_MODELS[$(((bus_num - 1) % ${#BUS_MODELS[@]}))]}"
            bus_type="${BUS_TYPES[$(((bus_num - 1) % ${#BUS_TYPES[@]}))]}"

            key="${SEED_PREFIX}-bus-${bus_num}"

            bus_id="$(
                jq -r \
                    --arg key "$key" \
                    '.buses[$key] // empty' \
                    "$STATE_FILE"
            )"

            if [[ -n "$bus_id" ]]; then
                log_ok "Bus exists in state: $registration_number ($bus_id)"
                seed_bus_seats \
                    "$bus_num" \
                    "$bus_id" \
                    "$bus_type"
                continue
            fi

            log "Creating bus: $registration_number"

            response="$(
                api_post "/buses" \
                    "$(
                        jq -n \
                            --arg registrationNumber "$registration_number" \
                            --arg model "$model" \
                            --arg busType "$bus_type" \
                            --arg status "ACTIVE" \
                            '{
                                registrationNumber: $registrationNumber,
                                model: $model,
                                busType: $busType,
                                status: $status
                            }'
                    )"
            )" || true

            bus_id="$(
                echo "$response" |
                    jq -r '.id // .busId // empty' 2>/dev/null
            )"

            if [[ -z "$bus_id" ]]; then
                die "Failed to create bus: $registration_number"
            fi

            jq \
                --arg key "$key" \
                --arg id "$bus_id" \
                --arg operator "$operator_id" \
                --arg registration "$registration_number" \
                --arg model "$model" \
                --arg busType "$bus_type" \
                '
                .buses[$key] = {
                    id: ($id | tonumber),
                    operatorId: ($operator | tonumber),
                    registrationNumber: $registration,
                    model: $model,
                    busType: $busType
                }
                ' \
                "$STATE_FILE" > "${STATE_FILE}.tmp"

            mv "${STATE_FILE}.tmp" "$STATE_FILE"

            log_ok \
                "$registration_number → bus=$bus_id operator=$operator_id"
        done
    done

    log_ok "Buses seeded: $bus_num"

    seed_bus_seats \
    "$bus_num" \
    "$bus_id" \
    "$bus_type"
}

SEAT_LAYOUT_SEMI_SLEEPER="SEMI_SLEEPER"
SEAT_LAYOUT_SLEEPER="SLEEPER"
SEAT_LAYOUT_SEATER="SEATER"

seat_layout_for_bus_type() {
    local bus_type="$1"

    case "$bus_type" in
        SEMI_SLEEPER)
            echo "$SEAT_LAYOUT_SEMI_SLEEPER"
            ;;

        SLEEPER)
            echo "$SEAT_LAYOUT_SLEEPER"
            ;;

        SEATER)
            echo "$SEAT_LAYOUT_SEATER"
            ;;

        *)
            die "Unknown bus type: $bus_type"
            ;;
    esac
}

generate_semi_sleeper_seats() {
    local bus_id="$1"
    local seats=()

    local row
    local seat_number

    for ((row = 1; row <= SEMI_SLEEPER_ROWS; row++)); do

        seat_number="$(printf 'A%02d' "$((row * 4 - 3))")"
        seats+=("${seat_number}|SEAT|WINDOW")

        seat_number="$(printf 'A%02d' "$((row * 4 - 2))")"
        seats+=("${seat_number}|SEAT|AISLE")

        seat_number="$(printf 'A%02d' "$((row * 4 - 1))")"
        seats+=("${seat_number}|SEAT|AISLE")

        seat_number="$(printf 'A%02d' "$((row * 4))")"
        seats+=("${seat_number}|SEAT|WINDOW")
    done

    printf '%s\n' "${seats[@]}"
}

generate_sleeper_seats() {
    local bus_id="$1"
    local seats=()

    local row
    local seat_number

    for ((row = 1; row <= SLEEPER_ROWS; row++)); do

        seat_number="$(printf 'L%02d' "$row")"
        seats+=("${seat_number}|SLEEPER|WINDOW")

        seat_number="$(printf 'R%02d' "$row")"
        seats+=("${seat_number}|SLEEPER|WINDOW")
    done

    printf '%s\n' "${seats[@]}"
}

generate_seater_seats() {
    generate_semi_sleeper_seats
}

generate_bus_seats() {
    local bus_type="$1"

    case "$bus_type" in
        SEMI_SLEEPER)
            generate_semi_sleeper_seats
            ;;

        SLEEPER)
            generate_sleeper_seats
            ;;

        SEATER)
            generate_seater_seats
            ;;

        *)
            die "Unsupported bus type: $bus_type"
            ;;
    esac
}

find_existing_seat_id() {
    local bus_id="$1"
    local seat_number="$2"

    local response

    response="$(api_get "/seats/bus/${bus_id}")" || return 1

    echo "$response" |
        jq -r --arg seatNumber "$seat_number" '
            if type == "array" then .
            elif .content then .content
            else []
            end
            | .[]
            | select(.seatNumber == $seatNumber)
            | (.id // .seatId)
        ' |
        head -n 1
}

seed_bus_seats() {
    local bus_num="$1"
    local bus_id="$2"
    local bus_type="$3"

    local seat_definition
    local seat_number
    local seat_type
    local position

    local seat_index=0
    local seat_id
    local key
    local response

    log "Creating seats for bus $bus_id ($bus_type)"

    while IFS= read -r seat_definition; do

        [[ -z "$seat_definition" ]] && continue

        IFS='|' read -r \
            seat_number \
            seat_type \
            position <<< "$seat_definition"

        seat_index=$((seat_index + 1))

        key="${SEED_PREFIX}-bus-${bus_num}-seat-${seat_number}"

        seat_id="$(
            jq -r \
                --arg key "$key" \
                '.seats[$key] // empty' \
                "$STATE_FILE"
        )"

        if [[ -n "$seat_id" ]]; then
            continue
        fi

        response="$(
            api_post "/seats" \
                "$(
                    jq -n \
                        --arg busId "$bus_id" \
                        --arg seatNumber "$seat_number" \
                        --arg seatType "$seat_type" \
                        --arg position "$position" \
                        '{
                            busId: ($busId | tonumber),
                            seatNumber: $seatNumber,
                            seatType: $seatType,
                            position: $position
                        }'
                )"
        )" || true

        seat_id="$(
            echo "$response" |
                jq -r '.id // .seatId // empty' 2>/dev/null
        )"

        if [[ -z "$seat_id" ]]; then
            seat_id="$(
                find_existing_seat_id "$bus_id" "$seat_number" || true
            )"
        fi

        if [[ -z "$seat_id" ]]; then
            die "Unable to create seat: bus=$bus_id seat=$seat_number"
        fi

        jq \
            --arg key "$key" \
            --arg id "$seat_id" \
            --arg busId "$bus_id" \
            --arg seatNumber "$seat_number" \
            --arg seatType "$seat_type" \
            --arg position "$position" \
            '
            .seats[$key] = {
                id: ($id | tonumber),
                busId: ($busId | tonumber),
                seatNumber: $seatNumber,
                seatType: $seatType,
                position: $position
            }
            ' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        log_ok "Seat $seat_number → $seat_id"

    done < <(generate_bus_seats "$bus_type")

    log_ok "Seats created for bus $bus_id: $seat_index"
}

validate_bus_seats() {
    local bus_id="$1"
    local bus_type="$2"

    local expected_count

    case "$bus_type" in
        SEMI_SLEEPER|SEATER)
            expected_count=$((SEMI_SLEEPER_ROWS * 4))
            ;;

        SLEEPER)
            expected_count=$((SLEEPER_ROWS * 2))
            ;;

        *)
            die "Unknown bus type: $bus_type"
            ;;
    esac

    local response
    local actual_count

    response="$(api_get "/seats/bus/${bus_id}")" ||
        die "Unable to retrieve seats for bus $bus_id"

    actual_count="$(
        echo "$response" |
            jq '
                if type == "array" then length
                elif .content then (.content | length)
                else 0
                end
            '
    )"

    if (( actual_count != expected_count )); then
        die \
            "Seat count mismatch for bus $bus_id: expected=$expected_count actual=$actual_count"
    fi

    log_ok \
        "Bus $bus_id seat inventory valid: $actual_count seats"
}

SCHEDULE_DEFINITIONS=(
    "Chennai - Pondicherry|1|06:30|MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY|450|2.50"
    "Chennai - Pondicherry|2|14:00|MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY|500|2.75"

    "Chennai - Cuddalore|3|07:00|MONDAY,WEDNESDAY,FRIDAY,SATURDAY|550|2.80"
    "Chennai - Villupuram|4|21:30|MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY|600|2.90"

    "Chennai - Chidambaram|5|22:00|FRIDAY,SATURDAY,SUNDAY|700|3.00"

    "Chennai - Kumbakonam|6|05:30|MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY|750|2.70"
    "Chennai - Trichy|7|22:30|MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY|850|2.60"

    "Chennai - Salem|8|06:00|MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY|700|2.40"
    "Chennai - Coimbatore|9|21:00|MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY|950|2.30"

    "Coimbatore - Ooty|10|07:30|MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY|400|4.00"

    "Bengaluru - Chennai|11|23:00|MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY|1000|2.50"
)

SCHEDULE_EFFECTIVE_DAYS=30

schedule_effective_from() {
    date -d "tomorrow" "+%Y-%m-%d"
}

schedule_effective_until() {
    date -d "+${SCHEDULE_EFFECTIVE_DAYS} days" "+%Y-%m-%d"
}

route_id_by_name() {
    local route_name="$1"

    local index=0
    local definition
    local name

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

bus_id_by_number() {
    local bus_num="$1"

    jq -r \
        --arg key "${SEED_PREFIX}-bus-${bus_num}" \
        '.buses[$key].id // empty' \
        "$STATE_FILE"
}

bus_operator_id_by_number() {
    local bus_num="$1"

    jq -r \
        --arg key "${SEED_PREFIX}-bus-${bus_num}" \
        '.buses[$key].operatorId // empty' \
        "$STATE_FILE"
}

find_existing_schedule_id() {
    local route_id="$1"
    local bus_id="$2"
    local departure_time="$3"

    local response

    response="$(api_get "/schedules")" || return 1

    echo "$response" |
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
        ' |
        head -n 1
}

seed_schedules() {
    log "Seeding schedules..."

    local schedule_index=0
    local definition

    local route_name
    local bus_num
    local departure_time
    local operating_days
    local base_fare
    local price_per_km

    local route_id
    local bus_id
    local operator_id

    local effective_from
    local effective_until

    local key
    local schedule_id
    local response

    effective_from="$(schedule_effective_from)"
    effective_until="$(schedule_effective_until)"

    for definition in "${SCHEDULE_DEFINITIONS[@]}"; do
        schedule_index=$((schedule_index + 1))

        IFS='|' read -r \
            route_name \
            bus_num \
            departure_time \
            operating_days \
            base_fare \
            price_per_km <<< "$definition"

        route_id="$(route_id_by_name "$route_name")"

        if [[ -z "$route_id" ]]; then
            die "Route not found for schedule: $route_name"
        fi

        bus_id="$(bus_id_by_number "$bus_num")"

        if [[ -z "$bus_id" ]]; then
            die "Bus not found for schedule: $bus_num"
        fi

        operator_id="$(bus_operator_id_by_number "$bus_num")"

        if [[ -z "$operator_id" ]]; then
            die "Operator ownership missing for bus: $bus_num"
        fi

        key="${SEED_PREFIX}-schedule-${schedule_index}"

        schedule_id="$(
            jq -r \
                --arg key "$key" \
                '.schedules[$key].id // empty' \
                "$STATE_FILE"
        )"

        if [[ -n "$schedule_id" ]]; then
            log_ok \
                "Schedule exists: $route_name / bus $bus_num ($schedule_id)"
            continue
        fi

        log "Creating schedule: $route_name / bus $bus_num"

        #
        # Authenticate as the owner of the bus.
        #
        # operator_id is used only to determine which operator account
        # should perform the request.
        #
        local operator_num

        operator_num="$(
            jq -r \
                --arg operatorId "$operator_id" '
                .users.operators
                | to_entries[]
                | select(
                    (.value.operatorId | tostring) == $operatorId
                )
                | .key
                | split("-")
                | last
                ' \
                "$STATE_FILE"
        )"

        if [[ -z "$operator_num" ]]; then
            die "Unable to determine operator account for operator $operator_id"
        fi

        use_operator_auth "$operator_num"

        response="$(
            api_post "/schedules" \
                "$(
                    jq -n \
                        --arg routeId "$route_id" \
                        --arg busId "$bus_id" \
                        --arg departureTime "$departure_time" \
                        --arg effectiveFrom "$effective_from" \
                        --arg effectiveUntil "$effective_until" \
                        --arg operatingDays "$operating_days" \
                        --argjson baseFare "$base_fare" \
                        --argjson pricePerKm "$price_per_km" \
                        '{
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
        )" || true

        schedule_id="$(
            echo "$response" |
                jq -r '.id // .scheduleId // empty' 2>/dev/null
        )"

        if [[ -z "$schedule_id" ]]; then
            schedule_id="$(
                find_existing_schedule_id \
                    "$route_id" \
                    "$bus_id" \
                    "$departure_time" ||
                true
            )"
        fi

        if [[ -z "$schedule_id" ]]; then
            die \
                "Unable to create or recover schedule: $route_name / bus $bus_num"
        fi

        jq \
            --arg key "$key" \
            --arg id "$schedule_id" \
            --arg routeId "$route_id" \
            --arg busId "$bus_id" \
            --arg operatorId "$operator_id" \
            --arg departureTime "$departure_time" \
            --arg effectiveFrom "$effective_from" \
            --arg effectiveUntil "$effective_until" \
            --arg operatingDays "$operating_days" \
            --arg baseFare "$base_fare" \
            --arg pricePerKm "$price_per_km" \
            '
            .schedules[$key] = {
                id: ($id | tonumber),
                routeId: ($routeId | tonumber),
                busId: ($busId | tonumber),
                operatorId: ($operatorId | tonumber),
                departureTime: $departureTime,
                effectiveFrom: $effectiveFrom,
                effectiveUntil: $effectiveUntil,
                operatingDays: $operatingDays,
                baseFare: ($baseFare | tonumber),
                pricePerKm: ($pricePerKm | tonumber)
            }
            ' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        log_ok \
            "$route_name / bus $bus_num → schedule=$schedule_id"
    done

    log_ok "Schedules seeded: $schedule_index"
}

validate_schedule_definition() {
    local route_name="$1"
    local bus_num="$2"
    local departure_time="$3"
    local operating_days="$4"
    local base_fare="$5"
    local price_per_km="$6"

    [[ -n "$route_name" ]] ||
        die "Schedule has no route"

    [[ -n "$bus_num" ]] ||
        die "Schedule has no bus"

    [[ "$departure_time" =~ ^[0-9]{2}:[0-9]{2}$ ]] ||
        die "Invalid departure time: $departure_time"

    [[ -n "$operating_days" ]] ||
        die "Schedule has no operating days"

    (( base_fare > 0 )) ||
        die "Base fare must be positive: $route_name"

    (( $(awk "BEGIN {print ($price_per_km > 0)}") )) ||
        die "Price per km must be positive: $route_name"
}

TRIP_HORIZON_DAYS=30
date_after_days() {
    local days="$1"

    date -d "+${days} days" "+%Y-%m-%d"
}
day_of_week() {
    local trip_date="$1"

    date -d "$trip_date" "+%A" | tr '[:lower:]' '[:upper:]'
}
schedule_operates_on() {
    local operating_days="$1"
    local trip_date="$2"

    local day

    day="$(day_of_week "$trip_date")"

    IFS=',' read -ra days <<< "$operating_days"

    for allowed_day in "${days[@]}"; do
        if [[ "$allowed_day" == "$day" ]]; then
            return 0
        fi
    done

    return 1
}
date_within_range() {
    local date="$1"
    local start="$2"
    local end="$3"

    [[ "$date" > "$start" || "$date" == "$start" ]] &&
    [[ "$date" < "$end" || "$date" == "$end" ]]
}

find_existing_trip_id() {
    local schedule_id="$1"
    local trip_date="$2"

    local response

    response="$(api_get "/trips")" || return 1

    echo "$response" |
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
        ' |
        head -n 1
}

trip_state_key() {
    local schedule_id="$1"
    local trip_date="$2"

    echo "${SEED_PREFIX}-schedule-${schedule_id}-${trip_date}"
}

create_trip() {
    local schedule_id="$1"
    local trip_date="$2"

    local response

    response="$(
        api_post "/trips" \
            "$(
                jq -n \
                    --arg scheduleId "$schedule_id" \
                    --arg tripDate "$trip_date" \
                    '{
                        scheduleId: ($scheduleId | tonumber),
                        tripDate: $tripDate
                    }'
            )"
    )" || true

    echo "$response"
}

validate_trip_seats() {
    local trip_id="$1"
    local bus_id="$2"

    local seats_response
    local bus_response

    seats_response="$(api_get "/trip-seats/trip/${trip_id}")" ||
        die "Unable to retrieve TripSeats for trip $trip_id"

    bus_response="$(api_get "/seats/bus/${bus_id}")" ||
        die "Unable to retrieve physical seats for bus $bus_id"

    local trip_seat_count
    local physical_seat_count

    trip_seat_count="$(
        echo "$seats_response" |
            jq '
                if type == "array" then length
                elif .content then (.content | length)
                else 0
                end
            '
    )"

    physical_seat_count="$(
        echo "$bus_response" |
            jq '
                if type == "array" then length
                elif .content then (.content | length)
                else 0
                end
            '
    )"

    if (( trip_seat_count != physical_seat_count )); then
        die \
            "TripSeat mismatch: trip=$trip_id expected=$physical_seat_count actual=$trip_seat_count"
    fi

    log_ok \
        "TripSeat inventory valid: trip=$trip_id seats=$trip_seat_count"
}

validate_trip_seat_mapping() {
    local trip_id="$1"
    local bus_id="$2"

    local physical
    local inventory

    physical="$(
        api_get "/seats/bus/${bus_id}"
    )" || die "Unable to retrieve physical seats"

    inventory="$(
        api_get "/trip-seats/trip/${trip_id}"
    )" || die "Unable to retrieve trip seats"

    local physical_numbers
    local trip_numbers

    physical_numbers="$(
        echo "$physical" |
            jq -r '
                if type == "array" then .
                elif .content then .content
                else []
                end
                | .[]
                | .seatNumber
            ' |
            sort
    )"

    trip_numbers="$(
        echo "$inventory" |
            jq -r '
                if type == "array" then .
                elif .content then .content
                else []
                end
                | .[]
                | (.seatNumber // .seat?.seatNumber)
            ' |
            sort
    )"

    if [[ "$physical_numbers" != "$trip_numbers" ]]; then
        die \
            "TripSeat physical-seat mapping mismatch for trip $trip_id"
    fi

    log_ok "TripSeat mapping valid for trip $trip_id"
}

seed_trips() {
    log "Seeding calendar-valid trips..."

    local schedule_index=0
    local schedule_key

    local schedule_id
    local route_id
    local bus_id
    local operating_days
    local effective_from
    local effective_until

    local trip_date
    local state_key
    local trip_id
    local response

    local created_count=0
    local skipped_count=0

    while read -r schedule_key; do

        [[ -z "$schedule_key" ]] && continue

        schedule_id="$(
            jq -r \
                --arg key "$schedule_key" \
                '.schedules[$key].id // empty' \
                "$STATE_FILE"
        )"

        route_id="$(
            jq -r \
                --arg key "$schedule_key" \
                '.schedules[$key].routeId // empty' \
                "$STATE_FILE"
        )"

        bus_id="$(
            jq -r \
                --arg key "$schedule_key" \
                '.schedules[$key].busId // empty' \
                "$STATE_FILE"
        )"

        operating_days="$(
            jq -r \
                --arg key "$schedule_key" \
                '.schedules[$key].operatingDays // empty' \
                "$STATE_FILE"
        )"

        effective_from="$(
            jq -r \
                --arg key "$schedule_key" \
                '.schedules[$key].effectiveFrom // empty' \
                "$STATE_FILE"
        )"

        effective_until="$(
            jq -r \
                --arg key "$schedule_key" \
                '.schedules[$key].effectiveUntil // empty' \
                "$STATE_FILE"
        )"

        if [[ -z "$schedule_id" || -z "$bus_id" ]]; then
            die "Invalid schedule state: $schedule_key"
        fi

        log "Generating trips for schedule $schedule_id"

        for ((day_offset = 1; day_offset <= TRIP_HORIZON_DAYS; day_offset++)); do

            trip_date="$(date_after_days "$day_offset")"

            #
            # Outside schedule validity?
            #
            if ! date_within_range \
                "$trip_date" \
                "$effective_from" \
                "$effective_until"; then

                skipped_count=$((skipped_count + 1))
                continue
            fi

            #
            # Schedule doesn't operate on this weekday.
            #
            if ! schedule_operates_on \
                "$operating_days" \
                "$trip_date"; then

                skipped_count=$((skipped_count + 1))
                continue
            fi

            state_key="$(
                trip_state_key \
                    "$schedule_id" \
                    "$trip_date"
            )"

            trip_id="$(
                jq -r \
                    --arg key "$state_key" \
                    '.trips[$key].id // empty' \
                    "$STATE_FILE"
            )"

            if [[ -n "$trip_id" ]]; then
                log_ok \
                    "Trip exists: schedule=$schedule_id date=$trip_date"

                continue
            fi

            log "Creating trip: schedule=$schedule_id date=$trip_date"

            #
            # Determine operator from bus ownership.
            #
            local operator_id
            local operator_num

            operator_id="$(
                jq -r \
                    --arg busId "$bus_id" '
                    .buses
                    | to_entries[]
                    | select(
                        (.value.id | tostring) == $busId
                    )
                    | .value.operatorId
                    ' \
                    "$STATE_FILE"
            )"

            operator_num="$(
                jq -r \
                    --arg operatorId "$operator_id" '
                    .users.operators
                    | to_entries[]
                    | select(
                        (.value.operatorId | tostring) == $operatorId
                    )
                    | .key
                    | split("-")
                    | last
                    ' \
                    "$STATE_FILE"
            )"

            if [[ -z "$operator_num" ]]; then
                die \
                    "Unable to determine operator for schedule $schedule_id"
            fi

            use_operator_auth "$operator_num"

            response="$(
                create_trip \
                    "$schedule_id" \
                    "$trip_date"
            )"

            trip_id="$(
                echo "$response" |
                    jq -r '.id // .tripId // empty' 2>/dev/null
            )"

            if [[ -z "$trip_id" ]]; then
                log_warn \
                    "Trip creation returned no ID; checking existing trip..."

                trip_id="$(
                    find_existing_trip_id \
                        "$schedule_id" \
                        "$trip_date" ||
                    true
                )"
            fi

            if [[ -z "$trip_id" ]]; then
                die \
                    "Unable to create/recover trip: schedule=$schedule_id date=$trip_date"
            fi

            jq \
                --arg key "$state_key" \
                --arg id "$trip_id" \
                --arg scheduleId "$schedule_id" \
                --arg routeId "$route_id" \
                --arg busId "$bus_id" \
                --arg tripDate "$trip_date" \
                '
                .trips[$key] = {
                    id: ($id | tonumber),
                    scheduleId: ($scheduleId | tonumber),
                    routeId: ($routeId | tonumber),
                    busId: ($busId | tonumber),
                    tripDate: $tripDate
                }
                ' \
                "$STATE_FILE" > "${STATE_FILE}.tmp"

            mv "${STATE_FILE}.tmp" "$STATE_FILE"

            validate_trip_seats \
                "$trip_id" \
                "$bus_id"

            validate_trip_seat_mapping \
                "$trip_id" \
                "$bus_id"

            created_count=$((created_count + 1))

            log_ok \
                "Trip ready: $trip_date → trip=$trip_id"
        done

    done < <(
        jq -r '.schedules | keys[]' "$STATE_FILE"
    )

    log_ok \
        "Trips created: $created_count; dates skipped: $skipped_count"
}

PASSENGER_COUNT=20
SEED_PASSENGER_PASSWORD="Passenger@12345"

passenger_email() {
    local number="$1"
    printf 'passenger%02d@seed.local' "$number"
}

passenger_name() {
    local number="$1"
    printf 'Seed Passenger %02d' "$number"
}

passenger_phone() {
    local number="$1"
    printf '+91980000%04d' "$number"
}

seed_passengers() {
    log "Seeding passengers..."

    local number
    local email
    local name
    local phone

    local key
    local user_id
    local response

    for ((number = 1; number <= PASSENGER_COUNT; number++)); do

        email="$(passenger_email "$number")"
        name="$(passenger_name "$number")"
        phone="$(passenger_phone "$number")"

        key="${SEED_PREFIX}-passenger-${number}"

        user_id="$(
            jq -r \
                --arg key "$key" \
                '.users.passengers[$key].userId // empty' \
                "$STATE_FILE"
        )"

        if [[ -n "$user_id" ]]; then
            log_ok "Passenger exists: $email ($user_id)"
            continue
        fi

        log "Registering passenger: $email"

        response="$(
            api_post "/auth/register" \
                "$(
                    jq -n \
                        --arg email "$email" \
                        --arg password "$SEED_PASSENGER_PASSWORD" \
                        --arg firstName "$name" \
                        --arg phone "$phone" \
                        '{
                            userType: "PASSENGER",
                            email: $email,
                            password: $password,
                            firstName: $firstName,
                            phone: $phone
                        }'
                )"
        )" || true

        user_id="$(
            echo "$response" |
                jq -r '.id // .userId // .user?.id // empty' \
                2>/dev/null
        )"

        if [[ -z "$user_id" ]]; then
            die "Unable to create passenger: $email"
        fi

        jq \
            --arg key "$key" \
            --arg userId "$user_id" \
            --arg email "$email" \
            --arg password "$SEED_PASSENGER_PASSWORD" \
            --arg name "$name" \
            --arg phone "$phone" \
            '
            .users.passengers[$key] = {
                userId: ($userId | tonumber),
                email: $email,
                password: $password,
                name: $name,
                phone: $phone
            }
            ' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        log_ok "$email → $user_id"
    done

    log_ok "Passengers seeded: $PASSENGER_COUNT"
}

get_available_trip_seats() {
    local trip_id="$1"

    api_get "/trip-seats/trip/${trip_id}" |
        jq -r '
            if type == "array" then .
            elif .content then .content
            else []
            end
            | .[]
            | select(.status == "AVAILABLE")
            | (.id // .tripSeatId)
        '
}

pick_available_seats() {
    local trip_id="$1"
    local count="$2"

    get_available_trip_seats "$trip_id" |
        head -n "$count"
}

find_existing_seat_hold_id() {
    local trip_id="$1"
    local passenger_id="$2"

    local response

    response="$(api_get "/seat-holds")" || return 1

    echo "$response" |
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
            )
            | select(
                ((.userId // .user?.id // .passengerId | tostring)
                 == $passengerId)
            )
            | (.id // .seatHoldId)
        ' |
        head -n 1
}

TARGET_SEAT_HOLDS=10

seed_seat_holds() {
    log "Seeding seat holds..."

    local created=0
    local trip_key
    local trip_id
    local passenger_num
    local passenger_id
    local hold_key

    while read -r trip_key; do

        (( created >= TARGET_SEAT_HOLDS )) && break

        trip_id="$(
            jq -r \
                --arg key "$trip_key" \
                '.trips[$key].id // empty' \
                "$STATE_FILE"
        )"

        [[ -z "$trip_id" ]] && continue

        passenger_num=$((created % PASSENGER_COUNT + 1))

        passenger_id="$(
            jq -r \
                --arg key "${SEED_PREFIX}-passenger-${passenger_num}" \
                '.users.passengers[$key].userId // empty' \
                "$STATE_FILE"
        )"

        use_passenger_auth "$passenger_num"

        mapfile -t seat_ids < <(
            pick_available_seats "$trip_id" 1
        )

        if (( ${#seat_ids[@]} == 0 )); then
            log_warn "No available seat for trip $trip_id"
            continue
        fi

        hold_key="${SEED_PREFIX}-hold-${created}"

        log "Holding seat ${seat_ids[0]} on trip $trip_id"

        response="$(
            api_post "/seat-holds" \
                "$(
                    jq -n \
                        --arg tripId "$trip_id" \
                        --arg seatId "${seat_ids[0]}" \
                        '{
                            tripId: ($tripId | tonumber),
                            seatIds: [($seatId | tonumber)]
                        }'
                )"
        )" || true

        local hold_id

        hold_id="$(
            echo "$response" |
                jq -r '.id // .seatHoldId // empty' 2>/dev/null
        )"

        if [[ -z "$hold_id" ]]; then
            die "Unable to create seat hold for trip $trip_id"
        fi

        jq \
            --arg key "$hold_key" \
            --arg id "$hold_id" \
            --arg tripId "$trip_id" \
            --arg passengerId "$passenger_id" \
            --arg seatId "${seat_ids[0]}" \
            '
            .seatHolds[$key] = {
                id: ($id | tonumber),
                tripId: ($tripId | tonumber),
                passengerId: ($passengerId | tonumber),
                seatIds: [($seatId | tonumber)]
            }
            ' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        created=$((created + 1))

        log_ok "Hold $hold_id created"

    done < <(
        jq -r '.trips | keys[]' "$STATE_FILE"
    )

    log_ok "Seat holds created: $created"
}

get_booking_locations() {
    local route_id="$1"
    local scenario="$2"

    local stops

    stops="$(get_route_stops "$route_id")"

    case "$scenario" in
        FULL_ROUTE)
            echo "$stops" |
                jq -c '[.[0], .[-1]]'
            ;;

        SHORT_ROUTE)
            echo "$stops" |
                jq -c '
                    if length >= 3
                    then [.[1], .[2]]
                    else [.[0], .[-1]]
                    end
                '
            ;;

        *)
            echo "$stops" |
                jq -c '[.[0], .[-1]]'
            ;;
    esac
}

TARGET_BOOKINGS=50

seed_bookings() {
    log "Seeding bookings..."

    local created=0
    local trip_key
    local trip_id
    local route_id

    local passenger_num
    local passenger_id

    local hold_key
    local hold_id

    while read -r trip_key; do

        (( created >= TARGET_BOOKINGS )) && break

        trip_id="$(
            jq -r \
                --arg key "$trip_key" \
                '.trips[$key].id // empty' \
                "$STATE_FILE"
        )"

        route_id="$(
            jq -r \
                --arg key "$trip_key" \
                '.trips[$key].routeId // empty' \
                "$STATE_FILE"
        )"

        [[ -z "$trip_id" || -z "$route_id" ]] && continue

        passenger_num=$((created % PASSENGER_COUNT + 1))

        passenger_id="$(
            jq -r \
                --arg key "${SEED_PREFIX}-passenger-${passenger_num}" \
                '.users.passengers[$key].userId // empty' \
                "$STATE_FILE"
        )"

        use_passenger_auth "$passenger_num"

        #
        # Prefer a newly created hold for this passenger/trip.
        #
        hold_key="$(
            jq -r \
                --arg tripId "$trip_id" \
                --arg passengerId "$passenger_id" '
                .seatHolds
                | to_entries[]
                | select(
                    (.value.tripId | tostring) == $tripId
                    and
                    (.value.passengerId | tostring) == $passengerId
                )
                | .key
                ' \
                "$STATE_FILE" |
                head -n 1
        )"

        if [[ -z "$hold_key" ]]; then
            continue
        fi

        hold_id="$(
            jq -r \
                --arg key "$hold_key" \
                '.seatHolds[$key].id' \
                "$STATE_FILE"
        )"

        locations="$(
            get_booking_locations "$route_id" \
                "$(
                    if (( created % 3 == 0 )); then
                        echo SHORT_ROUTE
                    else
                        echo FULL_ROUTE
                    fi
                )"
        )"

        pickup_location_id="$(
            echo "$locations" | jq -r '.[0].locationId // .[0].location?.id'
        )"

        drop_location_id="$(
            echo "$locations" | jq -r '.[1].locationId // .[1].location?.id'
        )"

        response="$(
            api_post "/bookings" \
                "$(
                    jq -n \
                        --arg tripId "$trip_id" \
                        --arg holdId "$hold_id" \
                        --arg pickup "$pickup_location_id" \
                        --arg drop "$drop_location_id" \
                        '{
                            tripId: ($tripId | tonumber),
                            seatHoldIds: [($holdId | tonumber)],
                            pickupLocationId: ($pickup | tonumber),
                            dropLocationId: ($drop | tonumber)
                        }'
                )"
        )" || true

        booking_id="$(
            echo "$response" |
                jq -r '.id // .bookingId // empty' 2>/dev/null
        )"

        if [[ -z "$booking_id" ]]; then
            log_warn "Booking creation failed for trip $trip_id"
            continue
        fi

        booking_key="${SEED_PREFIX}-booking-${created}"

        jq \
            --arg key "$booking_key" \
            --arg id "$booking_id" \
            --arg tripId "$trip_id" \
            --arg passengerId "$passenger_id" \
            --arg holdId "$hold_id" \
            --arg pickup "$pickup_location_id" \
            --arg drop "$drop_location_id" \
            '
            .bookings[$key] = {
                id: ($id | tonumber),
                tripId: ($tripId | tonumber),
                passengerId: ($passengerId | tonumber),
                seatHoldIds: [($holdId | tonumber)],
                pickupLocationId: ($pickup | tonumber),
                dropLocationId: ($drop | tonumber)
            }
            ' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        created=$((created + 1))

        log_ok "Booking $booking_id created"

    done < <(
        jq -r '.trips | keys[]' "$STATE_FILE"
    )

    log_ok "Bookings created: $created"
}

PAYMENT_METHODS=(
    "UPI"
    "CARD"
    "NET_BANKING"
    "WALLET"
)

seed_payments() {
    log "Processing payments..."

    local index=0
    local booking_key

    local booking_id
    local passenger_id
    local passenger_num

    local payment_method
    local response
    local payment_id

    for booking_key in $(
        jq -r '.bookings | keys[]' "$STATE_FILE"
    ); do

        index=$((index + 1))

        booking_id="$(
            jq -r \
                --arg key "$booking_key" \
                '.bookings[$key].id' \
                "$STATE_FILE"
        )"

        passenger_id="$(
            jq -r \
                --arg key "$booking_key" \
                '.bookings[$key].passengerId' \
                "$STATE_FILE"
        )"

        passenger_num="$(
            jq -r \
                --arg passengerId "$passenger_id" '
                .users.passengers
                | to_entries[]
                | select(
                    (.value.userId | tostring) == $passengerId
                )
                | .key
                | split("-")
                | last
                ' \
                "$STATE_FILE"
        )"

        use_passenger_auth "$passenger_num"

        payment_method="$(
            echo "${PAYMENT_METHODS[$(((index - 1) % ${#PAYMENT_METHODS[@]}))]}"
        )"

        log "Paying booking $booking_id using $payment_method"

        response="$(
            api_post "/payments" \
                "$(
                    jq -n \
                        --arg bookingId "$booking_id" \
                        --arg paymentMethod "$payment_method" \
                        '{
                            bookingId: ($bookingId | tonumber),
                            paymentMethod: $paymentMethod
                        }'
                )"
        )" || true

        payment_id="$(
            echo "$response" |
                jq -r '.id // .paymentId // empty' 2>/dev/null
        )"

        if [[ -z "$payment_id" ]]; then
            log_warn "Payment failed for booking $booking_id"
            continue
        fi

        jq \
            --arg key "${SEED_PREFIX}-payment-${index}" \
            --arg id "$payment_id" \
            --arg bookingId "$booking_id" \
            --arg method "$payment_method" \
            '
            .payments[$key] = {
                id: ($id | tonumber),
                bookingId: ($bookingId | tonumber),
                paymentMethod: $method
            }
            ' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        log_ok "Payment $payment_id → booking $booking_id"
    done
}

find_ticket_by_booking() {
    local booking_id="$1"

    api_get "/tickets/booking/${booking_id}" |
        jq -r '.id // .ticketId // empty'
}

validate_tickets() {
    log "Validating generated tickets..."

    local booking_key
    local booking_id
    local ticket_id

    for booking_key in $(
        jq -r '.bookings | keys[]' "$STATE_FILE"
    ); do

        booking_id="$(
            jq -r \
                --arg key "$booking_key" \
                '.bookings[$key].id' \
                "$STATE_FILE"
        )"

        ticket_id="$(
            find_ticket_by_booking "$booking_id" || true
        )"

        if [[ -z "$ticket_id" ]]; then
            log_warn \
                "No ticket found for booking $booking_id"

            continue
        fi

        jq \
            --arg key "${SEED_PREFIX}-ticket-${booking_id}" \
            --arg id "$ticket_id" \
            --arg bookingId "$booking_id" \
            '
            .tickets[$key] = {
                id: ($id | tonumber),
                bookingId: ($bookingId | tonumber)
            }
            ' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        log_ok \
            "Ticket $ticket_id verified for booking $booking_id"
    done
}

CANCELLATION_PERCENT=10

seed_cancellations() {
    log "Creating cancellation scenarios..."

    local index=0
    local booking_key
    local booking_id

    for booking_key in $(
        jq -r '.bookings | keys[]' "$STATE_FILE"
    ); do

        index=$((index + 1))

        #
        # Cancel approximately 10%.
        #
        if (( index % 10 != 0 )); then
            continue
        fi

        booking_id="$(
            jq -r \
                --arg key "$booking_key" \
                '.bookings[$key].id' \
                "$STATE_FILE"
        )"

        passenger_id="$(
            jq -r \
                --arg key "$booking_key" \
                '.bookings[$key].passengerId' \
                "$STATE_FILE"
        )"

        passenger_num="$(
            jq -r \
                --arg passengerId "$passenger_id" '
                .users.passengers
                | to_entries[]
                | select(
                    (.value.userId | tostring) == $passengerId
                )
                | .key
                | split("-")
                | last
                ' \
                "$STATE_FILE"
        )"

        use_passenger_auth "$passenger_num"

        log "Cancelling booking $booking_id"

        response="$(
            api_post "/bookings/${booking_id}/cancel" "{}"
        )" || true

        if [[ -z "$response" ]]; then
            log_warn "Cancellation failed: booking $booking_id"
            continue
        fi

        jq \
            --arg key "$booking_key" \
            '.bookings[$key].cancelled = true' \
            "$STATE_FILE" > "${STATE_FILE}.tmp"

        mv "${STATE_FILE}.tmp" "$STATE_FILE"

        log_ok "Booking cancelled: $booking_id"
    done
}

print_summary() {
    echo
    echo "========================================"
    echo "          SEED SUMMARY"
    echo "========================================"

    printf "Passengers     : %s\n" \
        "$(jq '.users.passengers | length' "$STATE_FILE")"

    printf "Operators      : %s\n" \
        "$(jq '.users.operators | length' "$STATE_FILE")"

    printf "Locations      : %s\n" \
        "$(jq '.locations | length' "$STATE_FILE")"

    printf "Routes         : %s\n" \
        "$(jq '.routes | length' "$STATE_FILE")"

    printf "Route Stops    : %s\n" \
        "$(jq '.routeStops | length' "$STATE_FILE")"

    printf "Buses          : %s\n" \
        "$(jq '.buses | length' "$STATE_FILE")"

    printf "Seats          : %s\n" \
        "$(jq '.seats | length' "$STATE_FILE")"

    printf "Schedules      : %s\n" \
        "$(jq '.schedules | length' "$STATE_FILE")"

    printf "Trips          : %s\n" \
        "$(jq '.trips | length' "$STATE_FILE")"

    printf "Seat Holds     : %s\n" \
        "$(jq '.seatHolds | length' "$STATE_FILE")"

    printf "Bookings       : %s\n" \
        "$(jq '.bookings | length' "$STATE_FILE")"

    printf "Payments       : %s\n" \
        "$(jq '.payments | length' "$STATE_FILE")"

    printf "Tickets        : %s\n" \
        "$(jq '.tickets | length' "$STATE_FILE")"

    echo "========================================"
}

location_id_by_name() {
    local name="$1"

    local i
    local entry
    local location_name
    local city

    for ((i = 0; i < ${#LOCATIONS[@]}; i++)); do
        entry="${LOCATIONS[$i]}"

        IFS='|' read -r \
            location_name \
            city \
            _state \
            _country \
            _latitude \
            _longitude <<< "$entry"

        if [[ "$location_name" == "$name" ]]; then
            jq -r \
                --arg key "${SEED_PREFIX}-location-$((i + 1))" \
                '.locations[$key] // empty' \
                "$STATE_FILE"

            return 0
        fi
    done

    return 1
}

###############################################################################
# Main
###############################################################################

main() {
    check_requirements
    validate_config
    acquire_lock
    initialize_state

    load_env

    use_admin_auth

    seed_locations
    seed_routes
    seed_route_stops

    seed_operators
    seed_buses
    seed_schedules
    seed_trips

    # Transactions
    seed_seat_holds
    seed_bookings
    seed_payments
    validate_tickets

    # Edge cases
    seed_cancellations

    # Final report
    print_summary


    log_ok "Location seeding completed."

    log "Bus Booking API synthetic seeder"
    log "API:   $API_BASE_URL"
    log "State: $STATE_FILE"

    # Stages will be added here incrementally.
}

main "$@"