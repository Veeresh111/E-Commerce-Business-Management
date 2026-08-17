import { useState } from "react";
import axios from "../lib/axios";
import { formatPrice } from "../lib/dsaClient";
import { useCartStore } from "../stores/useCartStore";
import {
	X,
	CreditCard,
	QrCode,
	Truck,
	Coins,
	Calendar,
	CheckCircle2,
	Lock,
	ShieldCheck,
	ArrowRight,
	Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const PaymentModal = ({ isOpen, onClose, cart, total, subtotal, coupon }) => {
	const navigate = useNavigate();
	const { clearCart } = useCartStore();
	const [selectedMethod, setSelectedMethod] = useState("upi"); // "stripe" | "upi" | "cod" | "crypto" | "bnpl"
	const [loading, setLoading] = useState(false);
	const [upiOtp, setUpiOtp] = useState("");
	const [codOtp, setCodOtp] = useState("");
	const [generatedOtp, setGeneratedOtp] = useState("8492");
	const [bnplTenure, setBnplTenure] = useState(3);

	if (!isOpen) return null;

	const handleStripeCheckout = async () => {
		setLoading(true);
		try {
			const { loadStripe } = await import("@stripe/stripe-js");
			const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
			if (!key) {
				toast.error("Stripe test key not configured in .env. Try Instant UPI QR, COD, or BNPL 0% EMI instead!");
				setLoading(false);
				return;
			}
			const stripe = await loadStripe(key);
			const res = await axios.post("/payments/create-checkout-session", {
				products: cart,
				couponCode: coupon ? coupon.code : null,
			});

			const session = res.data;
			if (stripe) {
				const result = await stripe.redirectToCheckout({
					sessionId: session.id,
				});
				if (result.error) toast.error(result.error.message);
			}
		} catch (error) {
			console.error("Stripe error:", error);
			toast.error(error.response?.data?.message || "Stripe checkout failed. Try UPI QR or COD!");
		} finally {
			setLoading(false);
		}
	};

	const handleDirectPayment = async () => {
		if (selectedMethod === "cod" && codOtp !== generatedOtp) {
			toast.error(`Please enter valid OTP: ${generatedOtp}`);
			return;
		}

		setLoading(true);
		try {
			const res = await axios.post("/payments/direct-checkout", {
				products: cart,
				paymentMethod: selectedMethod,
				paymentDetails: {
					method: selectedMethod,
					tenureMonths: selectedMethod === "bnpl" ? bnplTenure : undefined,
					monthlyEmi: selectedMethod === "bnpl" ? (total / bnplTenure).toFixed(2) : undefined,
				},
				couponCode: coupon ? coupon.code : null,
			});

			toast.success("Order Placed Successfully!");
			await clearCart();
			onClose();
			navigate("/orders");
		} catch (error) {
			console.error("Direct payment error:", error);
			toast.error(error.response?.data?.error || "Order placement failed");
		} finally {
			setLoading(false);
		}
	};

	const paymentOptions = [
		{
			id: "upi",
			title: "Instant UPI / QR Code",
			subtitle: "PhonePe, Google Pay, Paytm, BHIM",
			icon: <QrCode className='text-emerald-400' size={22} />,
			badge: "0% Fee • 1-Sec Pay",
		},
		{
			id: "stripe",
			title: "Credit / Debit Card & Apple Pay",
			subtitle: "Visa, Mastercard, Amex, Apple/Google Pay",
			icon: <CreditCard className='text-blue-400' size={22} />,
			badge: "Global Instant",
		},
		{
			id: "cod",
			title: "Cash on Delivery (COD)",
			subtitle: "Pay in cash or UPI at delivery doorstep",
			icon: <Truck className='text-amber-400' size={22} />,
			badge: "OTP Protected",
		},
		{
			id: "crypto",
			title: "Zero-Gas Web3 Pay",
			subtitle: "USDC, USDT, ETH, Bitcoin",
			icon: <Coins className='text-purple-400' size={22} />,
			badge: "Decentralized",
		},
		{
			id: "bnpl",
			title: "0% EMI / Buy Now Pay Later",
			subtitle: "Split into 3, 6, or 12 interest-free months",
			icon: <Calendar className='text-teal-400' size={22} />,
			badge: "Instant Approval",
		},
	];

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn'>
			<div className='relative w-full max-w-xl rounded-3xl border border-emerald-500/40 bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]'>
				{/* Modal Header */}
				<div className='flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-emerald-950/40 to-gray-900'>
					<div className='flex items-center gap-2.5'>
						<div className='p-2 rounded-xl bg-emerald-500/20 text-emerald-400'>
							<Lock size={20} />
						</div>
						<div>
							<h3 className='font-bold text-white text-base'>Secure Nexus Gateway</h3>
							<p className='text-xs text-gray-400'>256-bit encrypted multi-channel checkout</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className='p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition'
					>
						<X size={20} />
					</button>
				</div>

				<div className='p-6 overflow-y-auto space-y-5'>
					{/* Total Summary */}
					<div className='p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between'>
						<div>
							<p className='text-xs text-emerald-400 font-semibold uppercase tracking-wider'>Final Amount to Pay</p>
							<p className='text-2xl sm:text-3xl font-black text-white'>{formatPrice(total)}</p>
						</div>
						<div className='text-right text-xs text-gray-400'>
							<p>{cart.length} item{cart.length > 1 ? "s" : ""}</p>
							{coupon && <p className='text-emerald-400 font-bold'>Coupon applied: {coupon.code}</p>}
						</div>
					</div>

					{/* Payment Method Selector */}
					<div className='space-y-2.5'>
						<p className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Select Payment Gateway:</p>
						<div className='space-y-2'>
							{paymentOptions.map((opt) => (
								<label
									key={opt.id}
									onClick={() => setSelectedMethod(opt.id)}
									className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
										selectedMethod === opt.id
											? "border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-950/30"
											: "border-gray-800 bg-gray-800/40 hover:border-gray-700"
									}`}
								>
									<div className='flex items-center gap-3.5'>
										<div className='p-2 rounded-xl bg-gray-800 border border-gray-700/80'>{opt.icon}</div>
										<div>
											<div className='flex items-center gap-2'>
												<span className='text-sm font-bold text-white'>{opt.title}</span>
												<span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'>
													{opt.badge}
												</span>
											</div>
											<p className='text-xs text-gray-400 mt-0.5'>{opt.subtitle}</p>
										</div>
									</div>
									<input
										type='radio'
										name='payment_method'
										checked={selectedMethod === opt.id}
										onChange={() => setSelectedMethod(opt.id)}
										className='text-emerald-500 focus:ring-emerald-500'
									/>
								</label>
							))}
						</div>
					</div>

					{/* Dynamic Sub-Panels for Selected Method */}
					{selectedMethod === "upi" && (
						<div className='p-4 rounded-2xl bg-gray-800/60 border border-emerald-500/30 text-center space-y-3'>
							<div className='p-3 bg-white rounded-xl inline-block shadow-lg'>
								{/* Simulated Dynamic QR Code */}
								<div className='w-36 h-36 border-4 border-gray-900 rounded-lg flex flex-col items-center justify-center bg-gray-950 text-emerald-400 p-2'>
									<QrCode size={90} className='text-emerald-400' />
									<span className='text-[9px] font-mono text-gray-300 mt-1 font-bold'>UPI://NEXUS-PAY</span>
								</div>
							</div>
							<p className='text-xs text-gray-300'>Scan with any UPI App (GPay, PhonePe, Paytm) to pay <b>{formatPrice(total)}</b></p>
						</div>
					)}

					{selectedMethod === "cod" && (
						<div className='p-4 rounded-2xl bg-gray-800/60 border border-gray-700 space-y-2'>
							<p className='text-xs text-gray-300'>
								To prevent spam, enter security OTP code: <b className='text-emerald-400 font-mono text-sm tracking-wider'>{generatedOtp}</b>
							</p>
							<input
								type='text'
								placeholder='Enter 4-digit OTP'
								value={codOtp}
								onChange={(e) => setCodOtp(e.target.value)}
								className='w-full rounded-xl bg-gray-800 border border-gray-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500'
							/>
						</div>
					)}

					{selectedMethod === "bnpl" && (
						<div className='p-4 rounded-2xl bg-gray-800/60 border border-gray-700 space-y-3'>
							<p className='text-xs font-semibold text-gray-300'>Choose 0% Interest Tenure:</p>
							<div className='grid grid-cols-3 gap-2'>
								{[3, 6, 12].map((months) => (
									<button
										key={months}
										type='button'
										onClick={() => setBnplTenure(months)}
										className={`p-2.5 rounded-xl border text-center transition ${
											bnplTenure === months
												? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
												: "border-gray-700 bg-gray-800 text-gray-400"
										}`}
									>
										<p className='text-xs font-bold'>{months} Months</p>
										<p className='text-[11px] font-black text-white mt-0.5'>{formatPrice(total / months)}/mo</p>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Pay Button */}
					<button
						onClick={selectedMethod === "stripe" ? handleStripeCheckout : handleDirectPayment}
						disabled={loading}
						className='w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-black text-base shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-[0.99]'
					>
						{loading ? (
							"Processing Secure Transaction..."
						) : (
							<>
								Complete Payment of {formatPrice(total)} <ArrowRight size={18} />
							</>
						)}
					</button>

					<div className='flex items-center justify-center gap-2 text-xs text-gray-500'>
						<ShieldCheck size={14} className='text-emerald-400' /> Protected by 100% Nexus Buyer Guarantee & Instant Refund Protection
					</div>
				</div>
			</div>
		</div>
	);
};

export default PaymentModal;
