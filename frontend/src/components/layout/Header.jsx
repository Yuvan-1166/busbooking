import { Link, NavLink } from "react-router-dom"

function initials(firstName, lastName) {
  const local = firstName?.charAt(0) + lastName?.charAt(0) || ''
  // const local = userData.firstName.charAt(0) + lastName.charAt(0);
  return local.slice(0, 2).toUpperCase() || '?'
}

export default function Header({ email, firstName, lastName, roles }) {
  const isPassenger = roles?.includes('ROLE_PASSENGER') || roles?.includes('PASSENGER')
  const isAdmin = roles?.includes('ROLE_ADMIN') || roles?.includes('ADMIN')
  const workspacePath = isAdmin ? '/admin' : '/operator'

  const navClass = ({ isActive }) =>
    `border-b-2 py-2 text-[13px] ${isActive ? 'border-ink font-bold text-ink' : 'border-transparent text-muted'}`

  const roleLabel = roles?.[0]?.replace('ROLE_', '') || 'USER'
  const avatarInitials = initials(firstName, lastName)

  return (
    <header className="mx-auto flex min-h-[78px] max-w-[1240px] items-center justify-between gap-6 px-[34px] max-[600px]:flex-wrap max-[600px]:px-4 max-[600px]:py-3">

      {/* Logo */}
      <Link
        className="flex items-center gap-2.5 text-xl font-bold tracking-[-.04em] text-ink no-underline"
        to={isPassenger ? "/" : isAdmin ? "/admin" : "/operator"}
      >
        <span className="grid h-[31px] w-[31px] rotate-[-8deg] place-items-center rounded-full bg-ink font-display text-base text-[#f9d66d]">
          B
        </span>
        <span>Bus Booking</span>
      </Link>

      {/* Primary nav */}
      <nav className="ml-auto flex gap-9 max-[600px]:gap-4" aria-label="Main navigation">
        <NavLink className={navClass} to={isPassenger ? "/" : isAdmin ? "/admin" : "/operator"}>
          {isPassenger ? 'Find a ride' : isAdmin ? 'Admin' : 'Operator'}
        </NavLink>
        {isPassenger && (
          <NavLink className={navClass} to="/bookings">
            Bookings
          </NavLink>
        )}
      </nav>

      {/* Profile + sign out */}
      <div className="flex items-center gap-3 max-[600px]:order-3 max-[600px]:w-full max-[600px]:justify-between">

        {/* Avatar link → /profile */}
        <Link
          to="/profile"
          className="group flex items-center gap-2.5 no-underline"
          title={`View profile · ${email}`}
        >
          {/* Avatar circle */}
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] font-bold text-[#f9d66d] transition group-hover:opacity-80">
            {avatarInitials}
          </span>

          {/* Email + role — hidden on very small screens */}
          <span className="hidden flex-col items-start sm:flex">
            <span className="max-w-[150px] truncate font-mono text-[10px] text-ink">
              {email}
            </span>
            <span className="font-mono text-[9px] text-muted">
              {roleLabel}
            </span>
          </span>
        </Link>
      </div>
    </header>
  )
}
