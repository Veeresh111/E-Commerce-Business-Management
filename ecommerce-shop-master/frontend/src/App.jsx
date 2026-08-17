import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";

import ShoppableReelsPage from "./pages/ShoppableReelsPage";
import MarketplacePage from "./pages/MarketplacePage";
import PersonaHubPage from "./pages/PersonaHubPage";
import GlobalExplorePage from "./pages/GlobalExplorePage";

import Navbar from "./components/Navbar";
import LoadingSpinner from "./components/LoadingSpinner";
import AiShoppingAssistant from "./components/AiShoppingAssistant";
import { useUserStore } from "./stores/useUserStore";
import { useCartStore } from "./stores/useCartStore";

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { getCartItems } = useCartStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!user) return;
		getCartItems();
	}, [getCartItems, user]);

	if (checkingAuth) return <LoadingSpinner />;

	return (
		<div className='min-h-screen bg-gray-950 text-white relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-gray-950'>
			{/* Ambient Gradient Mesh Background */}
			<div className='fixed inset-0 overflow-hidden pointer-events-none'>
				<div className='absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.22)_0%,rgba(13,148,136,0.12)_40%,transparent_70%)] blur-2xl' />
				<div className='absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] blur-3xl' />
			</div>

			<div className='relative z-40 pt-16'>
				<Navbar />
				<Routes>
					<Route path='/' element={<HomePage />} />
					<Route path='/shorts' element={<ShoppableReelsPage />} />
					<Route path='/marketplace' element={<MarketplacePage />} />
					<Route path='/explore-global' element={<GlobalExplorePage />} />
					<Route path='/persona' element={user ? <PersonaHubPage /> : <Navigate to='/login' />} />
					<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
					<Route path='/forgot-password' element={!user ? <ForgotPasswordPage /> : <Navigate to='/' />} />
					<Route path='/reset-password' element={!user ? <ResetPasswordPage /> : <Navigate to='/' />} />
					<Route path='/verify-email' element={<VerifyEmailPage />} />
					<Route
						path='/secret-dashboard'
						element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />}
					/>
					<Route path='/category/:category' element={<CategoryPage />} />
					<Route path='/search' element={<SearchResultsPage />} />
					<Route path='/cart' element={user ? <CartPage /> : <Navigate to='/login' />} />
					<Route path='/orders' element={user ? <OrdersPage /> : <Navigate to='/login' />} />
					<Route
						path='/purchase-success'
						element={user ? <PurchaseSuccessPage /> : <Navigate to='/login' />}
					/>
					<Route path='/purchase-cancel' element={user ? <PurchaseCancelPage /> : <Navigate to='/login' />} />
				</Routes>
			</div>

			{/* Autonomous AI Copilot Voice & Shopping Assistant */}
			<AiShoppingAssistant />

			<Toaster
				position='top-right'
				toastOptions={{
					style: {
						background: "#111827",
						color: "#fff",
						border: "1px solid #374151",
						borderRadius: "14px",
						fontSize: "13px",
					},
				}}
			/>
		</div>
	);
}

export default App;
