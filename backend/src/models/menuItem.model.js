import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
    {
        restaurant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        image: {
            type: String,
            default: null,
        },
        is_Available: {
            type: Boolean,
            default: true,
        },
        is_Active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const menuItem = mongoose.model("MenuItem", menuItemSchema);
export default menuItem;