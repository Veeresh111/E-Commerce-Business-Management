import { useState, useEffect } from "react";
import { aiApi } from "../lib/freeAiClient";
import { formatPrice } from "../lib/dsaClient";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import PriceComparisonWidget from "./PriceComparisonWidget";
import AiBargainModal from "./AiBargainModal";
import {
	X,
	ShoppingCart,
	Star,
	ShieldCheck,
	Truck,
	Sparkles,
	MessageSquare,
	Check,
	ChevronRight,
	Zap,
} from "lucide-react";
import toast from "react-hot-toast";

const ProductDetailModal = ({ product, isOpen, onClose }) => {
	const { user } = useUserStore();
	const { addToCart } = useCartStore();
	const [activeImage, setActiveImage] = useState(product?.image || "");
	const [activeTab, setActiveTab] = useState("comparison"); // "comparison" | "reviews" | "specs"
	const [reviewAnalysis, setReviewAnalysis] = useState(null);
	const [isBargainOpen, setIsBargainOpen] = useState(false);

	useEffect(() => {
		if (product) {
			setActiveImage(product.image);
			aiApi.analyzeReviews(product._id).then(setReviewAnalysis).catch(() => {});
		}
	}, [product]);

	if (!isOpen || !product) return null;

	const handleAddToCart = () => {
		if (!user) {
			toast.error("Please login to add items to cart");
			return;
		}
		addToCart(product);
	};

	const galleryImages = [
		product.image,
		product.image,
		product.image,
	];

	return (
		<>
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn'>
				<div className='relative w-full max-w-4xl rounded-3xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]'>
					{/* Modal Close Button */}
					<button
						onClick={onClose}
						className='absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition'
					>
						<X size={20} />
					</button>

					{/* Modal Body */}
					<div className='flex-1 overflow-y-auto p-5 sm:p-7 space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							{/* Image Viewer & Gallery */}
							<div className='space-y-3'>
								<div className='relative h-72 sm:h-80 w-full overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/50 flex items-center justify-center'>
									<img src={activeImage || product.image} alt={product.name} className='h-full w-full object-cover' />
									<div className='absolute top-3 left-3 bg-emerald-500/90 text-gray-950 text-xs font-black uppercase px-2.5 py-1 rounded-full shadow'>
										Verified Stock
									</div>
								</div>
								{/* Thumbnail Row */}
								<div className='flex gap-2 justify-center'>
									{galleryImages.map((img, idx) => (
										<button
											key={idx}
											onClick={() => setActiveImage(img)}
											className={`h-14 w-14 rounded-xl overflow-hidden border-2 transition ${
												activeImage === img ? "border-emerald-400 scale-105" : "border-gray-700 opacity-60"
											}`}
										>
											<img src={img} alt='Thumbnail' className='h-full w-full object-cover' />
										</button>
									))}
								</div>
							</div>

							{/* Product Information & Buy Actions */}
							<div className='flex flex-col justify-between space-y-4'>
								<div>
									<div className='flex items-center gap-2 mb-1.5'>
										<span className='px-2.5 py-0.5 rounded-full bg-gray-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-gray-700'>
											{product.category}
										</span>
										<div className='flex items-center gap-1 text-amber-400 text-xs font-bold'>
											<Star size={14} className='fill-amber-400' />
											{product.rating || 4.8} ({product.reviewCount || 34} reviews)
										</div>
									</div>

									<h2 className='text-2xl sm:text-3xl font-extrabold text-white leading-tight'>{product.name}</h2>
									<p className='text-sm text-gray-300 mt-2 leading-relaxed'>{product.description}</p>
								</div>

								<div className='p-4 rounded-2xl bg-gray-800/60 border border-gray-700 space-y-3'>
									<div className='flex items-baseline gap-3'>
										<span className='text-3xl sm:text-4xl font-black text-emerald-400'>{formatPrice(product.price)}</span>
										<span className='text-sm text-gray-400 line-through'>{formatPrice(product.price * 1.2)}</span>
										<span className='px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold'>
											Save 20%
										</span>
									</div>

									<div className='flex items-center gap-2 text-xs text-emerald-300'>
										<Truck size={16} /> Hyper-fast same-day fulfillment from nearest Hub
									</div>
								</div>

								{/* Action Buttons */}
								<div className='flex flex-col sm:flex-row gap-3 pt-2'>
									<button
										onClick={handleAddToCart}
										className='flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition'
									>
										<ShoppingCart size={18} /> Add to Cart
									</button>
									<button
										onClick={() => setIsBargainOpen(true)}
										className='flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-gray-950 font-black text-sm shadow-lg transition'
									>
										<Sparkles size={18} /> Haggle with AI
									</button>
								</div>
							</div>
						</div>

						{/* Interactive Tabs */}
						<div className='border-t border-gray-800 pt-5'>
							<div className='flex gap-2 border-b border-gray-800 pb-3'>
								<button
									onClick={() => setActiveTab("comparison")}
									className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
										activeTab === "comparison"
											? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
											: "text-gray-400 hover:text-white"
									}`}
								>
									<Zap size={15} /> Amazon & Flipkart Price Intelligence
								</button>
								<button
									onClick={() => setActiveTab("reviews")}
									className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
										activeTab === "reviews"
											? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
											: "text-gray-400 hover:text-white"
									}`}
								>
									<MessageSquare size={15} /> AI Smart Review Breakdown
								</button>
							</div>

							{/* Tab Content */}
							<div className='pt-4'>
								{activeTab === "comparison" && (
									<PriceComparisonWidget product={product} />
								)}

								{activeTab === "reviews" && reviewAnalysis && (
									<div className='space-y-4 rounded-2xl bg-gray-800/40 border border-gray-700/80 p-5'>
										<div className='flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 pb-3'>
											<div>
												<h4 className='text-sm font-bold text-white flex items-center gap-2'>
													AI Review & Authenticity Analysis
													<span className='px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold'>
														{reviewAnalysis.authenticityScore}
													</span>
												</h4>
												<p className='text-xs text-gray-400 mt-0.5'>Neural sentiment parsed from verified customers</p>
											</div>
											<div className='text-right'>
												<span className='text-2xl font-black text-emerald-400'>{reviewAnalysis.overallRating} / 5</span>
											</div>
										</div>

										<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
											<div className='p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30'>
												<p className='text-xs font-bold text-emerald-300 mb-2 flex items-center gap-1'>
													<Check size={14} /> AI Pros Highlight
												</p>
												<ul className='space-y-1.5 text-xs text-gray-300'>
													{reviewAnalysis.pros?.map((pro, i) => (
														<li key={i} className='flex items-start gap-1.5'>
															<span className='text-emerald-400 font-bold'>•</span> {pro}
														</li>
													))}
												</ul>
											</div>

											<div className='p-3.5 rounded-xl bg-gray-800/70 border border-gray-700'>
												<p className='text-xs font-bold text-amber-300 mb-2'>AI Caveats / Cons</p>
												<ul className='space-y-1.5 text-xs text-gray-300'>
													{reviewAnalysis.cons?.map((con, i) => (
														<li key={i} className='flex items-start gap-1.5'>
															<span className='text-amber-400 font-bold'>•</span> {con}
														</li>
													))}
												</ul>
											</div>
										</div>

										<div className='p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200'>
											<span className='font-bold mr-1'>Verdict:</span>
											{reviewAnalysis.aiVerdict}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Sub-Modal: AI Bargaining */}
			<AiBargainModal
				product={product}
				isOpen={isBargainOpen}
				onClose={() => setIsBargainOpen(false)}
			/>
		</>
	);
};

export default ProductDetailModal;
