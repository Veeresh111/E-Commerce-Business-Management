import { useState, useEffect } from "react";
import { aiApi } from "../lib/freeAiClient";
import { formatPrice } from "../lib/dsaClient";
import { useCartStore } from "../stores/useCartStore";
import { Zap, Timer, Flame, ArrowRight, ShoppingCart, Star } from "lucide-react";
import toast from "react-hot-toast";

const FlashSalesBanner = ({ onSelectProduct }) => {
	const [deals, setDeals] = useState([]);
	const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 44, seconds: 12 });
	const { addToCart } = useCartStore();

	useEffect(() => {
		let isMounted = true;
		aiApi
			.getFlashDeals()
			.then((res) => {
				if (isMounted) setDeals(res || []);
			})
			.catch(() => {});

		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
				if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
				if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
				return { hours: 3, minutes: 0, seconds: 0 };
			});
		}, 1000);

		return () => {
			isMounted = false;
			clearInterval(interval);
		};
	}, []);

	if (deals.length === 0) return null;

	return (
		<div className='my-10 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-gray-900 to-emerald-950/30 p-6 shadow-2xl relative overflow-hidden'>
			{/* Ambient Glowing Background Effect */}
			<div className='absolute -right-20 -top-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none' />

			{/* Banner Header with Live Countdown */}
			<div className='flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-6'>
				<div className='flex items-center gap-3'>
					<div className='p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30'>
						<Flame size={24} className='animate-pulse fill-amber-400' />
					</div>
					<div>
						<div className='flex items-center gap-2'>
							<h3 className='text-xl sm:text-2xl font-black text-white'>Priority Flash Sale Hub</h3>
							<span className='px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 text-xs font-black uppercase border border-red-500/30'>
								Live
							</span>
						</div>
						<p className='text-xs text-gray-400'>Algorithmically prioritized high-discount deals</p>
					</div>
				</div>

				{/* Countdown Timer */}
				<div className='flex items-center gap-2 bg-gray-800/80 px-4 py-2 rounded-2xl border border-gray-700 shadow'>
					<Timer size={18} className='text-amber-400' />
					<span className='text-xs text-gray-400 font-semibold'>Ends in:</span>
					<div className='flex gap-1 font-mono font-bold text-sm text-white'>
						<span className='px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700'>
							{String(timeLeft.hours).padStart(2, "0")}h
						</span>
						:
						<span className='px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700'>
							{String(timeLeft.minutes).padStart(2, "0")}m
						</span>
						:
						<span className='px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700 text-amber-400'>
							{String(timeLeft.seconds).padStart(2, "0")}s
						</span>
					</div>
				</div>
			</div>

			{/* Deals Carousel / Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
				{deals.slice(0, 4).map((item) => (
					<div
						key={item._id}
						onClick={() => onSelectProduct && onSelectProduct(item)}
						className='group rounded-2xl border border-gray-700/80 bg-gray-800/60 hover:bg-gray-800 hover:border-amber-500/50 p-4 transition-all duration-300 shadow-lg cursor-pointer flex flex-col justify-between'
					>
						<div>
							<div className='relative h-44 rounded-xl overflow-hidden mb-3'>
								<img src={item.image} alt={item.name} className='w-full h-full object-cover group-hover:scale-105 transition duration-500' />
								<div className='absolute top-2 left-2 bg-amber-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow'>
									{item.discountPercentage || 25}% OFF
								</div>
							</div>

							<div className='flex items-center gap-1 text-amber-400 text-xs font-semibold mb-1'>
								<Star size={12} className='fill-amber-400' /> {item.rating || 4.9}
							</div>
							<h4 className='text-sm font-bold text-white truncate group-hover:text-emerald-400 transition'>{item.name}</h4>
						</div>

						<div className='mt-3 pt-3 border-t border-gray-700 flex items-center justify-between'>
							<div>
								<p className='text-base font-black text-emerald-400'>{formatPrice(item.price)}</p>
								<p className='text-[10px] text-gray-400 line-through'>{formatPrice(item.price * 1.25)}</p>
							</div>
							<button
								onClick={(e) => {
									e.stopPropagation();
									addToCart(item);
									toast.success(`Added ${item.name} to cart`);
								}}
								className='p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow'
								title='Add to cart'
							>
								<ShoppingCart size={16} />
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default FlashSalesBanner;
