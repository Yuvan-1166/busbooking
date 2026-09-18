# 🚌 Seat Template System - Implementation Guide

## Overview

This document describes the comprehensive seat template system implemented for the bus booking platform. The system provides pre-built, professional seat arrangements for 9 common bus configurations, making it dramatically easier for operators to set up their buses.

## Problem Solved

**Before:** Operators had to manually create every single seat, one by one, or use a basic grid generator that didn't account for:
- Real-world bus configurations
- Proper seat numbering conventions
- Gender-reserved seating policies
- Double-decker buses
- Different bus types (seater vs sleeper)

**After:** Operators can now:
- Browse 9 professional templates with visual previews
- Apply a complete seat layout in one click
- Support both single and double-decker buses
- Get proper seat numbering automatically
- Include female-reserved seats by default
- Save hours of manual work per bus

## Architecture

### Backend Components

```
bus/
├── entity/
│   ├── SeatTemplate.java              # Main entity with JSON configuration
│   ├── BusTemplateType.java           # Enum with 9 template types
│   ├── DeckType.java                  # SINGLE or DOUBLE
│   └── (existing Seat, SeatType, SeatPosition, SeatGenderPolicy enums)
├── repository/
│   └── SeatTemplateRepository.java    # JPA repository with filtering
├── service/
│   ├── SeatTemplateService.java       # Business logic & template application
│   └── SeatTemplateInitializer.java   # Auto-seeds templates on startup
├── controller/
│   └── SeatTemplateController.java    # REST API endpoints
└── dto/
    └── SeatTemplateResponse.java      # API response format
```

### Frontend Components

```
components/workspace/
├── TemplateGallery.jsx         # Modal with template selection UI
├── SeatsWorkspace.jsx          # Updated with template integration
└── OperatorDashboard.jsx       # Updated with batch API calls

api.js                           # Added template API functions
```

### Database

```
seat_templates table
├── id (PK)
├── name
├── template_type (ENUM)
├── deck_type (ENUM)
├── total_seats
├── description
├── configuration (JSON)        # Flexible deck & seat patterns
├── is_active
├── created_at
└── updated_at
```

## Pre-built Templates

### 1. Standard AC Seater (2+2)
- **Capacity:** 40 seats
- **Configuration:** 10 rows × 4 seats (2+2)
- **Use Case:** Most common intercity bus
- **Features:** Female-reserved first 2 rows (8 seats)

### 2. Economy AC Seater (2+3)
- **Capacity:** 55 seats
- **Configuration:** 11 rows × 5 seats (2+3)
- **Use Case:** Budget routes, maximum capacity
- **Features:** Female-reserved first 2 rows (10 seats)

### 3. AC Semi-Sleeper (2+2)
- **Capacity:** 36 seats
- **Configuration:** 9 rows × 4 seats (2+2)
- **Use Case:** Comfortable overnight with reclining seats
- **Features:** Extra legroom, female-reserved first row (4 seats)

### 4. AC Sleeper (2+1)
- **Capacity:** 27 berths
- **Configuration:** 9 rows × 3 berths (2 stacked + 1)
- **Use Case:** Full sleeper for long overnight journeys
- **Features:** Berth numbering (AL=lower, AU=upper), female-reserved first 2 rows

### 5. Volvo Multi-Axle (2+2)
- **Capacity:** 44 seats
- **Configuration:** 11 rows × 4 seats (2+2)
- **Use Case:** Premium long-distance travel
- **Features:** Spacious layout, female-reserved first 2 rows

### 6. Mini Bus (2+1)
- **Capacity:** 21 seats
- **Configuration:** 7 rows × 3 seats (2+1)
- **Use Case:** Short routes, smaller groups
- **Features:** Compact, female-reserved first row

### 7. Luxury Coach (1+2)
- **Capacity:** 30 seats
- **Configuration:** 10 rows × 3 seats (1+2)
- **Use Case:** VIP travel with extra space
- **Features:** Wide seating, female-reserved first 2 rows

### 8. Double Decker Seater (2+2)
- **Capacity:** 72 seats (32 lower + 40 upper)
- **Configuration:** Lower: 8 rows × 4, Upper: 10 rows × 4
- **Use Case:** High-demand routes
- **Features:** Seat numbering with L/U prefix (L1A, U1A), female-reserved lower front

### 9. Double Decker Sleeper (2+1)
- **Capacity:** 42 berths (18 lower + 24 upper)
- **Configuration:** Lower: 6 rows × 3, Upper: 8 rows × 3
- **Use Case:** Premium overnight with high capacity
- **Features:** Berth numbering with deck prefix, female-reserved lower front

## API Reference

### Get All Templates
```http
GET /api/v1/seat-templates
GET /api/v1/seat-templates?deckType=SINGLE
GET /api/v1/seat-templates?deckType=DOUBLE
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Standard AC Seater (2+2)",
    "templateType": "AC_SEATER_2X2",
    "templateTypeDisplay": "AC Seater (2+2)",
    "deckType": "SINGLE",
    "totalSeats": 40,
    "description": "Standard AC seater bus...",
    "configuration": {
      "decks": [...]
    },
    "isActive": true
  }
]
```

### Get Template by ID
```http
GET /api/v1/seat-templates/{id}
```

### Preview Template Seats
```http
GET /api/v1/seat-templates/{id}/preview
```

**Response:** Array of `SeatRequest` objects showing what would be created

### Apply Template to Bus
```http
POST /api/v1/seat-templates/{id}/apply
Content-Type: application/json

{
  "busId": 123,
  "clearExisting": false
}
```

**Response:** Array of created `SeatResponse` objects

**Parameters:**
- `busId` (required): The bus to apply template to
- `clearExisting` (optional, default: false): Whether to delete existing seats first

### Batch Create Seats
```http
POST /api/v1/seats/batch
Content-Type: application/json

[
  {
    "busId": 123,
    "seatNumber": "1A",
    "seatType": "SEAT",
    "position": "WINDOW",
    "genderPolicy": "ANY"
  },
  ...
]
```

## Configuration Structure

The `configuration` JSON field in `seat_templates` follows this structure:

```json
{
  "decks": [
    {
      "deckNumber": 1,
      "deckName": "Lower Deck",
      "rows": 10,
      "columns": 4,
      "aisleAfter": 2,
      "seatPattern": [
        {
          "row": 1,
          "col": 1,
          "seatNumber": "1A",
          "type": "SEAT",
          "position": "WINDOW",
          "genderPolicy": "FEMALE_PREFERRED"
        },
        ...
      ]
    }
  ]
}
```

## User Workflow

### For Operators

1. **Navigate to Operator Dashboard**
   - Go to `/operator/seats`

2. **Select Bus**
   - Choose bus from dropdown

3. **Browse Templates**
   - Click prominent "Browse Templates" button
   - See 9 professional layouts with descriptions

4. **Filter (Optional)**
   - Click "Single Deck" or "Double Decker" to filter

5. **Select Template**
   - Click on desired template card
   - Review stats (seat count, configuration)

6. **Apply Template**
   - Click "Use This Template"
   - If bus has existing seats, choose to replace or append
   - Wait for confirmation

7. **Verify**
   - See all seats rendered in bus layout
   - Check seat numbering and types
   - Ready to create trips!

### Alternative: Manual Creation

Operators can still use the manual dimension builder:
1. Set rows, seats per row, aisle position
2. Preview generated layout
3. Edit individual seats before saving
4. Batch save all seats

## Technical Details

### Auto-Seeding

Templates are automatically seeded on application startup via `SeatTemplateInitializer`:

```java
@Bean
@Transactional
CommandLineRunner initSeatTemplates(SeatTemplateRepository repository) {
    return args -> {
        if (repository.count() > 0) {
            log.info("Seat templates already exist. Skipping initialization.");
            return;
        }
        // Create and save 9 templates...
    };
}
```

### Template Application Logic

When a template is applied:

1. **Validation**
   - Bus must exist
   - Template must be active

2. **Conflict Handling**
   - Check if bus already has seats
   - If `clearExisting=true`, delete existing seats first

3. **Seat Generation**
   - Iterate through all decks in configuration
   - Create `Seat` entity for each pattern entry
   - Set proper bus reference, numbering, type, position, gender policy

4. **Batch Save**
   - Use `saveAll()` for efficiency
   - All created in single transaction

### Frontend State Management

The `SeatsWorkspace` component manages:
- Template gallery visibility
- Template application status
- Conflict resolution
- Page refresh after application

## Deployment

### Prerequisites
- Java 17+
- Spring Boot 3.x
- MySQL/MariaDB 8.x with JSON support
- Node.js 18+ (frontend)

### Backend Deployment

1. **Database Migration**
   - Flyway will automatically run `V3__create_seat_templates_table.sql`
   - Creates `seat_templates` table on first startup

2. **Template Seeding**
   - `SeatTemplateInitializer` runs automatically
   - Seeds 9 templates on first run only
   - Idempotent - won't duplicate on restart

3. **No Additional Configuration Needed**
   - All defaults are production-ready
   - Templates marked as active by default

### Frontend Deployment

1. **Build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy**
   - Serve `dist/` folder
   - Ensure API base URL is configured correctly

## Performance Considerations

### Backend
- **Indexes:** Added on `deck_type` and `template_type` for fast filtering
- **Batch Operations:** Seats created in bulk via `saveAll()`
- **Lazy Loading:** Template configuration loaded only when needed
- **Caching:** Consider adding `@Cacheable` for templates (rarely change)

### Frontend
- **Modal Rendering:** Template gallery uses React portal
- **Lazy Loading:** Gallery loaded only when button clicked
- **Optimistic UI:** Show loading states during application
- **Batch API:** Single request creates all seats

### Database
- **JSON Type:** Native JSON for flexible configuration
- **Transaction Scope:** Template application wrapped in `@Transactional`
- **Connection Pooling:** Use production-grade pool (HikariCP)

## Customization

### Adding New Templates

1. **Backend** - In `SeatTemplateInitializer.java`:
   ```java
   private SeatTemplate createMyCustomTemplate() {
       List<SeatTemplate.SeatPattern> pattern = new ArrayList<>();
       
       // Define your seat pattern
       for (int row = 1; row <= ROWS; row++) {
           pattern.add(createSeatPattern(row, col, seatNumber, ...));
       }
       
       // Create deck configuration
       SeatTemplate.DeckConfiguration deck = new SeatTemplate.DeckConfiguration(...);
       
       // Build template
       SeatTemplate template = new SeatTemplate();
       template.setName("My Custom Template");
       template.setTemplateType(BusTemplateType.NEW_TYPE); // Add to enum first
       // ... set other properties
       
       return template;
   }
   ```

2. **Add to Enum** - In `BusTemplateType.java`:
   ```java
   NEW_TYPE("My Custom Type", "Description", DeckType.SINGLE)
   ```

3. **Add to Initializer** - In `initSeatTemplates()`:
   ```java
   templates.add(createMyCustomTemplate());
   ```

### Modifying Existing Templates

Edit the corresponding `create*()` method in `SeatTemplateInitializer.java`. Changes apply on next clean database initialization.

For production databases with existing data, create a new migration to update the JSON configuration.

## Security

- **Authentication Required:** All template endpoints require `ROLE_OPERATOR` or `ROLE_ADMIN`
- **Authorization:** Operators can only apply templates to their own buses
- **Validation:** Template application validates bus ownership
- **Input Sanitization:** All inputs validated via Bean Validation

## Monitoring

### Logs to Watch
```
Initializing pre-built seat templates...
Successfully initialized 9 seat templates
Applying template {id} to bus {busId}
Successfully created {count} seats for bus {busId} using template {name}
```

### Metrics to Track
- Template application success rate
- Average seats created per template
- Template selection distribution
- Time to apply template (should be < 2s)

## Troubleshooting

### Templates Not Showing in UI
1. Check backend logs for seeding errors
2. Verify `seat_templates` table has data: `SELECT * FROM seat_templates;`
3. Check API response: `curl http://localhost:8080/api/v1/seat-templates`
4. Verify frontend API base URL configuration

### Template Application Fails
1. Check bus exists and belongs to operator
2. Verify template is active
3. Check for duplicate seat number errors
4. Review transaction logs for rollback reasons

### Duplicate Seats Error
- If `clearExisting=false` and bus already has seats with same numbers
- Solution: Use `clearExisting=true` or manually resolve conflicts

### Migration Fails
- Ensure MySQL/MariaDB version supports JSON type (5.7.8+)
- Check Flyway version compatibility
- Verify database user has CREATE TABLE permissions

## Future Enhancements

### Potential Additions
1. **Custom Template Builder:** Let operators save their own templates
2. **Template Marketplace:** Share templates between operators
3. **Import/Export:** JSON import/export for templates
4. **Visual Editor:** Drag-and-drop seat arrangement editor
5. **Template Variations:** Allow minor customizations before applying
6. **Deck Visualization:** Separate views for upper/lower decks
7. **Analytics:** Most popular templates, average setup time
8. **Versioning:** Track template versions and changes

## Support

For issues or questions:
1. Check logs in `logs/spring-boot-application.log`
2. Review this documentation
3. Check `docs/SEAT_TEMPLATE_TESTING.md` for test procedures
4. Contact development team

## License

Internal proprietary system. All rights reserved.

---

**Last Updated:** September 2026  
**Version:** 1.0.0  
**Author:** Kiro AI Development Team
