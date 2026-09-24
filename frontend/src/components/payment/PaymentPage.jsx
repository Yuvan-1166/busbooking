import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { LoadingPage } from "../common/Loading";
import { locationLabel, tripLabel } from "../../utils/reference";

const PAYMENT_METHODS = [
  { value: "RAZORPAY", label: "Razorpay", description: "UPI, cards, net banking & wallets — powered by Razorpay" },
  { value: "WALLET", label: "Wallet", description: "Pay from your bus booking wallet balance" },
];

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the payment gateway. Please try again."));
    document.body.appendChild(script);
  });
}

function openRazorpayCheckout(initiated) {
  return new Promise((resolve, reject) => {
    const options = {
      key: initiated.gatewayKeyId,
      amount: Math.round(Number(initiated.amount) * 100),
      currency: initiated.currency || "INR",
      name: "BusBooking",
      description: `Booking ${initiated.transactionReference}`,
      order_id: initiated.gatewayOrderId,
      theme: { color: "#e67e22" },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => resolve(null) },
    };
    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", (response) => {
      const description = response?.error?.description || "Payment failed. Please try again.";
      reject(new Error(description));
    });
    razorpay.open();
  });
}

export default function PaymentPage({ locations, onPaymentSuccess }) {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");
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
    return loc ? locationLabel(loc) : "Unknown location";
  };

  const handlePay = async () => {
    setPaying(true);
    setError("");
    try {
      const initiated = await api.initiatePayment(Number(bookingId), paymentMethod);

      let result;
      if (paymentMethod === "RAZORPAY") {
        await loadRazorpayScript();
        const payment = await openRazorpayCheckout(initiated);
        if (!payment) {
          setError("Payment window closed. Your booking is still held — please retry.");
          return;
        }
        result = await api.confirmPayment({
          paymentId: initiated.paymentId,
          gatewayOrderId: payment.razorpay_order_id,
          gatewayPaymentId: payment.razorpay_payment_id,
          gatewaySignature: payment.razorpay_signature,
        });
      } else {
        result = await api.confirmPayment({ paymentId: initiated.paymentId });
      }

      if (result && result.status === "FAILED") {
        setError(result.failureReason || "Payment failed. Please try again.");
        return;
      }

      if (result?.walletBalanceAfter != null) {
        setWallet({ balance: result.walletBalanceAfter });
      }

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

  if (loading) {
    return <LoadingPage message="Loading Payment" subMessage="Preparing your secure checkout experience" />;
  }

  if (!booking) {
    return (
      <main className="mx-auto mb-20 mt-8 min-h-screen max-w-5xl px-4 sm:px-6">
        <div className="alert alert-error">
          {error || "Booking not found."}
        </div>
      </main>
    );
  }

  const from = getLocationName(booking.pickupLocationId);
  const to = getLocationName(booking.dropLocationId);

  return (
    <main className="mx-auto mb-20 mt-8 min-h-screen max-w-5xl px-4 sm:px-6">

      {/* Back button */}
      <button
        className="btn-ghost mb-6"
        onClick={() => navigate(-1)}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Page heading */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="badge badge-info">Booking {booking.bookingReference}</span>
          <span className="badge badge-neutral">{tripLabel(booking)}</span>
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-neutral-900 sm:text-3xl">
          Review &amp; Complete Payment
        </h1>
        <p className="text-neutral-600">
          Confirm your journey details and complete payment securely
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* Journey card */}
          <section className="card">
            <div className="mb-6 flex items-center gap-2">
              <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h2 className="text-lg font-semibold text-neutral-900">Journey Details</h2>
            </div>

            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-600">From</p>
                <p className="text-xl font-semibold text-neutral-900">
                  {from}
                </p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <svg className="h-6 w-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              <div className="text-right md:text-left">
                <p className="mb-1 text-xs font-medium text-neutral-600">To</p>
                <p className="text-xl font-semibold text-neutral-900">
                  {to}
                </p>
              </div>
            </div>
          </section>

          {/* Passengers card */}
          <section className="card">
            <div className="mb-6 flex items-center gap-2">
              <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-neutral-900">
                Passengers ({booking.passengers?.length ?? 0})
              </h2>
            </div>

            <div className="divide-y divide-neutral-200">
              {booking.passengers?.map((p, i) => (
                <div
                  key={p.id ?? i}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-600">
                      {p.gender?.charAt(0) + p.gender?.slice(1).toLowerCase()} · {p.age} years
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="badge badge-neutral">
                      Seat {p.seatNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">

          {/* Fare summary */}
          <section className="card bg-neutral-50">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h2 className="text-lg font-semibold text-neutral-900">Fare Summary</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>
                  {booking.passengers?.length ?? 1} passenger{booking.passengers?.length !== 1 ? "s" : ""}
                </span>
                <span className="font-medium text-neutral-900">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="divider"></div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">Total Amount</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </section>

          {/* Wallet balance */}
          {wallet && (
            <section
              className={`card transition-colors ${
                paymentMethod === "WALLET"
                  ? canAfford
                    ? "border-2 border-success-500 bg-success-50"
                    : "border-2 border-error-500 bg-error-50"
                  : "bg-white"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h3 className="text-sm font-semibold text-neutral-900">Wallet Balance</h3>
              </div>
              <p className="mb-2 text-3xl font-bold text-neutral-900">
                {formatCurrency(walletBalance)}
              </p>

              {paymentMethod === "WALLET" && canAfford && (
                <p className="text-sm text-success-700">
                  Balance after payment: <strong>{formatCurrency(walletBalance - totalAmount)}</strong>
                </p>
              )}
              {paymentMethod === "WALLET" && !canAfford && (
                <p className="text-sm text-error-700">
                  Insufficient balance. You need {formatCurrency(totalAmount)} but only have {formatCurrency(walletBalance)}.
                </p>
              )}
            </section>
          )}

          {/* Payment method selector */}
          <section className="card">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-neutral-900">Payment Method</h2>
            </div>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                    paymentMethod === method.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-neutral-200 bg-white hover:border-primary-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 h-4 w-4 shrink-0 accent-primary-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900">{method.label}</p>
                    <p className="mt-0.5 text-sm text-neutral-600">
                      {method.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Error alert */}
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Pay button */}
          <button
            className="btn btn-primary btn-lg w-full transition-smooth hover-scale disabled:opacity-50"
            disabled={paying || (paymentMethod === "WALLET" && !canAfford)}
            onClick={handlePay}
          >
            {paying ? (
              <span className="flex items-center gap-2 fade-in">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-l-transparent"></div>
                Processing Payment...
              </span>
            ) : (
              <span className="flex items-center gap-2 transition-colors">
                Pay {formatCurrency(totalAmount)}
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Payments secured and processed by Razorpay</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function formatCurrency(amount) {
  if (amount == null) return "—";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}
