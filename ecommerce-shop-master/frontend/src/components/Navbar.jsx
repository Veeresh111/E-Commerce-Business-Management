import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { formatPrice, CURRENCIES, getGlobalCurrency, setGlobalCurrency } from "../lib/dsaClient";
import { createSpeechRecognizer } from "../lib/freeAiClient";
import axios from "../lib/axios";
import VisualSearchModal from "./VisualSearchModal";
import {
	ShoppingCart,
	UserPlus,
	LogIn,
	LogOut,
	Lock,
	Package,
	Search,
	Camera,
	Mic,
	MicOff,
	Globe,
	Sparkles,
	Zap,
	Flame,
	Tag,
	User,
} from "lucide-react";
import toast from "react-hot-toast";

const Navbar = () => {
	const { user, logout } = useUserStore();
	const isAdmin = user?.role === "admin";
	const { cart } = useCartStore();
	const navigate = useNavigate();

	const [searchQuery, setSearchQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
	const [selectedCurrency, setSelectedCurrency] = useState(getGlobalCurrency().code);
	const searchRef = useRef(null);

	// Fetch Trie-based autocomplete suggestions on typing
	useEffect(() => {
		if (!searchQuery.trim() || searchQuery.trim().length < 2) {
			setSuggestions([]);
			return;
		}

		const timer = setTimeout(async () => {
			try {
				const res = await axios.get(`/products/autocomplete?q=${encodeURIComponent(searchQuery.trim())}`);
				setSuggestions(res.data || []);
			} catch (err) {
				setSuggestions([]);
			}
		}, 150);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Close suggestion dropdown on outside click
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (searchRef.current && !searchRef.current.contains(e.target)) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			setShowSuggestions(false);
			navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	const handleVoiceSearch = () => {
		if (isListening) {
			setIsListening(false);
		} else {
			const recognizer = createSpeechRecognizer(
				(transcript) => {
					setSearchQuery(transcript);
					setIsListening(false);
					navigate(`/search?q=${encodeURIComponent(transcript.trim())}`);
				},
				() => {
					setIsListening(false);
					toast.error("Microphone unavailable");
				},
				() => setIsListening(false)
			);

			if (recognizer) {
				recognizer.start();
				setIsListening(true);
				toast.success("Listening for product search...");
			}
		}
	};

	const handleCurrencyChange = (code) => {
		setGlobalCurrency(code);
		setSelectedCurrency(code);
		window.location.reload();
	};

	return (
		<>
			<header className='fixed top-0 left-0 w-full bg-gray-900/90 backdrop-blur-xl shadow-2xl z-40 transition-all duration-300 border-b border-emerald-500/20'>
				<div className='container mx-auto px-4 py-2.5'>
					<div className='flex flex-wrap justify-between items-center gap-3'>
						{/* Logo */}
						<Link to='/' className='text-2xl font-black text-white items-center space-x-2 flex group'>
							<div className='p-1.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-gray-950 shadow-md group-hover:scale-105 transition'>
								<Zap size={20} className='fill-gray-950' />
							</div>
							<span className='bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent font-black'>
								NexusMart
							</span>
							<span className='hidden lg:inline-block px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold border border-emerald-500/30'>
								AI Prime
							</span>
						</Link>

						{/* Enhanced Search Bar with Trie Autocomplete, Voice, and Visual Image Search */}
						<div ref={searchRef} className='order-3 w-full md:order-none md:w-auto md:flex-1 md:max-w-xs lg:max-w-sm relative'>
							<form onSubmit={handleSearch} className='relative'>
								<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400' />
								<input
									type='text'
									value={searchQuery}
									onFocus={() => setShowSuggestions(true)}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setShowSuggestions(true);
									}}
									placeholder='Search products, brands, or ask AI...'
									className='w-full rounded-2xl bg-gray-800/90 border border-gray-700 pl-8 pr-16 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-inner'
								/>

								{/* Inline Voice & Visual Search Triggers */}
								<div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400'>
									<button
										type='button'
										onClick={handleVoiceSearch}
										className={`p-1 rounded-lg transition ${
											isListening ? "text-red-400 bg-red-500/20 animate-pulse" : "hover:text-emerald-400"
										}`}
										title='Voice Search'
									>
										{isListening ? <MicOff size={13} /> : <Mic size={13} />}
									</button>
									<button
										type='button'
										onClick={() => setIsVisualSearchOpen(true)}
										className='p-1 rounded-lg hover:text-emerald-400 transition'
										title='Visual Image Search'
									>
										<Camera size={13} />
									</button>
								</div>
							</form>

							{/* Trie Autocomplete Dropdown */}
							{showSuggestions && suggestions.length > 0 && (
								<div className='absolute left-0 right-0 top-full mt-2 rounded-2xl border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-md overflow-hidden z-50 animate-fadeIn'>
									<div className='p-2 space-y-1'>
										<p className='px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between'>
											<span>Trie Suggestions</span>
											<Sparkles size={11} className='text-emerald-400' />
										</p>
										{suggestions.map((item) => (
											<button
												key={item._id}
												onClick={() => {
													setShowSuggestions(false);
													setSearchQuery(item.name);
													navigate(`/search?q=${encodeURIComponent(item.name)}`);
												}}
												className='w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-800 transition text-left'
											>
												<img src={item.image} alt={item.name} className='w-8 h-8 rounded-lg object-cover' />
												<div className='flex-1 min-w-0'>
													<p className='text-xs font-semibold text-white truncate'>{item.name}</p>
													<p className='text-[10px] text-emerald-400 font-bold'>{formatPrice(item.price)}</p>
												</div>
											</button>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Feature Hub Navigation: Shorts, Marketplace, Global, Persona */}
						<div className='hidden sm:flex items-center gap-1 text-xs font-bold'>
							<Link
								to='/shorts'
								className='flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-red-300 hover:bg-red-500/10 transition'
							>
								<Flame size={14} className='text-red-400' /> Shorts
							</Link>
							<Link
								to='/marketplace'
								className='flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-teal-300 hover:bg-teal-500/10 transition'
							>
								<Tag size={14} className='text-teal-400' /> Marketplace
							</Link>
							<Link
								to='/explore-global'
								className='flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-purple-300 hover:bg-purple-500/10 transition'
							>
								<Globe size={14} className='text-purple-400' /> Global Deals
							</Link>
							{user && (
								<Link
									to='/persona'
									className='flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-cyan-300 hover:bg-cyan-500/10 transition'
								>
									<Sparkles size={14} className='text-cyan-400' /> AI Persona
								</Link>
							)}
						</div>

						{/* Right Navigation & Currency Selector */}
						<nav className='flex flex-wrap items-center gap-2.5'>
							{/* Currency Selector */}
							<div className='relative flex items-center gap-1 bg-gray-800/80 px-2 py-1 rounded-xl border border-gray-700 text-xs text-gray-200 font-bold'>
								<Globe size={13} className='text-emerald-400' />
								<select
									value={selectedCurrency}
									onChange={(e) => handleCurrencyChange(e.target.value)}
									className='bg-transparent text-white focus:outline-none cursor-pointer text-[11px] font-bold'
								>
									{Object.values(CURRENCIES).map((cur) => (
										<option key={cur.code} value={cur.code} className='bg-gray-900 text-white'>
											{cur.symbol} {cur.code}
										</option>
									))}
								</select>
							</div>

							{user && (
								<>
									<Link
										to='/orders'
										className='text-gray-300 hover:text-emerald-400 text-xs font-medium transition flex items-center'
									>
										<Package className='inline-block mr-1' size={16} />
										<span className='hidden sm:inline'>Orders</span>
									</Link>
									<Link
										to='/cart'
										className='relative group text-gray-300 hover:text-emerald-400 text-xs font-medium transition flex items-center'
									>
										<ShoppingCart className='inline-block mr-1 group-hover:text-emerald-400' size={16} />
										<span className='hidden sm:inline'>Cart</span>
										{cart.length > 0 && (
											<span className='absolute -top-2 -left-2 bg-emerald-500 text-gray-950 font-black rounded-full px-1.5 py-0.2 text-[10px] shadow'>
												{cart.length}
											</span>
										)}
									</Link>
								</>
							)}

							{isAdmin && (
								<Link
									className='bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-xl font-bold text-[11px] transition flex items-center'
									to='/secret-dashboard'
								>
									<Lock className='inline-block mr-1' size={12} />
									<span className='hidden sm:inline'>Admin</span>
								</Link>
							)}

							{user ? (
								<button
									className='bg-gray-800 hover:bg-gray-700 text-gray-200 py-1 px-2.5 rounded-xl flex items-center text-xs font-semibold border border-gray-700 transition'
									onClick={logout}
								>
									<LogOut size={13} />
									<span className='hidden sm:inline ml-1'>Logout</span>
								</button>
							) : (
								<div className='flex items-center gap-1.5'>
									<Link
										to='/signup'
										className='bg-emerald-600 hover:bg-emerald-500 text-white py-1 px-3 rounded-xl font-bold text-xs shadow-md transition flex items-center'
									>
										<UserPlus className='mr-1' size={13} />
										Sign Up
									</Link>
									<Link
										to='/login'
										className='bg-gray-800 hover:bg-gray-700 text-gray-200 py-1 px-2.5 rounded-xl font-semibold text-xs border border-gray-700 transition flex items-center'
									>
										<LogIn className='mr-1' size={13} />
										Login
									</Link>
								</div>
							)}
						</nav>
					</div>
				</div>
			</header>

			{/* Visual Search Modal */}
			<VisualSearchModal
				isOpen={isVisualSearchOpen}
				onClose={() => setIsVisualSearchOpen(false)}
			/>
		</>
	);
};

export default Navbar;
