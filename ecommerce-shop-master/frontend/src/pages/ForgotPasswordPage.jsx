import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, Loader, CheckCircle } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await axios.post("/auth/forgot-password", { email });
			setSent(true);
		} catch (error) {
			toast.error(error.response?.data?.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<h2 className='mt-6 text-center text-3xl font-extrabold text-emerald-400'>Reset your password</h2>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					{sent ? (
						<div className='text-center'>
							<CheckCircle className='h-12 w-12 text-emerald-400 mx-auto mb-4' />
							<p className='text-gray-300 mb-2'>
								If an account exists for <span className='font-medium text-emerald-400'>{email}</span>,
								a password reset link has been sent.
							</p>
							<p className='text-gray-500 text-sm mb-6'>The link expires in 15 minutes.</p>
							<Link
								to='/login'
								className='inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300'
							>
								Back to login <ArrowRight size={16} />
							</Link>
						</div>
					) : (
						<form onSubmit={handleSubmit} className='space-y-6'>
							<div>
								<label htmlFor='email' className='block text-sm font-medium text-gray-300'>
									Email address
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<Mail className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										id='email'
										type='email'
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
										placeholder='you@example.com'
									/>
								</div>
							</div>

							<button
								type='submit'
								disabled={loading}
								className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50'
							>
								{loading ? (
									<Loader className='h-5 w-5 animate-spin' aria-hidden='true' />
								) : (
									"Send reset link"
								)}
							</button>

							<p className='text-center text-sm text-gray-400'>
								Remembered it?{" "}
								<Link to='/login' className='font-medium text-emerald-400 hover:text-emerald-300'>
									Login
								</Link>
							</p>
						</form>
					)}
				</div>
			</motion.div>
		</div>
	);
};

export default ForgotPasswordPage;