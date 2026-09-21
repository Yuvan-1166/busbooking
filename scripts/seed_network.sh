#!/usr/bin/env bash
set -Eeuo pipefail

###############################################################################
# Bus Booking API - Real Network Seeder
#
# Purpose:
#   Populate a local/dev Bus Booking Spring Boot API with REAL transport
#   topology data only:
#
#       * Admin accounts  (roles + credentials, used for all writes)
#       * Locations       (the master list of bus stops/depots)
#       * Routes          (both OUTBOUND and RETURN = round trips)
#       * Route stops     (ordered stops with distance + timing offsets)
#
#   This script deliberately does NOT create passengers, operators, buses,
#   seats, schedules, trips, bookings or any other user/shop data.
#
# Requirements:
#   - bash
#   - curl
#   - jq
#   - awk
#
# Authentication:
#   Admin credentials are read from ENV_FILE (default: .env):
#       ADMIN_USERNAME=...
#       ADMIN_PASSWORD=...
#
#   The application bootstraps the first admin during startup
#   (common/config/AdminInitializer.java), so this script only verifies that
#   the admin exists, records it in state, and uses it to author all writes.
###############################################################################

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

###############################################################################
# Configuration
###############################################################################

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
ENV_FILE="${ENV_FILE:-"$SCRIPT_DIR/.env"}"

SEED_PREFIX="${SEED_PREFIX:-real}"
STATE_DIR="${STATE_DIR:-"$SCRIPT_DIR/.seed"}"
STATE_FILE="${STATE_FILE:-"$STATE_DIR/state.network.json"}"
LOCK_DIR="${LOCK_DIR:-"$STATE_DIR/.lock.network"}"

ROUND_TRIP_ROUTES="${ROUND_TRIP_ROUTES:-true}"

HTTP_TIMEOUT="${HTTP_TIMEOUT:-30}"

# Average service speed used to derive arrival offsets from distances (km/h).
AVERAGE_SPEED_KMPH="${AVERAGE_SPEED_KMPH:-45}"

# Dwell time at intermediate stops (minutes).
STOP_DWELL_MINUTES="${STOP_DWELL_MINUTES:-10}"

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
    require_command awk
    require_command sort
    require_command head
}

validate_config() {
    [[ -n "$API_BASE_URL" ]] || die "API_BASE_URL cannot be empty."
    [[ -n "$SEED_PREFIX" ]] || die "SEED_PREFIX cannot be empty."
    [[ "$SEED_PREFIX" =~ ^[a-zA-Z0-9_-]+$ ]] ||
        die "SEED_PREFIX contains invalid characters: $SEED_PREFIX"

    [[ "$ROUND_TRIP_ROUTES" == "true" || "$ROUND_TRIP_ROUTES" == "false" ]] ||
        die "ROUND_TRIP_ROUTES must be true or false."

    [[ "$AVERAGE_SPEED_KMPH" =~ ^[0-9]+$ ]] && (( AVERAGE_SPEED_KMPH > 0 )) ||
        die "AVERAGE_SPEED_KMPH must be a positive integer."

    [[ "$STOP_DWELL_MINUTES" =~ ^[0-9]+$ ]] ||
        die "STOP_DWELL_MINUTES must be a non-negative integer."
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
  "admins": {},
  "locations": {},
  "routes": {},
  "routeStops": {}
}
EOF
    fi

    jq empty "$STATE_FILE" >/dev/null 2>&1 ||
        die "Invalid state file: $STATE_FILE"

    local tmp="${STATE_FILE}.tmp.$$"
    jq '
      .version = (.version // 1) |
      .seedPrefix = (.seedPrefix // "real") |
      .admins = (.admins // {}) |
      .locations = (.locations // {}) |
      .routes = (.routes // {}) |
      .routeStops = (.routeStops // {})
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

###############################################################################
# Admins
###############################################################################

seed_admins() {
    log "Verifying admin account..."
    use_admin_auth

    api_get "/users/me" ||
        die "Unable to fetch admin profile (HTTP $API_STATUS): $API_RESPONSE"

    local admin_id admin_email
    admin_id="$(jq -r '.id // .userId // empty' <<< "$API_RESPONSE")"
    admin_email="$(jq -r '.email // empty' <<< "$API_RESPONSE")"

    [[ -n "$admin_id" && -n "$admin_email" ]] ||
        die "Admin profile did not include id/email: $API_RESPONSE"

    state_set_json ".admins[\"$SEED_PREFIX-admin\"]" "$(
        jq -cn \
            --arg id "$admin_id" \
            --arg email "$admin_email" \
            --arg username "$ADMIN_USERNAME" '{
                id: ($id | tonumber),
                email: $email,
                username: $username
            }'
    )"

    log_ok "Admin ready: $admin_email (id=$admin_id)"
}

###############################################################################
# Master location / stop data
#
# The application has a single master list of stops (the `locations` table).
# RouteStops point back to these locations, so "stops" == locations here.
###############################################################################

LOCATIONS=(
    "Chennai Central Bus Stand (CMBT)|Chennai|Tamil Nadu|India|13.0674|80.2134"
    "Tambaram|Chennai|Tamil Nadu|India|12.9249|80.1000"
    "Chengalpattu|Chengalpattu|Tamil Nadu|India|12.6906|79.9769"
    "Tindivanam|Tindivanam|Tamil Nadu|India|12.2375|79.6558"
    "Pondicherry New Bus Stand|Puducherry|Puducherry|India|11.9416|79.8083"
    "Villupuram|Villupuram|Tamil Nadu|India|11.9401|79.4861"
    "Ulundurpettai|Ulundurpettai|Tamil Nadu|India|11.6793|79.2263"
    "Virudhachalam|Virudhachalam|Tamil Nadu|India|11.5147|79.3207"
    "Ariyalur|Ariyalur|Tamil Nadu|India|11.1397|79.0747"
    "Tiruchirappalli Chathiram Bus Stand|Tiruchirappalli|Tamil Nadu|India|10.8008|78.6955"
    "Dindigul|Dindigul|Tamil Nadu|India|10.3544|77.9800"
    "Madurai Mattuthavani Bus Terminus|Madurai|Tamil Nadu|India|9.9588|78.1067"
    "Kanchipuram|Kanchipuram|Tamil Nadu|India|12.8342|79.7038"
    "Vellore New Bus Stand|Vellore|Tamil Nadu|India|12.9298|79.1273"
    "Ambur|Ambur|Tamil Nadu|India|12.7917|78.7043"
    "Vaniyambadi|Vaniyambadi|Tamil Nadu|India|12.6886|78.6345"
    "Krishnagiri|Krishnagiri|Tamil Nadu|India|12.5186|78.2137"
    "Dharmapuri|Dharmapuri|Tamil Nadu|India|12.1230|78.1590"
    "Hosur|Hosur|Tamil Nadu|India|12.7409|77.8253"
    "Bengaluru Kempegowda Majestic|Bengaluru|Karnataka|India|12.9771|77.5725"
    "Salem Central Bus Stand|Salem|Tamil Nadu|India|11.6643|78.1460"
    "Erode Central Bus Stand|Erode|Tamil Nadu|India|11.3410|77.7172"
    "Coimbatore Gandhipuram Bus Stand|Coimbatore|Tamil Nadu|India|11.0168|76.9558"
    "Mettupalayam|Mettupalayam|Tamil Nadu|India|11.2990|76.9400"
    "Coonoor|Coonoor|Tamil Nadu|India|11.3530|76.7950"
    "Ooty (Udhagamandalam)|Udhagamandalam|Tamil Nadu|India|11.4064|76.6932"
    "Pollachi|Pollachi|Tamil Nadu|India|10.6579|77.0086"
    "Palani|Palani|Tamil Nadu|India|10.4505|77.5163"
    "Theni|Theni|Tamil Nadu|India|10.0104|77.4766"
    "Periyakulam|Periyakulam|Tamil Nadu|India|10.1216|77.5285"
    "Usilampatti|Usilampatti|Tamil Nadu|India|9.9667|77.8000"
    "Virudhunagar|Virudhunagar|Tamil Nadu|India|9.5860|77.9613"
    "Sivakasi|Sivakasi|Tamil Nadu|India|9.4530|77.8060"
    "Tirunelveli Junction Bus Stand|Tirunelveli|Tamil Nadu|India|8.7139|77.7567"
    "Nagercoil|Nagercoil|Tamil Nadu|India|8.1833|77.4133"
    "Kanyakumari|Kanyakumari|Tamil Nadu|India|8.0883|77.5385"
    "Thoothukudi (Tuticorin)|Thoothukudi|Tamil Nadu|India|8.7642|78.1348"
    "Kovilpatti|Kovilpatti|Tamil Nadu|India|9.1759|77.8716"
    "Manamadurai|Manamadurai|Tamil Nadu|India|9.7000|78.4661"
    "Paramakudi|Paramakudi|Tamil Nadu|India|9.5464|78.5930"
    "Ramanathapuram|Ramanathapuram|Tamil Nadu|India|9.3710|78.8327"
    "Rameswaram|Rameswaram|Tamil Nadu|India|9.2876|79.3129"
    "Pudukkottai|Pudukkottai|Tamil Nadu|India|10.3833|78.8216"
    "Karaikudi|Karaikudi|Tamil Nadu|India|10.0730|78.7830"
    "Sivagangai|Sivagangai|Tamil Nadu|India|9.8469|78.4806"
    "Aruppukkottai|Aruppukkottai|Tamil Nadu|India|9.5054|78.0951"
    "Thanjavur New Bus Stand|Thanjavur|Tamil Nadu|India|10.7870|79.1378"
    "Kumbakonam|Kumbakonam|Tamil Nadu|India|10.9602|79.3780"
    "Cuddalore|Cuddalore|Tamil Nadu|India|11.7480|79.7714"
    "Chidambaram|Chidambaram|Tamil Nadu|India|11.3993|79.6917"
    "Sirkazhi|Sirkazhi|Tamil Nadu|India|11.2275|79.7380"
    "Mayiladuthurai|Mayiladuthurai|Tamil Nadu|India|11.1020|79.6530"
    "Nagapattinam|Nagapattinam|Tamil Nadu|India|10.7672|79.8449"
    "Namakkal|Namakkal|Tamil Nadu|India|11.2200|78.1657"
    "Karur|Karur|Tamil Nadu|India|10.9602|78.0860"
    "Tiruppur|Tiruppur|Tamil Nadu|India|11.1085|77.3411"
)

# Route definitions.
#
# Format: "Route Name|Stop1>Stop2>Stop3|distance1,distance2,distance3"
#
# Distances are one-way, cumulative kilometres from the first stop along the
# real highway corridor. The matching RETURN route is generated automatically
# by reversing the stop order and mirroring the distances (total - cumulative
# value).
ROUTE_DEFINITIONS=(
    # East Coast / NH32
    "Chennai - Pondicherry|Chennai Central Bus Stand (CMBT)>Tambaram>Chengalpattu>Tindivanam>Pondicherry New Bus Stand|0,25,55,105,155"
    "Chennai - Trichy|Chennai Central Bus Stand (CMBT)>Tambaram>Chengalpattu>Tindivanam>Villupuram>Ulundurpettai>Virudhachalam>Ariyalur>Tiruchirappalli Chathiram Bus Stand|0,25,55,105,155,195,225,258,335"
    "Chennai - Madurai|Chennai Central Bus Stand (CMBT)>Tambaram>Chengalpattu>Tindivanam>Villupuram>Ulundurpettai>Virudhachalam>Ariyalur>Tiruchirappalli Chathiram Bus Stand>Dindigul>Madurai Mattuthavani Bus Terminus|0,25,55,105,155,195,225,258,335,401,462"
    "Pondicherry - Nagapattinam|Pondicherry New Bus Stand>Cuddalore>Chidambaram>Sirkazhi>Mayiladuthurai>Nagapattinam|0,40,75,100,115,145"
    "Trichy - Chidambaram|Tiruchirappalli Chathiram Bus Stand>Ariyalur>Chidambaram|0,62,134"

    # NH44 (Bengaluru - Salem - Madurai spine)
    "Chennai - Bengaluru|Chennai Central Bus Stand (CMBT)>Kanchipuram>Vellore New Bus Stand>Ambur>Vaniyambadi>Krishnagiri>Hosur>Bengaluru Kempegowda Majestic|0,75,140,185,205,260,310,345"
    "Chennai - Coimbatore|Chennai Central Bus Stand (CMBT)>Kanchipuram>Vellore New Bus Stand>Ambur>Vaniyambadi>Krishnagiri>Dharmapuri>Salem Central Bus Stand>Erode Central Bus Stand>Coimbatore Gandhipuram Bus Stand|0,75,145,190,210,263,293,350,420,510"
    "Trichy - Madurai|Tiruchirappalli Chathiram Bus Stand>Dindigul>Madurai Mattuthavani Bus Terminus|0,90,156"
    "Salem - Madurai|Salem Central Bus Stand>Namakkal>Karur>Dindigul>Madurai Mattuthavani Bus Terminus|0,50,95,160,226"

    # NH544 / western corridor
    "Salem - Coimbatore|Salem Central Bus Stand>Erode Central Bus Stand>Coimbatore Gandhipuram Bus Stand|0,65,175"
    "Coimbatore - Trichy|Coimbatore Gandhipuram Bus Stand>Tiruppur>Karur>Tiruchirappalli Chathiram Bus Stand|0,55,145,223"
    "Coimbatore - Madurai|Coimbatore Gandhipuram Bus Stand>Pollachi>Palani>Dindigul>Madurai Mattuthavani Bus Terminus|0,40,110,165,231"
    "Madurai - Theni|Madurai Mattuthavani Bus Terminus>Usilampatti>Periyakulam>Theni|0,35,60,78"

    # Nilgiris (NH181)
    "Coimbatore - Ooty|Coimbatore Gandhipuram Bus Stand>Mettupalayam>Coonoor>Ooty (Udhagamandalam)|0,36,67,88"

    # NH83 / Cauvery delta
    "Trichy - Kumbakonam|Tiruchirappalli Chathiram Bus Stand>Thanjavur New Bus Stand>Kumbakonam|0,62,97"

    # NH87 (Rameswaram corridor)
    "Madurai - Rameswaram|Madurai Mattuthavani Bus Terminus>Manamadurai>Paramakudi>Ramanathapuram>Rameswaram|0,45,76,122,170"

    # NH944 / southern corridor
    "Madurai - Kanyakumari|Madurai Mattuthavani Bus Terminus>Virudhunagar>Sivakasi>Tirunelveli Junction Bus Stand>Nagercoil>Kanyakumari|0,55,91,138,226,247"
    "Tirunelveli - Thoothukudi|Tirunelveli Junction Bus Stand>Kovilpatti>Thoothukudi (Tuticorin)|0,48,88"

    # Southern region (Trichy - Tuticorin via Ramanathapuram side)
    "Trichy - Thoothukudi|Tiruchirappalli Chathiram Bus Stand>Pudukkottai>Karaikudi>Sivagangai>Aruppukkottai>Thoothukudi (Tuticorin)|0,55,113,153,200,290"
)

###############################################################################
# Locations
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
    log "Seeding locations (stops master list)..."

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
# Routes (outbound + return round trips)
###############################################################################

# split_route DEFINITION -> sets ROUTE_NAME, ROUTE_STOP_CSV, ROUTE_DIST_CSV
split_route() {
    local definition="$1"
    IFS='|' read -r ROUTE_NAME ROUTE_STOP_CSV ROUTE_DIST_CSV <<< "$definition"
}

# reverse route name "A - B" -> "B - A"
reverse_route_name() {
    local name="$1"
    local forward reverse

    forward="${name%% - *}"
    reverse="${name##* - }"
    printf '%s - %s' "$reverse" "$forward"
}

# Given the outbound stop/dist CSV, print the return stop CSV and return dist CSV
# in two global variables: RETURN_STOP_CSV, RETURN_DIST_CSV
build_return_route() {
    local stop_csv="$1"
    local dist_csv="$2"

    local -a stops out_dists ret_dists
    local total

    IFS='>' read -ra stops <<< "$stop_csv"
    IFS=',' read -ra out_dists <<< "$dist_csv"

    total="${out_dists[${#out_dists[@]} - 1]}"

    local -a ret_stops
    local i inverse

    for ((i = 0; i < ${#stops[@]}; i++)); do
        inverse=$(( ${#stops[@]} - 1 - i ))
        ret_stops[$i]="${stops[$inverse]}"
        ret_dists[$i]=$(( total - out_dists[$inverse] ))
    done

    local IFS
    IFS='>'
    RETURN_STOP_CSV="${ret_stops[*]}"
    IFS=','
    RETURN_DIST_CSV="${ret_dists[*]}"
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

create_route() {
    local state_key="$1"
    local name="$2"

    local route_id
    route_id="$(state_get ".routes[\"$state_key\"].id")"

    if [[ -n "$route_id" ]]; then
        log_ok "Route exists: $name ($route_id)"
        printf '%s\n' "$route_id"
        return 0
    fi

    api_post "/routes" "$(
        jq -cn --arg name "$name" '{
            name: $name,
            status: "ACTIVE"
        }'
    )"

    if (( API_STATUS >= 200 && API_STATUS < 300 )); then
        route_id="$(jq -r '.id // .routeId // empty' <<< "$API_RESPONSE")"
    elif (( API_STATUS == 409 )); then
        route_id="$(find_existing_route_id "$name" || true)"
    else
        die "Route creation failed: $name (HTTP $API_STATUS): $API_RESPONSE"
    fi

    [[ -n "$route_id" ]] ||
        die "Unable to create/recover route: $name"

    state_set_json ".routes[\"$state_key\"]" "$(
        jq -cn \
            --arg id "$route_id" \
            --arg name "$name" '{
                id: ($id | tonumber),
                name: $name
            }'
    )"

    log_ok "Route created: $name → $route_id"
    printf '%s\n' "$route_id"
}

seed_routes() {
    log "Seeding routes (round trips)..."

    local index=0
    local definition
    local fwd_key ret_key
    local fwd_name ret_name
    local fwd_id ret_id

    for definition in "${ROUTE_DEFINITIONS[@]}"; do
        index=$((index + 1))
        split_route "$definition"

        fwd_key="$SEED_PREFIX-route-$index-fwd"
        fwd_name="$ROUTE_NAME"
        fwd_id="$(create_route "$fwd_key" "$fwd_name")"

        if [[ "$ROUND_TRIP_ROUTES" == "true" ]]; then
            ret_key="$SEED_PREFIX-route-$index-ret"
            ret_name="$(reverse_route_name "$ROUTE_NAME")"
            ret_id="$(create_route "$ret_key" "$ret_name")"
        fi
    done

    log_ok "Routes seeded."
}

###############################################################################
# Route stops
###############################################################################

# arrival_offset_km KM -> prints arrival offset minutes at AVERAGE_SPEED_KMPH
arrival_offset_km() {
    local km="$1"
    awk -v km="$km" -v speed="$AVERAGE_SPEED_KMPH" 'BEGIN {
        if (km == 0) print 0;
        else print int((km / speed) * 60 + 0.999999);
    }'
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

    get_route_stops "$route_id" >/dev/null || return 1

    jq -r \
        --arg locationId "$location_id" \
        --argjson stopOrder "$stop_order" '
        .[]
        | select(
            ((.locationId // .location?.id // empty | tostring) == $locationId)
            and
            ((.stopOrder // -1) == $stopOrder)
        )
        | (.id // .routeStopId // empty)
        ' <<< "$API_RESPONSE" |
        head -n 1
}

create_route_stops() {
    local state_route_key="$1"
    local route_id="$2"
    local stop_csv="$3"
    local dist_csv="$4"

    local -a stops distances
    local stop_index stop_name distance
    local location_id arrival_offset departure_offset
    local key

    IFS='>' read -ra stops <<< "$stop_csv"
    IFS=',' read -ra distances <<< "$dist_csv"

    (( ${#stops[@]} == ${#distances[@]} )) ||
        die "Stop/distance count mismatch for route $route_id"

    for ((stop_index = 0; stop_index < ${#stops[@]}; stop_index++)); do
        stop_name="${stops[$stop_index]}"
        distance="${distances[$stop_index]}"

        location_id="$(location_id_by_name "$stop_name" || true)"
        [[ -n "$location_id" ]] ||
            die "Location not found for route stop: $stop_name"

        arrival_offset="$(arrival_offset_km "$distance")"
        if (( stop_index == 0 )); then
            arrival_offset=0
            departure_offset="$STOP_DWELL_MINUTES"
        elif (( stop_index == ${#stops[@]} - 1 )); then
            departure_offset="$arrival_offset"
        else
            departure_offset=$(( arrival_offset + STOP_DWELL_MINUTES ))
        fi

        key="$state_route_key-stop-$((stop_index + 1))"

        local state_stop_id
        state_stop_id="$(state_get ".routeStops[\"$key\"]")"
        if [[ "$state_stop_id" =~ ^[0-9]+$ ]]; then
            log_ok "Route stop exists in state: $stop_name ($state_stop_id)"
            continue
        fi

        # Recover first from the API in case a previous run was interrupted
        # after the server created the stop but before state was updated.
        local stop_id
        stop_id="$(find_existing_route_stop_id "$route_id" "$location_id" "$((stop_index + 1))" || true)"
        if [[ -n "$stop_id" ]]; then
            state_set ".routeStops[\"$key\"]" "$stop_id"
            log_ok "Recovered route stop: $stop_name ($stop_id)"
            continue
        fi

        log "  Adding stop: $stop_name | order=$((stop_index + 1)) | dist=${distance}km"

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
            die "Route stop creation failed: $stop_name (HTTP $API_STATUS): $API_RESPONSE"
        fi

        [[ -n "$stop_id" ]] ||
            die "Unable to create/recover route stop: $stop_name"

        state_set ".routeStops[\"$key\"]" "$stop_id"
        log_ok "$stop_name → $stop_id"
    done
}

seed_route_stops() {
    log "Seeding route stops..."

    local index=0
    local definition
    local fwd_key ret_key
    local fwd_id ret_id

    for definition in "${ROUTE_DEFINITIONS[@]}"; do
        index=$((index + 1))
        split_route "$definition"

        fwd_key="$SEED_PREFIX-route-$index-fwd"
        fwd_id="$(state_get ".routes[\"$fwd_key\"].id")"
        [[ -n "$fwd_id" ]] || die "Route ID missing for forward route: $ROUTE_NAME"

        log "Processing forward route: $ROUTE_NAME"
        create_route_stops "$fwd_key" "$fwd_id" "$ROUTE_STOP_CSV" "$ROUTE_DIST_CSV"

        if [[ "$ROUND_TRIP_ROUTES" == "true" ]]; then
            ret_key="$SEED_PREFIX-route-$index-ret"
            ret_id="$(state_get ".routes[\"$ret_key\"].id")"
            [[ -n "$ret_id" ]] || die "Route ID missing for return route of: $ROUTE_NAME"

            build_return_route "$ROUTE_STOP_CSV" "$ROUTE_DIST_CSV"

            local ret_name
            ret_name="$(reverse_route_name "$ROUTE_NAME")"
            log "Processing return route: $ret_name"
            create_route_stops "$ret_key" "$ret_id" "$RETURN_STOP_CSV" "$RETURN_DIST_CSV"
        fi
    done

    log_ok "Route stops seeded."
}

###############################################################################
# Validation / summary
###############################################################################

validate_state_integrity() {
    log "Validating local seed state..."

    jq empty "$STATE_FILE" >/dev/null ||
        die "State file became invalid."

    local locations routes

    locations="$(jq '.locations | length' "$STATE_FILE")"
    routes="$(jq '.routes | length' "$STATE_FILE")"

    (( locations == ${#LOCATIONS[@]} )) ||
        die "State location count mismatch: expected=${#LOCATIONS[@]} actual=$locations"

    local expected_routes=${#ROUTE_DEFINITIONS[@]}
    if [[ "$ROUND_TRIP_ROUTES" == "true" ]]; then
        expected_routes=$((expected_routes * 2))
    fi

    (( routes == expected_routes )) ||
        die "State route count mismatch: expected=$expected_routes actual=$routes"

    log_ok "Local state integrity checks passed."
}

print_summary() {
    echo
    echo "============================================================"
    echo "              BUS BOOKING NETWORK SEED SUMMARY"
    echo "============================================================"
    printf "%-20s : %s\n" "API" "$API_BASE_URL"
    printf "%-20s : %s\n" "State" "$STATE_FILE"
    printf "%-20s : %s\n" "Seed prefix" "$SEED_PREFIX"
    printf "%-20s : %s\n" "Round trips" "$ROUND_TRIP_ROUTES"
    echo "------------------------------------------------------------"
    printf "%-20s : %s\n" "Admins" "$(jq '.admins | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Locations" "$(jq '.locations | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Routes" "$(jq '.routes | length' "$STATE_FILE")"
    printf "%-20s : %s\n" "Route stops" "$(jq '.routeStops | length' "$STATE_FILE")"
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

    log "Bus Booking API real network seeder"
    log "API:   $API_BASE_URL"
    log "State: $STATE_FILE"
    echo

    seed_admins
    seed_locations
    seed_routes
    seed_route_stops

    validate_state_integrity
    print_summary

    log_ok "Network seed completed successfully."
}

main "$@"