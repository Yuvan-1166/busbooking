import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { api } from "./api";
import { enrichTripsData } from "./utils/tripEnricher";
import { parseApiError, getErrorMessage } from "./utils/errorHandler";
import AccessDenied from "./auth/AccessDenied";
import { useAuth } from "./auth/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import BookingPanel from "./components/booking/BookingPanel";
import Bookings from "./components/booking/Bookings";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import PaymentPage from "./components/payment/PaymentPage";
import ProfilePage from "./components/profile/ProfilePage";
import HomePage from "./components/search/HomePage";
import SearchResults from "./components/search/SearchResults";
import AdminDashboard from "./components/workspace/AdminDashboard";
import OperatorDashboard from "./components/workspace/OperatorDashboard";
import AuthPage from "./auth/AuthPage";
import OnboardingPage from "./components/auth/OnboardingPage";
import TotpSetupPage from "./components/auth/TotpSetupPage";
import TotpVerificationPage from "./components/auth/TotpVerificationPageWrapper";
import TwitterCallback from "./components/auth/TwitterCallback";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import TermsOfService from "./components/legal/TermsOfService";

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
  const [user, setUser] = useState(null);
  const { session, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const canBook = hasRole("PASSENGER");
  const isOperator = hasRole("OPERATOR");
  const isAdmin = hasRole("ADMIN");

  // Redirect operators and admins to their respective routes when at /
  // Also redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/onboarding") {
      // Check if user needs to complete onboarding
      if (session && !session.onboardingRequired) {
        // User is authenticated and has completed onboarding
        if (isAdmin) {
          navigate("/admin", { replace: true });
        } else if (isOperator) {
          navigate("/operator", { replace: true });
        }
      } else if (session && session.onboardingRequired) {
        // User needs to complete onboarding
        navigate("/onboarding", { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isAdmin, isOperator, location.pathname]);

  const handleLogout = () => {
    navigate("/login", { replace: true });
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
      const appError = parseApiError(ticketError);
      setError(getErrorMessage(appError));
      console.error("Failed to load tickets:", appError);
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
        if (failedStops.length) {
          const errorMsg = `${failedStops.length} route(s) failed to load. Some routes may be unavailable.`;
          setError(errorMsg);
          console.warn(errorMsg);
        }
      })
      .catch((loadError) => {
        const appError = parseApiError(loadError);
        setError(getErrorMessage(appError));
        console.error("Failed to load search data:", appError);
      })
      .finally(() => setLoading(false));
  }, [session?.roles?.join(","), hasRole]);
  const availableLocations = useMemo(() => {
    const ids = new Set(routeStops.map((stop) => stop.locationId));
    return locations.filter((location) => ids.has(location.id));
  }, [locations, routeStops]);

  useEffect(() => {
    if (!session?.email) {
      setUser(null);
      return;
    }
    api.getCurrentUser().then(setUser).catch(console.error);
  }, [session?.email]);

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
    )
      return null;

    return (
      Math.round(
        (baseFare + (dropDistance - pickupDistance) * pricePerKm) * 100,
      ) / 100
    );
  };

  const searchTrips = async (event) => {
    event.preventDefault();
    setError("");
    if (!matchingRoute)
      return setError("No route connects the selected locations.");
    setSearching(true);
    try {
      const rawTrips = await api.getTrips(matchingRoute.id, date);
      const enrichedTrips = await enrichTripsData(rawTrips, api);
      setTrips(enrichedTrips);
      navigate("/search");
    } catch (searchError) {
      const appError = parseApiError(searchError);
      setError(getErrorMessage(appError));
      console.error("Failed to search trips:", appError);
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
      const appError = parseApiError(seatError);
      setError(getErrorMessage(appError));
      console.error("Failed to load seats:", appError);
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
    if (
      !passengers.length ||
      passengers.some(
        (passenger) =>
          !passenger.tripSeatId ||
          !passenger.firstName ||
          !passenger.lastName ||
          !passenger.age ||
          !passenger.gender,
      )
    )
      return setError("Complete passenger details for every selected seat.");
    setBookingInProgress(true);
    try {
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
      navigate(`/pay/${created.id}`);
    } catch (bookingError) {
      const appError = parseApiError(bookingError);
      setError(getErrorMessage(appError));
      console.error("Booking failed:", appError);
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
      const appError = parseApiError(cancellationError);
      setError(getErrorMessage(appError));
      console.error("Cancellation failed:", appError);
      throw appError;
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-shell">
        {session && (
          <Header
            email={session.email}
            firstName={user?.firstName}
            lastName={user?.lastName}
            roles={session.roles}
          />
        )}
        {error && (
          <div
            className="mx-auto mt-4 max-w-[1168px] border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]"
            role="alert"
          >
            {error}
          </div>
        )}
        <Routes>
          {/* Auth routes - must be first to avoid being caught by other routes */}
          <Route path="/totp/verify" element={<TotpVerificationPage />} />
          <Route
            path="/totp/setup"
            element={
              session ? <TotpSetupPage /> : <Navigate to="/login" replace />
            }
          />
          {/* Twitter OAuth callback — public, no auth guard */}
          <Route path="/auth/twitter/callback" element={<TwitterCallback />} />
          {/* Legal pages — public, required by Twitter for OAuth app approval */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route
            path="/login"
            element={
              session ? (
                // Redirect authenticated users to their appropriate page
                isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : isOperator ? (
                  <Navigate to="/operator" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <AuthPage />
              )
            }
          />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route
            path="/"
            element={
              session ? (
                canBook ? (
                  <HomePage
                    locations={availableLocations}
                    from={from}
                    to={to}
                    date={date}
                    loading={loading}
                    searching={searching}
                    matchingRoute={matchingRoute}
                    onFromChange={setFrom}
                    onToChange={setTo}
                    onDateChange={setDate}
                    onSwap={() => {
                      setFrom(to);
                      setTo(from);
                    }}
                    onSubmit={searchTrips}
                  />
                ) : isAdmin ? (
                  <Navigate to="/admin" replace />
                ) : isOperator ? (
                  <Navigate to="/operator" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/search"
            element={
              session && canBook ? (
                <SearchResults
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
              ) : (
                <Navigate to={session ? "/" : "/login"} replace />
              )
            }
          />
          <Route
            path="/book/:tripId"
            element={
              !session ? (
                <Navigate to="/login" replace />
              ) : isAdmin || isOperator ? (
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
                    navigate("/search");
                  }}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/pay/:bookingId"
            element={
              session && canBook ? (
                <PaymentPage
                  locations={locations}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              ) : (
                <Navigate to={session ? "/" : "/login"} replace />
              )
            }
          />
          <Route
            path="/bookings"
            element={
              session && canBook ? (
                <Bookings
                  tickets={tickets}
                  loading={ticketsLoading}
                  onFind={() => navigate("/")}
                  onCancel={cancelBooking}
                />
              ) : (
                <Navigate to={session ? "/" : "/login"} replace />
              )
            }
          />
          <Route
            path="/operator"
            element={
              !session ? (
                <Navigate to="/login" replace />
              ) : isOperator ? (
                <Navigate to="/operator/overview" replace />
              ) : (
                <AccessDenied />
              )
            }
          />
          <Route
            path="/operator/:section"
            element={
              !session ? (
                <Navigate to="/login" replace />
              ) : isOperator ? (
                <OperatorDashboard />
              ) : (
                <AccessDenied />
              )
            }
          />
          <Route
            path="/admin"
            element={
              !session ? (
                <Navigate to="/login" replace />
              ) : isAdmin ? (
                <Navigate to="/admin/overview" replace />
              ) : (
                <AccessDenied />
              )
            }
          />
          <Route
            path="/admin/:section"
            element={
              !session ? (
                <Navigate to="/login" replace />
              ) : isAdmin ? (
                <AdminDashboard />
              ) : (
                <AccessDenied />
              )
            }
          />
          <Route
            path="/profile"
            element={
              session ? (
                <ProfilePage onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default App;
