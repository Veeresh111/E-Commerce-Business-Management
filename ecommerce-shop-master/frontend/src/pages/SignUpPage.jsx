import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, ArrowRight, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";

const GOOGLE_CLIENT_ID = "531527182010-4f42ppkun3sub7p1ntabq29ro3p9hmsd.apps.googleusercontent.com";

const SignUpPage = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const { signup, googleLogin, loading } = useUserStore();

	useEffect(() => {
		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		script.onload = () => {
			if (window.google) {
				window.google.accounts.id.initialize({
					client_id: GOOGLE_CLIENT_ID,
					callback: (response) => {
						if (response.credential) {
							googleLogin({ credential: response.credential });
						}
					},
				});
				const btnContainer = document.getElementById("googleSignUpBtn");
				if (btnContainer) {
					window.google.accounts.id.renderButton(btnContainer, {
						theme: "filled_black",
						size: "large",
						width: 320,
						shape: "pill",
					});
				}
			}
		};
		document.body.appendChild(script);
		return () => {
			if (document.body.contains(script)) document.body.removeChild(script);
		};
	}, []);

	const handleSubmit = (e) => {
		e.preventDefault();
		signup(formData);
	};

	const handleSimulateGoogle = () => {
		googleLogin({
			email: "alex.demo@nexusmart.com",
			name: "Alex Mercer",
		});
	};

	return (
		<div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<h2 className='mt-6 text-center text-3xl font-extrabold text-emerald-400'>Create your NexusMart account</h2>
				<p className='mt-2 text-center text-xs text-gray-400'>
					Already have an account?{" "}
					<Link to='/login' className='font-medium text-emerald-400 hover:text-emerald-300'>
						Sign in here
					</Link>
				</p>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-gray-800/90 border border-gray-700 py-8 px-4 shadow-2xl rounded-3xl sm:px-10 space-y-6'>
					{/* Google One-Click Auth */}
					<div className='space-y-3 text-center'>
						<div id='googleSignUpBtn' className='flex justify-center' />
						<button
							type='button'
							onClick={handleSimulateGoogle}
							className='w-full py-2.5 rounded-2xl bg-gray-700/80 hover:bg-gray-700 border border-gray-600 text-xs font-bold text-white flex items-center justify-center gap-2 transition'
						>
							<svg className='w-4 h-4' viewBox='0 0 24 24'>
								<path
									fill='#EA4335'
									d='M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z'
								/>
								<path
									fill='#4285F4'
									d='M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z'
								/>
								<path
									fill='#FBBC05'
									d='M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z'
								/>
								<path
									fill='#34A853'
									d='M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z'
								/>
							</svg>
							Sign up with Google 1-Click
						</button>
					</div>

					<div className='relative flex py-1 items-center'>
						<div className='flex-grow border-t border-gray-700'></div>
						<span className='flex-shrink mx-3 text-xs text-gray-500 uppercase font-bold'>Or register with email</span>
						<div className='flex-grow border-t border-gray-700'></div>
					</div>

					<form onSubmit={handleSubmit} className='space-y-4 text-xs'>
						<div>
							<label htmlFor='name' className='block font-medium text-gray-300 mb-1'>
								Full name
							</label>
							<div className='relative rounded-xl shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<User className='h-4 w-4 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='name'
									type='text'
									required
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-xl shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-xs'
									placeholder='John Doe'
								/>
							</div>
						</div>

						<div>
							<label htmlFor='email' className='block font-medium text-gray-300 mb-1'>
								Email address
							</label>
							<div className='relative rounded-xl shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Mail className='h-4 w-4 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='email'
									type='email'
									required
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-xl shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-xs'
									placeholder='you@example.com'
								/>
							</div>
						</div>

						<div>
							<label htmlFor='password' className='block font-medium text-gray-300 mb-1'>
								Password
							</label>
							<div className='relative rounded-xl shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-4 w-4 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='password'
									type='password'
									required
									value={formData.password}
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-xl shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-xs'
									placeholder='••••••••'
								/>
							</div>
						</div>

						<div>
							<label htmlFor='confirmPassword' className='block font-medium text-gray-300 mb-1'>
								Confirm Password
							</label>
							<div className='relative rounded-xl shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-4 w-4 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='confirmPassword'
									type='password'
									required
									value={formData.confirmPassword}
									onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
									className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-xl shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-xs'
									placeholder='••••••••'
								/>
							</div>
						</div>

						<button
							type='submit'
							className='w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition'
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />
									Creating account...
								</>
							) : (
								<>
									<UserPlus className='mr-2 h-4 w-4' aria-hidden='true' />
									Create Account
								</>
							)}
						</button>
					</form>
				</div>
			</motion.div>
		</div>
	);
};
export default SignUpPage;
