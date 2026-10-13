
import Staff from "../models/staff.model.js";
import Table from "../models/table.model.js";
import MenuItem from "../models/menuItem.model.js";
import Order from "../models/Order.model.js";

export const getManagerDashboard = async (req, res) => {
  return getOwnerDashboard(req, res);
};

export const getOwnerDashboard = async (req, res) => {
  try {
    const restaurantId = req.restaurantId;

    const [
      totalStaff,
      activeStaff,
      totalTables,
      occupiedTables,
      totalMenuItems,
      todayOrders,
      orderStatuses,
    ] = await Promise.all([
      Staff.countDocuments({ restaurantId }),
      Staff.countDocuments({ restaurantId, isActive: true }),

      Table.countDocuments({
        restaurant_id: restaurantId,
        is_Active: true,
      }),
      Table.countDocuments({
        restaurant_id: restaurantId,
        is_Active: true,
        status: "Occupied",
      }),

      MenuItem.countDocuments({
        restaurant_id: restaurantId,
        is_Active: true,
      }),

      Order.countDocuments({
        restaurantId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),

      Order.aggregate([
        { $match: { restaurantId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        totalStaff,
        activeStaff,
        totalTables,
        occupiedTables,
        availableTables: totalTables - occupiedTables,
        totalMenuItems,
        todayOrders,
        orderStatuses,
      },
    });
  } catch (error) {
    console.error("Owner dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
