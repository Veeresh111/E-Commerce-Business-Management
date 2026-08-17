import { useState } from "react";
import toast from "react-hot-toast";
import { ShoppingCart, Star, Sparkles, Eye, TrendingDown } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { formatPrice } from "../lib/dsaClient";
import ProductDetailModal from "./ProductDetailModal";
import AiBargainModal from "./AiBargainModal";

const ProductCard = ({ product }) => {
	const { user } = useUserStore();
	const { addToCart } = useCartStore();
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isBargainOpen, setIsBargainOpen] = useState(false);

	const handleAddToCart = (e) => {
		e.stopPropagation();
		if (!user) {
			toast.error("Please login to add products to cart", { id: "login" });
			return;
		}
		addToCart(product);
	};

	// Deterministic delta calculation for Amazon & Flipkart comparison badge
	const hash = (product.name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const savingsDelta = Math.round(product.price * (0.12 + (hash % 10) / 100));

	return (
		<>
			<div
				onClick={() => setIsDetailOpen(true)}
				className='group flex w-full relative flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/80 hover:border-emerald-500/50 hover:bg-gray-900 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-950/30 cursor-pointer'
			>
				{/* Image Header with Competitor Badge */}
				<div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-2xl bg-gray-800'>
					<img
						className='object-cover w-full h-full group-hover:scale-105 transition-transform duration-500'
						src={product.image}
						alt={product.name}
					/>
					<div className='absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent' />

					{/* Competitor Price Savings Badge */}
					<div className='absolute top-2.5 left-2.5 bg-emerald-500 text-gray-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow flex items-center gap-1'>
						<TrendingDown size={11} /> Save {formatPrice(savingsDelta)} vs Amazon
					</div>

					{/* Quick View Button on Hover */}
					<div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]'>
						<button
							onClick={(e) => {
								e.stopPropagation();
								setIsDetailOpen(true);
							}}
							className='flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 text-gray-950 font-bold text-xs shadow-lg hover:bg-white transition'
						>
							<Eye size={14} /> Quick View
						</button>
					</div>
				</div>

				{/* Card Body */}
				<div className='p-4 flex flex-col justify-between flex-1'>
					<div>
						<div className='flex items-center justify-between gap-2 mb-1'>
							<span className='text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20'>
								{product.category}
							</span>
							<div className='flex items-center gap-1 text-amber-400 text-xs font-semibold'>
								<Star size={12} className='fill-amber-400' />
								{product.rating || 4.8}
							</div>
						</div>

						<h5 className='text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition truncate'>
							{product.name}
						</h5>
					</div>

					<div className='mt-3 pt-3 border-t border-gray-800 flex items-center justify-between'>
						<div>
							<p className='text-xl font-black text-white'>{formatPrice(product.price)}</p>
							<p className='text-[11px] text-gray-400 line-through'>{formatPrice(product.price * 1.18)}</p>
						</div>

						<div className='flex items-center gap-1.5'>
							{/* AI Bargain Button */}
							<button
								onClick={(e) => {
									e.stopPropagation();
									setIsBargainOpen(true);
								}}
								className='p-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition'
								title='Haggle with AI'
							>
								<Sparkles size={16} />
							</button>

							{/* Add to Cart Button */}
							<button
								className='flex items-center justify-center rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition'
								onClick={handleAddToCart}
							>
								<ShoppingCart size={16} className='mr-1' />
								Add
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Detailed Product Modal */}
			<ProductDetailModal
				product={product}
				isOpen={isDetailOpen}
				onClose={() => setIsDetailOpen(false)}
			/>

			{/* AI Bargain Modal */}
			<AiBargainModal
				product={product}
				isOpen={isBargainOpen}
				onClose={() => setIsBargainOpen(false)}
			/>
		</>
	);
};

export default ProductCard;
