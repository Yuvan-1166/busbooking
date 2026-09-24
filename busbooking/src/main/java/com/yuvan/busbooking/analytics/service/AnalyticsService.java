package com.yuvan.busbooking.analytics.service;

import com.yuvan.busbooking.analytics.dto.AnalyticsDashboard;
import com.yuvan.busbooking.analytics.dto.AnalyticsSummary;
import com.yuvan.busbooking.analytics.dto.BusAnalytics;
import com.yuvan.busbooking.analytics.dto.CountPoint;
import com.yuvan.busbooking.analytics.dto.OperatorAnalytics;
import com.yuvan.busbooking.analytics.dto.RouteAnalytics;
import com.yuvan.busbooking.analytics.dto.TrendPoint;
import com.yuvan.busbooking.booking.entity.Booking;
import com.yuvan.busbooking.booking.entity.BookingPassenger;
import com.yuvan.busbooking.booking.entity.BookingStatus;
import com.yuvan.busbooking.booking.entity.Cancellation;
import com.yuvan.busbooking.booking.repository.BookingPassengerRepository;
import com.yuvan.busbooking.booking.repository.BookingRepository;
import com.yuvan.busbooking.booking.repository.CancellationRepository;
import com.yuvan.busbooking.bus.entity.Bus;
import com.yuvan.busbooking.bus.repository.BusRepository;
import com.yuvan.busbooking.bus.repository.SeatRepository;
import com.yuvan.busbooking.operator.repository.OperatorRepository;
import com.yuvan.busbooking.route.repository.RouteRepository;
import com.yuvan.busbooking.ticket.entity.Ticket;
import com.yuvan.busbooking.ticket.repository.TicketRepository;
import com.yuvan.busbooking.trip.entity.Trip;
import com.yuvan.busbooking.trip.entity.TripSeat;
import com.yuvan.busbooking.trip.entity.TripSeatStatus;
import com.yuvan.busbooking.trip.entity.TripStatus;
import com.yuvan.busbooking.trip.repository.TripRepository;
import com.yuvan.busbooking.trip.repository.TripSeatRepository;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Aggregates bookings, trips, tickets and seats into analytics dashboards.
 *
 * <p>A {@code null} {@code operatorId} produces a platform-wide report
 * (admin scope). A non-{@code null} value restricts every metric to that
 * operator's fleet (operator scope).</p>
 */
@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private static final int DEFAULT_RANGE_DAYS = 29;

    private final BookingRepository bookingRepository;
    private final BookingPassengerRepository bookingPassengerRepository;
    private final TripRepository tripRepository;
    private final TripSeatRepository tripSeatRepository;
    private final TicketRepository ticketRepository;
    private final CancellationRepository cancellationRepository;
    private final BusRepository busRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final OperatorRepository operatorRepository;
    private final RouteRepository routeRepository;

    public AnalyticsService(
            BookingRepository bookingRepository,
            BookingPassengerRepository bookingPassengerRepository,
            TripRepository tripRepository,
            TripSeatRepository tripSeatRepository,
            TicketRepository ticketRepository,
            CancellationRepository cancellationRepository,
            BusRepository busRepository,
            SeatRepository seatRepository,
            UserRepository userRepository,
            OperatorRepository operatorRepository,
            RouteRepository routeRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingPassengerRepository = bookingPassengerRepository;
        this.tripRepository = tripRepository;
        this.tripSeatRepository = tripSeatRepository;
        this.ticketRepository = ticketRepository;
        this.cancellationRepository = cancellationRepository;
        this.busRepository = busRepository;
        this.seatRepository = seatRepository;
        this.userRepository = userRepository;
        this.operatorRepository = operatorRepository;
        this.routeRepository = routeRepository;
    }

    public AnalyticsDashboard getDashboard(LocalDate from, LocalDate to, Long operatorId) {
        LocalDate start = defaultStart(from);
        LocalDate end = defaultEnd(to, start);
        LocalDateTime startAt = start.atStartOfDay();
        LocalDateTime endAt = end.atTime(LocalTime.MAX);

        boolean platformWide = operatorId == null;

        List<Booking> bookings = loadBookings(startAt, endAt, operatorId, platformWide);
        List<Trip> trips = loadTrips(start, end, operatorId, platformWide);
        List<Ticket> tickets = loadTickets(startAt, endAt, operatorId, platformWide);
        List<Cancellation> cancellations = loadCancellations(startAt, endAt, operatorId, platformWide);

        List<Booking> confirmed = confirmedBookings(bookings);
        Map<Long, List<BookingPassenger>> passengersByBooking =
                passengersByBooking(confirmed);
        Map<Long, List<TripSeat>> tripSeatsByTrip =
                tripSeatsByTrip(trips);

        AnalyticsSummary summary = buildSummary(
                confirmed, passengersByBooking, tickets, bookings,
                cancellations, trips, tripSeatsByTrip,
                platformWide, operatorId, startAt, endAt
        );

        List<TrendPoint> trend = buildTrend(start, end, confirmed, passengersByBooking);
        List<CountPoint> userGrowth = platformWide
                ? buildUserGrowth(start, end, startAt, endAt)
                : List.of();

        List<RouteAnalytics> routePerformance = buildRoutePerformance(
                confirmed, trips, passengersByBooking, tripSeatsByTrip);
        List<BusAnalytics> busPerformance = buildBusPerformance(
                confirmed, trips, passengersByBooking, tripSeatsByTrip);
        List<OperatorAnalytics> operatorPerformance = platformWide
                ? buildOperatorPerformance(confirmed, trips, passengersByBooking, tripSeatsByTrip)
                : List.of();

        return new AnalyticsDashboard(
                start,
                end,
                operatorId,
                summary,
                trend,
                userGrowth,
                routePerformance,
                busPerformance,
                operatorPerformance
        );
    }

    // ── Data loading ────────────────────────────────────────────────────────

    private List<Booking> loadBookings(
            LocalDateTime from, LocalDateTime to, Long operatorId, boolean platformWide) {
        return platformWide
                ? bookingRepository.findForAnalytics(from, to)
                : bookingRepository.findForAnalyticsByOperator(from, to, operatorId);
    }

    private List<Trip> loadTrips(
            LocalDate from, LocalDate to, Long operatorId, boolean platformWide) {
        return platformWide
                ? tripRepository.findForAnalytics(from, to)
                : tripRepository.findForAnalyticsByOperator(from, to, operatorId);
    }

    private List<Ticket> loadTickets(
            LocalDateTime from, LocalDateTime to, Long operatorId, boolean platformWide) {
        return platformWide
                ? ticketRepository.findForAnalytics(from, to)
                : ticketRepository.findForAnalyticsByOperator(from, to, operatorId);
    }

    private List<Cancellation> loadCancellations(
            LocalDateTime from, LocalDateTime to, Long operatorId, boolean platformWide) {
        return platformWide
                ? cancellationRepository.findForAnalytics(from, to)
                : cancellationRepository.findForAnalyticsByOperator(from, to, operatorId);
    }

    // ── Derived state ───────────────────────────────────────────────────────

    private static List<Booking> confirmedBookings(List<Booking> bookings) {
        return bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED)
                .toList();
    }

    private Map<Long, List<BookingPassenger>> passengersByBooking(List<Booking> confirmed) {
        List<Long> ids = confirmed.stream().map(Booking::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return bookingPassengerRepository.findByBookingIdIn(ids)
                .stream()
                .collect(Collectors.groupingBy(passenger -> passenger.getBooking().getId()));
    }

    private Map<Long, List<TripSeat>> tripSeatsByTrip(List<Trip> trips) {
        List<Long> ids = trips.stream().map(Trip::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return tripSeatRepository.findByTripIdIn(ids)
                .stream()
                .collect(Collectors.groupingBy(seat -> seat.getTrip().getId()));
    }

    // ── Summary ─────────────────────────────────────────────────────────────

    private AnalyticsSummary buildSummary(
            List<Booking> confirmed,
            Map<Long, List<BookingPassenger>> passengersByBooking,
            List<Ticket> tickets,
            List<Booking> bookings,
            List<Cancellation> cancellations,
            List<Trip> trips,
            Map<Long, List<TripSeat>> tripSeatsByTrip,
            boolean platformWide,
            Long operatorId,
            LocalDateTime startAt,
            LocalDateTime endAt
    ) {
        BigDecimal revenue = confirmed.stream()
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long passengerCount = passengersByBooking.values().stream()
                .mapToLong(List::size)
                .sum();

        long cancelledBookings = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CANCELLED)
                .count();

        BigDecimal refundedAmount = cancellations.stream()
                .map(Cancellation::getRefundAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long scheduledTrips = countTrips(trips, TripStatus.SCHEDULED);
        long completedTrips = countTrips(trips, TripStatus.COMPLETED);
        long cancelledTrips = countTrips(trips, TripStatus.CANCELLED);

        long[] capacity = capacityForTrips(trips, tripSeatsByTrip);

        long totalBuses;
        long totalSeats;
        Long newUsers = null;
        Long totalUsers = null;
        Long totalOperators = null;
        Long totalRoutes = null;

        if (platformWide) {
            totalBuses = busRepository.count();
            totalSeats = seatRepository.count();
            newUsers = userRepository.countByCreatedAtBetween(startAt, endAt);
            totalUsers = userRepository.count();
            totalOperators = operatorRepository.count();
            totalRoutes = routeRepository.count();
        } else {
            List<Bus> fleet = busRepository.findByOperatorId(operatorId);
            List<Long> fleetIds = fleet.stream().map(Bus::getId).toList();
            totalBuses = fleet.size();
            totalSeats = fleetIds.isEmpty() ? 0 : seatRepository.countByBusIdIn(fleetIds);
        }

        return new AnalyticsSummary(
                revenue,
                confirmed.size(),
                passengerCount,
                tickets.size(),
                cancelledBookings,
                refundedAmount,
                trips.size(),
                completedTrips,
                cancelledTrips,
                scheduledTrips,
                occupancyRate(capacity[0], capacity[1]),
                totalBuses,
                totalSeats,
                newUsers,
                totalUsers,
                totalOperators,
                totalRoutes
        );
    }

    private static long countTrips(List<Trip> trips, TripStatus status) {
        return trips.stream()
                .filter(trip -> trip.getStatus() == status)
                .count();
    }

    /** Returns {@code {soldSeats, totalSeats}} for non-cancelled trips. */
    private static long[] capacityForTrips(
            List<Trip> trips, Map<Long, List<TripSeat>> tripSeatsByTrip) {
        long sold = 0;
        long total = 0;
        for (Trip trip : trips) {
            if (trip.getStatus() == TripStatus.CANCELLED) {
                continue;
            }
            List<TripSeat> seats = tripSeatsByTrip.getOrDefault(trip.getId(), List.of());
            total += seats.size();
            sold += seats.stream()
                    .filter(seat -> seat.getStatus() == TripSeatStatus.BOOKED)
                    .count();
        }
        return new long[]{sold, total};
    }

    // ── Trend ───────────────────────────────────────────────────────────────

    private List<TrendPoint> buildTrend(
            LocalDate from, LocalDate to, List<Booking> confirmed,
            Map<Long, List<BookingPassenger>> passengersByBooking) {
        Map<LocalDate, TrendDay> days = new LinkedHashMap<>();
        LocalDate day = from;
        while (!day.isAfter(to)) {
            days.put(day, new TrendDay());
            day = day.plusDays(1);
        }

        for (Booking booking : confirmed) {
            TrendDay bucket = days.get(booking.getCreatedAt().toLocalDate());
            if (bucket == null) {
                continue;
            }
            bucket.bookings++;
            bucket.passengers += passengersByBooking
                    .getOrDefault(booking.getId(), List.of())
                    .size();
            bucket.revenue = bucket.revenue.add(booking.getTotalAmount());
        }

        return days.entrySet().stream()
                .map(entry -> new TrendPoint(
                        entry.getKey(),
                        entry.getValue().bookings,
                        entry.getValue().passengers,
                        entry.getValue().revenue))
                .toList();
    }

    private List<CountPoint> buildUserGrowth(
            LocalDate from, LocalDate to, LocalDateTime startAt, LocalDateTime endAt) {
        Map<LocalDate, Long> counts = userRepository.findByCreatedAtBetween(startAt, endAt)
                .stream()
                .collect(Collectors.groupingBy(
                        user -> user.getCreatedAt().toLocalDate(),
                        Collectors.counting()));

        List<CountPoint> points = new ArrayList<>();
        LocalDate day = from;
        while (!day.isAfter(to)) {
            points.add(new CountPoint(day, counts.getOrDefault(day, 0L)));
            day = day.plusDays(1);
        }
        return points;
    }

    // ── Route / bus / operator performance ────────────────────────────────

    private List<RouteAnalytics> buildRoutePerformance(
            List<Booking> confirmed, List<Trip> trips,
            Map<Long, List<BookingPassenger>> passengersByBooking,
            Map<Long, List<TripSeat>> tripSeatsByTrip) {
        Map<Long, MetricAggregator> routes = new LinkedHashMap<>();

        for (Booking booking : confirmed) {
            Trip trip = booking.getTrip();
            Long routeId = trip.getRoute().getId();
            MetricAggregator agg = routes.computeIfAbsent(
                    routeId, id -> new MetricAggregator(id, trip.getRoute().getName(), null));
            agg.bookings++;
            agg.passengers += passengersByBooking.getOrDefault(booking.getId(), List.of()).size();
            agg.revenue = agg.revenue.add(booking.getTotalAmount());
        }

        for (Trip trip : trips) {
            if (trip.getStatus() == TripStatus.CANCELLED) {
                continue;
            }
            MetricAggregator agg = routes.computeIfAbsent(
                    trip.getRoute().getId(), id -> new MetricAggregator(id, trip.getRoute().getName(), null));
            agg.trips++;
            agg.addSeats(tripSeatsByTrip.getOrDefault(trip.getId(), List.of()));
        }

        return routes.values().stream()
                .sorted(MetricAggregator.byRevenueDesc())
                .map(agg -> new RouteAnalytics(
                        agg.id, agg.label, agg.trips, agg.bookings,
                        agg.passengers, agg.revenue, roundOne(agg.occupancyRate())))
                .toList();
    }

    private List<BusAnalytics> buildBusPerformance(
            List<Booking> confirmed, List<Trip> trips,
            Map<Long, List<BookingPassenger>> passengersByBooking,
            Map<Long, List<TripSeat>> tripSeatsByTrip) {
        Map<Long, MetricAggregator> buses = new LinkedHashMap<>();

        for (Booking booking : confirmed) {
            Trip trip = booking.getTrip();
            Long busId = trip.getBus().getId();
            MetricAggregator agg = buses.computeIfAbsent(
                    busId, id -> new MetricAggregator(id, trip.getBus().getModel(), trip.getBus().getRegistrationNumber()));
            agg.bookings++;
            agg.passengers += passengersByBooking.getOrDefault(booking.getId(), List.of()).size();
            agg.revenue = agg.revenue.add(booking.getTotalAmount());
        }

        for (Trip trip : trips) {
            if (trip.getStatus() == TripStatus.CANCELLED) {
                continue;
            }
            MetricAggregator agg = buses.computeIfAbsent(
                    trip.getBus().getId(), id -> new MetricAggregator(id, trip.getBus().getModel(), trip.getBus().getRegistrationNumber()));
            agg.trips++;
            agg.addSeats(tripSeatsByTrip.getOrDefault(trip.getId(), List.of()));
        }

        return buses.values().stream()
                .sorted(MetricAggregator.byRevenueDesc())
                .map(agg -> new BusAnalytics(
                        agg.id, agg.subLabel, agg.label, agg.trips, agg.bookings,
                        agg.passengers, agg.revenue, roundOne(agg.occupancyRate())))
                .toList();
    }

    private List<OperatorAnalytics> buildOperatorPerformance(
            List<Booking> confirmed, List<Trip> trips,
            Map<Long, List<BookingPassenger>> passengersByBooking,
            Map<Long, List<TripSeat>> tripSeatsByTrip) {
        Map<Long, OperatorAggregator> operators = new LinkedHashMap<>();

        for (Booking booking : confirmed) {
            Trip trip = booking.getTrip();
            Long operatorId = trip.getBus().getOperator().getId();
            OperatorAggregator agg = operators.computeIfAbsent(
                    operatorId, id -> new OperatorAggregator(operatorId, trip.getBus().getOperator().getName()));
            agg.bookings++;
            agg.passengers += passengersByBooking.getOrDefault(booking.getId(), List.of()).size();
            agg.revenue = agg.revenue.add(booking.getTotalAmount());
        }

        for (Trip trip : trips) {
            if (trip.getStatus() == TripStatus.CANCELLED) {
                continue;
            }
            Long operatorId = trip.getBus().getOperator().getId();
            OperatorAggregator agg = operators.computeIfAbsent(
                    operatorId, id -> new OperatorAggregator(operatorId, trip.getBus().getOperator().getName()));
            agg.trips++;
            agg.addSeats(tripSeatsByTrip.getOrDefault(trip.getId(), List.of()));
            agg.noteBus(trip.getBus().getId());
        }

        return operators.values().stream()
                .sorted(MetricAggregator.byRevenueDesc())
                .map(agg -> new OperatorAnalytics(
                        agg.id, agg.label, agg.busCount, agg.trips, agg.bookings,
                        agg.passengers, agg.revenue, roundOne(agg.occupancyRate())))
                .toList();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private static LocalDate defaultStart(LocalDate from) {
        return from != null ? from : LocalDate.now().minusDays(DEFAULT_RANGE_DAYS);
    }

    private static LocalDate defaultEnd(LocalDate to, LocalDate start) {
        LocalDate end = to != null ? to : LocalDate.now();
        return end.isBefore(start) ? start : end;
    }

    private static double occupancyRate(long sold, long total) {
        if (total == 0) {
            return 0.0;
        }
        return sold * 100.0 / total;
    }

    private static double roundOne(double value) {
        return BigDecimal.valueOf(value)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private static final class TrendDay {
        long bookings;
        long passengers;
        BigDecimal revenue = BigDecimal.ZERO;
    }

    private static class MetricAggregator {
        final Long id;
        final String label;
        final String subLabel;
        long trips;
        long bookings;
        long passengers;
        long soldSeats;
        long totalSeats;
        BigDecimal revenue = BigDecimal.ZERO;

        MetricAggregator(Long id, String label, String subLabel) {
            this.id = id;
            this.label = label;
            this.subLabel = subLabel;
        }

        void addSeats(List<TripSeat> seats) {
            totalSeats += seats.size();
            soldSeats += seats.stream()
                    .filter(seat -> seat.getStatus() == TripSeatStatus.BOOKED)
                    .count();
        }

        double occupancyRate() {
            if (totalSeats == 0) {
                return 0.0;
            }
            return soldSeats * 100.0 / totalSeats;
        }

        static java.util.Comparator<MetricAggregator> byRevenueDesc() {
            return java.util.Comparator
                    .comparing((MetricAggregator agg) -> agg.revenue).reversed()
                    .thenComparing(agg -> agg.bookings, java.util.Comparator.reverseOrder());
        }
    }

    private static final class OperatorAggregator extends MetricAggregator {
        long busCount;
        final java.util.Set<Long> busIds = new java.util.LinkedHashSet<>();

        OperatorAggregator(Long id, String label) {
            super(id, label, null);
        }

        void noteBus(Long busId) {
            if (busIds.add(busId)) {
                busCount++;
            }
        }
    }
}