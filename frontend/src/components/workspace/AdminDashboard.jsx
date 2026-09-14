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
      setMessage('Platform resource created.')
      await loadData()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const tabClass = (tab) => `shrink-0 border-b-2 bg-transparent pb-3.5 text-xs ${view === tab ? 'border-orange font-bold text-ink' : 'border-transparent text-muted'}`
  return <main className="mx-auto mb-[100px] max-w-[1168px] max-[900px]:mx-[22px] max-[600px]:mx-4">
    <section className="flex min-h-[300px] items-center justify-between overflow-hidden bg-[#d9e5e7] px-[52px] py-[45px] max-[900px]:px-[30px] max-[600px]:block max-[600px]:px-[22px] max-[600px]:py-[35px]"><div><p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">ADMIN</p><h1 className="mb-4 font-display text-[52px] font-semibold leading-[.96] tracking-[-.04em] text-ink max-[600px]:text-[41px]">Manage the<br /><em className="text-orange">system.</em></h1><p className="max-w-[340px] text-sm leading-6 text-[#606a5d]">Manage users, operators, locations, and routes.</p></div><div className="grid h-[170px] w-[170px] place-items-center content-center rounded-full border border-[rgba(32,38,34,.25)] text-center max-[600px]:ml-auto max-[600px]:mt-6 max-[600px]:h-[120px] max-[600px]:w-[120px]"><span className="font-mono text-[10px] text-green">USERS</span><strong className="my-2 font-display text-[43px] font-semibold max-[600px]:text-[32px]">{data.users.length}</strong><small className="text-[10px] text-muted">registered</small></div></section>
    <nav className="flex gap-7 overflow-x-auto border-b border-line px-0 pt-[18px] max-[600px]:gap-5"><button className={tabClass('overview')} onClick={() => setView('overview')}>Overview</button><button className={tabClass('users')} onClick={() => setView('users')}>Users</button><button className={tabClass('network')} onClick={() => setView('network')}>Locations and routes</button></nav>
    {error && <div className="my-4 border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]">{error}</div>}{message && <div className="my-4 border border-[#a5bea0] bg-[#e4eee1] px-4 py-3 text-xs text-green">{message}</div>}
    {loading ? <StateMessage>Loading platform data...</StateMessage> : view === 'overview' ? <><div className="mb-7 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2"><MetricCard label="Users" value={data.users.length} detail="registered accounts" accent="coral" /><MetricCard label="Operators" value={data.operators.length} detail="service partners" accent="green" /><MetricCard label="Locations" value={data.locations.length} detail="network points" accent="yellow" /><MetricCard label="Routes" value={data.routes.length} detail="active corridors" accent="blue" /></div><div className="grid grid-cols-2 gap-[18px] max-[600px]:grid-cols-1"><section className="border border-[#e7e5dc] bg-paper p-7"><div className="mb-[22px]"><p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">NETWORK BUILDER</p><h2 className="m-0 font-display text-[25px] font-semibold text-ink">Add location</h2></div><LocationForm form={locationForm} onChange={setLocationForm} saving={saving} onSubmit={(event) => createResource(event, () => api.createLocation({ ...locationForm, latitude: Number(locationForm.latitude), longitude: Number(locationForm.longitude) }), () => setLocationForm({ name: '', city: '', state: '', country: 'India', latitude: '', longitude: '' }))} /></section><section className="border border-[#e7e5dc] bg-[#f3edda] p-7"><div className="mb-[22px] flex justify-between"><div><p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">ROUTE CATALOGUE</p><h2 className="m-0 font-display text-[25px] font-semibold text-ink">Recent routes</h2></div><button className="border-0 border-b border-orange bg-transparent p-0 pb-1 text-[11px] text-orange" onClick={() => setView('network')}>Manage →</button></div><ItemList items={data.routes.slice(0, 5)} empty="No routes configured." render={(route) => <ResourceRow key={route.id} icon="↗" title={route.name} detail={`Route #${route.id}`} status={route.status} />} /></section></div></> : view === 'users' ? <section className="border border-[#e7e5dc] bg-paper p-7"><div className="mb-[22px]"><p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">ACCESS DIRECTORY</p><h2 className="m-0 font-display text-[25px] font-semibold text-ink">Users and operators</h2></div><div className="grid grid-cols-2 gap-[18px] max-[600px]:grid-cols-1"><ItemList items={data.users} empty="No users found." render={(user) => <ResourceRow key={user.id} icon={user.firstName?.[0] || 'U'} title={`${user.firstName} ${user.lastName || ''}`} detail={user.email} status={user.status} />} /><ItemList items={data.operators} empty="No operators found." render={(operator) => <ResourceRow key={operator.id} icon="O" title={operator.name} detail={operator.registrationNumber} status={operator.status} />} /></div></section> : <section className="border border-[#e7e5dc] bg-paper p-7"><div className="mb-[22px]"><p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">NETWORK BUILDER</p><h2 className="m-0 font-display text-[25px] font-semibold text-ink">Locations and routes</h2></div><div className="grid grid-cols-2 gap-[18px] max-[600px]:grid-cols-1"><LocationForm form={locationForm} onChange={setLocationForm} saving={saving} onSubmit={(event) => createResource(event, () => api.createLocation({ ...locationForm, latitude: Number(locationForm.latitude), longitude: Number(locationForm.longitude) }), () => setLocationForm({ name: '', city: '', state: '', country: 'India', latitude: '', longitude: '' }))} /><div><RouteForm form={routeForm} onChange={setRouteForm} saving={saving} onSubmit={(event) => createResource(event, () => api.createRoute(routeForm), () => setRouteForm({ name: '', status: 'ACTIVE' }))} /><ItemList items={data.locations} empty="No locations configured." render={(location) => <ResourceRow key={location.id} icon="⌖" title={location.name} detail={`${location.city}, ${location.state}`} status="" />} /></div></div></section>}
  </main>
}

function LocationForm({ form, onChange, saving, onSubmit }) {
  const update = (key, value) => onChange({ ...form, [key]: value })
  return <form className="grid gap-3.5" onSubmit={onSubmit}><Field label="Name"><input required value={form.name} onChange={(event) => update('name', event.target.value)} /></Field><Field label="City"><input required value={form.city} onChange={(event) => update('city', event.target.value)} /></Field><Field label="State"><input required value={form.state} onChange={(event) => update('state', event.target.value)} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Latitude"><input required type="number" step="any" value={form.latitude} onChange={(event) => update('latitude', event.target.value)} /></Field><Field label="Longitude"><input required type="number" step="any" value={form.longitude} onChange={(event) => update('longitude', event.target.value)} /></Field></div><Submit saving={saving}>{saving ? 'Saving...' : 'Add location'}</Submit></form>
}

function RouteForm({ form, onChange, saving, onSubmit }) {
  return <form className="grid gap-3.5" onSubmit={onSubmit}><Field label="Route name"><input required value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} /></Field><Field label="Status"><select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select></Field><Submit saving={saving}>{saving ? 'Saving...' : 'Add route'}</Submit></form>
}

function ItemList({ items, empty, render }) {
  return items.length ? <div className="grid gap-0">{items.map(render)}</div> : <StateMessage>{empty}</StateMessage>
}

function ResourceRow({ icon, title, detail, status }) {
  return <div className="flex min-h-[58px] items-center gap-3 border-b border-line py-2"><span className="grid h-8 w-8 shrink-0 place-items-center bg-[#e8eee4] font-mono text-[11px] text-green">{icon}</span><div className="grid min-w-0 flex-1 gap-1"><strong className="truncate text-xs">{title}</strong><small className="text-[10px] text-muted">{detail}</small></div>{status && <span className="font-mono text-[9px] uppercase text-green">{status}</span>}</div>
}

function Field({ label, children }) { return <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">{label}{cloneElement(children, { className: 'w-full border-0 border-b border-line bg-transparent py-2 text-ink outline-0' })}</label> }
function Submit({ saving, children }) { return <button className="border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45" disabled={saving}>{children}<span className="float-right text-lg">→</span></button> }
