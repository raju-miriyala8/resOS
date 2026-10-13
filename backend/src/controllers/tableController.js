import Table from "../models/table.model.js";
import crypto from "crypto";

export const createTable = async(req, res)=>{
    try{
        const {table_Number} = req.body;

        if(!table_Number){
            return res.status(400).json({
                success: false,
                message: "Table Number is required",
            });
        }

        console.log("Restaurant ID:", req.restaurantId);
        console.log("Table Number:", table_Number);
        const is_table_exist = await Table.findOne({
            restaurant_id: req.restaurantId,
            table_Number: table_Number,
        });

        console.log("Existing table:", is_table_exist);

        if(is_table_exist){
            return res.status(409).json({
                success: false,
                message: "Table number already exists",
            });
        }

        const qrToken = crypto.randomBytes(16).toString("hex");

        const table = await Table.create({
            restaurant_id: req.restaurantId,
            table_Number,
            qrToken,
        });

        return res.status(201).json({
            success: true,
            message: "Table created successfully",
            table,
        });
    } catch(error){
        console.error("Create table error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const getTables = async(req, res)=>{
    try{
        const tables = await Table.find({
            restaurant_id: req.restaurantId,
            is_Active: true,
        }).sort({ table_Number: 1});

        return res.status(200).json({
            success: true,
            count: tables.length,
            tables,
        });
    }catch(error){
        console.error("Get tables error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const updateTable = async(req, res)=>{
    try{
        const {tableId} = req.params;
        const {table_Number, status, is_Active} = req.body;

        const table = await Table.findOne({
            _id: tableId,
            restaurant_id: req.restaurantId,
        });

        if(!table){
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        if(table_Number!==undefined){
            table.table_Number = table_Number;
        }

        if(status !== undefined){
            table.status = status;
        }

        if(is_Active!==undefined){
            table.is_Active = is_Active;
        }

        await table.save();

        return res.status(200).json({
            success: true,
            message: "Table updates successfully",
            table,
        });
    }catch(error){
        console.error("Update table error:", error);

        return res.status(500).json({
            success: false,
            message: "something went wrong",
        });
    }
}

export const deactivateTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    const table = await Table.findOne({
      _id: tableId,
      restaurant_id: req.restaurantId,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    table.is_Active = false;

    await table.save();

    return res.status(200).json({
      success: true,
      message: "Table deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate table error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};