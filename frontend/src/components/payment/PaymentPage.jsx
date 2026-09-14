import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";

const PAYMENT_METHODS = [
  { value: "WALLET", label: "Wallet", description: "Pay from your bus booking wallet balance" },
  { value: "UPI", label: "UPI", description: "Any UPI app — GPay, PhonePe, Paytm" },
  { value: "CARD", label: "Card", description: "Credit or debit card" },
  { value: "NET_BANKING", label: "Net Banking", description: "Internet banking" },
];

export default function PaymentPage({ locations, onPaymentSuccess }) {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("WALLET");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [bookingData, walletData] = await Promise.all([
          api.getBooking(bookingId),
          api.getWalletBalance(),
        ]);
        setBooking(bookingData);
        setWallet(walletData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  const getLocationName = (id) => {
    const loc = locations?.find((l) => String(l.id) === String(id));
    return loc ? `${loc.name}, ${loc.city}` : `Location #${id}`;
  };

  const handlePay = async () => {
    setPaying(true);
    setError("");
    try {
      await api.pay(Number(bookingId), paymentMethod);
      const ticket = await api.getTicket(Number(bookingId));
      if (onPaymentSuccess) onPaymentSuccess(ticket);
      navigate("/bookings");
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const totalAmount = Number(booking?.totalAmount ?? 0);
  const walletBalance = Number(wallet?.balance ?? 0);
  const canAfford = paymentMethod !== "WALLET" || walletBalance >= totalAmount;

  console.log("api =", api);
  console.log("api.getBooking =", api.getBooking);
  console.log("typeof =", typeof api.getBooking);

  if (loading) {
    return (
      <main className="mx-auto mb-[100px] mt-[55px] max-w-[860px] px-4">
        <div className="border border-dashed border-line p-[74px_30px] text-center text-sm text-muted">
          Loading payment details...
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto mb-[100px] mt-[55px] max-w-[860px] px-4">
        <div className="border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]">
          {error || "Booking not found."}
        </div>
      </main>
    );
  }

  const from = getLocationName(booking.pickupLocationId);
  const to = getLocationName(booking.dropLocationId);

  return (
    <main className="mx-auto mb-[100px] mt-[55px] max-w-[900px] px-4">

      {/* Back */}
      <button
        className="border-0 bg-transparent p-0 text-xs text-muted"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      {/* Page heading */}
      <div className="mt-[43px] mb-10">
        <p className="mb-3.5 font-mono text-[10px] tracking-[.13em] text-green">
          BOOKING · {booking.bookingReference}
        </p>
        <h1 className="font-display text-5xl font-semibold leading-[.95] tracking-[-.045em] text-ink max-[600px]:text-[40px]">
          Review &amp; pay.
        </h1>
        <p className="mt-3 text-sm text-muted">
          Confirm your journey details and complete payment.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-6 max-[860px]:grid-cols-1">

        {/* ── LEFT COLUMN ── */}
        <div className="grid gap-5 content-start">

          {/* Journey card */}
          <section className="border border-[#e7e5dc] bg-paper p-7">
            <p className="mb-5 font-mono text-[10px] tracking-[.13em] text-green">JOURNEY</p>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div>
                <p className="mb-1 font-mono text-[9px] uppercase text-muted">From</p>
                <p className="font-display text-[20px] font-semibold leading-tight text-ink">
                  {from}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-[9px] text-muted">Trip #{booking.tripId}</span>
                <span className="text-xl text-orange">→</span>
              </div>

              <div className="text-right">
                <p className="mb-1 font-mono text-[9px] uppercase text-muted">To</p>
                <p className="font-display text-[20px] font-semibold leading-tight text-ink">
                  {to}
                </p>
              </div>
            </div>
          </section>

          {/* Passengers card */}
          <section className="border border-[#e7e5dc] bg-paper p-7">
            <p className="mb-5 font-mono text-[10px] tracking-[.13em] text-green">
              PASSENGERS · {booking.passengers?.length ?? 0}
            </p>

            <div className="grid gap-0">
              {booking.passengers?.map((p, i) => (
                <div
                  key={p.id ?? i}
                  className="flex items-center gap-4 border-b border-line py-3.5 last:border-0"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8eee4] font-mono text-[11px] font-bold text-green">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">
                      {p.gender?.charAt(0) + p.gender?.slice(1).toLowerCase()} · Age {p.age}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs font-semibold text-ink">
                      Seat {p.seatNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="grid gap-5 content-start">

          {/* Fare summary */}
          <section className="border border-[#e7e5dc] bg-paper p-7">
            <p className="mb-4 font-mono text-[10px] tracking-[.13em] text-green">FARE SUMMARY</p>

            <div className="grid gap-2.5 font-mono text-[11px]">
              <div className="flex justify-between text-muted">
                <span>
                  {booking.passengers?.length ?? 1} passenger
                  {booking.passengers?.length !== 1 ? "s" : ""}
                </span>
                <span className="text-ink">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="flex justify-between border-t border-line pt-2.5">
                <span className="font-bold text-ink">Total</span>
                <span className="text-[16px] font-bold text-orange">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </section>

          {/* Wallet balance */}
          {wallet && (
            <section
              className={`border p-5 transition ${
                paymentMethod === "WALLET"
                  ? canAfford
                    ? "border-[#a5bea0] bg-[#e4eee1]"
                    : "border-[#d79b8b] bg-[#f7e5df]"
                  : "border-[#e7e5dc] bg-paper"
              }`}
            >
              <p className="mb-2 font-mono text-[10px] tracking-[.13em] text-green">
                YOUR WALLET
              </p>
              <p className="font-display text-[30px] font-semibold text-ink">
                {formatCurrency(walletBalance)}
              </p>

              {paymentMethod === "WALLET" && canAfford && (
                <p className="mt-1 font-mono text-[10px] text-green">
                  Balance after payment:{" "}
                  <strong>{formatCurrency(walletBalance - totalAmount)}</strong>
                </p>
              )}
              {paymentMethod === "WALLET" && !canAfford && (
                <p className="mt-1 text-[11px] text-[#8c3e2d]">
                  Insufficient balance. You need {formatCurrency(totalAmount)} but
                  only have {formatCurrency(walletBalance)}.
                </p>
              )}
            </section>
          )}

          {/* Payment method selector */}
          <section className="border border-[#e7e5dc] bg-paper p-7">
            <p className="mb-4 font-mono text-[10px] tracking-[.13em] text-green">
              PAYMENT METHOD
            </p>

            <div className="grid gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex items-start gap-3 border p-3.5 text-left transition ${
                    paymentMethod === method.value
                      ? "border-orange bg-[#fff6ee]"
                      : "border-line bg-transparent hover:border-orange"
                  }`}
                >
                  {/* Radio dot */}
                  <span
                    className={`mt-[3px] h-[14px] w-[14px] shrink-0 rounded-full border-2 transition ${
                      paymentMethod === method.value
                        ? "border-orange bg-orange"
                        : "border-muted bg-transparent"
                    }`}
                  />
                  <div>
                    <p className="text-[12px] font-bold text-ink">{method.label}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-muted">
                      {method.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Inline error */}
          {error && (
            <div
              className="border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Pay button */}
          <button
            className="w-full border-0 bg-orange px-[17px] py-4 text-left font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
            disabled={paying || (paymentMethod === "WALLET" && !canAfford)}
            onClick={handlePay}
          >
            {paying
              ? "Processing…"
              : `Pay ${formatCurrency(totalAmount)}`}
            <span className="float-right text-xl">→</span>
          </button>

          <p className="text-center font-mono text-[10px] text-muted">
            Simulated payment · For development use only
          </p>
        </div>
      </div>
    </main>
  );
}

function formatCurrency(amount) {
  if (amount == null) return "—";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}
