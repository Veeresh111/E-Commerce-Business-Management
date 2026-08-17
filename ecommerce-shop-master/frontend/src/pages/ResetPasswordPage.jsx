import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, Loader, CheckCircle } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token") || "";
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}
		setLoading(true);
		try {
			await axios.post("/auth/reset-password", { token, password });
			setDone(true);
			toast.success("Password reset successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to reset password");
		} finally {
			setLoading(false);
		}
	};

	if (!token) {
		return (
			<div className='min-h-screen flex items-center justify-center px-4'>
				<p className='text-red-400 text-lg'>Invalid or missing reset token.</p>
			</div>
		);
	}

	return (
		<div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<h2 className='mt-6 text-center text-3xl font-extrabold text-emerald-400'>Choose a new password</h2>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					{done ? (
						<div className='text-center'>
							<CheckCircle className='h-12 w-12 text-emerald-400 mx-auto mb-4' />
							<p className='text-gray-300 mb-6'>Your password has been reset. Please login.</p>
							<Link
								to='/login'
								className='inline-flex w-full justify-center rounded-md bg-emerald-600 py-2 px-4 text-white hover:bg-emerald-700'
							>
								Go to login
							</Link>
						</div>
					) : (
						<form onSubmit={handleSubmit} className='space-y-6'>
							<div>
								<label htmlFor='password' className='block text-sm font-medium text-gray-300'>
									New password
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										id='password'
										type='password'
										required
										minLength={6}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
										placeholder='••••••••'
									/>
								</div>
							</div>

							<div>
								<label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-300'>
									Confirm new password
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										id='confirmPassword'
										type='password'
										required
										minLength={6}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
										placeholder='••••••••'
									/>
								</div>
							</div>

							<button
								type='submit'
								disabled={loading}
								className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50'
							>
								{loading ? <Loader className='h-5 w-5 animate-spin' /> : "Reset password"}
							</button>
						</form>
					)}
				</div>
			</motion.div>
		</div>
	);
};

export default ResetPasswordPage;