#!/usr/bin/env bash

# Small/local development dataset.
#
# Usage:
#   ./seed-small.sh
#
# Override anything if needed:
#   TRIPS=30 ./seed-small.sh

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

PASSENGERS="${PASSENGERS:-3}"
OPERATORS="${OPERATORS:-2}"
BUSES="${BUSES:-3}"
SEATS_PER_BUS="${SEATS_PER_BUS:-30}"
LOCATIONS="${LOCATIONS:-8}"
ROUTES="${ROUTES:-4}"
STOPS_PER_ROUTE="${STOPS_PER_ROUTE:-3}"
SCHEDULES="${SCHEDULES:-5}"
TRIPS="${TRIPS:-10}"

exec env \
    PASSENGERS="$PASSENGERS" \
    OPERATORS="$OPERATORS" \
    BUSES="$BUSES" \
    SEATS_PER_BUS="$SEATS_PER_BUS" \
    LOCATIONS="$LOCATIONS" \
    ROUTES="$ROUTES" \
    STOPS_PER_ROUTE="$STOPS_PER_ROUTE" \
    SCHEDULES="$SCHEDULES" \
    TRIPS="$TRIPS" \
    "$SCRIPT_DIR/populate_v2.sh"