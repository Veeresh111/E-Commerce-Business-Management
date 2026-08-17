import { useEffect, useState } from "react";
import { aiApi } from "../lib/freeAiClient";
import { formatPrice } from "../lib/dsaClient";
import { ShieldCheck, TrendingDown, ExternalLink, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const PriceComparisonWidget = ({ product }) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!product?._id) return;
		let isMounted = true;
		const loadComparison = async () => {
			try {
				const result = await aiApi.comparePrices(product._id);
				if (isMounted) setData(result);
			} catch (err) {
				console.error("Failed to load price comparison", err);
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		loadComparison();
		return () => {
			isMounted = false;
		};
	}, [product]);

	if (loading) {
		return (
			<div className='p-4 rounded-xl bg-gray-800/60 border border-gray-700 animate-pulse space-y-3'>
				<div className='h-4 bg-gray-700 rounded w-1/3'></div>
				<div className='h-12 bg-gray-700/50 rounded'></div>
			</div>
		);
	}

	if (!data) return null;

	return (
		<div className='rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-emerald-950/20 p-5 shadow-2xl backdrop-blur-md'>
			{/* Header */}
			<div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-700/70 pb-3 mb-4'>
				<div className='flex items-center gap-2'>
					<div className='p-2 rounded-lg bg-emerald-500/20 text-emerald-400'>
						<TrendingDown size={20} />
					</div>
					<div>
						<h4 className='text-base font-bold text-white flex items-center gap-1.5'>
							Live Competitor Price Intelligence
							<span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'>
								<Zap size={12} className='mr-1 fill-emerald-400' /> Live Match
							</span>
						</h4>
						<p className='text-xs text-gray-400'>Scanned in real-time across major online marketplaces</p>
					</div>
				</div>
				<div className='flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30'>
					<ShieldCheck size={14} /> Price Match Guarantee
				</div>
			</div>

			{/* Comparison Cards Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4'>
				{/* NexusMart (Our Store) */}
				<div className='relative rounded-xl border-2 border-emerald-500 bg-emerald-950/30 p-3 text-center shadow-lg shadow-emerald-950/40 flex flex-col justify-between'>
					<div className='absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow'>
						Best Price Winner
					</div>
					<div className='mt-1'>
						<span className='text-xs font-bold text-emerald-400 uppercase tracking-wider'>NexusMart (Ours)</span>
						<p className='text-2xl font-black text-white mt-0.5'>{formatPrice(data.ourPrice)}</p>
						<p className='text-[11px] text-emerald-300 flex items-center justify-center gap-1 mt-0.5'>
							<CheckCircle2 size={12} /> 2-Hour Metro Delivery
						</p>
					</div>
					<div className='mt-2 pt-2 border-t border-emerald-500/30 text-[11px] font-bold text-emerald-400'>
						Save up to {data.savingsPercentage}%
					</div>
				</div>

				{/* Amazon */}
				<div className='rounded-xl border border-gray-700/80 bg-gray-800/40 p-3 text-center flex flex-col justify-between hover:border-gray-600 transition'>
					<div>
						<span className='text-xs font-semibold text-gray-400'>Amazon Price</span>
						<p className='text-xl font-bold text-gray-300 line-through opacity-80 mt-0.5'>{formatPrice(data.amazon.price)}</p>
						<p className='text-[11px] text-gray-400 mt-0.5'>{data.amazon.delivery}</p>
					</div>
					<div className='mt-2 pt-2 border-t border-gray-700/50 text-[11px] text-red-400 font-medium'>
						+ {formatPrice(data.amazon.savings)} more expensive
					</div>
				</div>

				{/* Flipkart */}
				<div className='rounded-xl border border-gray-700/80 bg-gray-800/40 p-3 text-center flex flex-col justify-between hover:border-gray-600 transition'>
					<div>
						<span className='text-xs font-semibold text-gray-400'>Flipkart Price</span>
						<p className='text-xl font-bold text-gray-300 line-through opacity-80 mt-0.5'>{formatPrice(data.flipkart.price)}</p>
						<p className='text-[11px] text-gray-400 mt-0.5'>{data.flipkart.delivery}</p>
					</div>
					<div className='mt-2 pt-2 border-t border-gray-700/50 text-[11px] text-red-400 font-medium'>
						+ {formatPrice(data.flipkart.savings)} more expensive
					</div>
				</div>
			</div>

			{/* AI Recommendation Banner */}
			<div className='flex items-start gap-3 rounded-xl bg-gray-800/80 border border-emerald-500/20 p-3 text-xs mb-3'>
				<Sparkles className='text-emerald-400 shrink-0 mt-0.5' size={16} />
				<div>
					<span className='font-bold text-emerald-300 mr-1.5'>{data.pricePrediction.recommendation} ({data.pricePrediction.confidence} Confidence):</span>
					<span className='text-gray-300'>{data.pricePrediction.reasoning}</span>
				</div>
			</div>

			{/* 30-Day Price Trend Mini Chart */}
			{data.priceHistory && (
				<div className='pt-2'>
					<p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>30-Day Price Trajectory (USD)</p>
					<div className='h-24 w-full'>
						<ResponsiveContainer width='100%' height='100%'>
							<AreaChart data={data.priceHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
								<defs>
									<linearGradient id='colorPrice' x1='0' y1='0' x2='0' y2='1'>
										<stop offset='5%' stopColor='#10b981' stopOpacity={0.4} />
										<stop offset='95%' stopColor='#10b981' stopOpacity={0.0} />
									</linearGradient>
								</defs>
								<XAxis dataKey='day' stroke='#6b7280' fontSize={10} tickLine={false} />
								<YAxis stroke='#6b7280' fontSize={10} domain={["dataMin - 5", "dataMax + 5"]} tickLine={false} />
								<Tooltip
									contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151", borderRadius: "8px", fontSize: "11px" }}
									formatter={(val) => [`$${val}`, "Price"]}
								/>
								<Area type='monotone' dataKey='price' stroke='#10b981' strokeWidth={2} fillOpacity={1} fill='url(#colorPrice)' />
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
			)}
		</div>
	);
};

export default PriceComparisonWidget;
