import menuItem from "../models/menuItem.model.js";
import Table from "../models/table.model.js";

export const createMenuItem = async (req, res) => {
    try {
        const { name, description, category, price, image } = req.body;

        if (!name || !category || price === undefined) {
            return res.status(400).json({
                status: false,
                message: "Name, category and price are required",
            });
        }

        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative",
            });
        }

        const newMenuItem = await menuItem.create({
            restaurant_id: req.restaurantId,
            name,
            description,
            category,
            price,
            image,
        });

        return res.status(201).json({
            success: true,
            data: newMenuItem,
            message: "Menu item created successfully",
        });
    } catch (error) {
        console.error("Create menu item error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const getMenuItems = async (req, res)=>{
    try {
        const menuItems = await menuItem.find({
            restaurant_id: req.restaurantId,
            is_Active: true,
        }).sort({ category: 1, name: 1 });

        return res.status(200).json({
            success: true,
            count: menuItems.length,
            menuItems,
        });
    }catch(error){
        console.error("Get menu items error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
}

export const updateMenuItem = async (req, res)=>{
    try{
        const { menuItemId } = req.params;
        const {
            name, 
            description,
            category,
            price, 
            image,
            isAvailable,
        } = req.body;

        const menuitem = await menuItem.findOne({
            _id: menuItemId,
            restaurant_id: req.restaurantId,
            is_Active: true,
        });

        if(!menuitem){
            return res.status(404).json({
                success: false,
                message: "Menu item not found",
            });
        }

        if(price !== undefined && price < 0){
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative",
            });
        }

        if(name !== undefined) menuitem.name = name;
        if(description !== undefined) menuitem.description = description;
        if(category !== undefined) menuitem.category = category;
        if(price !== undefined) menuitem.price = price;
        if(image !== undefined) menuitem.image = image;
        if(isAvailable !== undefined){
            menuitem.is_Available = isAvailable;
        }

        await menuitem.save();

        return res.status(200).json({
            success: true,
            message: "Menu item updated successfully",
            menuItem: menuitem,
        });
    }catch(error){
        console.error("Update menu item error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const deactivateMenuItem = async(req, res)=>{
    try{
        const { menuItemId } = req.params;

        const menuitem = await menuItem.findOne({
            _id: menuItemId,
            restaurant_id: req.restaurantId,
            is_Active: true,
        });

        if(!menuitem){
            return res.status(404).json({
                success: false,
                message: "Menu item not found",
            });
        }

        menuitem.is_Active = false,

        await menuitem.save();

        return res.status(200).json({
            success: true,
            message: "Menu item deactivated successfully",
        }); 
    }catch(error){
        console.error("Deactivate menu item error: ", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const getCustomerMenu = async(req, res)=>{
    try{
        const { qrToken } = req.params;

        const table = await Table.findOne({
            qrToken,
            is_Active: true,
        });

        if(!table){
            return res.status(404).json({
                success: false,
                message: "Invalid table QR",
            });
        }

        const menuItems = await menuItem.find({
            restaurant_id: table.restaurant_id,
            is_Active: true,
            is_Available: true,
        }).sort({ category: 1, name: 1 });

        return res.status(200).json({
            success: true,
            tableId: table._id,
            tableNumber: table.table_Number,
            menuItems,
        });
    }catch (error) {
        console.error("Get customer menu error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};