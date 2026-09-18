# Seat Template System - Test Verification Checklist

## Prerequisites
- [ ] Database is running (MySQL/MariaDB)
- [ ] Backend application is compiled and running
- [ ] Frontend development server is running

## Backend Testing

### 1. Database Migration
```bash
# Check if migration ran successfully
# Look for V3__create_seat_templates_table.sql in flyway_schema_history
```
- [ ] Migration V3 executed successfully
- [ ] `seat_templates` table exists
- [ ] Indexes created properly

### 2. Template Seeding
```bash
# Check application logs on startup
# Should see: "Initializing pre-built seat templates..."
# Should see: "Successfully initialized 9 seat templates"
```
- [ ] 9 templates seeded automatically
- [ ] No duplicate seeding on restart

### 3. API Endpoints
Test with curl or Postman:

```bash
# Get all templates
GET http://localhost:8080/api/v1/seat-templates
# Expected: Array of 9 templates

# Get single-deck templates only
GET http://localhost:8080/api/v1/seat-templates?deckType=SINGLE
# Expected: Array of 7 templates

# Get double-deck templates only
GET http://localhost:8080/api/v1/seat-templates?deckType=DOUBLE
# Expected: Array of 2 templates

# Get specific template
GET http://localhost:8080/api/v1/seat-templates/1
# Expected: Single template object

# Preview template
GET http://localhost:8080/api/v1/seat-templates/1/preview
# Expected: Array of seat configurations

# Apply template (requires auth)
POST http://localhost:8080/api/v1/seat-templates/1/apply
Body: { "busId": 1, "clearExisting": false }
# Expected: Array of created seats
```

- [ ] All GET endpoints return data
- [ ] Filtering by deck type works
- [ ] Preview shows correct seat count
- [ ] Apply template creates seats in database

### 4. Batch Seat Creation
```bash
POST http://localhost:8080/api/v1/seats/batch
Body: [
  { "busId": 1, "seatNumber": "1A", "seatType": "SEAT", "position": "WINDOW", "genderPolicy": "ANY" },
  { "busId": 1, "seatNumber": "1B", "seatType": "SEAT", "position": "AISLE", "genderPolicy": "ANY" }
]
# Expected: Array of created seats
```
- [ ] Batch creation works
- [ ] Duplicate seat numbers rejected
- [ ] All seats created in one transaction

## Frontend Testing

### 1. Operator Portal Access
- [ ] Navigate to `/operator/seats`
- [ ] See "Browse Templates" button prominently displayed
- [ ] Orange banner with template CTA visible

### 2. Template Gallery
- [ ] Click "Browse Templates" button
- [ ] Modal opens with template grid
- [ ] All 9 templates displayed with icons and descriptions
- [ ] Filter buttons work (All/Single Deck/Double Decker)
- [ ] Template cards show correct stats (seat count, deck info)

### 3. Template Selection
- [ ] Click on a template card
- [ ] Card shows selected state (orange border, checkmark)
- [ ] "Use This Template" button becomes enabled
- [ ] Selected template name shown in footer

### 4. Template Application

#### Test Case 1: Empty Bus
- [ ] Select a bus with NO seats
- [ ] Choose a template and click "Use This Template"
- [ ] No conflict dialog shown
- [ ] Page reloads/seats refresh
- [ ] All seats from template appear in bus layout
- [ ] Seat count matches template (e.g., 40 for AC Seater 2+2)

#### Test Case 2: Bus with Existing Seats
- [ ] Select a bus that already has seats
- [ ] Choose a template and click "Use This Template"
- [ ] Conflict dialog appears asking to replace or keep
- [ ] Click "OK" to replace - existing seats removed, template applied
- [ ] OR Click "Cancel" - existing seats kept, template seats added

#### Test Case 3: Different Templates
Test at least 3 different templates:
- [ ] Single deck seater (e.g., AC Seater 2+2)
- [ ] Single deck sleeper (e.g., AC Sleeper 2+1)
- [ ] Double decker (e.g., Double Decker Seater)

### 5. Seat Layout Verification
After applying each template:
- [ ] Bus layout renders correctly
- [ ] Seat numbering is logical and sequential
- [ ] Female-reserved seats show purple/pink color
- [ ] Sleeper berths show tan/brown color
- [ ] Seat statistics at bottom are correct
- [ ] Double decker templates show proper deck prefixes (L1A, U1A)

### 6. Manual Creation Still Works
- [ ] Can still use "Manual dimensions" section
- [ ] Preview seats functionality works
- [ ] Batch save works
- [ ] Individual seat edit/delete works

### 7. Performance
- [ ] Template gallery loads quickly (< 1s)
- [ ] Template application completes in reasonable time
- [ ] 40+ seats batch creation is fast (< 2s)
- [ ] No browser freezing or lag

### 8. Error Handling
- [ ] Invalid bus ID shows error
- [ ] Network failure shows error message
- [ ] Duplicate seat numbers rejected with clear message
- [ ] Template not found returns 404

## Integration Testing

### End-to-End Flow
1. [ ] Create a new bus
2. [ ] Navigate to Seats workspace
3. [ ] Browse templates
4. [ ] Select "Standard AC Seater (2+2)"
5. [ ] Apply template
6. [ ] Verify 40 seats created
7. [ ] Check first 8 seats are female-preferred
8. [ ] Create a trip with this bus
9. [ ] Verify all 40 seats available for booking
10. [ ] Book a seat
11. [ ] Verify seat appears as booked in trip view

### Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile responsive view

## Performance Benchmarks
- Template gallery load: ____ ms
- Single template application (40 seats): ____ ms
- Double decker template (72 seats): ____ ms
- Batch API response time: ____ ms

## Known Issues / Notes
(Document any issues found during testing)

---

## Sign-off
- [ ] All critical tests passed
- [ ] Documentation complete
- [ ] Ready for production deployment

Tested by: ________________
Date: ________________
