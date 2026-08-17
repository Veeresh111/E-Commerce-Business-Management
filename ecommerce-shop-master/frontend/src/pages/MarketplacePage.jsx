import { useState, useEffect } from "react";
import axios from "../lib/axios";
import { formatPrice } from "../lib/dsaClient";
import { useUserStore } from "../stores/useUserStore";
import {
	Search,
	MapPin,
	Tag,
	Plus,
	MessageCircle,
	DollarSign,
	CheckCircle2,
	Clock,
	X,
	Send,
	ShieldCheck,
	Sparkles,
	Filter,
	Eye,
	SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

const CONDITIONS = [
	{ id: "all", label: "All Conditions" },
	{ id: "brand_new", label: "Brand New / Sealed" },
	{ id: "like_new", label: "Like New (Mint)" },
	{ id: "good", label: "Good Condition" },
	{ id: "fair", label: "Fair / Used" },
];

const CATEGORIES = ["all", "electronics", "audio", "photography", "jackets", "jeans", "shoes", "bags", "other"];

const MarketplacePage = () => {
	const { user } = useUserStore();

	const [listings, setListings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("browse"); // "browse" | "my_listings" | "messages"
	const [myListings, setMyListings] = useState([]);
	const [conversations, setConversations] = useState([]);

	// Filter state
	const [searchQuery, setSearchQuery] = useState("");
	const [cityFilter, setCityFilter] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedCondition, setSelectedCondition] = useState("all");

	// Modals
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [activeChatListing, setActiveChatListing] = useState(null);
	const [chatMessage, setChatMessage] = useState("");
	const [offerAmount, setOfferAmount] = useState("");

	// Create listing form
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		price: "",
		originalRetailPrice: "",
		condition: "like_new",
		category: "electronics",
		city: "New York",
		state: "NY",
		images: "",
		isNegotiable: true,
	});

	const fetchListings = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (selectedCategory !== "all") params.append("category", selectedCategory);
			if (selectedCondition !== "all") params.append("condition", selectedCondition);
			if (cityFilter.trim()) params.append("city", cityFilter.trim());
			if (searchQuery.trim()) params.append("q", searchQuery.trim());

			const res = await axios.get(`/marketplace?${params.toString()}`);
			setListings(res.data.listings || []);
		} catch (err) {
			toast.error("Failed to load marketplace listings");
		} finally {
			setLoading(false);
		}
	};

	const fetchMyListings = async () => {
		if (!user) return;
		try {
			const res = await axios.get("/marketplace/my-listings");
			setMyListings(res.data || []);
		} catch (err) {}
	};

	const fetchConversations = async () => {
		if (!user) return;
		try {
			const res = await axios.get("/marketplace/conversations");
			setConversations(res.data || []);
		} catch (err) {}
	};

	useEffect(() => {
		fetchListings();
	}, [selectedCategory, selectedCondition, cityFilter]);

	useEffect(() => {
		if (activeTab === "my_listings") fetchMyListings();
		if (activeTab === "messages") fetchConversations();
	}, [activeTab]);

	const handleSearchSubmit = (e) => {
		e.preventDefault();
		fetchListings();
	};

	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		if (!user) {
			toast.error("Please login to post a listing");
			return;
		}

		try {
			const payload = {
				title: formData.title,
				description: formData.description,
				price: Number(formData.price),
				originalRetailPrice: formData.originalRetailPrice ? Number(formData.originalRetailPrice) : undefined,
				condition: formData.condition,
				category: formData.category,
				location: { city: formData.city, state: formData.state },
				images: formData.images ? [formData.images] : ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800"],
				isNegotiable: formData.isNegotiable,
			};

			const res = await axios.post("/marketplace", payload);
			toast.success("Listing posted to C2C Marketplace!");
			setIsCreateOpen(false);
			setListings([res.data, ...listings]);
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to post listing");
		}
	};

	const handleSendOfferOrMessage = async (e) => {
		e.preventDefault();
		if (!user) {
			toast.error("Please login to contact seller");
			return;
		}

		try {
			await axios.post("/marketplace/inquire", {
				listingId: activeChatListing._id,
				message: chatMessage,
				offerAmount: offerAmount ? Number(offerAmount) : undefined,
			});
			toast.success("Message & offer sent to seller!");
			setActiveChatListing(null);
			setChatMessage("");
			setOfferAmount("");
		} catch (err) {
			toast.error(err.response?.data?.message || "Failed to send offer");
		}
	};

	const handleToggleStatus = async (id, currentStatus) => {
		const newStatus = currentStatus === "sold" ? "active" : "sold";
		try {
			await axios.patch(`/marketplace/${id}/status`, { status: newStatus });
			toast.success(`Listing marked as ${newStatus.toUpperCase()}`);
			fetchMyListings();
		} catch (err) {
			toast.error("Could not update status");
		}
	};

	return (
		<div className='min-h-screen max-w-7xl mx-auto px-4 py-8 pb-20'>
			{/* Marketplace Header */}
			<div className='flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-6 mb-8'>
				<div>
					<div className='flex items-center gap-2 mb-1'>
						<div className='p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30'>
							<Tag size={22} />
						</div>
						<h1 className='text-3xl font-black text-white'>Nexus C2C Marketplace</h1>
						<span className='px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30'>
							OLX / P2P Mode
						</span>
					</div>
					<p className='text-xs sm:text-sm text-gray-400'>
						Buy & sell pre-owned, refurbished, and brand-new products directly with verified community members
					</p>
				</div>

				<div className='flex items-center gap-3'>
					{/* Tab switchers */}
					<div className='flex bg-gray-900 p-1 rounded-2xl border border-gray-800 text-xs font-bold'>
						<button
							onClick={() => setActiveTab("browse")}
							className={`px-3.5 py-1.5 rounded-xl transition ${
								activeTab === "browse" ? "bg-emerald-500 text-gray-950 shadow" : "text-gray-400 hover:text-white"
							}`}
						>
							Explore Feed
						</button>
						{user && (
							<>
								<button
									onClick={() => setActiveTab("my_listings")}
									className={`px-3.5 py-1.5 rounded-xl transition ${
										activeTab === "my_listings" ? "bg-emerald-500 text-gray-950 shadow" : "text-gray-400 hover:text-white"
									}`}
								>
									My Listings
								</button>
								<button
									onClick={() => setActiveTab("messages")}
									className={`px-3.5 py-1.5 rounded-xl transition ${
										activeTab === "messages" ? "bg-emerald-500 text-gray-950 shadow" : "text-gray-400 hover:text-white"
									}`}
								>
									Direct Chats
								</button>
							</>
						)}
					</div>

					{/* Post Listing Button */}
					<button
						onClick={() => (user ? setIsCreateOpen(true) : toast.error("Please login to sell products"))}
						className='flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition'
					>
						<Plus size={16} /> Sell Your Item
					</button>
				</div>
			</div>

			{activeTab === "browse" && (
				<>
					{/* Search & Location Bar */}
					<div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6'>
						<form onSubmit={handleSearchSubmit} className='relative sm:col-span-2'>
							<Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
							<input
								type='text'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder='Search MacBooks, cameras, sneakers, phones...'
								className='w-full rounded-2xl bg-gray-900 border border-gray-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500'
							/>
						</form>

						<div className='relative'>
							<MapPin className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400' />
							<input
								type='text'
								value={cityFilter}
								onChange={(e) => setCityFilter(e.target.value)}
								placeholder='Filter by City (e.g. New York, London)...'
								className='w-full rounded-2xl bg-gray-900 border border-gray-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500'
							/>
						</div>
					</div>

					{/* Categories & Condition Filter Chips */}
					<div className='flex flex-wrap items-center justify-between gap-3 mb-8'>
						<div className='flex items-center gap-1.5 overflow-x-auto pb-1'>
							{CATEGORIES.map((cat) => (
								<button
									key={cat}
									onClick={() => setSelectedCategory(cat)}
									className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition ${
										selectedCategory === cat
											? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
											: "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
									}`}
								>
									{cat}
								</button>
							))}
						</div>

						<select
							value={selectedCondition}
							onChange={(e) => setSelectedCondition(e.target.value)}
							className='bg-gray-900 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-800 focus:outline-none'
						>
							{CONDITIONS.map((cond) => (
								<option key={cond.id} value={cond.id}>
									{cond.label}
								</option>
							))}
						</select>
					</div>

					{/* Products Grid */}
					{loading ? (
						<div className='h-64 flex items-center justify-center text-gray-400'>
							<Sparkles size={24} className='animate-spin text-emerald-400 mr-2' /> Loading C2C listings...
						</div>
					) : listings.length === 0 ? (
						<div className='text-center py-16 bg-gray-900/50 rounded-3xl border border-gray-800'>
							<Tag size={40} className='text-gray-600 mx-auto mb-3' />
							<p className='text-gray-300 font-bold'>No marketplace items found matching filters</p>
							<p className='text-xs text-gray-500 mt-1'>Try expanding your city or category search.</p>
						</div>
					) : (
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
							{listings.map((item) => (
								<div
									key={item._id}
									className='group rounded-3xl border border-gray-800 bg-gray-900/90 hover:border-teal-500/50 p-4 transition-all duration-300 shadow-xl flex flex-col justify-between'
								>
									<div>
										<div className='relative h-48 rounded-2xl overflow-hidden mb-3 bg-gray-800'>
											<img
												src={item.images[0]}
												alt={item.title}
												className='w-full h-full object-cover group-hover:scale-105 transition duration-500'
											/>
											<div className='absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1'>
												<MapPin size={10} className='text-red-400' /> {item.location?.city || "Local"}
											</div>
											<div className='absolute top-2 right-2 bg-emerald-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full'>
												{item.condition?.replace(/_/g, " ")}
											</div>
										</div>

										<div className='flex items-center justify-between gap-1 text-[11px] text-gray-400 mb-1'>
											<span className='font-semibold text-emerald-400 uppercase'>{item.category}</span>
											<span className='flex items-center gap-1'>
												<Eye size={12} /> {item.views || 0} views
											</span>
										</div>

										<h4 className='text-sm font-bold text-white group-hover:text-teal-400 transition line-clamp-1'>
											{item.title}
										</h4>
										<p className='text-xs text-gray-400 line-clamp-2 mt-1'>{item.description}</p>
									</div>

									<div className='mt-4 pt-3 border-t border-gray-800 flex items-center justify-between'>
										<div>
											<p className='text-lg font-black text-white'>{formatPrice(item.price)}</p>
											{item.originalRetailPrice > item.price && (
												<p className='text-[10px] text-gray-500 line-through'>
													Retail: {formatPrice(item.originalRetailPrice)}
												</p>
											)}
										</div>

										<button
											onClick={() => setActiveChatListing(item)}
											className='px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition'
										>
											<MessageCircle size={14} /> Make Offer
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}

			{/* My Listings Tab */}
			{activeTab === "my_listings" && (
				<div className='space-y-4'>
					<h3 className='text-lg font-bold text-white'>My Active & Sold Listings</h3>
					{myListings.length === 0 ? (
						<p className='text-xs text-gray-400'>You have not posted any marketplace listings yet.</p>
					) : (
						<div className='space-y-3'>
							{myListings.map((item) => (
								<div
									key={item._id}
									className='p-4 rounded-2xl bg-gray-900 border border-gray-800 flex flex-wrap items-center justify-between gap-4'
								>
									<div className='flex items-center gap-4'>
										<img src={item.images[0]} alt={item.title} className='w-16 h-16 rounded-xl object-cover' />
										<div>
											<h4 className='text-sm font-bold text-white'>{item.title}</h4>
											<p className='text-xs text-emerald-400 font-bold'>{formatPrice(item.price)}</p>
											<span className='text-[10px] text-gray-400'>
												{item.inquiriesCount || 0} Inquiries • {item.views || 0} Views
											</span>
										</div>
									</div>

									<div className='flex items-center gap-3'>
										<span
											className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
												item.status === "sold"
													? "bg-red-500/20 text-red-400 border border-red-500/30"
													: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
											}`}
										>
											{item.status}
										</span>
										<button
											onClick={() => handleToggleStatus(item._id, item.status)}
											className='px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white border border-gray-700'
										>
											{item.status === "sold" ? "Mark Active" : "Mark as Sold"}
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Direct Conversations Tab */}
			{activeTab === "messages" && (
				<div className='space-y-4'>
					<h3 className='text-lg font-bold text-white'>Direct Buyer & Seller Conversations</h3>
					{conversations.length === 0 ? (
						<p className='text-xs text-gray-400'>No active conversations yet.</p>
					) : (
						<div className='space-y-3'>
							{conversations.map((c) => (
								<div key={c._id} className='p-4 rounded-2xl bg-gray-900 border border-gray-800 space-y-3'>
									<div className='flex items-center justify-between border-b border-gray-800 pb-2'>
										<div>
											<span className='text-xs text-gray-400'>Item: </span>
											<b className='text-white text-xs'>{c.listingTitle}</b>
										</div>
										<span className='text-xs text-emerald-400 font-bold'>
											Offer: {c.currentOffer ? formatPrice(c.currentOffer) : "Standard Inquiry"}
										</span>
									</div>
									<div className='space-y-1.5'>
										{c.messages.map((m, idx) => (
											<div key={idx} className='text-xs'>
												<span className='font-bold text-teal-400'>{m.senderName}: </span>
												<span className='text-gray-300'>{m.text}</span>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Post Listing Modal */}
			{isCreateOpen && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn'>
					<div className='relative w-full max-w-lg rounded-3xl border border-teal-500/40 bg-gray-900 shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-4'>
						<div className='flex items-center justify-between border-b border-gray-800 pb-3'>
							<h3 className='text-base font-bold text-white flex items-center gap-2'>
								<Plus size={18} className='text-teal-400' /> Sell Your Product (OLX / P2P)
							</h3>
							<button onClick={() => setIsCreateOpen(false)} className='text-gray-400 hover:text-white'>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleCreateSubmit} className='space-y-3.5 text-xs'>
							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Product Title:</label>
								<input
									type='text'
									required
									value={formData.title}
									onChange={(e) => setFormData({ ...formData, title: e.target.value })}
									placeholder='e.g. Sony A7 III Camera (Mint Condition)'
									className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
								/>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Asking Price ($):</label>
									<input
										type='number'
										required
										value={formData.price}
										onChange={(e) => setFormData({ ...formData, price: e.target.value })}
										placeholder='799.00'
										className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
									/>
								</div>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Condition:</label>
									<select
										value={formData.condition}
										onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
										className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
									>
										{CONDITIONS.filter((c) => c.id !== "all").map((c) => (
											<option key={c.id} value={c.id}>
												{c.label}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-3'>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>Category:</label>
									<select
										value={formData.category}
										onChange={(e) => setFormData({ ...formData, category: e.target.value })}
										className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
									>
										{CATEGORIES.filter((c) => c !== "all").map((c) => (
											<option key={c} value={c}>
												{c.toUpperCase()}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className='block font-semibold text-gray-300 mb-1'>City Location:</label>
									<input
										type='text'
										required
										value={formData.city}
										onChange={(e) => setFormData({ ...formData, city: e.target.value })}
										placeholder='e.g. San Francisco'
										className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
									/>
								</div>
							</div>

							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Image URL:</label>
								<input
									type='url'
									value={formData.images}
									onChange={(e) => setFormData({ ...formData, images: e.target.value })}
									placeholder='https://images.unsplash.com/...'
									className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
								/>
							</div>

							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Detailed Description:</label>
								<textarea
									rows={3}
									required
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									placeholder='Describe defects, accessories included, reason for selling...'
									className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
								/>
							</div>

							<button
								type='submit'
								className='w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 font-black text-gray-950 text-sm shadow-xl'
							>
								Publish P2P Listing
							</button>
						</form>
					</div>
				</div>
			)}

			{/* Chat / Make Offer Modal */}
			{activeChatListing && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn'>
					<div className='relative w-full max-w-md rounded-3xl border border-emerald-500/40 bg-gray-900 shadow-2xl p-6 space-y-4'>
						<div className='flex items-center justify-between border-b border-gray-800 pb-3'>
							<div>
								<h3 className='text-sm font-bold text-white'>Contact Seller & Make Offer</h3>
								<p className='text-[11px] text-gray-400'>{activeChatListing.title}</p>
							</div>
							<button onClick={() => setActiveChatListing(null)} className='text-gray-400 hover:text-white'>
								<X size={18} />
							</button>
						</div>

						<div className='p-3 rounded-xl bg-gray-800/60 flex items-center justify-between text-xs'>
							<span>Listed Price:</span>
							<b className='text-emerald-400 font-black text-sm'>{formatPrice(activeChatListing.price)}</b>
						</div>

						<form onSubmit={handleSendOfferOrMessage} className='space-y-3 text-xs'>
							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Your Offer Price ($):</label>
								<input
									type='number'
									value={offerAmount}
									onChange={(e) => setOfferAmount(e.target.value)}
									placeholder={`e.g. ${Math.round(activeChatListing.price * 0.9)}`}
									className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
								/>
							</div>

							<div>
								<label className='block font-semibold text-gray-300 mb-1'>Message for Seller:</label>
								<textarea
									rows={3}
									value={chatMessage}
									onChange={(e) => setChatMessage(e.target.value)}
									placeholder='Hi, is this still available? Can we meet up today?'
									className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white'
								/>
							</div>

							<button
								type='submit'
								className='w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs transition flex items-center justify-center gap-1.5'
							>
								<Send size={14} /> Send Message & Offer
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default MarketplacePage;
