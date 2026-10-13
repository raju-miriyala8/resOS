import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
    },
    password:{
        type: String,
        required: true,
    },
    owner_password: {
        type: String,
        default: null,
    },
    managerPassword: {
        type: String,
        default: null,
    },
    kitchenPassword: {
        type: String,
        default: null,
    },
    isActive:{
        type: Boolean,
        default: true,
    },
},{
    timestamps: true,
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
