import { useState } from "react";
import { aiApi } from "../lib/freeAiClient";
import { formatPrice } from "../lib/dsaClient";
import { useCartStore } from "../stores/useCartStore";
import { X, MessageSquare, Sparkles, Send, Tag, ArrowRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const AiBargainModal = ({ product, isOpen, onClose }) => {
	const { applyCoupon, addToCart } = useCartStore();
	const [userOffer, setUserOffer] = useState("");
	const [chatLogs, setChatLogs] = useState([
		{
			sender: "ai",
			text: `👋 Hey there! I'm your AI Price Negotiator for "${product?.name}". Our listed price is ${formatPrice(product?.price || 0)}. What price do you have in mind? Make me an offer!`,
		},
	]);
	const [loading, setLoading] = useState(false);
	const [acceptedCoupon, setAcceptedCoupon] = useState(null);

	if (!isOpen || !product) return null;

	const handleSendOffer = async (e) => {
		e.preventDefault();
		if (!userOffer || isNaN(Number(userOffer)) || Number(userOffer) <= 0) {
			toast.error("Please enter a valid numeric offer amount");
			return;
		}

		const offerNum = Number(userOffer);
		const userMsg = `I want to offer $${offerNum} for this product.`;

		setChatLogs((prev) => [...prev, { sender: "user", text: userMsg }]);
		setUserOffer("");
		setLoading(true);

		try {
			const result = await aiApi.negotiateDeal(product._id, offerNum, chatLogs);
			setChatLogs((prev) => [...prev, { sender: "ai", text: result.message, status: result.status }]);

			if (result.couponCode) {
				setAcceptedCoupon(result.couponCode);
			}
		} catch (err) {
			setChatLogs((prev) => [
				...prev,
				{
					sender: "ai",
					text: "I can offer you an exclusive 10% instant discount right now! Use code `NEXUS10` at checkout.",
					status: "counter_offer",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	const handleApplyAndAdd = async () => {
		if (acceptedCoupon) {
			await applyCoupon(acceptedCoupon);
		}
		await addToCart(product);
		onClose();
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn'>
			<div className='relative w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]'>
				{/* Modal Header */}
				<div className='flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-emerald-950/40 to-gray-900'>
					<div className='flex items-center gap-2.5'>
						<div className='p-2 rounded-xl bg-emerald-500/20 text-emerald-400'>
							<Sparkles size={18} />
						</div>
						<div>
							<h3 className='font-bold text-white text-base'>AI Price Bargaining Hub</h3>
							<p className='text-xs text-gray-400'>Live AI margin evaluation & discount negotiation</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className='p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition'
					>
						<X size={20} />
					</button>
				</div>

				{/* Product Quick Info Banner */}
				<div className='px-5 py-3 bg-gray-800/40 border-b border-gray-800 flex items-center gap-3'>
					<img src={product.image} alt={product.name} className='w-12 h-12 rounded-lg object-cover border border-gray-700' />
					<div className='flex-1 min-w-0'>
						<p className='text-sm font-semibold text-white truncate'>{product.name}</p>
						<p className='text-xs text-gray-400'>
							Current Price: <span className='text-emerald-400 font-bold'>{formatPrice(product.price)}</span>
						</p>
					</div>
				</div>

				{/* Chat Message History */}
				<div className='flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[320px]'>
					{chatLogs.map((msg, idx) => (
						<div
							key={idx}
							className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
									msg.sender === "user"
										? "bg-emerald-600 text-white rounded-br-none"
										: "bg-gray-800 text-gray-200 border border-gray-700/80 rounded-bl-none shadow"
								}`}
							>
								<p className='leading-relaxed'>{msg.text}</p>
							</div>
						</div>
					))}

					{loading && (
						<div className='flex justify-start'>
							<div className='rounded-2xl rounded-bl-none bg-gray-800 border border-gray-700/80 px-4 py-2.5 text-xs text-gray-400 flex items-center gap-2'>
								<div className='w-2 h-2 rounded-full bg-emerald-400 animate-ping' />
								AI Agent is analyzing dynamic profit margins...
							</div>
						</div>
					)}
				</div>

				{/* Coupon Claim Banner if negotiated */}
				{acceptedCoupon && (
					<div className='mx-4 mb-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2'>
							<Tag size={16} className='text-emerald-400' />
							<div>
								<p className='text-xs font-bold text-emerald-300'>Special Deal Code Issued!</p>
								<p className='text-[11px] font-mono text-white font-semibold'>{acceptedCoupon}</p>
							</div>
						</div>
						<button
							onClick={handleApplyAndAdd}
							className='px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center gap-1 shadow'
						>
							Apply & Add <ArrowRight size={12} />
						</button>
					</div>
				)}

				{/* Input Offer Form */}
				<form onSubmit={handleSendOffer} className='p-4 border-t border-gray-800 bg-gray-900/90 flex gap-2'>
					<div className='relative flex-1'>
						<span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm'>$</span>
						<input
							type='number'
							step='any'
							placeholder={`Enter your offer (e.g. ${Math.round(product.price * 0.88)})`}
							value={userOffer}
							onChange={(e) => setUserOffer(e.target.value)}
							disabled={loading}
							className='w-full rounded-xl bg-gray-800 border border-gray-700 pl-8 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500'
						/>
					</div>
					<button
						type='submit'
						disabled={loading || !userOffer}
						className='px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-1.5 transition'
					>
						<Send size={16} /> Negotiate
					</button>
				</form>
			</div>
		</div>
	);
};

export default AiBargainModal;
