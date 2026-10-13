import crypto from "crypto";
import Table from "../models/table.model.js";
import TableSession from "../models/TableSession.model.js";
import menuItem from "../models/menuItem.model.js";

export const createTableSession = async(req, res)=>{
    try{
        const { qrToken } = req.body;

        if(!qrToken){
            return res.status(400).json({
                success: false,
                message: "QR token is required",
            });
        }

        const table = await Table.findOne({
            qrToken,
            is_Active: true,
        });

        if(!table){
            return res.status(404).json({
                success: false,
                message: "Invalid or inactive table QR",
            });
        }

        const existingSession = await TableSession.findOne({
            tableId: table._id,
            status: "ACTIVE",
        });

        if(existingSession){
            return res.status(200).json({
                success: true,
                message: "Active table session already exists",
                session: existingSession,
            });
        }

        const sessionToken = crypto.randomBytes(24).toString("hex");

        const session = await TableSession.create({
            restaurantId: table.restaurant_id,
            tableId: table._id,
            sessionToken,
            status: "ACTIVE",
        })

        table.status = "Occupied";
        await table.save();

        return res.status(201).json({
            success: true,
            message: "Table session created successfully",
            session,
        });
    }catch(error){
        console.error("Create table session error: ", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const completeTableSession = async(req, res)=>{
    try{
        const { sessionId } = req.params;

        const session = await TableSession.findOne({
            _id: sessionId,
            restaurantId: req.restaurantId,
            status: "ACTIVE",
        });

        if(!session){
            return res.status(404).json({
                success: false,
                message: "Active table session not found",
            });
        }

        session.status = "COMPLETED";
        session.closedAt = new Date();

        await session.save();

        await Table.findByIdAndUpdate(
            session.tableId,
            {
                status: "Available",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Table session completed successfully",
        });
    }catch(error){
        console.error("Complete table session error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};