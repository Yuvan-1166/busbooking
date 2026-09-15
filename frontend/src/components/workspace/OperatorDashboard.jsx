import { cloneElement, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { parseApiError, getErrorMessage } from "../../utils/errorHandler";
import StateMessage from "../common/StateMessage";
import MetricCard from "./MetricCard";
import SeatsWorkspace from "./SeatsWorkspace";

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
  operatingDays: "MON,TUE,WED,THU,FRI,SAT,SUN",
  baseFare: "",
  pricePerKm: "",
  status: "ACTIVE",
};
const emptyTrip = { scheduleId: "", tripDate: "" };

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
  const [tripForm, setTripForm] = useState(emptyTrip);
  const [editingTripId, setEditingTripId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  // ── Schedule CRUD Operations ───────────────────────────────────────────────
  const saveSchedule = async (event) => {
    event.preventDefault();
    setSaving("Schedule");
    setError("");
    setMessage("");
    try {
      const scheduleData = {
        ...scheduleForm,
        routeId: Number(scheduleForm.routeId),
        busId: Number(scheduleForm.busId),
        baseFare: Number(scheduleForm.baseFare),
        pricePerKm: Number(scheduleForm.pricePerKm),
      };

      if (editingScheduleId) {
        await api.updateSchedule(editingScheduleId, scheduleData);
        setMessage("Schedule updated successfully.");
        setEditingScheduleId(null);
      } else {
        await api.createSchedule(scheduleData);
        setMessage("Schedule created successfully.");
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
            <SchedulesView
              schedules={schedules}
              routes={routes}
              buses={buses}
              scheduleForm={scheduleForm}
              editingScheduleId={editingScheduleId}
              onScheduleChange={(field, value) => setScheduleForm(prev => ({ ...prev, [field]: value }))}
              onSaveSchedule={saveSchedule}
              onEditSchedule={editSchedule}
              onDeleteSchedule={deleteSchedule}
              onCancelEdit={() => {
                setScheduleForm(emptySchedule);
                setEditingScheduleId(null);
              }}
              saving={saving === "Schedule"}
            />
          )}
          {view === "trips" && (
            <TripsView
              trips={trips}
              schedules={schedules}
              tripForm={tripForm}
              editingTripId={editingTripId}
              onTripChange={(field, value) => setTripForm(prev => ({ ...prev, [field]: value }))}
              onSaveTrip={saveTrip}
              onEditTrip={editTrip}
              onDeleteTrip={deleteTrip}
              onCancelEdit={() => {
                setTripForm(emptyTrip);
                setEditingTripId(null);
              }}
              saving={saving === "Trip"}
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
          <option value="COACH">Coach</option>
          <option value="LUXURY">Luxury</option>
          <option value="AC_SLEEPER">AC Sleeper</option>
          <option value="AC_SEMI_SLEEPER">AC Semi-Sleeper</option>
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

// ── Schedules View Component ───────────────────────────────────────────────
const SchedulesView = ({
  schedules,
  routes,
  buses,
  scheduleForm,
  editingScheduleId,
  onScheduleChange,
  onSaveSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onCancelEdit,
  saving,
}) => (
  <section className="grid grid-cols-[350px_1fr] gap-8 py-8 max-[900px]:grid-cols-1">
    {/* Form */}
    <form onSubmit={onSaveSchedule} className="space-y-4 rounded-lg border border-[#e7e5dc] bg-white p-6">
      <h3 className="text-lg font-semibold text-ink">
        {editingScheduleId ? "Edit Schedule" : "Create Schedule"}
      </h3>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Route</span>
        <select
          value={scheduleForm.routeId}
          onChange={(e) => onScheduleChange("routeId", e.target.value)}
          required
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        >
          <option value="">Select Route</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Bus</span>
        <select
          value={scheduleForm.busId}
          onChange={(e) => onScheduleChange("busId", e.target.value)}
          required
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        >
          <option value="">Select Bus</option>
          {buses.map((bus) => (
            <option key={bus.id} value={bus.id}>
              {bus.model} ({bus.registrationNumber})
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Departure Time</span>
        <input
          type="time"
          value={scheduleForm.departureTime}
          onChange={(e) => onScheduleChange("departureTime", e.target.value)}
          required
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        />
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Base Fare (₹)</span>
        <input
          type="number"
          step="0.01"
          value={scheduleForm.baseFare}
          onChange={(e) => onScheduleChange("baseFare", e.target.value)}
          required
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        />
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Price Per KM (₹)</span>
        <input
          type="number"
          step="0.01"
          value={scheduleForm.pricePerKm}
          onChange={(e) => onScheduleChange("pricePerKm", e.target.value)}
          required
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        />
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Effective From</span>
        <input
          type="date"
          value={scheduleForm.effectiveFrom}
          onChange={(e) => onScheduleChange("effectiveFrom", e.target.value)}
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        />
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Effective Until</span>
        <input
          type="date"
          value={scheduleForm.effectiveUntil}
          onChange={(e) => onScheduleChange("effectiveUntil", e.target.value)}
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        />
      </label>
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-orange text-white py-2 rounded font-semibold hover:bg-[#d97e3a] disabled:opacity-50"
        >
          {saving ? "Saving..." : editingScheduleId ? "Update" : "Create"}
        </button>
        {editingScheduleId && (
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
      <h3 className="text-lg font-semibold text-ink">Schedules ({schedules.length})</h3>
      {schedules.length === 0 ? (
        <StateMessage>No schedules yet. Create one to publish trips.</StateMessage>
      ) : (
        schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="rounded-lg border border-[#e7e5dc] bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-ink">
                  {schedule.departureTime} · ₹{schedule.baseFare} + ₹{schedule.pricePerKm}/km
                </h4>
                <p className="text-xs text-muted">
                  {schedule.effectiveFrom && `${schedule.effectiveFrom} to ${schedule.effectiveUntil}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditSchedule(schedule)}
                  className="px-3 py-1 text-xs font-semibold text-orange hover:text-[#d97e3a]"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteSchedule(schedule.id)}
                  className="px-3 py-1 text-xs font-semibold text-[#8c3e2d] hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </section>
);

// ── Trips View Component ───────────────────────────────────────────────────
const TripsView = ({
  trips,
  schedules,
  tripForm,
  editingTripId,
  onTripChange,
  onSaveTrip,
  onEditTrip,
  onDeleteTrip,
  onCancelEdit,
  saving,
}) => (
  <section className="grid grid-cols-[350px_1fr] gap-8 py-8 max-[900px]:grid-cols-1">
    {/* Form */}
    <form onSubmit={onSaveTrip} className="space-y-4 rounded-lg border border-[#e7e5dc] bg-white p-6">
      <h3 className="text-lg font-semibold text-ink">
        {editingTripId ? "Edit Trip" : "Publish Trip"}
      </h3>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Schedule</span>
        <select
          value={tripForm.scheduleId}
          onChange={(e) => onTripChange("scheduleId", e.target.value)}
          required
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        >
          <option value="">Select Schedule</option>
          {schedules.map((schedule) => (
            <option key={schedule.id} value={schedule.id}>
              Schedule #{schedule.id}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-mono uppercase text-muted">Trip Date</span>
        <input
          type="date"
          value={tripForm.tripDate}
          onChange={(e) => onTripChange("tripDate", e.target.value)}
          required
          className="w-full mt-1 border-b border-line bg-transparent py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange"
        />
      </label>
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-orange text-white py-2 rounded font-semibold hover:bg-[#d97e3a] disabled:opacity-50"
        >
          {saving ? "Saving..." : editingTripId ? "Update" : "Publish"}
        </button>
        {editingTripId && (
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
      <h3 className="text-lg font-semibold text-ink">Published Trips ({trips.length})</h3>
      {trips.length === 0 ? (
        <StateMessage>No trips published yet. Create a schedule first.</StateMessage>
      ) : (
        trips.map((trip) => (
          <div
            key={trip.id}
            className="rounded-lg border border-[#e7e5dc] bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-ink">Trip #{trip.id}</h4>
                <p className="text-xs text-muted">
                  Schedule #{trip.scheduleId} · {trip.tripDate}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditTrip(trip)}
                  className="px-3 py-1 text-xs font-semibold text-orange hover:text-[#d97e3a]"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteTrip(trip.id)}
                  className="px-3 py-1 text-xs font-semibold text-[#8c3e2d] hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </section>
);
