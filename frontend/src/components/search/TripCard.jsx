export default function TripCard({ trip, onSelect }) {
  return <article className="grid min-h-[126px] grid-cols-[48px_1fr_145px] items-center gap-4 border border-[#e7e5dc] bg-paper px-[21px] py-[17px] max-[600px]:grid-cols-[38px_1fr] max-[600px]:gap-3 max-[600px]:p-4">
    <div className="grid h-[45px] w-[45px] place-items-center rounded-full font-display text-[13px] max-[600px]:h-[38px] max-[600px]:w-[38px]">#{trip.id}</div>
    <div>
      <div className="mb-[13px] flex items-center gap-[11px] text-[13px] max-[600px]:mb-2"><strong>Trip #{trip.id}</strong><span className="font-mono text-[10px] text-muted">Route #{trip.routeId}</span></div>
      <div className="grid grid-cols-[55px_1fr_55px] items-center gap-2.5 max-[600px]:grid-cols-[45px_1fr_45px]"><div><strong className="block font-mono text-xl max-[600px]:text-base">{trip.departureTime || '—'}</strong><small className="mt-1 block text-[10px] text-muted">{trip.tripDate}</small></div>
        <div className="flex items-center gap-1.5 text-[#a8aba2]"><span className="h-px flex-1 bg-[#c8cdc3]"></span><small className="whitespace-nowrap font-mono text-[9px]">Published trip</small><span className="h-px flex-1 bg-[#c8cdc3]"></span></div>
        <div className="text-right"><strong className="block font-mono text-xl max-[600px]:text-base">Bus {trip.busId || '—'}</strong><small className="mt-1 block text-[10px] text-muted">Schedule {trip.scheduleId || '—'}</small></div>
      </div>
    </div>
    <div className="text-right max-[600px]:col-start-2 max-[600px]:flex max-[600px]:items-center max-[600px]:gap-3 max-[600px]:text-left"><span className="mb-1 block font-mono text-[9px] uppercase text-muted max-[600px]:mb-0">Starting from</span><strong className="mb-2 block font-mono text-lg text-ink max-[600px]:mb-0">{formatCurrency(trip.startingFare)}</strong><button className="border-0 border-b border-orange bg-transparent p-0 text-[11px] text-orange max-[600px]:ml-auto" onClick={onSelect}>View seats <span className="ml-1.5 text-[15px]">→</span></button></div>
  </article>
}

function formatCurrency(amount) {
  return amount == null ? "—" : `₹${Number(amount).toLocaleString("en-IN")}`;
}
