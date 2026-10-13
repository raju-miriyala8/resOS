import bcrypt from "bcryptjs";
import Payment from "../models/payment.model.js";
import TableSession from "../models/TableSession.model.js";
import Restaurant from "../models/restaurant.model.js";

export const createPayment = async(req, res)=>{
    try{
        const { sessionId, amount, method } = req.body;

        if(!sessionId || amount === undefined || !method){
            return res.status(400).json({
                success: false,
                message: "Session ID, amount and payment method are required",
            });
        }

        if(!["CASH", "ONLINE"].includes(method)){
            return res.status(400).json({
                success: false,
                message: "Invalid payment method",
            });
        }

        const session = await TableSession.findOne({
            _id: sessionId,
            restaurantId: req.restaurantId,
        });

        if(!session){
            return res.status(404).json({
                success: false,
                message: "Table session not found",
            });
        }

        if(session.status === "COMPLETED"){
            return res.status(400).json({
                success: false,
                message: "Table session is already completed",
            });
        }

        const payment = await Payment.create({
            restaurantId: req.restaurantId,
            sessionId,
            amount,
            method,
            status: method === "CASH" ? "SUCCESS" : "PENDING",
        });

        return res.status(201).json({
            success: true,
            message: "Payment created successfully",
            payment,
        });
    } catch(error){
        console.error("Create payment error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};


export const createKitchenPassword = async(req, res) => {
    try{
        const { kitchenPassword } = req.body;

        if(!kitchenPassword){
            return res.status(400).json({
                success: false,
                message: "Kitchen password is required",
            });
        }

        if (kitchenPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Kitchen password must be at least 6 characters",
            });
        }

        const restaurant = await Restaurant.findById(req.restaurantId);

        if(!restaurant){
            return res.status(404).json({
                success: false,
                message: "Restaurant not found",
            });
        }

        if(restaurant.kitchenPassword){
            return res.status(409).json({
                success: false,
                message: "Kitchen password already exits",
            });
        }

        const hashedPassword = await bcrypt.hash(kitchenPassword, 12);

        restaurant.kitchenPassword = hashedPassword;

        await restaurant.save();

        return res.status(200).json({
            success: true,
            message: "Kitchen password created successfully",
        });
    } catch(error){
        console.error("Create kitchen password error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};