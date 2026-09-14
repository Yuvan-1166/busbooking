import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "./api";
import AccessDenied from "./auth/AccessDenied";
import { useAuth } from "./auth/AuthContext";
import BookingPanel from "./components/booking/BookingPanel";
import Bookings from "./components/booking/Bookings";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import PaymentPage from "./components/payment/PaymentPage";
import SearchPage from "./components/search/SearchPage";
import AdminDashboard from "./components/workspace/AdminDashboard";
import OperatorDashboard from "./components/workspace/OperatorDashboard";

function App() {
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripSeats, setTripSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [error, setError] = useState("");
  const [authorizationError, setAuthorizationError] = useState(false);
  const { session, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const canBook = hasRole("PASSENGER");
  const isOperator = hasRole("OPERATOR");
  const isAdmin = hasRole("ADMIN");

  const handleLogout = () => {
    navigate("/", { replace: true });
    logout();
  };

  const loadTickets = async () => {
    if (!canBook) {
      setTickets([]);
      return;
    }
    setTicketsLoading(true);
    try {
      setTickets(await api.getTickets());
    } catch (ticketError) {
      setError(ticketError.message);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [session?.email, canBook]);

  useEffect(() => {
    if (!hasRole("PASSENGER")) {
      setLoading(false);
      return;
    }
    setDate(new Date().toISOString().slice(0, 10));
    Promise.all([api.getLocations(), api.getRoutes(), api.getSchedules()])
      .then(async ([locationData, routeData, scheduleData]) => {
        setLocations(locationData);
        setRoutes(routeData);
        setSchedules(scheduleData);
        const stopResults = await Promise.allSettled(
          routeData.map((route) => api.getRouteStops(route.id)),
        );
        const failedStops = stopResults.filter(
          (result) => result.status === "rejected",
        );
        setRouteStops(
          stopResults
            .filter((result) => result.status === "fulfilled")
            .flatMap((result) => result.value),
        );
        if (failedStops.length)
          setError(
            `${failedStops.length} route stop request(s) failed. Check the backend response.`,
          );
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [session?.roles?.join(",")]);

  const availableLocations = useMemo(() => {
    const ids = new Set(routeStops.map((stop) => stop.locationId));
    return locations.filter((location) => ids.has(location.id));
  }, [locations, routeStops]);

  useEffect(() => {
    if (!from && availableLocations[0])
      setFrom(String(availableLocations[0].id));
    if (!to && availableLocations[1]) setTo(String(availableLocations[1].id));
  }, [availableLocations, from, to]);

  const matchingRoute = useMemo(
    () =>
      routes.find((route) => {
        const stops = routeStops
          .filter((stop) => stop.routeId === route.id)
          .sort((a, b) => a.stopOrder - b.stopOrder);
        return stops.some(
          (stop, index) =>
            String(stop.locationId) === from &&
            stops
              .slice(index + 1)
              .some((nextStop) => String(nextStop.locationId) === to),
        );
      }),
    [from, routeStops, routes, to],
  );

  const getTripFare = (trip) => {
    const schedule = schedules.find(
      (item) => String(item.id) === String(trip.scheduleId),
    );
    const stops = routeStops
      .filter((stop) => stop.routeId === trip.routeId)
      .sort((left, right) => left.stopOrder - right.stopOrder);
    const pickupStop = stops.find((stop) => String(stop.locationId) === from);
    const dropStop = stops.find((stop) => String(stop.locationId) === to);
    const baseFare = Number(schedule?.baseFare ?? trip.startingFare);
    const pricePerKm = Number(schedule?.pricePerKm);
    const pickupDistance = Number(pickupStop?.distanceFromOriginKm);
    const dropDistance = Number(dropStop?.distanceFromOriginKm);

    if (
      !Number.isFinite(baseFare) ||
      !Number.isFinite(pricePerKm) ||
      !Number.isFinite(pickupDistance) ||
      !Number.isFinite(dropDistance) ||
      dropDistance <= pickupDistance
    ) return null;

    return Math.round(
      (baseFare + (dropDistance - pickupDistance) * pricePerKm) * 100,
    ) / 100;
  };

  const searchTrips = async (event) => {
    event.preventDefault();
    setError("");
    if (!matchingRoute)
      return setError("No route connects the selected locations.");
    setSearching(true);
    try {
      setTrips(await api.getTrips(matchingRoute.id, date));
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setSearching(false);
    }
  };

  const openTrip = async (trip) => {
    setError("");
    if (!canBook) {
      setAuthorizationError(true);
      return false;
    }
    try {
      setTripSeats(await api.getSeats(trip.id));
      setSelectedSeats([]);
      setSelectedTrip(trip);
      return true;
    } catch (seatError) {
      setError(seatError.message);
      return false;
    }
  };

  const toggleSeat = (seat) =>
    setSelectedSeats((current) =>
      current.includes(seat.id)
        ? current.filter((id) => id !== seat.id)
        : current.length < 10
          ? [...current, seat.id]
          : current,
    );
  const selectedSeatObjects = tripSeats.filter((seat) =>
    selectedSeats.includes(seat.id),
  );

  const confirmBooking = async ({ passengers }) => {
    setError("");
    if (!selectedTrip || !selectedSeats.length)
      return setError("Select at least one available seat.");
    if (!passengers.length || passengers.some((passenger) =>
      !passenger.tripSeatId || !passenger.firstName || !passenger.lastName ||
      !passenger.age || !passenger.gender
    )) return setError("Complete passenger details for every selected seat.");
    setBookingInProgress(true);
    try {
      // Build per-seat hold items pairing each trip seat ID with the passenger's gender
      const holdItems = passengers.map((passenger) => ({
        tripSeatId: passenger.tripSeatId,
        gender: passenger.gender,
      }));
      await api.holdSeats(selectedTrip.id, holdItems);
      const created = await api.createBooking({
        tripId: selectedTrip.id,
        pickupLocationId: Number(from),
        dropLocationId: Number(to),
        passengers,
      });
      // Navigate to the dedicated payment page — payment happens there
      navigate(`/pay/${created.id}`);
    } catch (bookingError) {
      setError(bookingError.message);
    } finally {
      setBookingInProgress(false);
    }
  };

  const handlePaymentSuccess = (ticket) => {
    setTickets((current) => [
      ticket,
      ...current.filter((item) => item.id !== ticket.id),
    ]);
  };

  const cancelBooking = async (ticket, reason) => {
    setError("");
    try {
      const response = await api.cancelBooking(ticket.bookingId, reason);
      await loadTickets();
      return response;
    } catch (cancellationError) {
      setError(cancellationError.message);
      throw cancellationError;
    }
  };

  return (
    <div className="app-shell">
      <Header
        email={session.email}
        roles={session.roles}
        onLogout={handleLogout}
      />
      {error && (
        <div className="mx-auto mt-4 max-w-[1168px] border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]" role="alert">
          {error}
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={isAdmin ? "/admin" : isOperator ? "/operator" : "/search"}
              replace
            />
          }
        />
        <Route
          path="/search"
          element={
            isAdmin || isOperator ? (
              <Navigate to={isAdmin ? "/admin" : "/operator"} replace />
            ) : authorizationError ? (
              <AccessDenied />
            ) : (
              <SearchPage
                locations={locations}
                routes={routes}
                routeStops={routeStops}
                availableLocations={availableLocations}
                from={from}
                to={to}
                date={date}
                loading={loading}
                searching={searching}
                trips={trips}
                matchingRoute={matchingRoute}
                onFromChange={setFrom}
                onToChange={setTo}
                onDateChange={setDate}
                onSwap={() => {
                  setFrom(to);
                  setTo(from);
                }}
                onSubmit={searchTrips}
                onTripSelect={async (trip) => {
                  const fare = getTripFare(trip);
                  if (fare === null) {
                    setError("Fare is unavailable for this route.");
                    return;
                  }
                  if (await openTrip({ ...trip, startingFare: fare })) {
                    navigate(`/book/${trip.id}`);
                  }
                }}
                getTripFare={getTripFare}
              />
            )
          }
        />
        <Route
          path="/book/:tripId"
          element={
            isAdmin || isOperator ? (
              <Navigate to={isAdmin ? "/admin" : "/operator"} replace />
            ) : canBook && selectedTrip ? (
              <BookingPanel
                trip={selectedTrip}
                seats={tripSeats}
                selectedSeats={selectedSeatObjects}
                toggleSeat={toggleSeat}
                onConfirm={confirmBooking}
                bookingInProgress={bookingInProgress}
                onBack={() => {
                  navigate("/bookings");
                }}
              />
            ) : (
              <Navigate to="/search" replace />
            )
          }
        />
        <Route
          path="/pay/:bookingId"
          element={
            canBook ? (
              <PaymentPage
                locations={locations}
                onPaymentSuccess={handlePaymentSuccess}
              />
            ) : (
              <AccessDenied />
            )
          }
        />
        <Route
          path="/bookings"
          element={
            canBook ? (
              <Bookings
                tickets={tickets}
                loading={ticketsLoading}
                onFind={() => navigate("/search")}
                onCancel={cancelBooking}
              />
            ) : (
              <AccessDenied />
            )
          }
        />
        <Route
          path="/operator"
          element={
            isOperator ? <Navigate to="/operator/overview" replace /> : <AccessDenied />
          }
        />
        <Route
          path="/operator/:section"
          element={isOperator ? <OperatorDashboard /> : <AccessDenied />}
        />
        <Route
          path="/admin"
          element={
            isAdmin ? <Navigate to="/admin/overview" replace /> : <AccessDenied />
          }
        />
        <Route
          path="/admin/:section"
          element={isAdmin ? <AdminDashboard /> : <AccessDenied />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
