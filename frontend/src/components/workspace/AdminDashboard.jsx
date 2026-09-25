import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import MetricCard from './MetricCard'
import FilterablePaginatedList from './FilterablePaginatedList'
import RouteBuilder from './RouteBuilder'
import ItemList from '../common/ItemList'
import { LoadingPage } from '../common/Loading'
import AnalyticsPage from './analytics/AnalyticsPage'
import ReportPreferencesPage from './reports/ReportPreferencesPage'

const formatEnumLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

const EMPTY_LOCATION_FORM = { name: '', city: '', state: '', country: 'India', latitude: '', longitude: '' }

export default function AdminDashboard() {
  const [data, setData] = useState({ users: [], operators: [], locations: [], routes: [] })
  const { section } = useParams()
  const navigate = useNavigate()
  const view = section || 'overview'
  const setView = (nextView) => navigate(`/admin/${nextView}`)
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION_FORM)
  const [editingLocation, setEditingLocation] = useState(null)
  const [editingRoute, setEditingRoute] = useState(null)
  const [routeFormVersion, setRouteFormVersion] = useState(0)
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

  const runAction = async (action, successMessage) => {
    setSaving(true)
    setError('')
    try {
      await action()
      setMessage(successMessage)
      await loadData()
      return true
    } catch (actionError) {
      setError(actionError.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  const locationSubmit = async (event) => {
    event.preventDefault()
    const payload = { ...locationForm, latitude: Number(locationForm.latitude), longitude: Number(locationForm.longitude) }
    const ok = await runAction(
      () => (editingLocation ? api.updateLocation(editingLocation.id, payload) : api.createLocation(payload)),
      editingLocation ? 'Location updated.' : 'Location created.'
    )
    if (ok) {
      setEditingLocation(null)
      setLocationForm(EMPTY_LOCATION_FORM)
    }
  }

  const startLocationEdit = (location) => {
    setEditingLocation(location)
    setLocationForm({
      name: location.name,
      city: location.city,
      state: location.state,
      country: location.country || 'India',
      latitude: location.latitude ?? '',
      longitude: location.longitude ?? '',
    })
  }

  const cancelLocationEdit = () => {
    setEditingLocation(null)
    setLocationForm(EMPTY_LOCATION_FORM)
  }

  const deleteLocation = async (location) => {
    if (!window.confirm(`Delete location "${location.name}"? Locations used by a route stop cannot be deleted.`)) return
    const ok = await runAction(() => api.deleteLocation(location.id), 'Location deleted.')
    if (ok && editingLocation?.id === location.id) cancelLocationEdit()
  }

  const saveRoute = async (payload) => {
    const ok = await runAction(
      () => (editingRoute ? api.updateRoute(editingRoute.route.id, payload) : api.createRoute(payload)),
      editingRoute ? 'Route updated.' : 'Route created.'
    )
    if (ok) {
      setEditingRoute(null)
      setRouteFormVersion((version) => version + 1)
    }
  }

  const startRouteEdit = async (routeId) => {
    setError('')
    try {
      const route = data.routes.find((item) => item.id === routeId)
      const stops = await api.getRouteStops(routeId)
      setEditingRoute({ route, stops })
    } catch (editError) {
      setError(editError.message)
    }
  }

  const cancelRouteEdit = () => setEditingRoute(null)

  const deleteRoute = async (route) => {
    if (!window.confirm(`Delete route "${route.name}"? Routes used by schedules cannot be deleted.`)) return
    const ok = await runAction(() => api.deleteRoute(route.id), 'Route deleted.')
    if (ok && editingRoute?.route?.id === route.id) cancelRouteEdit()
  }

  const locationProps = {
    locationForm,
    setLocationForm,
    saving,
    locationSubmit,
    editingLocation,
    onCancelEdit: cancelLocationEdit,
  }

  return (
    <main className="w-full mx-auto mb-20 min-h-screen max-w-7xl px-4 sm:px-6">
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
        <NavTab active={view === 'locations'} onClick={() => setView('locations')}>
          <svg className="mb-1 inline-block h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Locations
        </NavTab>
        <NavTab active={view === 'routes'} onClick={() => setView('routes')}>
          <svg className="mb-1 inline-block h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Routes
        </NavTab>
        <NavTab active={view === 'analytics'} onClick={() => setView('analytics')}>
          <svg className="mb-1 inline-block h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analytics
        </NavTab>
        <NavTab active={view === 'reports'} onClick={() => setView('reports')}>
          <svg className="mb-1 inline-block h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Reports
        </NavTab>
      </nav>

      {/* Alerts */}
      {error && <div className="alert alert-error mb-6">{error}</div>}
      {message && <div className="alert alert-success mb-6">{message}</div>}

      {/* Content */}
      {loading ? (
        <LoadingPage message="Loading Admin Panel" subMessage="Gathering platform data and metrics" showLogo={false} />
      ) : view === 'overview' ? (
        <OverviewView data={data} setView={setView} {...locationProps} />
      ) : view === 'users' ? (
        <UsersView data={data} />
      ) : view === 'locations' ? (
        <LocationsView data={data} {...locationProps} onDeleteLocation={deleteLocation} onStartEdit={startLocationEdit} />
      ) : view === 'analytics' ? (
        <AnalyticsPage role="admin" />
      ) : view === 'reports' ? (
        <ReportPreferencesPage role="admin" />
      ) : (
        <RoutesView
          data={data}
          saving={saving}
          editingRoute={editingRoute}
          routeFormVersion={routeFormVersion}
          onSave={saveRoute}
          onEdit={startRouteEdit}
          onCancelEdit={cancelRouteEdit}
          onDeleteRoute={deleteRoute}
        />
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
const OverviewView = ({ data, setView, locationForm, setLocationForm, saving, locationSubmit, editingLocation, onCancelEdit }) => (
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
        <h2 className="mb-6 text-lg font-semibold text-neutral-900">
          {editingLocation ? 'Edit Location' : 'Add Location'}
        </h2>
        <LocationForm
          form={locationForm}
          onChange={setLocationForm}
          saving={saving}
          onSubmit={locationSubmit}
          editing={editingLocation}
          onCancelEdit={onCancelEdit}
        />
      </section>

      <section className="card bg-primary-50">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Routes</h2>
          <button className="btn-ghost text-sm" onClick={() => setView('routes')}>
            View All
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <ItemList
          items={data.routes.slice(0, 5)}
          empty="No routes configured."
          render={(route) => (
            <ResourceRow
              key={route.id}
              icon="↗"
              title={route.name}
              detail={`${route.stopCount ?? 0} stops · ${route.totalDistanceKm ?? 0} km total`}
              status={route.status}
            />
          )}
        />
      </section>
    </div>
  </>
)

// ── Users View ─────────────────────────────────────────────────────────────
const UsersView = ({ data }) => (
  <section className="card">
    <h2 className="mb-6 text-lg font-semibold text-neutral-900">Users & Operators</h2>
    <div className="grid gap-6 lg:grid-cols-2">
      <FilterablePaginatedList
        title="Users"
        items={data.users}
        empty="No users found."
        resultLabel="users"
        searchPlaceholder="Search by name, email or phone..."
        searchGetter={(user) => `${user.firstName || ''} ${user.lastName || ''} ${user.email} ${user.phone || ''}`}
        filters={[{ label: 'Status', getValue: (user) => user.status, formatLabel: formatEnumLabel }]}
        renderItem={(user) => <ResourceRow key={user.id} icon={user.firstName?.[0] || 'U'} title={`${user.firstName} ${user.lastName || ''}`} detail={user.email} status={user.status} />}
      />
      <FilterablePaginatedList
        title="Operators"
        items={data.operators}
        empty="No operators found."
        resultLabel="operators"
        searchPlaceholder="Search by name, registration or email..."
        searchGetter={(operator) => `${operator.name} ${operator.registrationNumber} ${operator.contactEmail || ''}`}
        filters={[{ label: 'Status', getValue: (operator) => operator.status, formatLabel: formatEnumLabel }]}
        renderItem={(operator) => <ResourceRow key={operator.id} icon="O" title={operator.name} detail={operator.registrationNumber} status={operator.status} />}
      />
    </div>
  </section>
)

// ── Locations View ─────────────────────────────────────────────────────────
const LocationsView = ({ data, locationForm, setLocationForm, saving, locationSubmit, editingLocation, onCancelEdit, onDeleteLocation, onStartEdit }) => (
  <section className="grid gap-6 xl:grid-cols-[minmax(320px,1fr)_2fr]">
    <div className="card h-fit">
      <h3 className="mb-6 text-lg font-semibold text-neutral-900">
        {editingLocation ? 'Edit Location' : 'Add New Location'}
      </h3>
      <LocationForm
        form={locationForm}
        onChange={setLocationForm}
        saving={saving}
        onSubmit={locationSubmit}
        editing={editingLocation}
        onCancelEdit={onCancelEdit}
      />
    </div>

    <div>
      <FilterablePaginatedList
        title="All Locations"
        items={data.locations}
        empty="No locations configured. Add one to get started."
        resultLabel="locations"
        searchPlaceholder="Search by name, city or state..."
        searchGetter={(location) => `${location.name} ${location.city} ${location.state} ${location.country || ''}`}
        filters={[{ label: 'City', getValue: (location) => location.city, formatLabel: formatEnumLabel }]}
        renderItem={(location) => (
          <div key={location.id} className="flex items-center gap-3">
            <ResourceRow
              icon="⌖"
              title={location.name}
              detail={`${location.city}, ${location.state}`}
              hint={`${location.latitude ?? '–'}, ${location.longitude ?? '–'} (lat, lng)`}
            />
            <div className="flex shrink-0 gap-1">
              <button type="button" className="btn-ghost px-2 py-1 text-sm" onClick={() => onStartEdit(location)}>
                Edit
              </button>
              <button type="button" className="btn-ghost px-2 py-1 text-sm text-error-600 hover:bg-error-50" onClick={() => onDeleteLocation(location)}>
                Delete
              </button>
            </div>
          </div>
        )}
      />
    </div>
  </section>
)

// ── Routes View ────────────────────────────────────────────────────────────
const RoutesView = ({ data, saving, editingRoute, routeFormVersion, onSave, onEdit, onCancelEdit, onDeleteRoute }) => (
  <section className="grid gap-6 xl:grid-cols-[minmax(340px,1fr)_2fr]">
    <div className="card h-fit">
      <h3 className="mb-6 text-lg font-semibold text-neutral-900">
        {editingRoute ? `Edit Route: ${editingRoute.route.name}` : 'Add New Route'}
      </h3>
      <RouteBuilder
        key={`${editingRoute?.route?.id ?? 'new'}-${routeFormVersion}`}
        locations={data.locations}
        initialRoute={editingRoute}
        saving={saving}
        onSave={onSave}
        onCancel={onCancelEdit}
      />
    </div>

    <div>
      <FilterablePaginatedList
        title="All Routes"
        items={data.routes}
        empty="No routes configured. Build one with the editor."
        resultLabel="routes"
        searchPlaceholder="Search by route name..."
        searchGetter={(route) => route.name}
        filters={[{ label: 'Status', getValue: (route) => route.status, formatLabel: formatEnumLabel }]}
        renderItem={(route) => (
          <div key={route.id} className="flex items-center gap-3">
            <ResourceRow
              icon="↗"
              title={route.name}
              detail={`${route.stopCount ?? 0} stops · ${route.totalDistanceKm ?? 0} km total`}
              status={route.status}
            />
            <div className="flex shrink-0 gap-1">
              <button type="button" className="btn-ghost px-2 py-1 text-sm" onClick={() => onEdit(route.id)}>
                Edit
              </button>
              <button type="button" className="btn-ghost px-2 py-1 text-sm text-error-600 hover:bg-error-50" onClick={() => onDeleteRoute(route)}>
                Delete
              </button>
            </div>
          </div>
        )}
      />
    </div>
  </section>
)

// ── Form Components ────────────────────────────────────────────────────────

function LocationForm({ form, onChange, saving, onSubmit, editing, onCancelEdit }) {
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
      <p className="text-xs text-neutral-600">
        Coordinates are used to auto-calculate stage distances on routes that cover this location.
      </p>
      <div className="flex gap-2">
        <button className="btn btn-primary w-full" disabled={saving}>
          {saving ? (
            <>
              <span className="spinner"></span>
              Saving...
            </>
          ) : editing ? (
            'Update Location'
          ) : (
            'Add Location'
          )}
        </button>
        {editing && (
          <button type="button" className="btn btn-ghost" onClick={onCancelEdit} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

// ── Utility Components ─────────────────────────────────────────────────────

function ResourceRow({ icon, title, detail, hint, status }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-neutral-900">{title}</div>
        <div className="text-sm text-neutral-600">{detail}</div>
        {hint && <div className="text-xs text-neutral-500">{hint}</div>}
      </div>
      {status && (
        <span className={`badge ${status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
          {status}
        </span>
      )}
    </div>
  )
}