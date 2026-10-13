import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
    {
        restaurant_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true
        },
        table_Number:{
            type: Number,
            required: true
        },
        qrToken:{
            type: String,
            required: true,
            unique: true,
        },
        status:{
            type: String,
            enum: ["Available", "Occupied"],
            default: "Available",
        },
        is_Active:{
            type: Boolean,
            default: true
        }
    },{
        timestamps: true
    }
)

const Table = new mongoose.model("Table", tableSchema);
export default Table;