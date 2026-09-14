export default function AccessDenied({ role = 'passenger' }) {
  return <main className="mx-auto mb-[180px] mt-[100px] max-w-[720px] border border-line bg-paper p-11 max-[600px]:mx-4 max-[600px]:my-[55px] max-[600px]:p-7"><p className="mb-3 font-mono text-[10px] tracking-[.13em] text-green">AUTHORIZATION REQUIRED</p><h1 className="mb-3 font-display text-[42px] font-semibold leading-[.98] text-ink max-[600px]:text-[34px]">This page is reserved for {role}s.</h1><p className="text-sm text-muted">Your account is authenticated, but it does not have the role required for this action.</p></main>
}
