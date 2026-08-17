import { useState, useEffect, useRef } from "react";
import { aiApi, speakText, stopSpeaking, createSpeechRecognizer } from "../lib/freeAiClient";
import { formatPrice } from "../lib/dsaClient";
import { useCartStore } from "../stores/useCartStore";
import {
	Bot,
	X,
	Send,
	Mic,
	MicOff,
	Volume2,
	VolumeX,
	Sparkles,
	ShoppingCart,
	ArrowRight,
	TrendingDown,
	Zap,
	RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

const AiShoppingAssistant = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState([
		{
			id: "welcome",
			sender: "ai",
			text: "👋 Hi! I'm **Nova**, your Autonomous AI Shopping Copilot. I can find the best deals, compare live prices with Amazon & Flipkart, negotiate special discounts, and answer any product questions. How can I help you?",
			suggestedProducts: [],
			timestamp: new Date(),
		},
	]);
	const [loading, setLoading] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [voiceEnabled, setVoiceEnabled] = useState(false);
	const recognizerRef = useRef(null);
	const messagesEndRef = useRef(null);
	const { addToCart } = useCartStore();

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		if (isOpen) {
			scrollToBottom();
		}
	}, [messages, isOpen]);

	const handleSendMessage = async (userText = input) => {
		const textToSend = userText.trim();
		if (!textToSend) return;

		const userMsg = {
			id: Date.now().toString(),
			sender: "user",
			text: textToSend,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setLoading(true);

		try {
			const data = await aiApi.chat(textToSend, { conversationLength: messages.length });

			const aiMsg = {
				id: (Date.now() + 1).toString(),
				sender: "ai",
				text: data.reply || "I'm on it! Let me know if you need anything else.",
				suggestedProducts: data.suggestedProducts || [],
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, aiMsg]);

			if (voiceEnabled) {
				speakText(aiMsg.text);
			}
		} catch (err) {
			const fallbackMsg = {
				id: (Date.now() + 1).toString(),
				sender: "ai",
				text: "✨ I'm here to help! NexusMart is currently 15% cheaper than Amazon & Flipkart with 2-hour hyper-fast dispatch.",
				suggestedProducts: [],
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, fallbackMsg]);
			if (voiceEnabled) speakText(fallbackMsg.text);
		} finally {
			setLoading(false);
		}
	};

	const toggleVoiceInput = () => {
		if (isListening) {
			if (recognizerRef.current) recognizerRef.current.stop();
			setIsListening(false);
		} else {
			const recognizer = createSpeechRecognizer(
				(transcript) => {
					setInput(transcript);
					setIsListening(false);
					handleSendMessage(transcript);
				},
				(err) => {
					console.error("Speech error", err);
					setIsListening(false);
					toast.error("Microphone access unavailable");
				},
				() => setIsListening(false)
			);

			if (recognizer) {
				recognizerRef.current = recognizer;
				recognizer.start();
				setIsListening(true);
				toast.success("Listening... Speak now!");
			} else {
				toast.error("Speech recognition is not supported in this browser.");
			}
		}
	};

	const toggleVoicePlayback = () => {
		if (voiceEnabled) {
			stopSpeaking();
			setVoiceEnabled(false);
			toast("Voice playback turned OFF");
		} else {
			setVoiceEnabled(true);
			speakText("Voice playback activated! I'll read my answers aloud to you.");
			toast.success("Voice playback enabled!");
		}
	};

	const quickPrompts = [
		{ label: "🔥 Best Flash Deals", query: "Show me today's highest discount flash deals" },
		{ label: "📊 Amazon vs Flipkart", query: "Compare your prices against Amazon and Flipkart" },
		{ label: "⚡ Hyper-Fast Delivery", query: "How does your 2-hour delivery routing work?" },
		{ label: "🏷️ Secret Discount", query: "Do you have any active coupons or secret promotions?" },
	];

	return (
		<div className='fixed bottom-6 right-6 z-50'>
			{/* Floating Trigger Button */}
			{!isOpen && (
				<button
					onClick={() => setIsOpen(true)}
					className='relative group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-gray-950 font-bold shadow-2xl shadow-emerald-500/40 hover:scale-105 transition-all duration-300 active:scale-95'
				>
					<div className='relative'>
						<Bot size={24} className='animate-bounce' />
						<span className='absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full' />
					</div>
					<span className='text-sm font-black tracking-wide'>Nova AI Copilot</span>
					<span className='hidden sm:inline-block px-1.5 py-0.5 rounded bg-gray-950/30 text-white text-[10px] uppercase font-bold'>
						Live
					</span>
				</button>
			)}

			{/* Floating Chat Modal */}
			{isOpen && (
				<div className='relative w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] rounded-3xl border border-emerald-500/40 bg-gray-900/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-slideUp'>
					{/* Header */}
					<div className='px-4 py-3.5 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-emerald-950/60 to-gray-900 flex items-center justify-between'>
						<div className='flex items-center gap-2.5'>
							<div className='relative p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-gray-950 shadow-md'>
								<Bot size={20} />
								<span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-300 border-2 border-gray-900 rounded-full' />
							</div>
							<div>
								<div className='flex items-center gap-1.5'>
									<h3 className='font-bold text-white text-sm'>Nova AI Copilot</h3>
									<span className='px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'>
										GPT-4o Proxy
									</span>
								</div>
								<p className='text-[11px] text-gray-400'>Real-time Voice & Shopping Agent</p>
							</div>
						</div>

						<div className='flex items-center gap-1'>
							<button
								onClick={toggleVoicePlayback}
								title={voiceEnabled ? "Mute Voice" : "Enable Voice Assistant"}
								className={`p-2 rounded-lg transition ${
									voiceEnabled
										? "text-emerald-400 bg-emerald-500/20"
										: "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
								}`}
							>
								{voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
							</button>
							<button
								onClick={() => setIsOpen(false)}
								className='p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition'
							>
								<X size={18} />
							</button>
						</div>
					</div>

					{/* Message Log */}
					<div className='flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm scrollbar-thin scrollbar-thumb-gray-700'>
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
							>
								<div
									className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
										msg.sender === "user"
											? "bg-emerald-600 text-white rounded-br-none shadow"
											: "bg-gray-800/90 text-gray-100 border border-gray-700/70 rounded-bl-none shadow-md"
									}`}
								>
									<p className='whitespace-pre-wrap leading-relaxed'>{msg.text}</p>
								</div>

								{/* Product Suggestion Cards within Chat */}
								{msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
									<div className='mt-2 space-y-2 w-full max-w-[90%]'>
										<p className='text-[11px] font-bold text-emerald-400 uppercase tracking-wider'>Matching Catalog Picks:</p>
										{msg.suggestedProducts.map((p) => (
											<div
												key={p._id}
												className='flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-800 border border-gray-700/80 hover:border-emerald-500/50 transition'
											>
												<img src={p.image} alt={p.name} className='w-10 h-10 rounded-lg object-cover' />
												<div className='flex-1 min-w-0'>
													<p className='text-xs font-semibold text-white truncate'>{p.name}</p>
													<p className='text-[11px] text-emerald-400 font-bold'>{formatPrice(p.price)}</p>
												</div>
												<button
													onClick={() => {
														addToCart(p);
														toast.success(`Added ${p.name} to cart!`);
													}}
													className='p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow'
													title='Add to cart'
												>
													<ShoppingCart size={14} />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						))}

						{loading && (
							<div className='flex items-center gap-2 text-xs text-emerald-400 bg-gray-800/70 border border-gray-700 rounded-xl px-3.5 py-2 w-fit'>
								<Sparkles size={14} className='animate-spin' />
								Nova is thinking...
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Quick Prompt Chips */}
					<div className='px-3 py-2 border-t border-gray-800/80 bg-gray-900/60 overflow-x-auto flex gap-1.5 scrollbar-none'>
						{quickPrompts.map((chip, idx) => (
							<button
								key={idx}
								onClick={() => handleSendMessage(chip.query)}
								className='whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-800 hover:bg-emerald-950/60 hover:border-emerald-500/40 border border-gray-700 text-[11px] text-gray-300 hover:text-emerald-300 transition'
							>
								{chip.label}
							</button>
						))}
					</div>

					{/* Message Input Bar */}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleSendMessage();
						}}
						className='p-3 border-t border-gray-800 bg-gray-900 flex items-center gap-2'
					>
						<button
							type='button'
							onClick={toggleVoiceInput}
							className={`p-2.5 rounded-xl transition ${
								isListening
									? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/40"
									: "bg-gray-800 hover:bg-gray-700 text-gray-300"
							}`}
							title='Voice Search / Talk with AI'
						>
							{isListening ? <MicOff size={16} /> : <Mic size={16} />}
						</button>

						<input
							type='text'
							placeholder={isListening ? "Listening to your voice..." : "Ask Nova anything (e.g. compare jeans)..."}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							className='flex-1 rounded-xl bg-gray-800 border border-gray-700 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500'
						/>

						<button
							type='submit'
							disabled={loading || !input.trim()}
							className='p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold transition shadow'
						>
							<Send size={16} />
						</button>
					</form>
				</div>
			)}
		</div>
	);
};

export default AiShoppingAssistant;
