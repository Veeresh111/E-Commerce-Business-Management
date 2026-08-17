import { useState, useEffect, useRef } from "react";
import axios from "../lib/axios";
import { formatPrice } from "../lib/dsaClient";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import {
	Heart,
	MessageCircle,
	Share2,
	Volume2,
	VolumeX,
	Plus,
	ShoppingCart,
	Globe,
	Sparkles,
	MapPin,
	X,
	Send,
	Flame,
	Play,
	Pause,
	ExternalLink,
	Check,
	ShieldCheck,
	AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const REGIONS = ["Global", "US", "India", "UK", "Japan", "Europe"];

// Reliable video stream presets
const VIDEO_PRESETS = [
	"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
	"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
	"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
	"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
];

const ShoppableReelsPage = () => {
	const { user } = useUserStore();
	const { addToCart } = useCartStore();

	const [reels, setReels] = useState([]);
	const [activeIdx, setActiveIdx] = useState(0);
	const [selectedRegion, setSelectedRegion] = useState("Global");
	const [isMuted, setIsMuted] = useState(true);
	const [isPlaying, setIsPlaying] = useState(true);
	const [videoError, setVideoError] = useState(false);
	const [showComments, setShowComments] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [isPostModalOpen, setIsPostModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);

	const videoRef = useRef(null);

	// New Reel Form State
	const [newReel, setNewReel] = useState({
		videoUrl: VIDEO_PRESETS[0],
		thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
		title: "",
		description: "",
		region: "Global",
		city: "New York",
		productName: "",
		productPrice: "",
		productImage: "",
		productCategory: "apparel",
	});

	const fetchReels = async () => {
		setLoading(true);
		try {
			const res = await axios.get(`/reels?region=${selectedRegion}`);
			setReels(res.data.reels || []);
			setActiveIdx(0);
			setVideoError(false);
		} catch (err) {
			toast.error("Failed to load trending reels");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReels();
	}, [selectedRegion]);

	const currentReel = reels[activeIdx];

	useEffect(() => {
		setVideoError(false);
		if (videoRef.current) {
			videoRef.current.currentTime = 0;
			const playPromise = videoRef.current.play();
			if (playPromise !== undefined) {
				playPromise
					.then(() => setIsPlaying(true))
					.catch(() => {
						setIsPlaying(false);
					});
			}
		}
	}, [activeIdx, reels]);

	const togglePlayPause = () => {
		if (videoRef.current && !videoError) {
			if (videoRef.current.paused) {
				videoRef.current
					.play()
					.then(() => setIsPlaying(true))
					.catch(() => setIsPlaying(false));
			} else {
				videoRef.current.pause();
				setIsPlaying(false);
			}
		} else {
			setIsPlaying(!isPlaying);
		}
	};

	const handleLike = async () => {
		if (!user) {
			toast.error("Please login to like this reel");
			return;
		}
		try {
			const res = await axios.post(`/reels/${currentReel._id}/like`);
			setReels((prev) =>
				prev.map((r, i) =>
					i === activeIdx
						? {
								...r,
								likesCount: res.data.likesCount,
								likes: res.data.isLiked ? [...(r.likes || []), user._id] : (r.likes || []).filter((id) => id !== user._id),
						  }
						: r
				)
			);
		} catch (err) {
			toast.error("Could not update like");
		}
	};

	const handleAddComment = async (e) => {
		e.preventDefault();
		if (!user) {
			toast.error("Please login to comment");
			return;
		}
		if (!commentText.trim()) return;

		try {
			const res = await axios.post(`/reels/${currentReel._id}/comment`, { text: commentText });
			setReels((prev) =>
				prev.map((r, i) => (i === activeIdx ? { ...r, comments: res.data } : r))
			);
			setCommentText("");
			toast.success("Comment added!");
		} catch (err) {
			toast.error("Failed to add comment");
		}
	};

	const handlePostReelSubmit = async (e) => {
		e.preventDefault();
		if (!user) {
			toast.error("Please login to post a reel");
			return;
		}

		try {
			const payload = {
				videoUrl: newReel.videoUrl || VIDEO_PRESETS[0],
				thumbnail: newReel.thumbnail,
				title: newReel.title,
				description: newReel.description,
				region: newReel.region,
				city: newReel.city,
				product: {
					name: newReel.productName,
					price: Number(newReel.productPrice),
					image: newReel.productImage || newReel.thumbnail,
					category: newReel.productCategory,
				},
			};

			const res = await axios.post("/reels", payload);
			toast.success("Agentic AI approved & published your commerce short!");
			setReels([res.data, ...reels]);
			setIsPostModalOpen(false);
			setActiveIdx(0);
		} catch (err) {
			toast.error(err.response?.data?.message || "Agentic AI rejected short upload");
		}
	};

	const handleAddToCart = (product) => {
		addToCart({
			_id: product.productId || `reel_prod_${Date.now()}`,
			name: product.name,
			price: product.price,
			image: product.image,
			category: product.category || "apparel",
		});
		toast.success(`Added ${product.name} to cart!`);
	};

	const isCurrentLiked = currentReel?.likes?.includes(user?._id);

	return (
		<div className='min-h-[90vh] max-w-5xl mx-auto px-4 py-4 sm:py-8'>
			{/* Top Bar with Region Trend Selector and Post Reel Button */}
			<div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
				<div className='flex items-center gap-3'>
					<div className='p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30'>
						<Flame size={24} className='animate-pulse' />
					</div>
					<div>
						<h1 className='text-2xl sm:text-3xl font-black text-white flex items-center gap-2'>
							Nexus Shorts & Trends
							<span className='px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'>
								Shoppable 4K
							</span>
						</h1>
						<p className='text-xs text-gray-400'>
							Real-time regional shopping trends, creator unboxings, and 1-click buy
						</p>
					</div>
				</div>

				<div className='flex items-center gap-2.5'>
					{/* Region Selector Pills */}
					<div className='flex items-center gap-1 bg-gray-900/90 p-1 rounded-2xl border border-gray-800 overflow-x-auto'>
						{REGIONS.map((reg) => (
							<button
								key={reg}
								onClick={() => setSelectedRegion(reg)}
								className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
									selectedRegion === reg
										? "bg-emerald-500 text-gray-950 shadow"
										: "text-gray-400 hover:text-white"
								}`}
							>
								{reg}
							</button>
						))}
					</div>

					{/* Create Reel Button */}
					<button
						onClick={() => (user ? setIsPostModalOpen(true) : toast.error("Please login to post a reel"))}
						className='flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-gray-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:from-teal-400 hover:to-emerald-400 transition'
					>
						<Plus size={16} /> Post Reel
					</button>
				</div>
			</div>

			{/* Main Video Carousel Player */}
			{loading ? (
				<div className='h-[600px] flex items-center justify-center rounded-3xl bg-gray-900 border border-gray-800 text-gray-400'>
					<Sparkles size={24} className='animate-spin text-emerald-400 mr-2' /> Loading trending shorts...
				</div>
			) : reels.length === 0 ? (
				<div className='h-[500px] flex flex-col items-center justify-center rounded-3xl bg-gray-900 border border-gray-800 text-center p-6'>
					<Flame size={48} className='text-gray-600 mb-3' />
					<h3 className='text-lg font-bold text-white mb-1'>No reels found in {selectedRegion}</h3>
					<p className='text-xs text-gray-400 mb-4'>Be the first creator to post a shoppable video for this region!</p>
					<button
						onClick={() => setIsPostModalOpen(true)}
						className='px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-lg'
					>
						Post the First Reel
					</button>
				</div>
			) : (
				<div className='relative max-w-sm sm:max-w-md mx-auto h-[640px] sm:h-[700px] rounded-3xl overflow-hidden bg-black border border-gray-800 shadow-2xl flex flex-col justify-between group'>
					{/* Video Canvas or High-Res Poster Fallback */}
					{!videoError ? (
						<video
							ref={videoRef}
							key={currentReel.videoUrl}
							src={currentReel.videoUrl}
							poster={currentReel.thumbnail}
							autoPlay
							loop
							muted={isMuted}
							playsInline
							onError={() => setVideoError(true)}
							onClick={togglePlayPause}
							className='absolute inset-0 w-full h-full object-cover cursor-pointer'
						/>
					) : (
						<div
							onClick={togglePlayPause}
							className='absolute inset-0 w-full h-full bg-cover bg-center cursor-pointer flex items-center justify-center'
							style={{ backgroundImage: `url(${currentReel.thumbnail})` }}
						>
							<div className='absolute inset-0 bg-black/40 backdrop-blur-[2px]' />
							<div className='relative p-4 rounded-full bg-emerald-500/80 text-gray-950 shadow-2xl animate-pulse'>
								<Play size={32} className='fill-gray-950 ml-1' />
							</div>
						</div>
					)}

					{/* Top Overlay Controls */}
					<div className='relative z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/20 to-transparent'>
						<div className='flex items-center gap-2'>
							<span className='px-2.5 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-white text-[11px] font-bold flex items-center gap-1'>
								<MapPin size={12} className='text-red-400' /> {currentReel.city || "Global"} ({currentReel.region || "Global"})
							</span>
						</div>
						<div className='flex items-center gap-2'>
							<button
								onClick={() => setIsMuted(!isMuted)}
								className='p-2 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition'
							>
								{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
							</button>
						</div>
					</div>

					{/* Right Sidebar Action Icons */}
					<div className='absolute right-3.5 bottom-28 z-20 flex flex-col items-center gap-4.5'>
						{/* Like Button */}
						<div className='flex flex-col items-center gap-1'>
							<button
								onClick={handleLike}
								className={`p-3 rounded-full backdrop-blur transition transform active:scale-125 ${
									isCurrentLiked ? "bg-red-500 text-white" : "bg-black/60 text-white hover:bg-black/80"
								}`}
							>
								<Heart size={20} className={isCurrentLiked ? "fill-white" : ""} />
							</button>
							<span className='text-[11px] font-bold text-white drop-shadow'>{currentReel.likesCount || 0}</span>
						</div>

						{/* Comments Button */}
						<div className='flex flex-col items-center gap-1'>
							<button
								onClick={() => setShowComments(!showComments)}
								className='p-3 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition'
							>
								<MessageCircle size={20} />
							</button>
							<span className='text-[11px] font-bold text-white drop-shadow'>
								{currentReel.comments?.length || 0}
							</span>
						</div>

						{/* Share Button */}
						<div className='flex flex-col items-center gap-1'>
							<button
								onClick={() => {
									navigator.clipboard.writeText(window.location.href);
									toast.success("Reel link copied to clipboard!");
								}}
								className='p-3 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition'
							>
								<Share2 size={20} />
							</button>
							<span className='text-[11px] font-bold text-white drop-shadow'>Share</span>
						</div>
					</div>

					{/* Bottom Video Information & Shoppable Product Card Overlay */}
					<div className='relative z-20 p-4 bg-gradient-to-t from-black via-black/80 to-transparent space-y-3'>
						{/* Creator Info */}
						<div>
							<div className='flex items-center gap-2 mb-1'>
								<img
									src={currentReel.creatorAvatar}
									alt={currentReel.creatorName}
									className='w-7 h-7 rounded-full object-cover border border-emerald-400'
								/>
								<span className='text-xs font-bold text-white drop-shadow'>{currentReel.creatorName}</span>
							</div>
							<h3 className='text-sm font-black text-white drop-shadow line-clamp-1'>{currentReel.title}</h3>
							{currentReel.description && (
								<p className='text-xs text-gray-300 line-clamp-1 drop-shadow mt-0.5'>{currentReel.description}</p>
							)}
						</div>

						{/* Shoppable Floating Product Card */}
						{currentReel.product && (
							<div className='p-2.5 rounded-2xl bg-gray-900/95 border border-emerald-500/40 backdrop-blur shadow-2xl flex items-center justify-between gap-3 animate-slideUp'>
								<div className='flex items-center gap-2.5 min-w-0'>
									<img
										src={currentReel.product.image}
										alt={currentReel.product.name}
										className='w-12 h-12 rounded-xl object-cover border border-gray-700 shrink-0'
									/>
									<div className='min-w-0'>
										<span className='text-[9px] font-bold text-emerald-400 uppercase tracking-wider'>
											Shoppable Feature
										</span>
										<p className='text-xs font-bold text-white truncate'>{currentReel.product.name}</p>
										<div className='flex items-baseline gap-1.5'>
											<span className='text-sm font-black text-emerald-400'>
												{formatPrice(currentReel.product.price)}
											</span>
											{currentReel.product.originalPrice && (
												<span className='text-[10px] text-gray-400 line-through'>
													{formatPrice(currentReel.product.originalPrice)}
												</span>
											)}
										</div>
									</div>
								</div>

								<button
									onClick={() => handleAddToCart(currentReel.product)}
									className='px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-black text-xs shadow-md shrink-0 flex items-center gap-1 transition'
								>
									<ShoppingCart size={14} /> Buy
								</button>
							</div>
						)}

						{/* Carousel Navigation Indicator Dots & Arrow Triggers */}
						<div className='flex items-center justify-between pt-1 text-xs text-gray-400'>
							<button
								disabled={activeIdx === 0}
								onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
								className='px-2 py-0.5 rounded bg-black/60 text-white disabled:opacity-30'
							>
								◀ Prev
							</button>
							<span>
								{activeIdx + 1} / {reels.length}
							</span>
							<button
								disabled={activeIdx === reels.length - 1}
								onClick={() => setActiveIdx((prev) => Math.min(reels.length - 1, prev + 1))}
								className='px-2 py-0.5 rounded bg-black/60 text-white disabled:opacity-30'
							>
								Next ▶
							</button>
						</div>
					</div>

					{/* Comments Slide-over Drawer */}
					{showComments && (
						<div className='absolute inset-x-0 bottom-0 h-3/5 bg-gray-900/95 backdrop-blur-md rounded-t-3xl border-t border-gray-700 p-4 z-30 flex flex-col justify-between animate-slideUp'>
							<div className='flex items-center justify-between border-b border-gray-800 pb-2 mb-2'>
								<span className='text-xs font-bold text-white'>
									Comments ({currentReel.comments?.length || 0})
								</span>
								<button onClick={() => setShowComments(false)} className='text-gray-400 hover:text-white'>
									<X size={16} />
								</button>
							</div>

							<div className='overflow-y-auto space-y-2 flex-1 pr-1'>
								{(currentReel.comments || []).map((c, i) => (
									<div key={i} className='p-2 rounded-xl bg-gray-800/60 text-xs'>
										<p className='font-bold text-emerald-400 text-[11px]'>{c.userName}</p>
										<p className='text-gray-200 mt-0.5'>{c.text}</p>
									</div>
								))}
							</div>

							<form onSubmit={handleAddComment} className='flex items-center gap-2 pt-2 border-t border-gray-800'>
								<input
									type='text'
									placeholder='Add a comment...'
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									className='flex-1 rounded-xl bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500'
								/>
								<button
									type='submit'
									className='p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition'
								>
									<Send size={14} />
								</button>
							</form>
						</div>
					)}
				</div>
			)}

			{/* Post Reel Modal */}
			{isPostModalOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn'>
					<div className='relative w-full max-w-lg rounded-3xl border border-emerald-500/40 bg-gray-900 shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-4'>
						<div className='flex items-center justify-between border-b border-gray-800 pb-3'>
							<h3 className='text-base font-bold text-white flex items-center gap-2'>
								<Plus size={18} className='text-emerald-400' /> Post a Shoppable Video Reel
							</h3>
							<button onClick={() => setIsPostModalOpen(false)} className='text-gray-400 hover:text-white'>
								<X size={20} />
							</button>
						</div>

						{/* Agentic AI Security Notice */}
						<div className='p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2'>
							<ShieldCheck size={16} className='text-cyan-400 shrink-0' />
							<span><b>Agentic AI Scanner Active:</b> Only shopping, unboxing, fashion, and commerce shorts will be approved.</span>
						</div>

						<form onSubmit={handlePostReelSubmit} className='space-y-3.5 text-xs'>
							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Video MP4 URL or Preset:</label>
								<input
									type='url'
									required
									value={newReel.videoUrl}
									onChange={(e) => setNewReel({ ...newReel, videoUrl: e.target.value })}
									placeholder='https://...'
									className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
								/>
								<div className='flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-400'>
									<span>Quick Demo Streams:</span>
									{VIDEO_PRESETS.map((preset, idx) => (
										<button
											key={idx}
											type='button'
											onClick={() => setNewReel({ ...newReel, videoUrl: preset })}
											className='px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-emerald-400 font-bold border border-gray-700'
										>
											Stream {idx + 1}
										</button>
									))}
								</div>
							</div>

							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Reel Title:</label>
								<input
									type='text'
									required
									value={newReel.title}
									onChange={(e) => setNewReel({ ...newReel, title: e.target.value })}
									placeholder='e.g. Unboxing Nexus Cyberpunk Jacket 🔥'
									className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
								/>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Region Trend:</label>
									<select
										value={newReel.region}
										onChange={(e) => setNewReel({ ...newReel, region: e.target.value })}
										className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
									>
										{REGIONS.map((r) => (
											<option key={r} value={r}>
												{r}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>City:</label>
									<input
										type='text'
										value={newReel.city}
										onChange={(e) => setNewReel({ ...newReel, city: e.target.value })}
										className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
									/>
								</div>
							</div>

							{/* Linked Shoppable Product Section */}
							<div className='p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5'>
								<p className='font-bold text-emerald-400 text-xs'>Linked Shoppable Product</p>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Product Name:</label>
									<input
										type='text'
										required
										value={newReel.productName}
										onChange={(e) => setNewReel({ ...newReel, productName: e.target.value })}
										placeholder='e.g. Sony WH-1000XM5'
										className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2 text-white'
									/>
								</div>
								<div className='grid grid-cols-2 gap-3'>
									<div>
										<label className='block font-semibold text-gray-300 mb-1'>Price ($):</label>
										<input
											type='number'
											required
											value={newReel.productPrice}
											onChange={(e) => setNewReel({ ...newReel, productPrice: e.target.value })}
											placeholder='189.99'
											className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2 text-white'
										/>
									</div>
									<div>
										<label className='block font-semibold text-gray-300 mb-1'>Product Image URL:</label>
										<input
											type='url'
											value={newReel.productImage}
											onChange={(e) => setNewReel({ ...newReel, productImage: e.target.value })}
											placeholder='https://...'
											className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2 text-white'
										/>
									</div>
								</div>
							</div>

							<button
								type='submit'
								className='w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 font-black text-gray-950 text-sm shadow-xl hover:from-emerald-400 hover:to-teal-400 transition'
							>
								Submit to Agentic AI & Publish Short
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default ShoppableReelsPage;
