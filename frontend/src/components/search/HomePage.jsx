import SearchForm from "./SearchForm";

export default function HomePage({
  locations,
  from,
  to,
  date,
  loading,
  searching,
  matchingRoute,
  onFromChange,
  onToChange,
  onDateChange,
  onSwap,
  onSubmit,
}) {
  return (
    <main id="top" className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-20 text-white md:py-32">
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fast & Reliable Bus Booking
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Book Your Bus Journey
              <br />
              <span className="text-primary-200">In Minutes</span>
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-primary-100 md:text-xl">
              Search from thousands of routes, compare prices, and book your seat with India's most trusted bus booking platform.
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute left-0 top-0 h-full w-full opacity-10">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-white blur-3xl"></div>
        </div>
      </section>
      
      {/* Search Form */}
      <div className="-mt-12 px-6">
        <div className="mx-auto max-w-6xl fade-in-up">
          <SearchForm
            locations={locations}
            from={from}
            to={to}
            date={date}
            loading={loading}
            searching={searching}
            matchingRoute={matchingRoute}
            onFromChange={onFromChange}
            onToChange={onToChange}
            onDateChange={onDateChange}
            onSwap={onSwap}
            onSubmit={onSubmit}
          />
        </div>
      </div>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-semibold text-neutral-900">Why Choose Us</h2>
          <p className="text-neutral-600">Everything you need for a comfortable journey</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card card-hover fade-in-up stagger-1 hover-lift transition-smooth">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 transition-transform">
              <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">Easy Search</h3>
            <p className="text-sm text-neutral-600">
              Find buses instantly with our smart search. Filter by time, price, and amenities.
            </p>
          </div>

          <div className="card card-hover fade-in-up stagger-2 hover-lift transition-smooth">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success-100 transition-transform">
              <svg className="h-6 w-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">Instant Confirmation</h3>
            <p className="text-sm text-neutral-600">
              Get instant booking confirmation and digital tickets delivered to your email.
            </p>
          </div>

          <div className="card card-hover fade-in-up stagger-3 hover-lift transition-smooth">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-warning-100">
              <svg className="h-6 w-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">Secure Payment</h3>
            <p className="text-sm text-neutral-600">
              Your transactions are protected with bank-grade encryption and security.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-neutral-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-primary-600">500+</div>
              <div className="text-sm text-neutral-600">Bus Operators</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-primary-600">10K+</div>
              <div className="text-sm text-neutral-600">Routes Covered</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-primary-600">1M+</div>
              <div className="text-sm text-neutral-600">Happy Travelers</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-primary-600">24/7</div>
              <div className="text-sm text-neutral-600">Customer Support</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
