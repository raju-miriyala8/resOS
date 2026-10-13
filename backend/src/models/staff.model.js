import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    restaurantId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ["MANAGER", "KITCHEN"],
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
}
)

const Staff = new mongoose.model("Staff", staffSchema);
export default Staff;