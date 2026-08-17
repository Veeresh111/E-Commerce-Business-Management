import { useState } from "react";
import { aiApi } from "../lib/freeAiClient";
import { X, ShieldAlert, Sparkles, CheckCircle2, ArrowRight, RefreshCw, FileText } from "lucide-react";
import toast from "react-hot-toast";

const reasonsList = [
	"Defective on arrival",
	"Wrong item delivered",
	"Damaged during shipping",
	"Item significantly different from description",
	"Size/Fit issue",
];

const ReturnArbitratorModal = ({ order, isOpen, onClose, onDisputeResolved }) => {
	const [reason, setReason] = useState(reasonsList[0]);
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);

	if (!isOpen || !order) return null;

	const handleArbitrationSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await aiApi.arbitrateReturn(order._id, reason, description);
			setResult(res.arbitration);
			toast.success("AI Arbitrator approved return claim!");
			if (onDisputeResolved) onDisputeResolved(res.order);
		} catch (err) {
			toast.error(err.response?.data?.message || "Arbitration request failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn'>
			<div className='relative w-full max-w-lg rounded-3xl border border-emerald-500/40 bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]'>
				{/* Header */}
				<div className='flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-emerald-950/40 to-gray-900'>
					<div className='flex items-center gap-2.5'>
						<div className='p-2 rounded-xl bg-emerald-500/20 text-emerald-400'>
							<ShieldAlert size={20} />
						</div>
						<div>
							<h3 className='font-bold text-white text-base'>AI Return & Refund Arbitrator</h3>
							<p className='text-xs text-gray-400'>Automated instant dispute resolution engine</p>
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
					{/* Order Brief */}
					<div className='p-3.5 rounded-xl bg-gray-800/60 border border-gray-700 text-xs flex items-center justify-between'>
						<div>
							<span className='text-gray-400'>Order Reference:</span>
							<p className='font-mono font-bold text-white mt-0.5'>#{order._id.slice(-8)}</p>
						</div>
						<div className='text-right'>
							<span className='text-gray-400'>Amount Paid:</span>
							<p className='font-bold text-emerald-400 mt-0.5'>${order.totalAmount.toFixed(2)}</p>
						</div>
					</div>

					{!result ? (
						<form onSubmit={handleArbitrationSubmit} className='space-y-4'>
							<div>
								<label className='block text-xs font-semibold text-gray-300 mb-1.5'>Reason for Return / Dispute:</label>
								<select
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									className='w-full rounded-xl bg-gray-800 border border-gray-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500'
								>
									{reasonsList.map((r, i) => (
										<option key={i} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className='block text-xs font-semibold text-gray-300 mb-1.5'>Details / Notes for AI Arbitrator:</label>
								<textarea
									rows={3}
									placeholder='Describe the defect or reason for return...'
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className='w-full rounded-xl bg-gray-800 border border-gray-700 p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500'
								/>
							</div>

							<button
								type='submit'
								disabled={loading}
								className='w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition'
							>
								{loading ? (
									<>
										<Sparkles size={16} className='animate-spin' /> AI Assessing Telemetry...
									</>
								) : (
									<>
										<Sparkles size={16} /> Submit to AI Arbitrator for Instant Approval
									</>
								)}
							</button>
						</form>
					) : (
						/* Arbitration Result Card */
						<div className='p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-4 animate-scaleUp'>
							<div className='flex items-center gap-2 text-emerald-400 font-bold text-sm'>
								<CheckCircle2 size={20} />
								<span>{result.status}</span>
							</div>

							<div className='p-3.5 rounded-xl bg-gray-800/80 border border-gray-700 text-xs space-y-2'>
								<p className='text-gray-300 leading-relaxed'>{result.aiAssessment}</p>
								<div className='pt-2 border-t border-gray-700 flex justify-between items-center text-[11px]'>
									<span className='text-gray-400'>Prepaid Return Label:</span>
									<span className='font-mono font-bold text-emerald-300'>{result.returnTrackingNumber}</span>
								</div>
								<div className='flex justify-between items-center text-[11px]'>
									<span className='text-gray-400'>Resolution Speed:</span>
									<span className='font-bold text-white'>{result.resolutionTimeEstimate}</span>
								</div>
							</div>

							<button
								onClick={onClose}
								className='w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition'
							>
								Close & View Updated Order Status
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ReturnArbitratorModal;
