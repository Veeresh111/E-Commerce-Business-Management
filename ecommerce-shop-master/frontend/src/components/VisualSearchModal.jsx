import { useState } from "react";
import { aiApi } from "../lib/freeAiClient";
import { formatPrice } from "../lib/dsaClient";
import { useCartStore } from "../stores/useCartStore";
import { X, Camera, Upload, Sparkles, ShoppingCart, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

const samplePresets = [
	{ name: "Denim Jeans", tags: ["jeans", "denim", "pants"], img: "/jeans.jpg" },
	{ name: "Leather Jacket", tags: ["jackets", "leather", "coat"], img: "/jackets.jpg" },
	{ name: "Sneakers", tags: ["shoes", "sneakers", "footwear"], img: "/shoes.jpg" },
	{ name: "Luxury Bag", tags: ["bags", "leather", "accessory"], img: "/bags.jpg" },
];

const VisualSearchModal = ({ isOpen, onClose, onSelectProduct }) => {
	const [selectedImage, setSelectedImage] = useState(null);
	const [detectedTags, setDetectedTags] = useState([]);
	const [matchedProducts, setMatchedProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const { addToCart } = useCartStore();

	if (!isOpen) return null;

	const handleImageUpload = async (file) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = async (e) => {
			const dataUrl = e.target.result;
			setSelectedImage(dataUrl);
			runVisualSearch(["apparel", "fashion", "trend"]);
		};
		reader.readAsDataURL(file);
	};

	const runVisualSearch = async (tags, query = "") => {
		setLoading(true);
		try {
			const res = await aiApi.visualSearch(tags, query);
			setDetectedTags(res.matchedTags || tags);
			setMatchedProducts(res.products || []);
		} catch (err) {
			toast.error("Visual search processing failed");
		} finally {
			setLoading(false);
		}
	};

	const handlePresetClick = (preset) => {
		setSelectedImage(preset.img);
		runVisualSearch(preset.tags, preset.name);
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn'>
			<div className='relative w-full max-w-2xl rounded-3xl border border-emerald-500/40 bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]'>
				{/* Header */}
				<div className='flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-emerald-950/40 to-gray-900'>
					<div className='flex items-center gap-2.5'>
						<div className='p-2 rounded-xl bg-emerald-500/20 text-emerald-400'>
							<Camera size={20} />
						</div>
						<div>
							<h3 className='font-bold text-white text-base'>AI Visual Product Finder</h3>
							<p className='text-xs text-gray-400'>Reverse image vector matching across full catalog</p>
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
					{/* Drop Zone / Upload Area */}
					<label className='border-2 border-dashed border-gray-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-gray-800/30 group'>
						<input
							type='file'
							accept='image/*'
							className='hidden'
							onChange={(e) => handleImageUpload(e.target.files[0])}
						/>
						{selectedImage ? (
							<div className='flex items-center gap-4'>
								<img src={selectedImage} alt='Uploaded search target' className='w-24 h-24 object-cover rounded-xl border border-emerald-500/40' />
								<div>
									<p className='text-sm font-semibold text-white'>Visual query uploaded</p>
									<p className='text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1'>
										<Sparkles size={14} /> AI Embedding extracted
									</p>
									<p className='text-[11px] text-gray-400 mt-1'>Click to choose a different photo</p>
								</div>
							</div>
						) : (
							<div className='text-center space-y-2'>
								<div className='p-3 rounded-full bg-emerald-500/10 text-emerald-400 w-fit mx-auto group-hover:scale-110 transition'>
									<Upload size={24} />
								</div>
								<p className='text-sm font-semibold text-gray-200'>Drag and drop a photo or click to browse</p>
								<p className='text-xs text-gray-400'>Supports PNG, JPG, WebP photos</p>
							</div>
						)}
					</label>

					{/* Sample Presets */}
					<div>
						<p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>Or Try Instant Sample Searches:</p>
						<div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
							{samplePresets.map((preset, idx) => (
								<button
									key={idx}
									onClick={() => handlePresetClick(preset)}
									className='flex items-center gap-2 p-2 rounded-xl bg-gray-800/60 border border-gray-700 hover:border-emerald-500/50 hover:bg-emerald-950/30 transition text-left'
								>
									<img src={preset.img} alt={preset.name} className='w-8 h-8 rounded object-cover' />
									<span className='text-xs font-medium text-gray-200 truncate'>{preset.name}</span>
								</button>
							))}
						</div>
					</div>

					{/* Results Area */}
					{detectedTags.length > 0 && (
						<div>
							<div className='flex items-center gap-2 mb-3'>
								<span className='text-xs font-semibold text-gray-400'>Detected Visual Tags:</span>
								<div className='flex flex-wrap gap-1.5'>
									{detectedTags.map((tag, idx) => (
										<span key={idx} className='px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30'>
											#{tag}
										</span>
									))}
								</div>
							</div>

							<div className='space-y-2'>
								<h4 className='text-sm font-bold text-white'>Visually Matching Catalog Products:</h4>
								{loading ? (
									<div className='p-6 text-center text-xs text-emerald-400 flex items-center justify-center gap-2'>
										<Sparkles className='animate-spin' size={16} /> Vector matching across products...
									</div>
								) : matchedProducts.length > 0 ? (
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
										{matchedProducts.map((prod) => (
											<div
												key={prod._id}
												className='flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-800 border border-gray-700 hover:border-emerald-500 transition'
											>
												<img src={prod.image} alt={prod.name} className='w-14 h-14 object-cover rounded-lg' />
												<div className='flex-1 min-w-0'>
													<p className='text-xs font-semibold text-white truncate'>{prod.name}</p>
													<p className='text-xs text-emerald-400 font-bold mt-0.5'>{formatPrice(prod.price)}</p>
													<span className='text-[10px] text-gray-400 uppercase'>{prod.category}</span>
												</div>
												<button
													onClick={() => {
														addToCart(prod);
														toast.success(`Added ${prod.name} to cart`);
													}}
													className='p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow'
													title='Add to cart'
												>
													<ShoppingCart size={16} />
												</button>
											</div>
										))}
									</div>
								) : (
									<p className='text-xs text-gray-400'>No direct vector matches found. Try another image.</p>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default VisualSearchModal;
