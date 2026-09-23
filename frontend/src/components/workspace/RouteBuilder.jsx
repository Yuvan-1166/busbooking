import { useMemo, useState } from 'react'
import { computeCumulativeDistances, round2 } from '../../utils/geoDistance'

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE']

/**
 * Editor for building a route from an ordered list of location stops.
 *
 * Props:
 *  - locations:      all configured locations
 *  - initialRoute:   null, or { route, stops } loaded from the API when editing
 *  - saving:         disables the form while a save request is in flight
 *  - onSave:         called with the route payload ({ name, status, stops })
 *  - onCancel:       called when the user abandons an edit
 */
export default function RouteBuilder({ locations, initialRoute, saving, onSave, onCancel }) {
  const editing = Boolean(initialRoute)

  const [name, setName] = useState(initialRoute?.route.name || '')
  const [status, setStatus] = useState(initialRoute?.route.status || 'ACTIVE')
  const [stops, setStops] = useState(() => {
    if (!initialRoute?.stops?.length) return []
    return initialRoute.stops.map((stop) => ({
      locationId: Number(stop.locationId),
      arrivalOffsetMinutes: stop.arrivalOffsetMinutes ?? 0,
      departureOffsetMinutes: stop.departureOffsetMinutes ?? 0,
      distanceFromOriginKm: Number(stop.distanceFromOriginKm || 0),
    }))
  })
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [error, setError] = useState('')

  const locationsById = useMemo(
    () => Object.fromEntries(locations.map((location) => [Number(location.id), location])),
    [locations]
  )

  const usedLocationIds = new Set(stops.map((stop) => stop.locationId))
  const availableLocations = locations.filter((location) => !usedLocationIds.has(Number(location.id)))

  const totalDistanceKm = stops.length ? Number(stops[stops.length - 1].distanceFromOriginKm || 0) : 0

  const recomputeDistances = (list) => computeCumulativeDistances(list, locationsById)

  const addStop = () => {
    if (!selectedLocationId) return
    const next = [
      ...stops,
      { locationId: Number(selectedLocationId), arrivalOffsetMinutes: 0, departureOffsetMinutes: 0, distanceFromOriginKm: 0 },
    ]
    setStops(recomputeDistances(next))
    setSelectedLocationId('')
  }

  const removeStop = (index) => {
    setStops(recomputeDistances(stops.filter((_, i) => i !== index)))
  }

  const moveStop = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= stops.length) return
    const next = [...stops]
    const moved = next[index]
    next[index] = next[target]
    next[target] = moved
    setStops(recomputeDistances(next))
  }

  const updateStop = (index, key, value) => {
    setStops(stops.map((stop, i) => (i === index ? { ...stop, [key]: value } : stop)))
  }

  const submit = (event) => {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Route name is required.')
      return
    }
    if (stops.length < 2) {
      setError('A route needs at least an origin and a destination stop.')
      return
    }

    onSave({
      name: name.trim(),
      status,
      stops: stops.map((stop, index) => ({
        locationId: stop.locationId,
        stopOrder: index + 1,
        arrivalOffsetMinutes: stop.arrivalOffsetMinutes || null,
        departureOffsetMinutes: stop.departureOffsetMinutes || null,
        distanceFromOriginKm: Number(stop.distanceFromOriginKm || 0),
      })),
    })
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label className="form-label">Route Name *</label>
        <input
          required
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g., Bangalore → Hyderabad"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Status *</label>
        <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Route Stops (ordered) *</label>
        <p className="mb-2 text-xs text-neutral-600">
          Distances are calculated automatically from each location's latitude and longitude. You can
          override them, then use “Recalculate” to restore calculated values.
        </p>

        {stops.length > 0 && (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600">
              {stops.length} stops · {round2(totalDistanceKm)} km total
            </span>
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => setStops(recomputeDistances(stops))}
            >
              Recalculate distances
            </button>
          </div>
        )}

        <div className="space-y-2">
          {stops.map((stop, index) => (
            <StopRow
              key={`${stop.locationId}-${index}`}
              index={index}
              stop={stop}
              location={locationsById[stop.locationId]}
              previousDistance={
                index > 0 ? Number(stops[index - 1].distanceFromOriginKm || 0) : 0
              }
              total={stops.length}
              canMoveUp={index > 0}
              canMoveDown={index < stops.length - 1}
              onChange={(key, value) => updateStop(index, key, value)}
              onMoveUp={() => moveStop(index, -1)}
              onMoveDown={() => moveStop(index, 1)}
              onRemove={() => removeStop(index)}
            />
          ))}
        </div>

        {stops.length === 0 && (
          <p className="rounded border border-dashed border-neutral-300 bg-neutral-50 px-3 py-4 text-center text-sm text-neutral-500">
            No stops yet. Use the add box below to build the route order from origin to destination.
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <select
            className="select flex-1"
            value={selectedLocationId}
            onChange={(event) => setSelectedLocationId(event.target.value)}
          >
            <option value="">Select a location…</option>
            {availableLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} — {location.city}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost" onClick={addStop} disabled={!selectedLocationId || saving}>
            Add Stop
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary w-full" disabled={saving || stops.length < 2}>
          {saving ? (
            <>
              <span className="spinner"></span>
              Saving...
            </>
          ) : editing ? (
            'Update Route'
          ) : (
            'Create Route'
          )}
        </button>
        {editing && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function StopRow({ index, stop, location, previousDistance, total, canMoveUp, canMoveDown, onChange, onMoveUp, onMoveDown, onRemove }) {
  const segmentKm = round2(Number(stop.distanceFromOriginKm || 0) - previousDistance)

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
            {index + 1}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-neutral-900">
              {location ? location.name : 'Unknown location'}
            </div>
            <div className="text-xs text-neutral-600">
              {location ? `${location.city}, ${location.state}` : ''}
              {segmentKm >= 0 && index > 0 ? ` · +${segmentKm} km from previous` : index === 0 ? ' · origin' : ''}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={onMoveUp} disabled={!canMoveUp} aria-label="Move stop up">
            ↑
          </button>
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={onMoveDown} disabled={!canMoveDown} aria-label="Move stop down">
            ↓
          </button>
          <button type="button" className="btn-ghost px-2 py-1 text-xs text-error-600 hover:bg-error-50" onClick={onRemove} disabled={total <= 2} aria-label="Remove stop">
            ✕
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="form-group">
          <label className="form-label text-xs">Dist. from origin (km)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="any"
            value={stop.distanceFromOriginKm}
            onChange={(event) => onChange('distanceFromOriginKm', event.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label text-xs">Arrival offset (min)</label>
          <input
            className="input"
            type="number"
            min="0"
            value={stop.arrivalOffsetMinutes}
            onChange={(event) => onChange('arrivalOffsetMinutes', event.target.value)}
            placeholder="optional"
          />
        </div>
        <div className="form-group">
          <label className="form-label text-xs">Departure offset (min)</label>
          <input
            className="input"
            type="number"
            min="0"
            value={stop.departureOffsetMinutes}
            onChange={(event) => onChange('departureOffsetMinutes', event.target.value)}
            placeholder="optional"
          />
        </div>
      </div>
    </div>
  )
}