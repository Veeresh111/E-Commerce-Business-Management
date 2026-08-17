import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowRight, Truck, CheckCircle2, ShieldAlert, Clock, MapPin, XCircle } from "lucide-react";
import axios from "../lib/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import ReturnArbitratorModal from "../components/ReturnArbitratorModal";
import { formatPrice } from "../lib/dsaClient";
import toast from "react-hot-toast";

const statusStyles = {
	pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
	paid: "bg-blue-500/20 text-blue-400 border-blue-500/40",
	packed: "bg-teal-500/20 text-teal-400 border-teal-500/40",
	shipped: "bg-purple-500/20 text-purple-400 border-purple-500/40",
	out_for_delivery: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
	delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
	returned: "bg-pink-500/20 text-pink-400 border-pink-500/40",
	cancelled: "bg-red-500/20 text-red-400 border-red-500/40",
};

const OrdersPage = () => {
	const [orders, setOrders] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedDisputeOrder, setSelectedDisputeOrder] = useState(null);

	const fetchOrders = async () => {
		try {
			const res = await axios.get("/orders");
			setOrders(res.data.orders);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to load orders");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	const handleCancelOrder = async (orderId) => {
		if (!window.confirm("Are you sure you want to cancel this order?")) return;
		try {
			await axios.patch(`/orders/${orderId}/cancel`);
			toast.success("Order cancelled successfully");
			fetchOrders();
		} catch (err) {
			toast.error(err.response?.data?.message || "Could not cancel order");
		}
	};

	if (isLoading) return <LoadingSpinner />;

	if (error) {
		return (
			<div className='max-w-4xl mx-auto px-4 py-16 text-center'>
				<p className='text-red-400 text-lg'>{error}</p>
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div className='max-w-4xl mx-auto px-4 py-16 text-center'>
				<Package className='h-16 w-16 text-gray-500 mx-auto mb-4' />
				<h2 className='text-2xl font-semibold text-gray-200 mb-2'>No orders yet</h2>
				<p className='text-gray-400 mb-6'>When you make a purchase, your orders will appear here.</p>
				<Link
					to='/'
					className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-white hover:bg-emerald-700 shadow-lg'
				>
					Start Shopping <ArrowRight size={16} />
				</Link>
			</div>
		);
	}

	return (
		<div className='max-w-5xl mx-auto px-4 py-12 pb-20'>
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl sm:text-4xl font-extrabold text-white'>Live Order Tracking & History</h1>
					<p className='text-xs sm:text-sm text-gray-400 mt-1'>
						Real-time dispatch telemetry, spatial warehouse routing, and automated dispute resolution
					</p>
				</div>
			</div>

			<div className='space-y-6'>
				{orders.map((order) => {
					const canCancel = order.status === "pending" || order.status === "paid";
					const canDispute = order.status === "paid" || order.status === "delivered" || order.status === "shipped";

					return (
						<div key={order._id} className='rounded-3xl border border-gray-800 bg-gray-900/90 p-6 shadow-2xl space-y-5'>
							{/* Order Top Bar */}
							<div className='flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4'>
								<div>
									<div className='flex items-center gap-2'>
										<p className='text-sm text-gray-400'>
											Order <span className='text-white font-mono font-bold'>#{order._id.slice(-8)}</span>
										</p>
										<span className='px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-800 text-gray-300 border border-gray-700'>
											Method: {order.paymentMethod?.toUpperCase() || "STRIPE"}
										</span>
									</div>
									<p className='text-xs text-gray-500 mt-1'>
										Placed on {new Date(order.createdAt).toLocaleDateString(undefined, {
											year: "numeric",
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>

								<div className='flex items-center gap-3'>
									<span
										className={`px-3 py-1 rounded-full text-xs font-bold border ${
											statusStyles[order.status] || statusStyles.pending
										}`}
									>
										{order.status?.toUpperCase().replace(/_/g, " ")}
									</span>
									<p className='text-xl font-black text-emerald-400'>{formatPrice(order.totalAmount)}</p>
								</div>
							</div>

							{/* Order Items List */}
							<div className='space-y-3'>
								{order.products.map((item) => (
									<div key={item._id} className='flex items-center gap-4 p-3 rounded-2xl bg-gray-800/40 border border-gray-800'>
										{item.product && item.product.image && (
											<img
												src={item.product.image}
												alt={item.product.name}
												className='h-16 w-16 rounded-xl object-cover border border-gray-700'
											/>
										)}
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-bold text-white truncate'>
												{item.product ? item.product.name : "Product unavailable"}
											</p>
											<p className='text-xs text-gray-400 mt-0.5'>
												Qty: <span className='font-bold text-gray-200'>{item.quantity}</span> × {formatPrice(item.price)}
											</p>
										</div>
										<p className='text-sm font-bold text-white'>{formatPrice(item.price * item.quantity)}</p>
									</div>
								))}
							</div>

							{/* Live Tracking Timeline */}
							<div className='p-4 rounded-2xl bg-gray-800/60 border border-gray-700/80 space-y-3'>
								<div className='flex items-center justify-between'>
									<p className='text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5'>
										<Truck size={15} /> Live Dispatch Milestones
									</p>
									<span className='text-[11px] text-gray-400 font-medium'>
										Estimated Delivery: <b>Within 24–48 Hours</b>
									</span>
								</div>

								{/* Timeline Steps */}
								<div className='grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1'>
									{["Order Placed", "Robotic Packing", "Out for Delivery", "Delivered"].map((stage, idx) => {
										const currentStageIdx =
											order.status === "delivered" ? 3 :
											order.status === "shipped" || order.status === "out_for_delivery" ? 2 :
											order.status === "packed" ? 1 : 0;
										const isCompleted = idx <= currentStageIdx && order.status !== "cancelled";

										return (
											<div key={idx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${
												isCompleted
													? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
													: "border-gray-800 bg-gray-900/40 text-gray-500"
											}`}>
												<CheckCircle2 size={16} className={isCompleted ? "text-emerald-400" : "text-gray-600"} />
												<span className='text-xs font-semibold'>{stage}</span>
											</div>
										);
									})}
								</div>
							</div>

							{/* Dispute Banner if returned / resolved */}
							{order.dispute?.disputeId && (
								<div className='p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<ShieldAlert size={16} />
										<span><b>AI Return Resolution Active:</b> {order.dispute.status} (Tracking: {order.dispute.returnTrackingNumber})</span>
									</div>
								</div>
							)}

							{/* Order Footer Actions */}
							<div className='flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-gray-800'>
								{canCancel && (
									<button
										onClick={() => handleCancelOrder(order._id)}
										className='px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition'
									>
										<XCircle size={14} /> Cancel Order
									</button>
								)}

								{canDispute && !order.dispute?.disputeId && (
									<button
										onClick={() => setSelectedDisputeOrder(order)}
										className='px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow'
									>
										<ShieldAlert size={14} /> AI Return / Instant Refund
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* AI Return Resolution Modal */}
			{selectedDisputeOrder && (
				<ReturnArbitratorModal
					order={selectedDisputeOrder}
					isOpen={!!selectedDisputeOrder}
					onClose={() => setSelectedDisputeOrder(null)}
					onDisputeResolved={(updatedOrder) => {
						fetchOrders();
						setSelectedDisputeOrder(null);
					}}
				/>
			)}
		</div>
	);
};

export default OrdersPage;