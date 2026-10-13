import Staff from "../models/staff.model.js";

export const createStaff = async (req, res) => {
  try {
    const { name, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: "Name and role are required",
      });
    }

    if (!["MANAGER", "KITCHEN"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff role",
      });
    }

    const staff = await Staff.create({
      restaurantId: req.restaurantId,
      name,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff,
    });
  } catch (error) {
    console.error("Create staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getStaff = async (req, res) => {
  try{
    const staff = await Staff.find({
      restaurantId: req.restaurantId,
      isActive: true,
    }).sort({createdAt: -1});

    return res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch(error){
    console.error("Get staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const deactivateStaff = async(req, res)=>{
  try{

    const { staffId } = req.params;

    const staff = await Staff.findOne({
      _id: staffId,
      restaurantId: req.restaurantId,
      isActive: true,
    });

    if(!staff){
      return res.status(400).json({
        success: false,
        message: "Staff member not found",
      });
    }

    staff.isActive = false;
    await staff.save();

    return res.status(200).json({
      success: true,
      message: "Staff deactivated successfully",
    });
  } catch(error){
    console.error("Deactivate staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};