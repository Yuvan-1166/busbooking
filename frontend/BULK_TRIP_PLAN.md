# Operator Bulk Trip Publishing Plan

## Problem Analysis
Current workflow:
1. Create Schedule (metadata)
2. Manually create Trip (one by one, dated)
3. Confusing UX with separate components

Desired workflow:
1. Create Schedule + auto-generate trips in bulk
2. Toggle days (Mon-Sun) operator won't run
3. Set date range for trip generation
4. Single unified form experience

## Design Plan

### 1. Enhanced Schedule Form Component

**Input Fields:**
- Route (dropdown)
- Bus (dropdown)
- Departure Time (time picker)
- Base Fare (number)
- Price Per KM (number)
- Operating Days (toggle buttons - Mon-Sun, all pre-selected)
- Effective From (date picker) - when schedule starts
- Effective Until (date picker) - when schedule ends
- **NEW: Trip Generation Range** (date picker)
  - "Generate trips from [date] to [date]"
  - Default: Today to 90 days from today
- Status (Active/Inactive)

### 2. Operating Days Toggle UI

```
Operating Days
┌─────────────────────────────────────┐
│ [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun] │
│  ✓     ✓     ✓     ✓     ✓     ✓     ✓   │
└─────────────────────────────────────┘

User clicks a day to toggle it off
Days with ✗ are skipped during trip generation
```

### 3. Trip Generation Logic

**When operator saves schedule:**
1. Create schedule record
2. Calculate all dates from "Generate trips from" to "Generate trips to"
3. Filter dates by operating days (skip Mon/Tue/etc if toggled off)
4. Create trip records for each filtered date
5. Show summary: "Created 45 trips from Jan 1 to Mar 30"

**Example:**
- Schedule: Mon-Fri, 8:00 AM
- Generate from: Jan 1 to Mar 31 (91 days)
- Operating days: Mon-Fri (65 business days in that period)
- Auto-create: 65 trips

### 4. Trip Management

**After schedule creation:**
- Trips auto-appear in list (read-only or minimal edit)
- Operator can still manually:
  - Edit individual trip dates
  - Delete specific trips (if no bookings)
  - View trip details
- Can edit schedule to regenerate trips (with warning about existing bookings)

### 5. User Flow

```
Operator Dashboard → Schedules Tab
                    ↓
            [Create Schedule Button]
                    ↓
        Enhanced Schedule Form
        ├─ Route, Bus, Time, Pricing
        ├─ Schedule dates (effective from/until)
        ├─ Operating days (toggle Mon-Sun)
        ├─ Trip generation range (from/to)
        └─ [Create Schedule & Publish Trips]
                    ↓
        API Call: POST /schedules
        API Call: POST /trips (bulk, multiple in one request or batch)
                    ↓
        Success message: "Schedule created, 45 trips published"
        Redirect to Trips tab or Schedules tab
                    ↓
        User sees trips listed (grouped by schedule or searchable)
```

### 6. Backend Considerations

**API Enhancement:**
- POST /schedules/with-trips (single endpoint handling both)
  - Request: schedule data + trip generation range + operating days
  - Response: schedule + created trips count
  
OR

- POST /schedules (existing)
- POST /trips/bulk (new bulk endpoint)
  - Request: scheduleId + date range + operating days
  - Response: trips created count

**Validation:**
- Generation date range must be within schedule's effective dates
- At least 1 operating day must be selected
- Prevent duplicate trips on same date for same schedule
- Check for existing bookings before allowing schedule edit

### 7. Implementation Steps

1. **Update Schedule Form Component**
   - Add operating days toggles
   - Add trip generation range pickers
   - Improve form layout (single cohesive experience)

2. **Create Bulk Trip Generation Logic**
   - Function to generate dates based on:
     - Start and end dates
     - Operating days (weekday filter)
   - Create trip records for each generated date

3. **Update API Integration**
   - Modify createSchedule to also accept trip generation params
   - Implement bulk trip creation
   - Add error handling for generation failures

4. **Update UI/Lists**
   - Show generated trips in list
   - Group by schedule or show summary
   - Minimal trip management options

5. **Error Handling**
   - Invalid date ranges
   - No operating days selected
   - API failures during bulk creation
   - Partial failures (some trips created, some failed)

### 8. Benefits

✅ **Simplified UX**: One form, not separate schedule + trips
✅ **Bulk Operation**: No manual one-by-one creation
✅ **Flexibility**: Toggle days, set date ranges
✅ **Efficiency**: 90 days of trips in seconds
✅ **Clear Feedback**: Shows how many trips will be created
✅ **Realistic**: Matches real bus operations workflow

### 9. State Management

```javascript
const [scheduleForm, setScheduleForm] = useState({
  routeId: "",
  busId: "",
  departureTime: "",
  baseFare: "",
  pricePerKm: "",
  effectiveFrom: "",
  effectiveUntil: "",
  status: "ACTIVE",
  // NEW FIELDS:
  operatingDays: {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true,
  },
  tripGenerationFrom: "",
  tripGenerationTo: "", // Default: today + 90 days
});
```

## Implementation Priority
1. HIGH: Operating days toggle + date range inputs
2. HIGH: Bulk trip generation logic
3. MEDIUM: API integration
4. MEDIUM: UI for generated trips
5. LOW: Trip management/editing
