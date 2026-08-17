import mongoose from "mongoose";
import Product from "../models/product.model.js";

const MAX_QUANTITY_PER_ITEM = 99;

// Cart items historically stored the product id in the subdoc `_id` (bare push).
// New items store it in the `product` field. This helper handles both formats
// so pre-existing carts keep working after the schema contract change.
const cartItemProductId = (item) => String(item.product || item._id);

const findCartItem = (user, productId) =>
	user.cartItems.find((item) => cartItemProductId(item) === productId);

export const getCartProducts = async (req, res) => {
	try {
		const cartItems = req.user.cartItems || [];
		const productIds = cartItems.map(cartItemProductId);

		const products = await Product.find({ _id: { $in: productIds } });

		const cartItemsWithDetails = products.map((product) => {
			const item = findCartItem(req.user, String(product._id));
			const quantity = Math.min(Number(item?.quantity) || 1, product.stock);
			return { ...product.toJSON(), quantity, availableStock: product.stock };
		});

		res.json(cartItemsWithDetails);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId } = req.body;

		if (!mongoose.isValidObjectId(productId)) {
			return res.status(400).json({ message: "Invalid product id" });
		}

		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		if (product.stock <= 0) {
			return res.status(400).json({ message: `"${product.name}" is out of stock` });
		}

		const user = req.user;
		const existingItem = findCartItem(user, productId);

		if (existingItem) {
			if (existingItem.quantity >= product.stock || existingItem.quantity >= MAX_QUANTITY_PER_ITEM) {
				return res.status(400).json({ message: `Maximum quantity reached for "${product.name}"` });
			}
			existingItem.quantity += 1;
			existingItem.product = productId; // normalize legacy entries
		} else {
			user.cartItems.push({ quantity: 1, product: productId });
		}

		await user.save();
		res.status(200).json(user.cartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;

		if (!productId) {
			user.cartItems = [];
		} else {
			if (!mongoose.isValidObjectId(productId)) {
				return res.status(400).json({ message: "Invalid product id" });
			}
			user.cartItems = user.cartItems.filter((item) => cartItemProductId(item) !== productId);
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;

		if (!mongoose.isValidObjectId(productId)) {
			return res.status(400).json({ message: "Invalid product id" });
		}

		const parsedQuantity = Number(quantity);
		if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
			return res.status(400).json({ message: "Quantity must be a non-negative integer" });
		}

		const user = req.user;
		const existingItem = findCartItem(user, productId);

		if (!existingItem) {
			return res.status(404).json({ message: "Product not in cart" });
		}

		if (parsedQuantity === 0) {
			user.cartItems = user.cartItems.filter((item) => cartItemProductId(item) !== productId);
			await user.save();
			return res.json(user.cartItems);
		}

		const product = await Product.findById(productId);
		const maxAllowed = Math.min(product?.stock ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM);
		existingItem.quantity = Math.min(parsedQuantity, maxAllowed);
		existingItem.product = productId; // normalize legacy entries

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};