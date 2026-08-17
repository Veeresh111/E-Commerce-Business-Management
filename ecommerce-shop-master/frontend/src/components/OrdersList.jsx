import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

const statusStyles = {
	pending: "bg-yellow-500/20 text-yellow-400",
	paid: "bg-blue-500/20 text-blue-400",
	shipped: "bg-purple-500/20 text-purple-400",
	delivered: "bg-emerald-500/20 text-emerald-400",
	cancelled: "bg-red-500/20 text-red-400",
};

const OrdersList = () => {
	const [orders, setOrders] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("");

	const fetchOrders = useCallback(async (status = "") => {
		try {
			const res = await axios.get(`/orders/all${status ? `?status=${status}` : ""}`);
			setOrders(res.data.orders);
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to load orders");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchOrders("");
	}, [fetchOrders]);

	const handleStatusChange = async (orderId, newStatus) => {
		try {
			const res = await axios.patch(`/orders/${orderId}/status`, { status: newStatus });
			setOrders((prev) => prev.map((o) => (o._id === orderId ? res.data : o)));
			toast.success("Order status updated");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to update order status");
		}
	};

	if (isLoading) {
		return <div className='text-center py-16 text-gray-400'>Loading orders...</div>;
	}

	return (
		<motion.div
			className='bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-6xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<div className='p-6 border-b border-gray-700 flex flex-wrap items-center justify-between gap-4'>
				<h2 className='text-xl font-semibold text-emerald-300'>All Orders</h2>
				<div className='flex items-center gap-2'>
					<label className='text-sm text-gray-400'>Filter:</label>
					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
							fetchOrders(e.target.value);
						}}
						className='bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-emerald-500'
					>
						<option value=''>All statuses</option>
						{ORDER_STATUSES.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</div>
			</div>

			{orders.length === 0 ? (
				<p className='text-center py-16 text-gray-400'>No orders found</p>
			) : (
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-700'>
						<thead className='bg-gray-700'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Order
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Customer
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Total
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Date
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Status
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
									Update Status
								</th>
							</tr>
						</thead>
						<tbody className='bg-gray-800 divide-y divide-gray-700'>
							{orders.map((order) => (
								<tr key={order._id} className='hover:bg-gray-700'>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
										#{order._id.slice(-8)}
										<div className='text-xs text-gray-500'>{order.products.length} item(s)</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='text-sm font-medium text-white'>
											{order.user?.name || "Unknown"}
										</div>
										<div className='text-xs text-gray-400'>{order.user?.email}</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-400'>
										${order.totalAmount.toFixed(2)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
										{new Date(order.createdAt).toLocaleDateString()}
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${
												statusStyles[order.status] || ""
											}`}
										>
											{order.status.toUpperCase()}
										</span>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<select
											value={order.status}
											disabled={order.status === "cancelled" || order.status === "delivered"}
											onChange={(e) => handleStatusChange(order._id, e.target.value)}
											className='bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-emerald-500 disabled:opacity-50'
										>
											{ORDER_STATUSES.map((s) => (
												<option key={s} value={s}>
													{s}
												</option>
											))}
										</select>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</motion.div>
	);
};

export default OrdersList;