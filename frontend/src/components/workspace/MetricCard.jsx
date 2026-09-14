export default function MetricCard({ label, value, detail, accent = '' }) {
  const accents = { coral: 'border-t-orange', green: 'border-t-green', yellow: 'border-t-yellow', blue: 'border-t-[#7ea4aa]' }
  return <article className={`grid min-h-[130px] border border-[#e7e5dc] border-t-[3px] bg-paper p-5 ${accents[accent] || 'border-t-orange'}`}><span className="font-mono text-[10px] uppercase text-muted">{label}</span><strong className="self-center font-display text-[38px] font-semibold">{value}</strong><small className="text-[10px] text-muted">{detail}</small></article>
}
