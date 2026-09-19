import { Link, NavLink, useLocation } from "react-router-dom"
import { useState } from "react"

function initials(first, last) {
  return ((first?.[0] || "") + (last?.[0] || "")).toUpperCase() || "?";
}

export default function Header({ email, firstName, lastName, roles }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  
  const isPassenger = roles?.includes('ROLE_PASSENGER') || roles?.includes('PASSENGER')
  const isAdmin = roles?.includes('ROLE_ADMIN') || roles?.includes('ADMIN')
  const isOperator = roles?.includes('ROLE_OPERATOR') || roles?.includes('OPERATOR')
  
  const workspacePath = isAdmin ? '/admin' : '/operator'
  const roleLabel = roles?.[0]?.replace('ROLE_', '') || 'USER'
  const avatarInitials = initials(firstName, lastName)

  const navClass = ({ isActive }) =>
    `relative px-4 py-2 text-sm font-medium transition-colors ${
      isActive 
        ? 'text-primary-600' 
        : 'text-neutral-700 hover:text-neutral-900'
    }`

  const mobileNavClass = ({ isActive }) =>
    `block w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' 
        : 'text-neutral-700 hover:bg-neutral-50'
    }`

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* Logo */}
        <Link
          className="flex items-center gap-3 text-xl font-bold text-neutral-900 no-underline group"
          to={isPassenger ? "/" : isAdmin ? "/admin" : "/operator"}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-200">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4zm0 5h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6zm2-7h12a2 2 0 012 2v1H4V6a2 2 0 012-2z"/>
              <circle cx="6" cy="19" r="1"/>
              <circle cx="18" cy="19" r="1"/>
              <rect x="7" y="8" width="2" height="2" rx="0.5"/>
              <rect x="11" y="8" width="2" height="2" rx="0.5"/>
              <rect x="15" y="8" width="2" height="2" rx="0.5"/>
            </svg>
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-bold">BusBooking</div>
            <div className="text-xs text-neutral-500 -mt-1">Travel Smart</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {isPassenger && (
            <>
              <NavLink className={navClass} to="/">
                <svg className="mb-0.5 mr-1.5 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </NavLink>
              <NavLink className={navClass} to="/bookings">
                <svg className="mb-0.5 mr-1.5 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                My Bookings
              </NavLink>
            </>
          )}
          {isOperator && (
            <NavLink className={navClass} to="/operator">
              <svg className="mb-0.5 mr-1.5 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Fleet Management
            </NavLink>
          )}
          {isAdmin && (
            <NavLink className={navClass} to="/admin">
              <svg className="mb-0.5 mr-1.5 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Panel
            </NavLink>
          )}
        </nav>

        {/* Profile & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          
          {/* Profile Link - Desktop */}
          <Link
            to="/profile"
            className="hidden items-center gap-3 rounded-lg p-2 transition-colors hover:bg-neutral-100 md:flex"
            title={`View profile · ${email}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white">
              {avatarInitials}
            </div>
            <div className="hidden flex-col items-start lg:flex">
              <span className="max-w-[150px] truncate text-sm font-medium text-neutral-900">
                {firstName || email?.split('@')[0]}
              </span>
              <span className={`text-xs ${
                roleLabel === 'ADMIN' ? 'text-info-600' :
                roleLabel === 'OPERATOR' ? 'text-success-600' : 'text-neutral-600'
              }`}>
                {roleLabel}
              </span>
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute left-0 right-0 top-full z-50 border-b border-neutral-200 bg-white shadow-lg md:hidden">
            <nav className="px-4 py-4">
              
              {/* Profile Section - Mobile */}
              <Link
                to="/profile"
                className="mb-4 flex items-center gap-3 rounded-lg border border-neutral-200 p-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white">
                  {avatarInitials}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">
                    {firstName ? `${firstName} ${lastName || ''}` : email?.split('@')[0]}
                  </div>
                  <div className={`text-sm ${
                    roleLabel === 'ADMIN' ? 'text-info-600' :
                    roleLabel === 'OPERATOR' ? 'text-success-600' : 'text-neutral-600'
                  }`}>
                    {roleLabel} • View Profile
                  </div>
                </div>
                <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Navigation Links - Mobile */}
              <div className="space-y-1">
                {isPassenger && (
                  <>
                    <NavLink 
                      className={mobileNavClass} 
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="mr-3 inline h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search Buses
                    </NavLink>
                    <NavLink 
                      className={mobileNavClass} 
                      to="/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="mr-3 inline h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      My Bookings
                    </NavLink>
                  </>
                )}
                {isOperator && (
                  <NavLink 
                    className={mobileNavClass} 
                    to="/operator"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 inline h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Fleet Management
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink 
                    className={mobileNavClass} 
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 inline h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Panel
                  </NavLink>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
