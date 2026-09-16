import { cloneElement, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { parseApiError, getErrorMessage } from "../../utils/errorHandler";
import { generateTripDates, validateTripGeneration } from "../../utils/tripGeneration";
import StateMessage from "../common/StateMessage";
import Pagination from "../common/Pagination";
import MetricCard from "./MetricCard";
import SeatsWorkspace from "./SeatsWorkspace";
import ScheduleFormModal from "./ScheduleFormModal";

const emptyBus = {
  registrationNumber: "",
  model: "",
  busType: "SLEEPER",
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
  tripGenerationFrom: "",
  tripGenerationTo: "",
};

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
    setSaving("Bus");
    setError("");
    setMessage("");
    try {
      if (editingBusId) {
        await api.updateBus(editingBusId, busForm);
        setMessage("Bus updated successfully.");
        setEditingBusId(null);
      } else {
        await api.createBus(busForm);
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
    if (!window.confirm("Are you sure you want to delete this bus? All associated schedules and trips will be affected.")) {
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
      // Validate trip generation
      const validationErrors = validateTripGeneration(
        scheduleForm.tripGenerationFrom,
        scheduleForm.tripGenerationTo,
        scheduleForm.operatingDays
      );

      if (validationErrors.length > 0) {
        setError(validationErrors.join(" "));
        setSaving("");
        return;
      }

      // Generate trip dates
      const tripDates = generateTripDates(
        scheduleForm.tripGenerationFrom,
        scheduleForm.tripGenerationTo,
        scheduleForm.operatingDays
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
        setMessage(`Schedule updated. ${tripDates.length} trips ready for publishing.`);
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
              `Schedule created successfully! ${tripDates.length} trips published.`
            );
          } catch (tripError) {
            // Schedule created but trip bulk creation failed
            const appError = parseApiError(tripError);
            console.error("Bulk trip creation failed:", appError);
            setMessage(
              `Schedule created but only ${tripDates.length} trips are pending. Please try publishing them individually.`
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
    if (!window.confirm("Are you sure you want to delete this schedule? All associated trips will be deleted.")) {
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

  // ── Trip CRUD Operations ───────────────────────────────────────────────────
  const saveTrip = async (event) => {
    event.preventDefault();
    setSaving("Trip");
    setError("");
    setMessage("");
    try {
      const tripData = {
        scheduleId: Number(tripForm.scheduleId),
        tripDate: tripForm.tripDate,
      };

      if (editingTripId) {
        await api.updateTrip(editingTripId, tripData);
        setMessage("Trip updated successfully.");
        setEditingTripId(null);
      } else {
        await api.createTrip(tripData);
        setMessage("Trip created successfully.");
      }
      setTripForm(emptyTrip);
      await loadData();
    } catch (saveError) {
      const appError = parseApiError(saveError);
      setError(getErrorMessage(appError));
      console.error("Trip save failed:", appError);
    } finally {
      setSaving("");
    }
  };

  const editTrip = (trip) => {
    setTripForm(trip);
    setEditingTripId(trip.id);
  };

  const deleteTrip = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip? Passengers with bookings will be affected.")) {
      return;
    }
    setSaving("Trip");
    setError("");
    setMessage("");
    try {
      await api.deleteTrip(tripId);
      setMessage("Trip deleted successfully.");
      await loadData();
    } catch (deleteError) {
      const appError = parseApiError(deleteError);
      setError(getErrorMessage(appError));
      console.error("Trip delete failed:", appError);
    } finally {
      setSaving("");
    }
  };

  const cancelTrip = async (tripId, cancellationReason) => {
    setError("");
    setMessage("");
    try {
      await api.cancelTrip(tripId, cancellationReason);
      setMessage("Trip cancelled successfully. All passengers have been refunded.");
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
      for (const payload of payloads) await api.createSeat(payload);
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
  const deleteSeat = (seatId) =>
    saveSeat(() => api.deleteSeat(seatId), "Seat");

  return (
    <main className="mx-auto mb-[100px] max-w-[1168px] max-[900px]:mx-[22px] max-[600px]:mx-4">
      <section className="flex min-h-[300px] items-center justify-between overflow-hidden bg-[#dce5d5] px-[52px] py-[45px] max-[900px]:px-[30px] max-[600px]:block max-[600px]:px-[22px] max-[600px]:py-[35px]">
        <div>
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            OPERATOR
          </p>
          <h1 className="mb-4 font-display text-[52px] font-semibold leading-[.96] tracking-[-.04em] text-ink max-[600px]:text-[41px]">
            Manage buses
            <br />
            <em className="text-orange">and services.</em>
          </h1>
          <p className="max-w-[340px] text-sm leading-6 text-[#606a5d]">
            Set up buses, add seats, create schedules, and publish trips.
          </p>
        </div>
        <div className="grid h-[170px] w-[170px] place-items-center content-center rounded-full border border-[rgba(32,38,34,.25)] text-center max-[600px]:ml-auto max-[600px]:mt-6 max-[600px]:h-[120px] max-[600px]:w-[120px]">
          <span className="font-mono text-[10px] text-green">BUSES</span>
          <strong className="my-2 font-display text-[43px] font-semibold max-[600px]:text-[32px]">
            {buses.length}
          </strong>
          <small className="text-[10px] text-muted">registered</small>
        </div>
      </section>
      <nav className="flex gap-7 overflow-x-auto border-b border-line px-0 pt-[18px] max-[600px]:gap-5">
        <Tab active={view === "overview"} onClick={() => setView("overview")}>
          Overview
        </Tab>
        <Tab active={view === "buses"} onClick={() => setView("buses")}>
          Buses
        </Tab>
        <Tab active={view === "seats"} onClick={() => setView("seats")}>
          Seats
        </Tab>
        <Tab active={view === "schedules"} onClick={() => setView("schedules")}>
          Schedules
        </Tab>
        <Tab active={view === "trips"} onClick={() => setView("trips")}>
          Trips
        </Tab>
      </nav>
      {error && (
        <div
          className="my-4 border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]"
          role="alert"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          className="my-4 border border-[#a5bea0] bg-[#e4eee1] px-4 py-3 text-xs text-green"
          role="status"
        >
          {message}
        </div>
      )}
      {loading ? (
        <StateMessage>Loading operator data...</StateMessage>
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
              onBusChange={(field, value) => setBusForm(prev => ({ ...prev, [field]: value }))}
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
              createSeat={createSeat}
              createSeats={createSeats}
              updateSeat={updateSeat}
              deleteSeat={deleteSeat}
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
              onScheduleChange={(field, value) => setScheduleForm(prev => ({ ...prev, [field]: value }))}
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
            <TripsViewReadOnly
              trips={trips}
              schedules={schedules}
              routes={routes}
              buses={buses}
              onCreateNew={() => setView("schedules")}
              tripsPage={tripsPage}
              onTripsPageChange={setTripsPage}
              onCancelTrip={cancelTrip}
            />
          )}
        </>
      )}
    </main>
  );
}

// ── Tab Component ──────────────────────────────────────────────────────────
const Tab = ({ active, onClick, children }) => (
  <button
    className={`border-b-2 p-2 text-sm font-semibold transition-colors max-[600px]:text-xs ${
      active
        ? "border-ink text-ink"
        : "border-transparent text-muted hover:text-ink"
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

// ── Overview Component ────────────────────────────────────────────────────
const Overview = ({ buses, seats, schedules, trips, setView }) => (
  <section className="py-10">
    <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
      <MetricCard
        label="Buses"
        value={buses.length}
        onClick={() => setView("buses")}
      />
      <MetricCard
        label="Total Seats"
        value={seats.length}
        onClick={() => setView("seats")}
      />
      <MetricCard
        label="Schedules"
        value={schedules.length}
        onClick={() => setView("schedules")}
      />
      <MetricCard
        label="Trips"
        value={trips.length}
        onClick={() => setView("trips")}
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
}) => (
  <section className="grid grid-cols-[350px_1fr] gap-8 py-8 max-[900px]:grid-cols-1">
    {/* Form */}
    <form onSubmit={onSaveBus} className="space-y-4 rounded-lg border border-[#e7e5dc] bg-white p-6">
      <h3 className="text-lg font-semibold text-ink">
        {editingBusId ? "Edit Bus" : "Add New Bus"}
      </h3>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Registration Number</span>
        <input
          type="text"
          required
          value={busForm.registrationNumber}
          onChange={(e) => onBusChange("registrationNumber", e.target.value)}
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        />
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Model</span>
        <input
          type="text"
          required
          value={busForm.model}
          onChange={(e) => onBusChange("model", e.target.value)}
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        />
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Bus Type</span>
        <select
          value={busForm.busType}
          onChange={(e) => onBusChange("busType", e.target.value)}
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        >
          <option value="SLEEPER">Sleeper</option>
          <option value="SEMI_SLEEPER">Semi-Sleeper</option>
          <option value="AC_SLEEPER">AC Sleeper</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Status</span>
        <select
          value={busForm.status}
          onChange={(e) => onBusChange("status", e.target.value)}
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </label>
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-orange text-white py-2 rounded font-semibold hover:bg-[#d97e3a] disabled:opacity-50"
        >
          {saving ? "Saving..." : editingBusId ? "Update" : "Create"}
        </button>
        {editingBusId && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 border border-[#e7e5dc] text-ink py-2 rounded font-semibold hover:bg-[#fafaf8]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>

    {/* List */}
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-ink">Your Buses ({buses.length})</h3>
      {buses.length === 0 ? (
        <StateMessage>No buses yet. Create one to get started.</StateMessage>
      ) : (
        buses.map((bus) => (
          <div
            key={bus.id}
            className="flex items-center justify-between rounded-lg border border-[#e7e5dc] bg-white p-4"
          >
            <div>
              <h4 className="font-semibold text-ink">{bus.model}</h4>
              <p className="text-xs text-muted">{bus.registrationNumber} · {bus.busType}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEditBus(bus)}
                className="px-3 py-1 text-xs font-semibold text-orange hover:text-[#d97e3a]"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteBus(bus.id)}
                className="px-3 py-1 text-xs font-semibold text-[#8c3e2d] hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </section>
);

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
  
  const totalPages = Math.ceil(schedules.length / ITEMS_PER_PAGE);
  const paginatedSchedules = useMemo(() => {
    const startIdx = (schedulePage - 1) * ITEMS_PER_PAGE;
    return schedules.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [schedules, schedulePage]);

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
          <h3 className="text-lg font-semibold text-ink">Schedules ({schedules.length})</h3>
          <button
            onClick={onOpenModal}
            className="px-4 py-2 bg-orange text-white rounded font-semibold text-sm hover:bg-[#d97e3a] transition-colors"
          >
            + Create Schedule
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="rounded-lg border border-[#e7e5dc] bg-[#f9f9f7] p-4 text-center text-sm text-muted">
            No schedules yet. Click "Create Schedule" to get started.
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
                    className="rounded-lg border border-[#e7e5dc] bg-white p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="mb-3 pb-3 border-b border-[#e7e5dc]">
                      <h4 className="font-semibold text-ink text-sm mb-1">
                        {route?.name || "Unknown Route"}
                      </h4>
                      <p className="text-xs text-muted">
                        {bus?.model || "Unknown Bus"} • Reg: {bus?.registrationNumber || "—"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                      <div>
                        <p className="text-muted font-mono">Departure</p>
                        <p className="font-semibold text-ink">{schedule.departureTime}</p>
                      </div>
                      <div>
                        <p className="text-muted font-mono">Pricing</p>
                        <p className="font-semibold text-ink">
                          ₹{schedule.baseFare} + ₹{schedule.pricePerKm}/km
                        </p>
                      </div>
                      <div>
                        <p className="text-muted font-mono">Effective</p>
                        <p className="font-semibold text-ink text-[11px]">
                          {schedule.effectiveFrom ? `${schedule.effectiveFrom.substring(5)}` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted font-mono">Status</p>
                        <p className={`font-semibold text-xs ${schedule.status === "ACTIVE" ? "text-green" : "text-muted"}`}>
                          {schedule.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-[#e7e5dc]">
                      <button
                        onClick={() => {
                          onEditSchedule(schedule);
                          onOpenModal();
                        }}
                        className="flex-1 px-2 py-1.5 text-xs font-semibold text-orange hover:bg-[#fff6ee] rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteSchedule(schedule.id)}
                        className="flex-1 px-2 py-1.5 text-xs font-semibold text-[#8c3e2d] hover:bg-[#f7e5df] rounded transition-colors"
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

// ── Trips View (Read-only) with Pagination ────────────────────────────────
const TripsViewReadOnly = ({ trips, schedules, routes, buses, onCreateNew, tripsPage, onTripsPageChange, onCancelTrip }) => {
  const ITEMS_PER_PAGE = 8;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  
  const totalPages = Math.ceil(trips.length / ITEMS_PER_PAGE);
  const paginatedTrips = useMemo(() => {
    const startIdx = (tripsPage - 1) * ITEMS_PER_PAGE;
    return trips.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [trips, tripsPage]);

  const handleCancelClick = (tripId) => {
    setSelectedTripId(tripId);
    setCancellationReason("");
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) {
      alert("Please provide a reason for trip cancellation");
      return;
    }
    setCancelling(true);
    try {
      await onCancelTrip(selectedTripId, cancellationReason);
      setShowCancelModal(false);
      setCancellationReason("");
      setSelectedTripId(null);
    } catch (error) {
      console.error("Failed to cancel trip:", error);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg border border-[#e7e5dc] bg-white p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-ink mb-4">Cancel Trip</h3>
            <p className="text-sm text-muted mb-4">
              This will cancel the trip, refund all passengers, and move their bookings to past trips.
            </p>
            <label className="block mb-4">
              <span className="text-xs font-mono uppercase text-muted block mb-1">
                Reason for Cancellation *
              </span>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g., Driver unavailable, Bus breakdown, Route issues"
                className="w-full border border-[#e7e5dc] rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
                rows={4}
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-[#e7e5dc] text-ink py-2 rounded font-semibold hover:bg-[#fafaf8] transition-colors"
              >
                Keep Trip
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 bg-[#8c3e2d] text-white py-2 rounded font-semibold hover:bg-[#6d2f24] disabled:opacity-50 transition-colors"
              >
                {cancelling ? "Cancelling..." : "Cancel Trip"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="py-8">
        <div className="mb-6 flex items-center justify-between max-[600px]:flex-col max-[600px]:gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink mb-2">Published Trips</h3>
            <p className="text-sm text-muted">
              {trips.length} trips • Auto-created from schedules
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-orange text-white rounded font-semibold text-sm hover:bg-[#d97e3a] transition-colors"
          >
            + Create Schedule
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-lg border border-[#e7e5dc] bg-[#f9f9f7] p-4 text-center text-sm text-muted">
            No trips published yet. Create a schedule to get started.
          </div>
        ) : (
          <>
            <div className="grid gap-3 mb-6">
              {paginatedTrips.map((trip) => {
                const schedule = schedules.find((s) => s.id === trip.scheduleId);
                const route = routes.find((r) => r.id === schedule?.routeId);
                const bus = buses.find((b) => b.id === schedule?.busId);
                return (
                  <div
                    key={trip.id}
                    className="rounded-lg border border-[#e7e5dc] bg-white p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="grid grid-cols-2 gap-4 items-start max-[600px]:grid-cols-1">
                      {/* Left: Route & Bus */}
                      <div className="pb-3 max-[600px]:pb-0 max-[600px]:border-b border-[#e7e5dc]">
                        <h4 className="font-semibold text-ink text-sm mb-1">
                          {route?.name || "Unknown Route"}
                        </h4>
                        <p className="text-xs text-muted mb-2">
                          {bus?.model || "Unknown Bus"}
                        </p>
                        <p className="text-xs text-muted">
                          Reg: {bus?.registrationNumber || "—"}
                        </p>
                      </div>

                      {/* Right: Trip Details & Actions */}
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-muted font-mono mb-1">Trip Date</p>
                            <p className="font-semibold text-ink text-sm">{trip.tripDate}</p>
                            <p className="text-xs text-muted mt-1">
                              Departure: {schedule?.departureTime || "—"}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 text-xs font-semibold bg-[#e8f3e0] text-green rounded-full">
                            Active
                          </span>
                        </div>
                        <button
                          onClick={() => handleCancelClick(trip.id)}
                          className="w-full mt-2 px-3 py-1.5 text-xs font-semibold text-[#8c3e2d] hover:bg-[#f7e5df] rounded transition-colors border border-[#d79b8b]"
                        >
                          Cancel Trip
                        </button>
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
