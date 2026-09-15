# Comprehensive Filter Aspects for Bus Trips

## Current Available Filters (From Existing Data)
1. **Bus Type** - Sleeper, Semi-Sleeper, Coach, Luxury, AC variants
2. **Operator/Company** - All available bus operators
3. **Departure Time** - Night (00:00-06:00), Morning (06:00-12:00), Afternoon (12:00-18:00), Evening (18:00-24:00)
4. **Price Range** - Min-Max slider based on available fares

## Proposed Enhanced Filters (Requires Backend Data)

### Comfort & Amenities
- **Seat Type** - Window seats, Aisle seats, Mixed
- **Seat Configuration** - Single seats, Bed seats (2+1), Standard (2x2)
- **Amenities** - WiFi, Power outlets, Blanket/Pillow, Water bottle, Snacks included
- **AC/Non-AC** - With AC, Without AC
- **Reclining Angle** - 0°, 45°, 60°, 90°+ (for sleeper beds)

### Availability & Capacity
- **Available Seats** - Only show trips with X+ seats available
- **Occupancy** - Show less crowded (>30% available), moderately (>50%), plenty (>70%)

### Rating & Popularity
- **Operator Rating** - 4.5★+, 4★+, 3.5★+, All
- **Trip Popularity** - Trending, Popular, Recently booked
- **Cancellation Policy** - Free cancellation, Paid cancellation, No cancellation

### Travel Time
- **Journey Duration** - <3h, 3-5h, 5-8h, >8h
- **Arrival Time** - Early morning, Morning, Afternoon, Evening, Night
- **Layovers** - Direct only, With layovers

### Special Offers
- **Discounts Available** - Show trips with active discounts
- **Offers** - New passenger offer, Return ticket offer, Group booking offer
- **Price Drop** - Show prices dropped recently

### Boarding & Safety
- **Boarding Type** - Home pickup, Bus stop pickup
- **Safety Features** - GPS tracking, Emergency communication, Medical kit
- **Certification** - Star category bus, Certified safe

### Booking Experience
- **Mobile Exclusive** - Deals exclusive to mobile app
- **Instant Confirmation** - Immediate booking confirmation
- **Flexible Booking** - Modify booking after purchase

## Priority for Implementation (MVP)

### Phase 1 (Essential - No Backend Changes)
✅ Bus Type
✅ Operator
✅ Departure Time
✅ Price Range
✅ Journey Duration (calculate from trip data)
✅ Available Seats Count (from trip-seats)

### Phase 2 (Important - Minimal Backend Changes)
- Seat Type (add to Trip/Bus response)
- Operator Rating (add rating field to Operator)
- Amenities flags (add to Bus entity)
- AC/Non-AC flag (can infer from bus type but add explicit flag)

### Phase 3 (Enhanced - Database Schema Updates)
- Detailed amenities list
- Reclining angle specifications
- Safety certifications
- Booking flexibility options

## Backend Updates Needed (Phase 2)

### Operator Entity
```json
{
  "id": 1,
  "name": "Green Channel Express",
  "rating": 4.5,
  "totalRatings": 2340,
  "certifications": ["5-star", "GPS-enabled"],
  "hasFreeWifi": true,
  "hasPowerOutlets": true,
  "hasAC": true
}
```

### Bus Entity
```json
{
  "id": 15,
  "registrationNumber": "TN-01-AB-1234",
  "model": "Volvo B11R",
  "busType": "SEMI_SLEEPER",
  "hasAC": true,
  "amenities": ["WiFi", "Power Outlets", "Blanket/Pillow", "Water", "Snacks"],
  "seatConfiguration": "2+1",
  "operatorId": 1
}
```

### Trip Response Enhancement
```json
{
  "id": 100,
  "busId": 15,
  "scheduleId": 1,
  "tripDate": "2026-09-15",
  "departureTime": "22:10",
  "status": "ACTIVE",
  "availableSeats": 12,
  "totalSeats": 40,
  "occupancyPercentage": 70,
  "hasDiscount": true,
  "discountPercentage": 10,
  "originalFare": 899,
  "baseFare": 799,
  "busDetails": {
    "id": 15,
    "registrationNumber": "TN-01-AB-1234",
    "model": "Volvo B11R",
    "busType": "SEMI_SLEEPER",
    "hasAC": true,
    "amenities": ["WiFi", "Power Outlets"]
  },
  "operatorDetails": {
    "id": 1,
    "name": "Green Channel Express",
    "rating": 4.5,
    "totalRatings": 2340
  }
}
```

## Filter UI Organization (Sidebar)

```
FILTERS SIDEBAR
├── Search/Clear
├── Price Range
│   └── Slider 0-5000
├── Departure Time
│   ├── □ Night
│   ├── □ Morning
│   ├── □ Afternoon
│   └── □ Evening
├── Bus Type
│   ├── □ Sleeper
│   ├── □ Semi-Sleeper
│   └── ... (collapsible if many)
├── Journey Duration
│   ├── □ < 3 hours
│   ├── □ 3-5 hours
│   └── ... (collapsible)
├── Operator
│   ├── ☆☆☆☆☆ 4.5+ (shows 3)
│   ├── Search box (if many)
│   └── Scrollable list
├── Amenities
│   ├── □ WiFi
│   ├── □ Power Outlets
│   └── ... (expandable group)
├── Available Seats
│   ├── □ 10+ seats
│   ├── □ 20+ seats
│   └── □ 30+ seats
└── Clear All
```

## Implementation Strategy

1. **Sidebar Component** - Fixed left sidebar with independent scroll
2. **Main Content** - Right content area with trips list, independent scroll
3. **Responsive** - Stack sidebar on mobile (below search)
4. **Performance** - Filter calculations on client-side (useMemo)
5. **State Management** - Lift filters state to SearchResults
6. **API Enhancement** - Decide what backend data to enrich first

## Benefits
✅ Professional UI (like RedBus, MakeMyTrip)
✅ Independent scrolling (better UX)
✅ More filter options visible at once
✅ Easy to compare and filter
✅ Room for future enhancements
