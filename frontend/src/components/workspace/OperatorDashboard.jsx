import { cloneElement, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
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
  const [seatForm, setSeatForm] = useState(emptySeat);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [tripForm, setTripForm] = useState(emptyTrip);
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
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submit = async (event, action, reset, label) => {
    event.preventDefault();
    setSaving(label);
    setError("");
    setMessage("");
    try {
      await action();
      reset();
      setMessage(`${label} saved.`);
      await loadData();
      return true;
    } catch (saveError) {
      setError(saveError.message);
      return false;
    } finally {
      setSaving("");
    }
  };

  const createBus = (event) =>
    submit(
      event,
      () => api.createBus(busForm),
      () => setBusForm(emptyBus),
      "Bus",
    );
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
      setError(saveError.message);
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
      setError(saveError.message);
      return false;
    } finally {
      setSaving("");
    }
  };
  const updateSeat = (seatId, payload) =>
    saveSeat(() => api.updateSeat(seatId, payload), "Seat");
  const deleteSeat = (seatId) => saveSeat(() => api.deleteSeat(seatId), "Seat");
  const createSchedule = (event) =>
    submit(
      event,
      () =>
        api.createSchedule({
          ...scheduleForm,
          routeId: Number(scheduleForm.routeId),
          busId: Number(scheduleForm.busId),
          baseFare: Number(scheduleForm.baseFare),
          pricePerKm: Number(scheduleForm.pricePerKm),
        }),
      () => setScheduleForm(emptySchedule),
      "Schedule",
    );
  const createTrip = (event) =>
    submit(
      event,
      () =>
        api.createTrip({
          scheduleId: Number(tripForm.scheduleId),
          tripDate: tripForm.tripDate,
        }),
      () => setTripForm(emptyTrip),
      "Trip",
    );

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
            <ResourceView
              title="Buses"
              description="Add and review the buses assigned to your account."
              form={
                <BusForm
                  form={busForm}
                  onChange={setBusForm}
                  onSubmit={createBus}
                  saving={saving === "Bus"}
                />
              }
            >
              <ItemList
                items={buses}
                empty="No buses found."
                render={(bus) => (
                  <ResourceRow
                    key={bus.id}
                    icon="B"
                    title={bus.registrationNumber}
                    detail={`${bus.model} · ${bus.busType}`}
                    status={bus.status}
                  />
                )}
              />
            </ResourceView>
          )}
          {view === "seats" && (
            <SeatsWorkspace
              buses={buses}
              seats={seats}
              onCreate={createSeat}
              onCreateBatch={createSeats}
              onUpdate={updateSeat}
              onDelete={deleteSeat}
              saving={saving === "Seat" || saving === "Seats"}
            />
          )}
          {view === "schedules" && (
            <ResourceView
              title="Schedules"
              description="Connect your buses to routes and set prices and operating days."
              form={
                <ScheduleForm
                  form={scheduleForm}
                  buses={buses}
                  routes={routes}
                  onChange={setScheduleForm}
                  onSubmit={createSchedule}
                  saving={saving === "Schedule"}
                />
              }
            >
              <ItemList
                items={schedules}
                empty="No schedules found."
                render={(schedule) => (
                  <ResourceRow
                    key={schedule.id}
                    icon="S"
                    title={`Schedule #${schedule.id}`}
                    detail={`Route #${schedule.routeId} · Bus #${schedule.busId} · ${schedule.departureTime}`}
                    status={schedule.status}
                  />
                )}
              />
            </ResourceView>
          )}
          {view === "trips" && (
            <ResourceView
              title="Trips"
              description="Create a dated trip from an existing schedule."
              form={
                <TripForm
                  form={tripForm}
                  schedules={schedules}
                  onChange={setTripForm}
                  onSubmit={createTrip}
                  saving={saving === "Trip"}
                />
              }
            >
              <ItemList
                items={trips}
                empty="No trips found."
                render={(trip) => (
                  <ResourceRow
                    key={trip.id}
                    icon="#"
                    title={`Trip #${trip.id}`}
                    detail={`${trip.tripDate} · Schedule #${trip.scheduleId}`}
                    status="Published"
                  />
                )}
              />
            </ResourceView>
          )}
        </>
      )}
    </main>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      className={`shrink-0 border-b-2 bg-transparent pb-3.5 text-xs ${active ? "border-orange font-bold text-ink" : "border-transparent text-muted"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Overview({ buses, seats, schedules, trips, setView }) {
  return (
    <>
      <div className="mb-7 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
        <MetricCard
          label="Buses"
          value={buses.length}
          detail="registered"
          accent="coral"
        />
        <MetricCard
          label="Seats"
          value={seats.length}
          detail="configured"
          accent="green"
        />
        <MetricCard
          label="Schedules"
          value={schedules.length}
          detail="created"
          accent="yellow"
        />
        <MetricCard
          label="Trips"
          value={trips.length}
          detail="published"
          accent="blue"
        />
      </div>
      <div className="grid grid-cols-2 gap-[18px] max-[600px]:grid-cols-1">
        <QuickAction title="Add a bus" action="buses" setView={setView} />
        <QuickAction title="Add seats" action="seats" setView={setView} />
        <QuickAction
          title="Create a schedule"
          action="schedules"
          setView={setView}
        />
        <QuickAction title="Publish a trip" action="trips" setView={setView} />
      </div>
    </>
  );
}

function QuickAction({ title, action, setView }) {
  return (
    <button
      className="grid min-h-[120px] gap-2 border border-[#e7e5dc] bg-paper p-6 text-left transition hover:border-orange"
      onClick={() => setView(action)}
    >
      <span className="font-mono text-[10px] tracking-[.13em] text-green">
        SETUP
      </span>
      <strong className="font-display text-xl text-ink">{title}</strong>
      <span className="text-[11px] text-orange">Open →</span>
    </button>
  );
}

function ResourceView({ title, description, form, children }) {
  return (
    <section className="border border-[#e7e5dc] bg-paper p-7 max-[600px]:p-5">
      <div className="mb-[22px]">
        <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
          OPERATOR CONTROLS
        </p>
        <h2 className="m-0 font-display text-[25px] font-semibold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-xs text-muted">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-[18px] max-[600px]:grid-cols-1">
        <div>{form}</div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function BusForm({ form, onChange, onSubmit, saving }) {
  return (
    <form className="grid gap-3.5" onSubmit={onSubmit}>
      <FormField label="Registration number">
        <input
          required
          value={form.registrationNumber}
          onChange={(event) =>
            onChange({ ...form, registrationNumber: event.target.value })
          }
        />
      </FormField>
      <FormField label="Model">
        <input
          required
          value={form.model}
          onChange={(event) => onChange({ ...form, model: event.target.value })}
        />
      </FormField>
      <FormField label="Bus type">
        <select
          value={form.busType}
          onChange={(event) =>
            onChange({ ...form, busType: event.target.value })
          }
        >
          <option>SEMI_SLEEPER</option>
          <option>SLEEPER</option>
          <option>SEATER</option>
        </select>
      </FormField>
      <SubmitButton saving={saving}>
        {saving ? "Saving..." : "Add bus"}
      </SubmitButton>
    </form>
  );
}

function SeatForm({ form, buses, onChange, onSubmit, saving }) {
  return (
    <form className="grid gap-3.5" onSubmit={onSubmit}>
      <FormField label="Bus">
        <select
          required
          value={form.busId}
          onChange={(event) => onChange({ ...form, busId: event.target.value })}
        >
          <option value="">Select bus</option>
          {buses.map((bus) => (
            <option key={bus.id} value={bus.id}>
              #{bus.id} · {bus.registrationNumber}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Seat number">
        <input
          required
          value={form.seatNumber}
          placeholder="01"
          onChange={(event) =>
            onChange({ ...form, seatNumber: event.target.value })
          }
        />
      </FormField>
      <FormField label="Seat type">
        <select
          value={form.seatType}
          onChange={(event) =>
            onChange({ ...form, seatType: event.target.value })
          }
        >
          <option>SEAT</option>
          <option>SLEEPER</option>
        </select>
      </FormField>
      <FormField label="Position">
        <select
          value={form.position}
          onChange={(event) =>
            onChange({ ...form, position: event.target.value })
          }
        >
          <option>WINDOW</option>
          <option>AISLE</option>
          <option>MIDDLE</option>
        </select>
      </FormField>
      <SubmitButton saving={saving}>
        {saving ? "Saving..." : "Add seat"}
      </SubmitButton>
    </form>
  );
}

function ScheduleForm({ form, buses, routes, onChange, onSubmit, saving }) {
  const update = (key, value) => onChange({ ...form, [key]: value });
  return (
    <form className="grid gap-3.5" onSubmit={onSubmit}>
      <FormField label="Route">
        <select
          required
          value={form.routeId}
          onChange={(event) => update("routeId", event.target.value)}
        >
          <option value="">Select route</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              #{route.id} · {route.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Bus">
        <select
          required
          value={form.busId}
          onChange={(event) => update("busId", event.target.value)}
        >
          <option value="">Select bus</option>
          {buses.map((bus) => (
            <option key={bus.id} value={bus.id}>
              #{bus.id} · {bus.registrationNumber}
            </option>
          ))}
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Departure">
          <input
            required
            type="time"
            value={form.departureTime}
            onChange={(event) =>
              update("departureTime", `${event.target.value}:00`)
            }
          />
        </FormField>
        <FormField label="Status">
          <select
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option>ACTIVE</option>
            <option>INACTIVE</option>
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Effective from">
          <input
            required
            type="date"
            value={form.effectiveFrom}
            onChange={(event) => update("effectiveFrom", event.target.value)}
          />
        </FormField>
        <FormField label="Effective until">
          <input
            required
            type="date"
            value={form.effectiveUntil}
            onChange={(event) => update("effectiveUntil", event.target.value)}
          />
        </FormField>
      </div>
      <FormField label="Operating days">
        <input
          required
          value={form.operatingDays}
          onChange={(event) => update("operatingDays", event.target.value)}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Base fare">
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.baseFare}
            onChange={(event) => update("baseFare", event.target.value)}
          />
        </FormField>
        <FormField label="Price per km">
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.pricePerKm}
            onChange={(event) => update("pricePerKm", event.target.value)}
          />
        </FormField>
      </div>
      <SubmitButton saving={saving}>
        {saving ? "Saving..." : "Create schedule"}
      </SubmitButton>
    </form>
  );
}

function TripForm({ form, schedules, onChange, onSubmit, saving }) {
  return (
    <form className="grid gap-3.5" onSubmit={onSubmit}>
      <FormField label="Schedule">
        <select
          required
          value={form.scheduleId}
          onChange={(event) =>
            onChange({ ...form, scheduleId: event.target.value })
          }
        >
          <option value="">Select schedule</option>
          {schedules.map((schedule) => (
            <option key={schedule.id} value={schedule.id}>
              Schedule #{schedule.id} · Route #{schedule.routeId}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Trip date">
        <input
          required
          type="date"
          value={form.tripDate}
          onChange={(event) =>
            onChange({ ...form, tripDate: event.target.value })
          }
        />
      </FormField>
      <SubmitButton saving={saving || !schedules.length}>
        {saving ? "Saving..." : "Publish trip"}
      </SubmitButton>
    </form>
  );
}

function ItemList({ items, empty, render }) {
  return items.length ? (
    <div className="grid gap-0">{items.map(render)}</div>
  ) : (
    <StateMessage>{empty}</StateMessage>
  );
}

function ResourceRow({ icon, title, detail, status }) {
  return (
    <div className="flex min-h-[58px] items-center gap-3 border-b border-line py-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center bg-[#e8eee4] font-mono text-[11px] text-green">
        {icon}
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <strong className="truncate text-xs">{title}</strong>
        <small className="text-[10px] text-muted">{detail}</small>
      </div>
      <span className="font-mono text-[9px] uppercase text-green">
        {status}
      </span>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
      {label}
      {cloneElement(children, {
        className:
          "w-full border-0 border-b border-line bg-transparent py-2 text-ink outline-0",
      })}
    </label>
  );
}
function SubmitButton({ saving, children }) {
  return (
    <button
      className="border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
      disabled={saving}
    >
      {children}
      <span className="float-right text-lg">→</span>
    </button>
  );
}
