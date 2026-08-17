import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";

const SearchResultsPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [query, setQuery] = useState(searchParams.get("q") || "");
	const { searchProducts, products, loading } = useProductStore();
	const activeQuery = searchParams.get("q") || "";

	useEffect(() => {
		if (activeQuery) {
			searchProducts(activeQuery);
		}
	}, [activeQuery, searchProducts]);

	const handleSearch = (e) => {
		e.preventDefault();
		if (query.trim()) {
			setSearchParams({ q: query.trim() });
		}
	};

	return (
		<div className='min-h-screen'>
			<div className='relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<motion.h1
					className='text-center text-4xl sm:text-5xl font-bold text-emerald-400 mb-8'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					Search Products
				</motion.h1>

				<form onSubmit={handleSearch} className='max-w-xl mx-auto mb-10'>
					<div className='flex gap-2'>
						<input
							type='text'
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder='Search for products...'
							className='flex-1 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none'
						/>
						<button
							type='submit'
							className='flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700'
						>
							<Search size={18} />
							Search
						</button>
					</div>
				</form>

				{loading && <LoadingSpinner />}

				{!loading && activeQuery && products.length === 0 && (
					<h2 className='text-3xl font-semibold text-gray-300 text-center'>
						No products found for &quot;{activeQuery}&quot;
					</h2>
				)}

				{!loading && products.length > 0 && (
					<>
						<p className='text-gray-400 text-center mb-6'>
							{products.length} result(s) for &quot;{activeQuery}&quot;
						</p>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center'>
							{products.map((product) => (
								<ProductCard key={product._id} product={product} />
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default SearchResultsPage;