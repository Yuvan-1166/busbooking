import { cloneElement, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { parseApiError, getErrorMessage } from "../../utils/errorHandler";
import {
  generateTripDates,
  validateTripGeneration,
} from "../../utils/tripGeneration";
import {
  getTripStatusBadgeClass,
  getTripStatusLabel,
  isTripCancellable,
} from "../../utils/status";
import {
  INDIAN_PLATE_ERROR,
  isValidIndianPlate,
  normalizeIndianPlate,
} from "../../utils/registrationPlate";
import StateMessage from "../common/StateMessage";
import Pagination from "../common/Pagination";
import { LoadingPage } from "../common/Loading";
import MetricCard from "./MetricCard";
import SeatsWorkspace from "./SeatsWorkspace";
import ScheduleFormModal from "./ScheduleFormModal";
import TripDetailDrawer from "./TripDetailDrawer";
import FilterBar from "./FilterBar";

const emptyBus = {
  registrationNumber: "",
  model: "",
  busType: "SLEEPER",
  deckType: "SINGLE",
  status: "ACTIVE",
};
const emptySeat = {
  busId: "",
  seatNumber: "",
  seatType: "SEAT",
  position: "WINDOW",
};
const emptySchedule = {
  routeId: "",
  busId: "",
  departureTime: "",
  effectiveFrom: "",
  effectiveUntil: "",
  baseFare: "",
  pricePerKm: "",
  status: "ACTIVE",
  operatingDays: {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true,
  },
};

// ── Filter helpers ────────────────────────────────────────────────────────
const formatEnumLabel = (value) =>
  (value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const uniqueValues = (items, key) =>
  Array.from(new Set(items.map((item) => item[key]).filter(Boolean))).sort();

const toSelectOptions = (values, labelFn) =>
  values.map((value) => ({
    value,
    label: labelFn ? labelFn(value) : value,
  }));

const routeOptions = (routes) =>
  routes.map((route) => ({ value: String(route.id), label: route.name }));

const busOptions = (buses) =>
  buses.map((bus) => ({
    value: String(bus.id),
    label: `${bus.model} • ${bus.registrationNumber}`,
  }));

export default function OperatorDashboard() {
  const [buses, setBuses] = useState([]);
  const [seats, setSeats] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const { section } = useParams();
  const navigate = useNavigate();
  const view = section || "overview";
  const setView = (nextView) => navigate(`/operator/${nextView}`);
  const [busForm, setBusForm] = useState(emptyBus);
  const [editingBusId, setEditingBusId] = useState(null);
  const [seatForm, setSeatForm] = useState(emptySeat);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulePage, setSchedulePage] = useState(1);
  const [tripsPage, setTripsPage] = useState(1);

  const ITEMS_PER_PAGE = 8;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [busData, scheduleData, tripData, routeData] = await Promise.all([
        api.getBuses(),
        api.getSchedules(),
        api.getAllTrips(),
        api.getAllRoutes(),
      ]);
      setBuses(busData);
      setSchedules(scheduleData);
      setTrips(tripData);
      setRoutes(routeData);
      if (busData.length && !seatForm.busId)
        setSeatForm((current) => ({
          ...current,
          busId: String(busData[0].id),
        }));
      const seatResults = await Promise.all(
        busData.map((bus) => api.getSeatsByBus(bus.id)),
      );
      setSeats(seatResults.flat());
    } catch (loadError) {
      const appError = parseApiError(loadError);
      setError(getErrorMessage(appError));
      console.error("Failed to load operator data:", appError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Bus CRUD Operations ────────────────────────────────────────────────────
  const saveBus = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const registrationNumber = normalizeIndianPlate(busForm.registrationNumber);
    if (!isValidIndianPlate(busForm.registrationNumber)) {
      setError(INDIAN_PLATE_ERROR);
      return;
    }

    const payload = { ...busForm, registrationNumber };
    setSaving("Bus");
    try {
      if (editingBusId) {
        await api.updateBus(editingBusId, payload);
        setMessage("Bus updated successfully.");
        setEditingBusId(null);
      } else {
        await api.createBus(payload);
        setMessage("Bus created successfully.");
      }
      setBusForm(emptyBus);
      await loadData();
    } catch (saveError) {
      const appError = parseApiError(saveError);
      setError(getErrorMessage(appError));
      console.error("Bus save failed:", appError);
    } finally {
      setSaving("");
    }
  };

  const editBus = (bus) => {
    setBusForm(bus);
    setEditingBusId(bus.id);
  };

  const deleteBus = async (busId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this bus? All associated schedules and trips will be affected.",
      )
    ) {
      return;
    }
    setSaving("Bus");
    setError("");
    setMessage("");
    try {
      await api.deleteBus(busId);
      setMessage("Bus deleted successfully.");
      await loadData();
    } catch (deleteError) {
      const appError = parseApiError(deleteError);
      setError(getErrorMessage(appError));
      console.error("Bus delete failed:", appError);
    } finally {
      setSaving("");
    }
  };

  // ── Schedule CRUD Operations with Bulk Trips ──────────────────────────────
  const saveSchedule = async (event) => {
    event.preventDefault();
    setSaving("Schedule");
    setError("");
    setMessage("");
    try {
      // Validate trips derived from the schedule date range
      const validationErrors = validateTripGeneration(
        scheduleForm.effectiveFrom,
        scheduleForm.effectiveUntil,
        scheduleForm.operatingDays,
      );

      if (validationErrors.length > 0) {
        setError(validationErrors.join(" "));
        setSaving("");
        return;
      }

      // Generate trip dates within the schedule date range
      const tripDates = generateTripDates(
        scheduleForm.effectiveFrom,
        scheduleForm.effectiveUntil,
        scheduleForm.operatingDays,
      );

      const scheduleData = {
        routeId: Number(scheduleForm.routeId),
        busId: Number(scheduleForm.busId),
        departureTime: scheduleForm.departureTime,
        baseFare: Number(scheduleForm.baseFare),
        pricePerKm: Number(scheduleForm.pricePerKm),
        effectiveFrom: scheduleForm.effectiveFrom,
        effectiveUntil: scheduleForm.effectiveUntil,
        status: scheduleForm.status,
        // Backend expects comma-separated string
        operatingDays: Object.keys(scheduleForm.operatingDays)
          .filter((day) => scheduleForm.operatingDays[day])
          .map((day) => day.toUpperCase())
          .join(","),
      };

      let createdSchedule;
      if (editingScheduleId) {
        await api.updateSchedule(editingScheduleId, scheduleData);
        setMessage(
          `Schedule updated. ${tripDates.length} trips ready for publishing.`,
        );
        setEditingScheduleId(null);
      } else {
        createdSchedule = await api.createSchedule(scheduleData);

        // Bulk create trips
        if (tripDates.length > 0) {
          try {
            await api.createBulkTrips({
              scheduleId: createdSchedule.id,
              tripDates: tripDates,
            });
            setMessage(
              `Schedule created successfully! ${tripDates.length} trips published.`,
            );
          } catch (tripError) {
            // Schedule created but trip bulk creation failed
            const appError = parseApiError(tripError);
            console.error("Bulk trip creation failed:", appError);
            setMessage(
              `Schedule created but only ${tripDates.length} trips are pending. Please try publishing them individually.`,
            );
            setError(getErrorMessage(appError));
          }
        } else {
          setMessage("Schedule created successfully!");
        }
      }

      setScheduleForm(emptySchedule);
      await loadData();
    } catch (saveError) {
      const appError = parseApiError(saveError);
      setError(getErrorMessage(appError));
      console.error("Schedule save failed:", appError);
    } finally {
      setSaving("");
    }
  };

  const editSchedule = (schedule) => {
    setScheduleForm(schedule);
    setEditingScheduleId(schedule.id);
  };

  const deleteSchedule = async (scheduleId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this schedule? All associated trips will be deleted.",
      )
    ) {
      return;
    }
    setSaving("Schedule");
    setError("");
    setMessage("");
    try {
      await api.deleteSchedule(scheduleId);
      setMessage("Schedule deleted successfully.");
      await loadData();
    } catch (deleteError) {
      const appError = parseApiError(deleteError);
      setError(getErrorMessage(appError));
      console.error("Schedule delete failed:", appError);
    } finally {
      setSaving("");
    }
  };

  // ── Operating Days Handler ─────────────────────────────────────────────────
  const handleOperatingDayChange = (day) => {
    setScheduleForm((prev) => ({
      ...prev,
      operatingDays: {
        ...prev.operatingDays,
        [day]: !prev.operatingDays[day],
      },
    }));
  };

  // ── Trip Operations ───────────────────────────────────────────────────────
  const updateTripRequest = async (tripId, tripPayload) => {
    setSaving("Trip");
    setError("");
    setMessage("");
    try {
      await api.updateTrip(tripId, tripPayload);
      setMessage("Trip updated successfully.");
      await loadData();
    } catch (saveError) {
      const appError = parseApiError(saveError);
      setError(getErrorMessage(appError));
      console.error("Trip update failed:", appError);
      throw appError;
    } finally {
      setSaving("");
    }
  };

  const cancelTrip = async (tripId, cancellationReason) => {
    setError("");
    setMessage("");
    try {
      await api.cancelTrip(tripId, cancellationReason);
      setMessage(
        "Trip cancelled successfully. All passengers have been refunded.",
      );
      await loadData();
    } catch (cancelError) {
      const appError = parseApiError(cancelError);
      setError(getErrorMessage(appError));
      console.error("Trip cancellation failed:", appError);
      throw appError;
    }
  };

  // ── Seat Operations (unchanged) ────────────────────────────────────────────
  const saveSeat = async (action, label) => {
    setSaving(label);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(`${label} saved.`);
      await loadData();
      return true;
    } catch (saveError) {
      const appError = parseApiError(saveError);
      setError(getErrorMessage(appError));
      console.error("Seat operation failed:", appError);
      return false;
    } finally {
      setSaving("");
    }
  };

  const createSeat = (payload) =>
    saveSeat(() => api.createSeat(payload), "Seat");
  const createSeats = async (payloads) => {
    setSaving("Seats");
    setError("");
    setMessage("");
    try {
      await api.createSeats(payloads);
      setMessage(`${payloads.length} seats saved.`);
      await loadData();
      return true;
    } catch (saveError) {
      const appError = parseApiError(saveError);
      setError(getErrorMessage(appError));
      console.error("Bulk seat creation failed:", appError);
      return false;
    } finally {
      setSaving("");
    }
  };
  const updateSeat = (seatId, payload) =>
    saveSeat(() => api.updateSeat(seatId, payload), "Seat");
  const deleteSeat = (seatId) => saveSeat(() => api.deleteSeat(seatId), "Seat");

  return (
    <main className="w-full mx-auto mb-20 min-h-screen max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <section className="mb-8 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-8">
        <div className="flex items-center justify-between gap-6 max-[768px]:flex-col max-[768px]:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="badge badge-success">OPERATOR</span>
            </div>
            <h1 className="mb-3 text-4xl font-bold text-neutral-900">
              Manage Your Fleet
            </h1>
            <p className="max-w-md text-neutral-700">
              Set up buses, add seats, create schedules, and publish trips to
              passengers.
            </p>
          </div>
          <div className="card flex h-32 w-32 flex-col items-center justify-center bg-white text-center max-[768px]:ml-auto">
            <div className="mb-1 text-sm font-medium text-neutral-600">
              Total Buses
            </div>
            <div className="text-4xl font-bold text-primary-600">
              {buses.length}
            </div>
            <div className="text-xs text-neutral-500">registered</div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav
        className="mb-6 flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1"
        aria-label="Dashboard sections"
      >
        <NavTab
          active={view === "overview"}
          onClick={() => setView("overview")}
        >
          <svg
            className="mb-1 inline-block h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Overview
        </NavTab>
        <NavTab active={view === "buses"} onClick={() => setView("buses")}>
          <svg
            className="mb-1 inline-block h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          Buses
        </NavTab>
        <NavTab active={view === "seats"} onClick={() => setView("seats")}>
          <svg
            className="mb-1 inline-block h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          Seats
        </NavTab>
        <NavTab
          active={view === "schedules"}
          onClick={() => setView("schedules")}
        >
          <svg
            className="mb-1 inline-block h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Schedules
        </NavTab>
        <NavTab active={view === "trips"} onClick={() => setView("trips")}>
          <svg
            className="mb-1 inline-block h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Trips
        </NavTab>
      </nav>

      {/* Alerts */}
      {error && <div className="alert alert-error mb-6">{error}</div>}
      {message && <div className="alert alert-success mb-6">{message}</div>}

      {/* Content */}
      {loading ? (
        <LoadingPage
          message="Loading Dashboard"
          subMessage="Setting up your operator workspace"
          showLogo={false}
        />
      ) : (
        <>
          {view === "overview" && (
            <Overview
              buses={buses}
              seats={seats}
              schedules={schedules}
              trips={trips}
              setView={setView}
            />
          )}
          {view === "buses" && (
            <BusesView
              buses={buses}
              busForm={busForm}
              editingBusId={editingBusId}
              onBusChange={(field, value) =>
                setBusForm((prev) => ({ ...prev, [field]: value }))
              }
              onSaveBus={saveBus}
              onEditBus={editBus}
              onDeleteBus={deleteBus}
              onCancelEdit={() => {
                setBusForm(emptyBus);
                setEditingBusId(null);
              }}
              saving={saving === "Bus"}
            />
          )}
          {view === "seats" && (
            <SeatsWorkspace
              seats={seats}
              buses={buses}
              onCreate={createSeat}
              onCreateBatch={createSeats}
              onUpdate={updateSeat}
              onDelete={deleteSeat}
              saving={saving}
            />
          )}
          {view === "schedules" && (
            <SchedulesViewWithForm
              schedules={schedules}
              routes={routes}
              buses={buses}
              scheduleForm={scheduleForm}
              editingScheduleId={editingScheduleId}
              onScheduleChange={(field, value) =>
                setScheduleForm((prev) => ({ ...prev, [field]: value }))
              }
              onOperatingDayChange={handleOperatingDayChange}
              onSaveSchedule={saveSchedule}
              onEditSchedule={editSchedule}
              onDeleteSchedule={deleteSchedule}
              onCancelEdit={() => {
                setScheduleForm(emptySchedule);
                setEditingScheduleId(null);
              }}
              saving={saving === "Schedule"}
              onOpenModal={() => setShowScheduleModal(true)}
              onCloseModal={() => setShowScheduleModal(false)}
              showModal={showScheduleModal}
              schedulePage={schedulePage}
              onSchedulePageChange={setSchedulePage}
              tripsPage={tripsPage}
              onTripsPageChange={setTripsPage}
            />
          )}
          {view === "trips" && (
            <TripsView
              trips={trips}
              schedules={schedules}
              routes={routes}
              buses={buses}
              onCreateNew={() => setView("schedules")}
              tripsPage={tripsPage}
              onTripsPageChange={setTripsPage}
              onCancelTrip={cancelTrip}
              onUpdateTrip={updateTripRequest}
              updating={saving === "Trip"}
            />
          )}
        </>
      )}
    </main>
  );
}

// ── NavTab Component ───────────────────────────────────────────────────────
const NavTab = ({ active, onClick, children }) => (
  <button
    className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
      active
        ? "bg-white text-primary-600 shadow-sm"
        : "text-neutral-600 hover:text-neutral-900"
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

// ── Overview Component ────────────────────────────────────────────────────
const Overview = ({ buses, seats, schedules, trips, setView }) => (
  <section className="py-6">
    <h2 className="mb-6 text-2xl font-semibold text-neutral-900">
      Dashboard Overview
    </h2>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Buses"
        value={buses.length}
        onClick={() => setView("buses")}
        icon={
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        }
        color="primary"
      />
      <MetricCard
        label="Total Seats"
        value={seats.length}
        onClick={() => setView("seats")}
        icon={
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        }
        color="success"
      />
      <MetricCard
        label="Schedules"
        value={schedules.length}
        onClick={() => setView("schedules")}
        icon={
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        }
        color="warning"
      />
      <MetricCard
        label="Active Trips"
        value={trips.length}
        onClick={() => setView("trips")}
        icon={
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
        color="info"
      />
    </div>
  </section>
);

// ── Buses View Component ───────────────────────────────────────────────────
const BusesView = ({
  buses,
  busForm,
  editingBusId,
  onBusChange,
  onSaveBus,
  onEditBus,
  onDeleteBus,
  onCancelEdit,
  saving,
}) => {
  const [search, setSearch] = useState("");
  const [busType, setBusType] = useState("");
  const [deckType, setDeckType] = useState("");
  const [status, setStatus] = useState("");

  const filteredBuses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return buses.filter((bus) => {
      const matchesSearch =
        !query ||
        `${bus.registrationNumber} ${bus.model}`.toLowerCase().includes(query);
      const matchesType = !busType || bus.busType === busType;
      const matchesDeck = !deckType || bus.deckType === deckType;
      const matchesStatus = !status || bus.status === status;
      return matchesSearch && matchesType && matchesDeck && matchesStatus;
    });
  }, [buses, search, busType, deckType, status]);

  const clearFilters = () => {
    setSearch("");
    setBusType("");
    setDeckType("");
    setStatus("");
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Form */}
      <form onSubmit={onSaveBus} className="card h-fit">
        <h3 className="mb-6 text-lg font-semibold text-neutral-900">
          {editingBusId ? "Edit Bus" : "Add New Bus"}
        </h3>

        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Registration Number *</label>
            <input
              type="text"
              required
              value={busForm.registrationNumber}
              onChange={(e) =>
                onBusChange(
                  "registrationNumber",
                  e.target.value.toUpperCase(),
                )
              }
              className="input"
              placeholder="e.g., KA 01 AB 1234"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bus Model *</label>
            <input
              type="text"
              required
              value={busForm.model}
              onChange={(e) => onBusChange("model", e.target.value)}
              className="input"
              placeholder="e.g., Volvo Multi-Axle"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bus Type *</label>
            <select
              value={busForm.busType}
              onChange={(e) => onBusChange("busType", e.target.value)}
              className="select"
            >
              <option value="SLEEPER">Sleeper</option>
              <option value="SEMI_SLEEPER">Semi-Sleeper</option>
              <option value="SEATER">Seater</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Deck Type *</label>
            <select
              value={busForm.deckType}
              onChange={(e) => onBusChange("deckType", e.target.value)}
              className="select"
            >
              <option value="SINGLE">Single Deck</option>
              <option value="DOUBLE">Double Decker</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status *</label>
            <select
              value={busForm.status}
              onChange={(e) => onBusChange("status", e.target.value)}
              className="select"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1"
            >
              {saving ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : editingBusId ? (
                "Update Bus"
              ) : (
                "Create Bus"
              )}
            </button>
            {editingBusId && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="btn-ghost"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* List */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-neutral-900">
          Your Buses ({buses.length})
        </h3>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by registration number or model..."
          selects={[
            {
              label: "Bus Type",
              value: busType,
              onChange: setBusType,
              options: toSelectOptions(
                uniqueValues(buses, "busType"),
                formatEnumLabel,
              ),
            },
            {
              label: "Deck",
              value: deckType,
              onChange: setDeckType,
              options: toSelectOptions(
                uniqueValues(buses, "deckType"),
                (value) => `${formatEnumLabel(value)} Deck`,
              ),
            },
            {
              label: "Status",
              value: status,
              onChange: setStatus,
              options: toSelectOptions(
                uniqueValues(buses, "status"),
                formatEnumLabel,
              ),
            },
          ]}
          onClear={clearFilters}
          resultCount={filteredBuses.length}
          resultLabel="buses"
        />

        {filteredBuses.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200">
              <svg
                className="h-6 w-6 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <p className="text-sm text-neutral-600">
              No buses match your filters. Adjust the search or clear filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBuses.map((bus) => (
              <div
                key={bus.id}
                className="card card-hover flex items-center justify-between"
              >
                <div>
                  <h4 className="mb-1 font-semibold text-neutral-900">
                    {bus.model}
                  </h4>
                  <p className="text-sm text-neutral-600">
                    {bus.registrationNumber} · {bus.busType.replace(/_/g, " ")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`badge ${bus.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}
                    >
                      {bus.status}
                    </span>
                    <span className="badge badge-neutral">
                      {bus.deckType} Deck
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEditBus(bus)} className="btn-ghost">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteBus(bus.id)}
                    className="btn-ghost text-error-600"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ── Schedules View with Modal Form ────────────────────────────────────────
const SchedulesViewWithForm = ({
  schedules,
  routes,
  buses,
  scheduleForm,
  editingScheduleId,
  onScheduleChange,
  onOperatingDayChange,
  onSaveSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onCancelEdit,
  saving,
  onOpenModal,
  onCloseModal,
  showModal,
  schedulePage,
  onSchedulePageChange,
}) => {
  const ITEMS_PER_PAGE = 8;
  const [search, setSearch] = useState("");
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
  const [status, setStatus] = useState("");

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return schedules.filter((schedule) => {
      const route = routes.find((r) => r.id === schedule.routeId);
      const bus = buses.find((b) => b.id === schedule.busId);
      const matchesSearch =
        !query ||
        `${route?.name || ""} ${bus?.model || ""} ${bus?.registrationNumber || ""}`
          .toLowerCase()
          .includes(query);
      const matchesRoute = !routeId || String(schedule.routeId) === routeId;
      const matchesBus = !busId || String(schedule.busId) === busId;
      const matchesStatus = !status || schedule.status === status;
      return matchesSearch && matchesRoute && matchesBus && matchesStatus;
    });
  }, [schedules, routes, buses, search, routeId, busId, status]);

  const clearFilters = () => {
    setSearch("");
    setRouteId("");
    setBusId("");
    setStatus("");
  };

  useEffect(() => {
    onSchedulePageChange(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, routeId, busId, status]);

  const totalPages = Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE);
  const paginatedSchedules = useMemo(() => {
    const startIdx = (schedulePage - 1) * ITEMS_PER_PAGE;
    return filteredSchedules.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredSchedules, schedulePage]);

  return (
    <>
      {/* Modal */}
      <ScheduleFormModal
        isOpen={showModal}
        scheduleForm={scheduleForm}
        onScheduleChange={onScheduleChange}
        onOperatingDayChange={onOperatingDayChange}
        onSaveSchedule={onSaveSchedule}
        onCancelEdit={onCancelEdit}
        editingScheduleId={editingScheduleId}
        routes={routes}
        buses={buses}
        saving={saving}
        onClose={onCloseModal}
      />

      <section className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">
            Schedules ({schedules.length})
          </h3>
          <button onClick={onOpenModal} className="btn btn-primary">
            + Create Schedule
          </button>
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by route, bus model or registration..."
          selects={[
            {
              label: "Route",
              value: routeId,
              onChange: setRouteId,
              options: routeOptions(routes),
            },
            {
              label: "Bus",
              value: busId,
              onChange: setBusId,
              options: busOptions(buses),
            },
            {
              label: "Status",
              value: status,
              onChange: setStatus,
              options: toSelectOptions(
                uniqueValues(schedules, "status"),
                formatEnumLabel,
              ),
            },
          ]}
          onClear={clearFilters}
          resultCount={filteredSchedules.length}
          resultLabel="schedules"
        />

        {schedules.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
            No schedules yet. Click "Create Schedule" to get started.
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
            No schedules match your filters. Adjust the search or clear filters.
          </div>
        ) : (
          <>
            <div className="grid gap-3 mb-6">
              {paginatedSchedules.map((schedule) => {
                const route = routes.find((r) => r.id === schedule.routeId);
                const bus = buses.find((b) => b.id === schedule.busId);
                return (
                  <div
                    key={schedule.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-sm"
                  >
                    <div className="mb-3 pb-3 border-b border-neutral-200">
                      <h4 className="mb-1 text-sm font-semibold text-neutral-900">
                        {route?.name || "Unknown Route"}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {bus?.model || "Unknown Bus"} • Reg:{" "}
                        {bus?.registrationNumber || "—"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                      <div>
                        <p className="text-neutral-500">Departure</p>
                        <p className="font-semibold text-neutral-900">
                          {schedule.departureTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Pricing</p>
                        <p className="font-semibold text-neutral-900">
                          ₹{schedule.baseFare} + ₹{schedule.pricePerKm}/km
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Effective</p>
                        <p className="text-[11px] font-semibold text-neutral-900">
                          {schedule.effectiveFrom
                            ? `${schedule.effectiveFrom.substring(5)}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Status</p>
                        <span
                          className={`badge ${schedule.status === "ACTIVE" ? "badge-success" : "badge-neutral"}`}
                        >
                          {schedule.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-neutral-200">
                      <button
                        onClick={() => {
                          onEditSchedule(schedule);
                          onOpenModal();
                        }}
                        className="flex-1 rounded px-2 py-1.5 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteSchedule(schedule.id)}
                        className="flex-1 rounded px-2 py-1.5 text-xs font-semibold text-error-600 transition-colors hover:bg-error-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={schedulePage}
                totalPages={totalPages}
                onPageChange={onSchedulePageChange}
                isLoading={saving}
              />
            )}
          </>
        )}
      </section>
    </>
  );
};

// ── Trips View with Detail Drawer ─────────────────────────────────────────
const TripsView = ({
  trips,
  schedules,
  routes,
  buses,
  onCreateNew,
  tripsPage,
  onTripsPageChange,
  onCancelTrip,
  onUpdateTrip,
  updating,
}) => {
  const ITEMS_PER_PAGE = 8;
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [drawerAction, setDrawerAction] = useState("details");
  const [search, setSearch] = useState("");
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();
    return trips.filter((trip) => {
      const route = routes.find((r) => r.id === trip.routeId);
      const bus = buses.find((b) => b.id === trip.busId);
      const matchesSearch =
        !query ||
        `${route?.name || ""} ${bus?.model || ""} ${bus?.registrationNumber || ""}`
          .toLowerCase()
          .includes(query);
      const matchesRoute = !routeId || String(trip.routeId) === routeId;
      const matchesBus = !busId || String(trip.busId) === busId;
      const matchesStatus = !status || trip.status === status;
      const matchesFrom = !dateFrom || trip.tripDate >= dateFrom;
      const matchesTo = !dateTo || trip.tripDate <= dateTo;
      return (
        matchesSearch &&
        matchesRoute &&
        matchesBus &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [trips, routes, buses, search, routeId, busId, status, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch("");
    setRouteId("");
    setBusId("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  };

  useEffect(() => {
    onTripsPageChange(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, routeId, busId, status, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredTrips.length / ITEMS_PER_PAGE);
  const paginatedTrips = useMemo(() => {
    const startIdx = (tripsPage - 1) * ITEMS_PER_PAGE;
    return filteredTrips.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredTrips, tripsPage]);

  const openTrip = (trip, action = "details") => {
    setSelectedTrip(trip);
    setDrawerAction(action);
  };

  return (
    <>
      <TripDetailDrawer
        key={`${selectedTrip?.id}-${drawerAction}`}
        trip={selectedTrip}
        schedules={schedules}
        routes={routes}
        buses={buses}
        onClose={() => setSelectedTrip(null)}
        onUpdate={onUpdateTrip}
        onCancelTrip={onCancelTrip}
        saving={updating}
        initialAction={drawerAction}
      />

      <section className="py-8">
        <div className="mb-6 flex items-center justify-between max-[600px]:flex-col max-[600px]:gap-3">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
              Published Trips
            </h3>
            <p className="text-sm text-neutral-500">
              {trips.length} trips • Click a trip to view details or edit
            </p>
          </div>
          <button onClick={onCreateNew} className="btn btn-primary">
            + Create Schedule
          </button>
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by route, bus model or registration..."
          selects={[
            {
              label: "Route",
              value: routeId,
              onChange: setRouteId,
              options: routeOptions(routes),
            },
            {
              label: "Bus",
              value: busId,
              onChange: setBusId,
              options: busOptions(buses),
            },
            {
              label: "Status",
              value: status,
              onChange: setStatus,
              options: toSelectOptions(
                uniqueValues(trips, "status"),
                formatEnumLabel,
              ),
            },
          ]}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onClear={clearFilters}
          resultCount={filteredTrips.length}
          resultLabel="trips"
        />

        {trips.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
            No trips published yet. Create a schedule to get started.
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
            No trips match your filters. Adjust the search or clear filters.
          </div>
        ) : (
          <>
            <div className="grid gap-3 mb-6">
              {paginatedTrips.map((trip) => {
                const schedule = schedules.find(
                  (s) => s.id === trip.scheduleId,
                );
                const route = routes.find((r) => r.id === schedule?.routeId);
                const bus = buses.find((b) => b.id === schedule?.busId);
                return (
                  <div
                    key={trip.id}
                    onClick={() => openTrip(trip)}
                    className="cursor-pointer rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-sm"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openTrip(trip);
                      }
                    }}
                  >
                    <div className="grid items-start gap-4 grid-cols-2 max-[600px]:grid-cols-1">
                      {/* Left: Route & Bus */}
                      <div className="pb-3 border-b border-neutral-200 max-[600px]:pb-0">
                        <h4 className="mb-1 text-sm font-semibold text-neutral-900">
                          {route?.name || "Unknown Route"}
                        </h4>
                        <p className="mb-2 text-xs text-neutral-500">
                          {bus?.model || "Unknown Bus"}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Reg: {bus?.registrationNumber || "—"}
                        </p>
                      </div>

                      {/* Right: Trip Details & Actions */}
                      <div>
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <p className="mb-1 text-xs text-neutral-500">
                              Trip Date
                            </p>
                            <p className="text-sm font-semibold text-neutral-900">
                              {trip.tripDate}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              Departure: {schedule?.departureTime || "—"}
                            </p>
                          </div>
                          <span
                            className={`badge ${getTripStatusBadgeClass(trip.status)}`}
                          >
                            {getTripStatusLabel(trip.status)}
                          </span>
                        </div>
                        {isTripCancellable(trip) && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openTrip(trip, "cancel");
                            }}
                            className="mt-2 w-full rounded border border-error-200 px-3 py-1.5 text-xs font-semibold text-error-600 transition-colors hover:bg-error-50"
                          >
                            Cancel Trip
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={tripsPage}
                totalPages={totalPages}
                onPageChange={onTripsPageChange}
                isLoading={false}
              />
            )}
          </>
        )}
      </section>
    </>
  );
};
