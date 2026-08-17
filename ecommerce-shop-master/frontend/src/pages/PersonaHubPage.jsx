import { useState, useEffect } from "react";
import axios from "../lib/axios";
import { formatPrice } from "../lib/dsaClient";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import {
	User,
	Briefcase,
	Heart,
	Sparkles,
	MapPin,
	Check,
	Save,
	Activity,
	ShoppingCart,
	Star,
	Zap,
	ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const PROFESSIONS = [
	"Software Engineer",
	"Product Designer",
	"Medical Doctor / Healthcare",
	"Athlete / Fitness Coach",
	"Content Creator / Streamer",
	"University Student",
	"Chef / Culinary Specialist",
	"Entrepreneur / Executive",
	"Architect / Industrial Designer",
	"Photographer / Filmmaker",
];

const HOBBIES_LIST = [
	"Gaming",
	"Photography",
	"Fitness & Lifting",
	"Hiking & Outdoors",
	"Music Production",
	"Coding & Robotics",
	"Cycling",
	"Fashion & Styling",
	"Cooking & Coffee",
	"Travel & Exploration",
	"Mechanical Keyboards",
	"Reading & Philosophy",
];

const PersonaHubPage = () => {
	const { user } = useUserStore();
	const { addToCart } = useCartStore();

	const [profession, setProfession] = useState("Software Engineer");
	const [selectedHobbies, setSelectedHobbies] = useState(["Gaming", "Tech & Gadgets", "Fitness"]);
	const [city, setCity] = useState("San Francisco");
	const [region, setRegion] = useState("US");
	const [isSaving, setIsSaving] = useState(false);

	// Agentic synthesized result
	const [agenticData, setAgenticData] = useState(null);
	const [loadingRecs, setLoadingRecs] = useState(true);

	const fetchPersona = async () => {
		try {
			const res = await axios.get("/persona/profile");
			if (res.data) {
				setProfession(res.data.profession || "Software Engineer");
				setSelectedHobbies(res.data.hobbies || ["Gaming", "Fitness"]);
				setCity(res.data.location?.city || "San Francisco");
				setRegion(res.data.location?.region || "US");
			}
		} catch (err) {}
	};

	const fetchRecommendations = async () => {
		setLoadingRecs(true);
		try {
			const res = await axios.get("/persona/recommendations");
			setAgenticData(res.data);
		} catch (err) {
			console.log("Could not load agentic recommendations");
		} finally {
			setLoadingRecs(false);
		}
	};

	useEffect(() => {
		if (user) {
			fetchPersona();
			fetchRecommendations();
		}
	}, [user]);

	const toggleHobby = (hobby) => {
		if (selectedHobbies.includes(hobby)) {
			setSelectedHobbies(selectedHobbies.filter((h) => h !== hobby));
		} else {
			setSelectedHobbies([...selectedHobbies, hobby]);
		}
	};

	const handleSaveProfile = async (e) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			await axios.put("/persona/profile", {
				profession,
				hobbies: selectedHobbies,
				location: { city, region },
			});
			toast.success("Persona updated! Agentic AI synthesized new tailored catalog...");
			fetchRecommendations();
		} catch (err) {
			toast.error("Failed to save persona");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className='min-h-screen max-w-7xl mx-auto px-4 py-8 pb-20'>
			{/* Header */}
			<div className='flex items-center gap-3 border-b border-gray-800 pb-6 mb-8'>
				<div className='p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'>
					<Sparkles size={24} />
				</div>
				<div>
					<h1 className='text-3xl font-black text-white flex items-center gap-2'>
						Agentic AI Persona & Telemetry Hub
					</h1>
					<p className='text-xs sm:text-sm text-gray-400'>
						Configure your profession, lifestyle hobbies, and interests to power deep autonomous product matchmaking
					</p>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Left Column: Persona Configuration Card */}
				<div className='rounded-3xl border border-gray-800 bg-gray-900/90 p-6 shadow-2xl space-y-5 h-fit'>
					<h3 className='text-base font-bold text-white flex items-center gap-2'>
						<User size={18} className='text-emerald-400' /> Your Archetype Profile
					</h3>

					<form onSubmit={handleSaveProfile} className='space-y-4 text-xs'>
						<div>
							<label className='block font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5'>
								<Briefcase size={14} className='text-emerald-400' /> Profession / Craft:
							</label>
							<select
								value={profession}
								onChange={(e) => setProfession(e.target.value)}
								className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white focus:outline-none focus:border-emerald-500'
							>
								{PROFESSIONS.map((p) => (
									<option key={p} value={p}>
										{p}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className='block font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5'>
								<MapPin size={14} className='text-emerald-400' /> Location / Hub:
							</label>
							<input
								type='text'
								value={city}
								onChange={(e) => setCity(e.target.value)}
								placeholder='e.g. San Francisco, CA'
								className='w-full rounded-xl bg-gray-800 border border-gray-700 p-2.5 text-white focus:outline-none focus:border-emerald-500'
							/>
						</div>

						<div>
							<label className='block font-semibold text-gray-300 mb-2 flex items-center gap-1.5'>
								<Heart size={14} className='text-red-400' /> Hobbies & Lifestyles:
							</label>
							<div className='flex flex-wrap gap-1.5'>
								{HOBBIES_LIST.map((h) => {
									const isSelected = selectedHobbies.includes(h);
									return (
										<button
											key={h}
											type='button'
											onClick={() => toggleHobby(h)}
											className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition ${
												isSelected
													? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
													: "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
											}`}
										>
											{isSelected ? "✓ " : "+ "}
											{h}
										</button>
									);
								})}
							</div>
						</div>

						<button
							type='submit'
							disabled={isSaving}
							className='w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition'
						>
							<Save size={14} /> {isSaving ? "Synthesizing AI Engine..." : "Update Persona & Re-cluster"}
						</button>
					</form>
				</div>

				{/* Right 2 Columns: Agentic Telemetry Briefing & Synthesized Recommendations */}
				<div className='lg:col-span-2 space-y-6'>
					{/* AI Briefing Card */}
					{agenticData && (
						<div className='p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-gray-900 to-emerald-950/30 shadow-2xl space-y-4 relative overflow-hidden'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<div className='p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400'>
										<Zap size={16} />
									</div>
									<span className='text-xs font-bold text-cyan-300 uppercase tracking-wider'>
										Agentic Persona Synthesis
									</span>
								</div>
								<span className='px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30'>
									99.2% Match Score
								</span>
							</div>

							<h2 className='text-xl sm:text-2xl font-black text-white'>{agenticData.personaBrief}</h2>
							<p className='text-xs text-gray-300 leading-relaxed'>{agenticData.aiRationale}</p>

							{/* Perk Badge */}
							<div className='p-3 rounded-2xl bg-gray-800/80 border border-gray-700/80 text-xs flex items-center gap-2 text-emerald-300'>
								<ShieldCheck size={18} className='text-emerald-400 shrink-0' />
								<span>
									<b>Archetype Perk: </b>
									{agenticData.exclusivePersonaPerk}
								</span>
							</div>
						</div>
					)}

					{/* Curated Recommendations Grid */}
					<div>
						<h3 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
							<Activity size={18} className='text-emerald-400' /> Recommended Gear for your Archetype
						</h3>

						{loadingRecs ? (
							<div className='h-48 flex items-center justify-center text-gray-400'>
								<Sparkles size={20} className='animate-spin text-emerald-400 mr-2' /> Synthesizing neural
								recommendations...
							</div>
						) : (
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								{(agenticData?.recommendations || []).map((item) => (
									<div
										key={item._id}
										className='group p-4 rounded-3xl border border-gray-800 bg-gray-900/90 hover:border-emerald-500/50 p-4 transition duration-300 shadow-xl flex flex-col justify-between'
									>
										<div>
											<div className='relative h-44 rounded-2xl overflow-hidden mb-3 bg-gray-800'>
												<img
													src={item.image}
													alt={item.name}
													className='w-full h-full object-cover group-hover:scale-105 transition duration-500'
												/>
												<div className='absolute top-2 left-2 bg-emerald-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full'>
													{item.category}
												</div>
											</div>
											<div className='flex items-center gap-1 text-amber-400 text-xs font-semibold mb-1'>
												<Star size={12} className='fill-amber-400' /> {item.rating || 4.9}
											</div>
											<h4 className='text-sm font-bold text-white truncate group-hover:text-emerald-400 transition'>
												{item.name}
											</h4>
											<p className='text-xs text-gray-400 line-clamp-2 mt-1'>{item.description}</p>
										</div>

										<div className='mt-4 pt-3 border-t border-gray-800 flex items-center justify-between'>
											<span className='text-lg font-black text-white'>{formatPrice(item.price)}</span>
											<button
												onClick={() => {
													addToCart(item);
													toast.success(`Added ${item.name} to cart!`);
												}}
												className='px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1 transition'
											>
												<ShoppingCart size={14} /> Add
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PersonaHubPage;
