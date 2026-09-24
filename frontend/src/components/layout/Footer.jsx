import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { session, hasRole } = useAuth();

  const isAdmin = hasRole("ADMIN");
  const isOperator = hasRole("OPERATOR");
  const isPassenger = hasRole("PASSENGER");

  const platformLinks = [];
  if (isAdmin) {
    platformLinks.push(
      { to: "/admin", label: "Dashboard" },
      { to: "/admin/users", label: "Users" },
      { to: "/admin/locations", label: "Locations" },
      { to: "/admin/routes", label: "Routes" },
      { to: "/admin/analytics", label: "Analytics" },
    );
  }
  if (isOperator) {
    platformLinks.push(
      { to: "/operator", label: "Dashboard" },
      { to: "/operator/buses", label: "Buses" },
      { to: "/operator/seats", label: "Seat Layouts" },
      { to: "/operator/schedules", label: "Schedules" },
      { to: "/operator/trips", label: "Trips" },
      { to: "/operator/analytics", label: "Analytics" },
    );
  }
  if (isPassenger || !session) {
    platformLinks.push(
      { to: "/", label: "Search Buses" },
      { to: "/bookings", label: "My Bookings" },
      { to: "/profile", label: "My Profile" },
    );
  }

  const description = isOperator
    ? "Manage your buses, seats, schedules, and trips across your fleet."
    : isAdmin
      ? "Manage users, locations, and routes across the BusBooking platform."
      : "Find buses, book your seats, and manage all your journeys in one place.";

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-6 2xl:px-10">
        {/* Main Footer */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              to={isAdmin ? "/admin" : isOperator ? "/operator" : "/"}
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 6h16v2H4zm0 5h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6zm2-7h12a2 2 0 012 2v1H4V6a2 2 0 012-2z" />
                  <circle cx="6" cy="19" r="1" />
                  <circle cx="18" cy="19" r="1" />
                  <rect x="7" y="8" width="2" height="2" rx="0.5" />
                  <rect x="11" y="8" width="2" height="2" rx="0.5" />
                  <rect x="15" y="8" width="2" height="2" rx="0.5" />
                </svg>
              </div>

              <div>
                <div className="text-base font-bold text-neutral-900">
                  BusBooking
                </div>
                <div className="text-[11px] text-neutral-500">
                  {isOperator
                    ? "Operator Control Center"
                    : isAdmin
                      ? "Admin Control Center"
                      : "Your Journey, Simplified."}
                </div>
              </div>
            </Link>

            <div className="pt-6">
              <p className="max-w-sm text-xs leading-relaxed text-neutral-500">
                {description}
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 gap-12">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-900">
                Platform
              </h4>

              <div className="space-y-1.5">
                {platformLinks.map((link) => (
                  <Link
                    key={link.to + link.label}
                    to={link.to}
                    className="block text-sm text-neutral-500 transition-colors hover:text-primary-600"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-900">
                Support
              </h4>

              <div className="space-y-1.5">
                <a
                  href="#"
                  className="block text-sm text-neutral-500 transition-colors hover:text-primary-600"
                >
                  Help Center
                </a>

                <a
                  href="#"
                  className="block text-sm text-neutral-500 transition-colors hover:text-primary-600"
                >
                  Contact Us
                </a>

                <a
                  href="#"
                  className="block text-sm text-neutral-500 transition-colors hover:text-primary-600"
                >
                  Safety
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-900">
                Legal
              </h4>

              <div className="space-y-1.5">
                <Link
                  to="/privacy"
                  className="block text-sm text-neutral-500 transition-colors hover:text-primary-600"
                >
                  Privacy
                </Link>

                <Link
                  to="/terms"
                  className="block text-sm text-neutral-500 transition-colors hover:text-primary-600"
                >
                  Terms
                </Link>

                <a
                  href="#"
                  className="block text-sm text-neutral-500 transition-colors hover:text-primary-600"
                >
                  Refunds
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span>© {currentYear} BusBooking</span>

            <span className="hidden sm:inline">•</span>

            <span className="flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Secure
            </span>

            <span className="hidden sm:inline">•</span>

            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}