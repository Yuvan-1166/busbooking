import { cloneElement, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import MetricCard from './MetricCard'
import StateMessage from '../common/StateMessage'

export default function AdminDashboard() {
  const [data, setData] = useState({ users: [], operators: [], locations: [], routes: [] })
  const { section } = useParams()
  const navigate = useNavigate()
  const view = section || 'overview'
  const setView = (nextView) => navigate(`/admin/${nextView}`)
  const [locationForm, setLocationForm] = useState({ name: '', city: '', state: '', country: 'India', latitude: '', longitude: '' })
  const [routeForm, setRouteForm] = useState({ name: '', status: 'ACTIVE' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [users, operators, locations, routes] = await Promise.all([api.getUsers(), api.getOperators(), api.getAllLocations(), api.getAllRoutes()])
      setData({ users, operators, locations, routes })
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const createResource = async (event, action, reset) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await action()
      reset()
      setMessage('Resource created successfully.')
      await loadData()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto mb-20 min-h-screen max-w-7xl px-4 sm:px-6">
      {/* Header */}
      <section className="mb-8 rounded-xl bg-gradient-to-br from-info-50 to-info-100 p-8">
        <div className="flex items-center justify-between gap-6 max-[768px]:flex-col max-[768px]:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="badge badge-info">ADMIN</span>
            </div>
            <h1 className="mb-3 text-4xl font-bold text-neutral-900">
              Platform Management
            </h1>
            <p className="max-w-md text-neutral-700">
              Manage users, operators, locations, and routes across the platform.
            </p>
          </div>
          <div className="card flex h-32 w-32 flex-col items-center justify-center bg-white text-center max-[768px]:ml-auto">
            <div className="mb-1 text-sm font-medium text-neutral-600">Total Users</div>
            <div className="text-4xl font-bold text-info-600">{data.users.length}</div>
            <div className="text-xs text-neutral-500">registered</div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="mb-6 flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1" aria-label="Admin sections">
        <NavTab active={view === 'overview'} onClick={() => setView('overview')}>
          <svg className="mb-1 inline-block h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Overview
        </NavTab>
        <NavTab active={view === 'users'} onClick={() => setView('users')}>
          <svg className="mb-1 inline-block h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Users
        </NavTab>
        <NavTab active={view === 'network'} onClick={() => setView('network')}>
          <svg className="mb-1 inline-block h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Network
        </NavTab>
      </nav>

      {/* Alerts */}
      {error && <div className="alert alert-error mb-6">{error}</div>}
      {message && <div className="alert alert-success mb-6">{message}</div>}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading platform data...</p>
          </div>
        </div>
      ) : view === 'overview' ? (
        <OverviewView data={data} setView={setView} locationForm={locationForm} setLocationForm={setLocationForm} saving={saving} createResource={createResource} />
      ) : view === 'users' ? (
        <UsersView data={data} />
      ) : (
        <NetworkView data={data} locationForm={locationForm} setLocationForm={setLocationForm} routeForm={routeForm} setRouteForm={setRouteForm} saving={saving} createResource={createResource} />
      )}
    </main>
  )
}

// ── NavTab Component ───────────────────────────────────────────────────────
const NavTab = ({ active, onClick, children }) => (
  <button
    className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
      active
        ? "bg-white text-info-600 shadow-sm"
        : "text-neutral-600 hover:text-neutral-900"
    }`}
    onClick={onClick}
  >
    {children}
  </button>
)

// ── Overview View ──────────────────────────────────────────────────────────
const OverviewView = ({ data, setView, locationForm, setLocationForm, saving, createResource }) => (
  <>
    <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Users"
        value={data.users.length}
        detail="registered accounts"
        icon={
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
        color="info"
      />
      <MetricCard
        label="Operators"
        value={data.operators.length}
        detail="service partners"
        icon={
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
        color="success"
      />
      <MetricCard
        label="Locations"
        value={data.locations.length}
        detail="network points"
        icon={
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        color="warning"
      />
      <MetricCard
        label="Routes"
        value={data.routes.length}
        detail="active corridors"
        icon={
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        }
        color="primary"
      />
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card">
        <h2 className="mb-6 text-lg font-semibold text-neutral-900">Add Location</h2>
        <LocationForm form={locationForm} onChange={setLocationForm} saving={saving} onSubmit={(event) => createResource(event, () => api.createLocation({ ...locationForm, latitude: Number(locationForm.latitude), longitude: Number(locationForm.longitude) }), () => setLocationForm({ name: '', city: '', state: '', country: 'India', latitude: '', longitude: '' }))} />
      </section>

      <section className="card bg-primary-50">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Routes</h2>
          <button className="btn-ghost text-sm" onClick={() => setView('network')}>
            View All
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <ItemList items={data.routes.slice(0, 5)} empty="No routes configured." render={(route) => <ResourceRow key={route.id} icon="↗" title={route.name} detail={`Route #${route.id}`} status={route.status} />} />
      </section>
    </div>
  </>
)

// ── Users View ─────────────────────────────────────────────────────────────
const UsersView = ({ data }) => (
  <section className="card">
    <h2 className="mb-6 text-lg font-semibold text-neutral-900">Users & Operators</h2>
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-neutral-700">Users ({data.users.length})</h3>
        <ItemList items={data.users} empty="No users found." render={(user) => <ResourceRow key={user.id} icon={user.firstName?.[0] || 'U'} title={`${user.firstName} ${user.lastName || ''}`} detail={user.email} status={user.status} />} />
      </div>
      <div>
        <h3 className="mb-4 text-sm font-semibold text-neutral-700">Operators ({data.operators.length})</h3>
        <ItemList items={data.operators} empty="No operators found." render={(operator) => <ResourceRow key={operator.id} icon="O" title={operator.name} detail={operator.registrationNumber} status={operator.status} />} />
      </div>
    </div>
  </section>
)

// ── Network View ───────────────────────────────────────────────────────────
const NetworkView = ({ data, locationForm, setLocationForm, routeForm, setRouteForm, saving, createResource }) => (
  <section className="card">
    <h2 className="mb-6 text-lg font-semibold text-neutral-900">Locations & Routes</h2>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <LocationForm form={locationForm} onChange={setLocationForm} saving={saving} onSubmit={(event) => createResource(event, () => api.createLocation({ ...locationForm, latitude: Number(locationForm.latitude), longitude: Number(locationForm.longitude) }), () => setLocationForm({ name: '', city: '', state: '', country: 'India', latitude: '', longitude: '' }))} />
        <RouteForm form={routeForm} onChange={setRouteForm} saving={saving} onSubmit={(event) => createResource(event, () => api.createRoute(routeForm), () => setRouteForm({ name: '', status: 'ACTIVE' }))} />
      </div>
      <div>
        <h3 className="mb-4 text-sm font-semibold text-neutral-700">Locations ({data.locations.length})</h3>
        <ItemList items={data.locations} empty="No locations configured." render={(location) => <ResourceRow key={location.id} icon="⌖" title={location.name} detail={`${location.city}, ${location.state}`} status="" />} />
      </div>
    </div>
  </section>
)

// ── Form Components ────────────────────────────────────────────────────────

function LocationForm({ form, onChange, saving, onSubmit }) {
  const update = (key, value) => onChange({ ...form, [key]: value })
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="form-group">
        <label className="form-label">Location Name *</label>
        <input required className="input" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g., Central Bus Station" />
      </div>
      <div className="form-group">
        <label className="form-label">City *</label>
        <input required className="input" value={form.city} onChange={(event) => update('city', event.target.value)} placeholder="e.g., Bangalore" />
      </div>
      <div className="form-group">
        <label className="form-label">State *</label>
        <input required className="input" value={form.state} onChange={(event) => update('state', event.target.value)} placeholder="e.g., Karnataka" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="form-group">
          <label className="form-label">Latitude *</label>
          <input required className="input" type="number" step="any" value={form.latitude} onChange={(event) => update('latitude', event.target.value)} placeholder="12.9716" />
        </div>
        <div className="form-group">
          <label className="form-label">Longitude *</label>
          <input required className="input" type="number" step="any" value={form.longitude} onChange={(event) => update('longitude', event.target.value)} placeholder="77.5946" />
        </div>
      </div>
      <button className="btn btn-primary w-full" disabled={saving}>
        {saving ? (
          <>
            <span className="spinner"></span>
            Saving...
          </>
        ) : (
          'Add Location'
        )}
      </button>
    </form>
  )
}

function RouteForm({ form, onChange, saving, onSubmit }) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="form-group">
        <label className="form-label">Route Name *</label>
        <input required className="input" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="e.g., Bangalore to Mumbai" />
      </div>
      <div className="form-group">
        <label className="form-label">Status *</label>
        <select className="select" value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value })}>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
        </select>
      </div>
      <button className="btn btn-primary w-full" disabled={saving}>
        {saving ? (
          <>
            <span className="spinner"></span>
            Saving...
          </>
        ) : (
          'Add Route'
        )}
      </button>
    </form>
  )
}

// ── Utility Components ─────────────────────────────────────────────────────

function ItemList({ items, empty, render }) {
  return items.length ? (
    <div className="divide-y divide-neutral-200">
      {items.map(render)}
    </div>
  ) : (
    <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
      <p className="text-sm text-neutral-600">{empty}</p>
    </div>
  )
}

function ResourceRow({ icon, title, detail, status }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-neutral-900">{title}</div>
        <div className="text-sm text-neutral-600">{detail}</div>
      </div>
      {status && (
        <span className={`badge ${status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
          {status}
        </span>
      )}
    </div>
  )
}
