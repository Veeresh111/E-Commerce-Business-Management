import { useEffect, useState } from "react";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import FeaturedProducts from "../components/FeaturedProducts";
import FlashSalesBanner from "../components/FlashSalesBanner";
import ProductDetailModal from "../components/ProductDetailModal";
import { aiApi } from "../lib/freeAiClient";
import { formatPrice } from "../lib/dsaClient";
import { useCartStore } from "../stores/useCartStore";
import {
	Zap,
	ShieldCheck,
	Truck,
	Sparkles,
	ArrowRight,
	TrendingDown,
	CheckCircle2,
	Coins,
	Package,
} from "lucide-react";
import toast from "react-hot-toast";

const categories = [
	{ href: "/jeans", name: "Jeans", imageUrl: "/jeans.jpg" },
	{ href: "/t-shirts", name: "T-shirts", imageUrl: "/tshirts.jpg" },
	{ href: "/shoes", name: "Shoes", imageUrl: "/shoes.jpg" },
	{ href: "/glasses", name: "Glasses", imageUrl: "/glasses.png" },
	{ href: "/jackets", name: "Jackets", imageUrl: "/jackets.jpg" },
	{ href: "/suits", name: "Suits", imageUrl: "/suits.jpg" },
	{ href: "/bags", name: "Bags", imageUrl: "/bags.jpg" },
];

const HomePage = () => {
	const { fetchFeaturedProducts, products, loading } = useProductStore();
	const { addToCart } = useCartStore();
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [smartBundle, setSmartBundle] = useState(null);

	useEffect(() => {
		fetchFeaturedProducts();
	}, [fetchFeaturedProducts]);

	useEffect(() => {
		if (products && products.length > 0) {
			aiApi
				.getSmartBundles(products[0]._id)
				.then(setSmartBundle)
				.catch(() => {});
		}
	}, [products]);

	const handleAddBundle = () => {
		if (!smartBundle) return;
		addToCart(smartBundle.mainProduct);
		smartBundle.bundleProducts.forEach((p) => addToCart(p));
		toast.success("AI Synergy Bundle added to cart with 15% Discount!");
	};

	return (
		<div className='relative min-h-screen text-white overflow-hidden pb-16'>
			{/* Hero Section */}
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-10'>
				<div className='text-center max-w-3xl mx-auto space-y-5'>
					{/* Holographic Badge */}
					<div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg animate-pulse'>
						<Sparkles size={14} className='text-emerald-400' />
						Next-Gen AI Autonomous E-Commerce Engine
					</div>

					<h1 className='text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight'>
						Shop Smarter with{" "}
						<span className='bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent'>
							Live Competitor Price Matching
						</span>
					</h1>

					<p className='text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto'>
						Guaranteed 8%–25% lower prices than Amazon & Flipkart. Equipped with Autonomous Voice AI Copilots, 2-Hour Metro Delivery, and Zero-Friction Returns.
					</p>

					{/* Metrics Bar */}
					<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto'>
						<div className='p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/80 backdrop-blur text-center'>
							<p className='text-xl sm:text-2xl font-black text-emerald-400'>15%–25%</p>
							<p className='text-[11px] text-gray-400 font-semibold'>Cheaper than Amazon</p>
						</div>
						<div className='p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/80 backdrop-blur text-center'>
							<p className='text-xl sm:text-2xl font-black text-teal-400'>2 Hours</p>
							<p className='text-[11px] text-gray-400 font-semibold'>Hyper-Fast Dispatch</p>
						</div>
						<div className='p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/80 backdrop-blur text-center'>
							<p className='text-xl sm:text-2xl font-black text-cyan-400'>100%</p>
							<p className='text-[11px] text-gray-400 font-semibold'>Verified Genuine Brand</p>
						</div>
						<div className='p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/80 backdrop-blur text-center'>
							<p className='text-xl sm:text-2xl font-black text-purple-400'>Instant</p>
							<p className='text-[11px] text-gray-400 font-semibold'>AI Return Approval</p>
						</div>
					</div>
				</div>

				{/* Priority Flash Sales Banner */}
				<FlashSalesBanner onSelectProduct={setSelectedProduct} />

				{/* AI Smart Synergy Bundle Section */}
				{smartBundle && smartBundle.bundleProducts?.length > 0 && (
					<div className='my-12 rounded-3xl border border-teal-500/30 bg-gradient-to-br from-gray-900 via-teal-950/20 to-gray-900 p-6 sm:p-8 shadow-2xl'>
						<div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
							<div className='flex items-center gap-3'>
								<div className='p-2.5 rounded-2xl bg-teal-500/20 text-teal-400'>
									<Sparkles size={22} />
								</div>
								<div>
									<h3 className='text-lg sm:text-xl font-bold text-white flex items-center gap-2'>
										AI Automated Synergy Bundle
										<span className='px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black'>
											Save 15% Extra
										</span>
									</h3>
									<p className='text-xs text-gray-400'>{smartBundle.synergyReason}</p>
								</div>
							</div>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-center'>
							{/* Main Product */}
							<div className='flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/70 border border-gray-700'>
								<img src={smartBundle.mainProduct.image} alt={smartBundle.mainProduct.name} className='w-16 h-16 rounded-xl object-cover' />
								<div className='min-w-0'>
									<span className='text-[10px] uppercase font-bold text-emerald-400'>Core Item</span>
									<p className='text-xs font-bold text-white truncate'>{smartBundle.mainProduct.name}</p>
									<p className='text-sm font-black text-emerald-400'>{formatPrice(smartBundle.mainProduct.price)}</p>
								</div>
							</div>

							{/* Bundle Accessories */}
							{smartBundle.bundleProducts.map((item, idx) => (
								<div key={idx} className='flex items-center gap-3 p-3.5 rounded-2xl bg-gray-800/70 border border-gray-700'>
									<img src={item.image} alt={item.name} className='w-16 h-16 rounded-xl object-cover' />
									<div className='min-w-0'>
										<span className='text-[10px] uppercase font-bold text-teal-400'>Synergy Match</span>
										<p className='text-xs font-bold text-white truncate'>{item.name}</p>
										<p className='text-sm font-black text-teal-400'>{formatPrice(item.price)}</p>
									</div>
								</div>
							))}
						</div>

						{/* Bundle Call to Action */}
						<div className='mt-5 pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-4'>
							<div>
								<div className='flex items-baseline gap-2'>
									<span className='text-2xl font-black text-white'>{formatPrice(smartBundle.bundlePrice)}</span>
									<span className='text-sm text-gray-400 line-through'>{formatPrice(smartBundle.combinedOriginalPrice)}</span>
									<span className='text-xs font-bold text-teal-400'>Save {formatPrice(smartBundle.totalSavings)}</span>
								</div>
								<p className='text-[11px] text-gray-400'>All 3 items bundled together with 1-click checkout</p>
							</div>

							<button
								onClick={handleAddBundle}
								className='px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-gray-950 font-black text-sm shadow-xl flex items-center gap-2 transition'
							>
								Add Entire 3-Item Bundle <ArrowRight size={16} />
							</button>
						</div>
					</div>
				)}

				{/* Categories Header */}
				<div className='mt-14 mb-8 text-center'>
					<h2 className='text-3xl sm:text-4xl font-extrabold text-white'>
						Explore Trending Collections
					</h2>
					<p className='text-gray-400 text-sm mt-1.5'>
						Handcrafted fashion, apparel, and footwear curated with verified sustainable materials
					</p>
				</div>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{categories.map((category) => (
						<CategoryItem category={category} key={category.name} />
					))}
				</div>

				{/* Featured Products */}
				{!loading && products.length > 0 && <FeaturedProducts featuredProducts={products} />}
			</div>

			{/* Product Detail Modal */}
			{selectedProduct && (
				<ProductDetailModal
					product={selectedProduct}
					isOpen={!!selectedProduct}
					onClose={() => setSelectedProduct(null)}
				/>
			)}
		</div>
	);
};

export default HomePage;
