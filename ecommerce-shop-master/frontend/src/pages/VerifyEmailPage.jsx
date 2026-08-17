import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import axios from "../lib/axios";

const VerifyEmailPage = () => {
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token") || "";
	const [status, setStatus] = useState("loading"); // loading | success | error
	const [message, setMessage] = useState("");

	useEffect(() => {
		const verify = async () => {
			try {
				const res = await axios.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
				setStatus("success");
				setMessage(res.data.message);
			} catch (error) {
				setStatus("error");
				setMessage(error.response?.data?.message || "Verification failed");
			}
		};

		if (token) {
			verify();
		} else {
			setStatus("error");
			setMessage("Missing verification token");
		}
	}, [token]);

	return (
		<div className='min-h-screen flex items-center justify-center px-4'>
			<div className='max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center'>
				{status === "loading" && <Loader className='h-12 w-12 text-emerald-400 mx-auto mb-4 animate-spin' />}
				{status === "success" && (
					<>
						<CheckCircle className='h-12 w-12 text-emerald-400 mx-auto mb-4' />
						<h1 className='text-2xl font-bold text-emerald-400 mb-2'>Email verified!</h1>
						<p className='text-gray-300 mb-6'>{message}</p>
						<Link
							to='/'
							className='inline-flex w-full justify-center rounded-md bg-emerald-600 py-2 px-4 text-white hover:bg-emerald-700'
						>
							Continue shopping
						</Link>
					</>
				)}
				{status === "error" && (
					<>
						<XCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
						<h1 className='text-2xl font-bold text-red-500 mb-2'>Verification failed</h1>
						<p className='text-gray-300 mb-6'>{message}</p>
						<Link
							to='/login'
							className='inline-flex w-full justify-center rounded-md bg-gray-700 py-2 px-4 text-white hover:bg-gray-600'
						>
							Back to login
						</Link>
					</>
				)}
			</div>
		</div>
	);
};

export default VerifyEmailPage;