import { useState, useEffect } from "react";
import axios from "../lib/axios";
import { formatPrice } from "../lib/dsaClient";
import { useCartStore } from "../stores/useCartStore";
import {
	Globe,
	Search,
	Sparkles,
	TrendingDown,
	ShoppingCart,
	Star,
	ArrowRight,
	ExternalLink,
	ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const GLOBAL_CATEGORIES = [
	"all",
	"smartphones",
	"laptops",
	"fragrances",
	"skincare",
	"groceries",
	"home-decoration",
	"furniture",
	"tops",
	"womens-dresses",
	"mens-shirts",
	"mens-shoes",
	"mens-watches",
	"womens-watches",
	"womens-bags",
	"sunglasses",
	"automotive",
	"motorcycle",
	"lighting",
];

const GlobalExplorePage = () => {
	const { addToCart } = useCartStore();
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");

	const fetchGlobalProducts = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (selectedCategory !== "all") params.append("category", selectedCategory);
			if (searchQuery.trim()) params.append("q", searchQuery.trim());
			params.append("limit", "24");

			const res = await axios.get(`/external-shopping/products?${params.toString()}`);
			setProducts(res.data.products || []);
		} catch (err) {
			toast.error("Failed to load global shopping catalog");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchGlobalProducts();
	}, [selectedCategory]);

	const handleSearch = (e) => {
		e.preventDefault();
		fetchGlobalProducts();
	};

	return (
		<div className='min-h-screen max-w-7xl mx-auto px-4 py-8 pb-20'>
			{/* Header */}
			<div className='flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-6 mb-8'>
				<div>
					<div className='flex items-center gap-2 mb-1'>
						<div className='p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30'>
							<Globe size={22} />
						</div>
						<h1 className='text-3xl font-black text-white'>Free Global Shopping Network</h1>
						<span className='px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30'>
							Live API Proxy
						</span>
					</div>
					<p className='text-xs sm:text-sm text-gray-400'>
						Browse over 10,000+ live products streamed from global suppliers with real-time Amazon & Flipkart price comparison
					</p>
				</div>
			</div>

			{/* Search & Category Filter */}
			<div className='space-y-4 mb-8'>
				<form onSubmit={handleSearch} className='relative max-w-xl'>
					<Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
					<input
						type='text'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder='Search global smartphones, fragrances, skincare, watches...'
						className='w-full rounded-2xl bg-gray-900 border border-gray-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500'
					/>
				</form>

				<div className='flex items-center gap-1.5 overflow-x-auto pb-2'>
					{GLOBAL_CATEGORIES.map((cat) => (
						<button
							key={cat}
							onClick={() => setSelectedCategory(cat)}
							className={`px-3 py-1 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition ${
								selectedCategory === cat
									? "bg-purple-500 text-gray-950 shadow"
									: "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
							}`}
						>
							{cat.replace(/-/g, " ")}
						</button>
					))}
				</div>
			</div>

			{/* Products Grid */}
			{loading ? (
				<div className='h-64 flex items-center justify-center text-gray-400'>
					<Sparkles size={24} className='animate-spin text-purple-400 mr-2' /> Querying global commerce
					suppliers...
				</div>
			) : products.length === 0 ? (
				<div className='text-center py-16 bg-gray-900/50 rounded-3xl border border-gray-800'>
					<Globe size={40} className='text-gray-600 mx-auto mb-3' />
					<p className='text-gray-300 font-bold'>No global products found</p>
				</div>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
					{products.map((item) => (
						<div
							key={item._id}
							className='group rounded-3xl border border-gray-800 bg-gray-900/90 hover:border-purple-500/50 p-4 transition-all duration-300 shadow-xl flex flex-col justify-between'
						>
							<div>
								<div className='relative h-48 rounded-2xl overflow-hidden mb-3 bg-gray-800'>
									<img
										src={item.image}
										alt={item.name}
										className='w-full h-full object-cover group-hover:scale-105 transition duration-500'
									/>
									{item.savingsVsAmazon > 0 && (
										<div className='absolute top-2 left-2 bg-emerald-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow'>
											<TrendingDown size={10} /> Save {formatPrice(item.savingsVsAmazon)} vs Amazon
										</div>
									)}
									<div className='absolute top-2 right-2 bg-purple-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full'>
										{item.discountPercentage}% OFF
									</div>
								</div>

								<div className='flex items-center justify-between text-[11px] text-gray-400 mb-1'>
									<span className='font-semibold text-purple-400 uppercase'>{item.category}</span>
									<span className='flex items-center gap-1 text-amber-400 font-semibold'>
										<Star size={11} className='fill-amber-400' /> {item.rating}
									</span>
								</div>

								<h4 className='text-sm font-bold text-white group-hover:text-purple-400 transition line-clamp-1'>
									{item.name}
								</h4>
								<p className='text-xs text-gray-400 line-clamp-2 mt-1'>{item.description}</p>
							</div>

							<div className='mt-4 pt-3 border-t border-gray-800 flex items-center justify-between'>
								<div>
									<p className='text-lg font-black text-white'>{formatPrice(item.price)}</p>
									{item.originalPrice > item.price && (
										<p className='text-[10px] text-gray-500 line-through'>{formatPrice(item.originalPrice)}</p>
									)}
								</div>

								<button
									onClick={() => {
										addToCart(item);
										toast.success(`Added ${item.name} to cart!`);
									}}
									className='px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow flex items-center gap-1 transition'
								>
									<ShoppingCart size={14} /> Buy Now
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default GlobalExplorePage;
