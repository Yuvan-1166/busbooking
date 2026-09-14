import { NavLink, Link } from 'react-router-dom'

export default function Header({ email, roles, onLogout }) {
  const isPassenger = roles?.includes('ROLE_PASSENGER') || roles?.includes('PASSENGER')
  const isAdmin = roles?.includes('ROLE_ADMIN') || roles?.includes('ADMIN')
  const workspacePath = isAdmin ? '/admin' : '/operator'
  const navClass = ({ isActive }) => `border-b-2 py-2 text-[13px] ${isActive ? 'border-ink font-bold text-ink' : 'border-transparent text-muted'}`
  return <header className="mx-auto flex min-h-[78px] max-w-[1240px] items-center justify-between gap-6 px-[34px] max-[600px]:flex-wrap max-[600px]:px-0 max-[600px]:py-3">
    <Link className="flex items-center gap-2.5 text-xl font-bold tracking-[-.04em] text-ink no-underline" to={isPassenger ? '/search' : workspacePath}><span className="grid h-[31px] w-[31px] rotate-[-8deg] place-items-center rounded-full bg-ink font-display text-base text-[#f9d66d]">B</span><span>Bus Booking</span></Link>
    <nav className="ml-auto flex gap-9 max-[600px]:gap-4" aria-label="Main navigation">
      <NavLink className={navClass} to={isPassenger ? '/search' : workspacePath}>{isPassenger ? 'Find a ride' : 'Workspace'}</NavLink>
      {isPassenger && <NavLink className={navClass} to="/bookings">Bookings</NavLink>}
    </nav>
    <div className="flex items-center gap-2.5 font-mono text-[10px] text-muted max-[600px]:order-3 max-[600px]:w-full max-[600px]:justify-between"><span className="max-w-[180px] truncate">{email}</span><span className="border border-line px-2 py-1 text-[9px] text-green">{roles?.[0]?.replace('ROLE_', '') || 'USER'}</span><button className="border-0 border-b border-orange bg-transparent px-0 py-0.5 text-[11px] text-orange" onClick={onLogout}>Sign out</button></div>
  </header>
}
