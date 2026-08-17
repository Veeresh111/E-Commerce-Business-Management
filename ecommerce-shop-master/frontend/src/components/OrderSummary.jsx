import { useState } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight, ShieldCheck, Zap, Lock, Sparkles } from "lucide-react";
import { formatPrice } from "../lib/dsaClient";
import PaymentModal from "./PaymentModal";

const OrderSummary = () => {
	const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

	const savings = subtotal - total;
	const amazonEquivalentTotal = total * 1.18; // 18% higher on Amazon
	const amazonSavings = amazonEquivalentTotal - total;

	return (
		<>
			<motion.div
				className='space-y-4 rounded-3xl border border-gray-800 bg-gray-900/90 p-6 shadow-2xl backdrop-blur-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className='flex items-center justify-between border-b border-gray-800 pb-3'>
					<p className='text-lg font-extrabold text-white flex items-center gap-2'>
						<Lock size={18} className='text-emerald-400' /> Order Summary
					</p>
					<span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
						{cart.length} Items
					</span>
				</div>

				<div className='space-y-3.5'>
					<div className='space-y-2.5 text-sm'>
						<div className='flex items-center justify-between text-gray-300'>
							<span>Cart Subtotal</span>
							<span className='font-bold text-white'>{formatPrice(subtotal)}</span>
						</div>

						{savings > 0 && (
							<div className='flex items-center justify-between text-emerald-400'>
								<span>Coupon Discount</span>
								<span className='font-bold'>-{formatPrice(savings)}</span>
							</div>
						)}

						{coupon && isCouponApplied && (
							<div className='flex items-center justify-between text-emerald-400'>
								<span>Promo Code ({coupon.code})</span>
								<span className='font-bold'>-{coupon.discountPercentage}%</span>
							</div>
						)}

						<div className='flex items-center justify-between text-gray-400 text-xs'>
							<span>Estimated Standard Shipping</span>
							<span className='text-emerald-400 font-bold uppercase'>FREE (Prime)</span>
						</div>

						{/* Total */}
						<div className='flex items-center justify-between border-t border-gray-800 pt-3 text-base'>
							<span className='font-bold text-white'>Total Amount</span>
							<span className='text-2xl font-black text-emerald-400'>{formatPrice(total)}</span>
						</div>
					</div>

					{/* 0% EMI Hint */}
					<div className='p-3 rounded-2xl bg-teal-950/20 border border-teal-500/30 text-xs text-teal-300 flex items-center justify-between'>
						<span>Or 3 payments of <b>{formatPrice(total / 3)}/mo</b></span>
						<span className='font-bold text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20'>0% EMI</span>
					</div>

					{/* Competitor Price Savings Alert */}
					<div className='p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2'>
						<Zap size={16} className='text-emerald-400 shrink-0' />
						<span>You save <b>{formatPrice(amazonSavings)}</b> compared to Amazon & Flipkart cart totals!</span>
					</div>

					{/* Checkout Trigger */}
					<motion.button
						className='flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-5 py-3.5 text-sm font-black text-gray-950 hover:from-emerald-400 hover:to-teal-400 shadow-xl shadow-emerald-500/20 transition'
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						onClick={() => setIsPaymentModalOpen(true)}
					>
						Proceed to Multi-Gateway Checkout
					</motion.button>

					<div className='flex items-center justify-center gap-2 pt-1'>
						<Link
							to='/'
							className='inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-emerald-400 transition'
						>
							Continue Shopping <MoveRight size={14} />
						</Link>
					</div>
				</div>
			</motion.div>

			{/* Payment Gateway Modal */}
			<PaymentModal
				isOpen={isPaymentModalOpen}
				onClose={() => setIsPaymentModalOpen(false)}
				cart={cart}
				total={total}
				subtotal={subtotal}
				coupon={coupon}
			/>
		</>
	);
};

export default OrderSummary;
