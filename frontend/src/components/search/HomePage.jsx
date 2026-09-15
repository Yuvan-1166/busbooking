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
    <main id="top" className="min-h-screen bg-gradient-to-b from-[#fafaf8] to-[#f5f5f0]">
      <section className="relative mx-auto min-h-[400px] max-w-[1240px] overflow-hidden rounded-[3px] bg-[#dce5d5] px-[34px] pb-[52px] pt-[80px] flex items-center justify-center max-[600px]:min-h-[450px] max-[600px]:px-6 max-[600px]:py-[60px]">
        <div className="relative z-[2] w-full max-w-[600px] text-center">
          <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
            START YOUR JOURNEY
          </p>
          <h1 className="mb-4 font-display text-[56px] font-semibold leading-[1.1] tracking-[-.045em] text-ink max-[600px]:text-[40px]">
            Find Your Perfect
            <br />
            <em className="text-orange">Bus Trip</em>
          </h1>
          <p className="mx-auto mb-8 max-w-[380px] text-sm leading-6 text-[#606a5d]">
            Search and book your next journey with ease. Choose your departure location, destination, and date.
          </p>
        </div>
      </section>
      
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

      <section className="mx-auto mb-16 max-w-[1240px] px-[34px] py-16 max-[600px]:px-6 max-[600px]:py-12">
        <div className="grid grid-cols-3 gap-8 max-[600px]:grid-cols-1 max-[600px]:gap-6">
          <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e7e5dc]">
            <div className="mb-4 inline-block rounded-full bg-[#e8f3e0] p-3">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="mb-2 font-semibold text-ink">Easy Search</h3>
            <p className="text-sm text-[#606a5d]">
              Search for buses by selecting your starting point and destination in seconds.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e7e5dc]">
            <div className="mb-4 inline-block rounded-full bg-[#fff4e6] p-3">
              <span className="text-2xl">💺</span>
            </div>
            <h3 className="mb-2 font-semibold text-ink">Select Seats</h3>
            <p className="text-sm text-[#606a5d]">
              Choose your preferred seats from available options and see real-time availability.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm border border-[#e7e5dc]">
            <div className="mb-4 inline-block rounded-full bg-[#f0e6ff] p-3">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="mb-2 font-semibold text-ink">Secure Booking</h3>
            <p className="text-sm text-[#606a5d]">
              Complete your booking safely with encrypted payment processing.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
