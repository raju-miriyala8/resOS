import Order from "../models/Order.model.js";
import OrderItem from "../models/orderItem.model.js";
import TableSession from "../models/TableSession.model.js";
import Table from "../models/table.model.js";
import MenuItem from "../models/menuItem.model.js";

export const createOrder = async (req, res) => {
  try {
    const { qrToken, items } = req.body;

    if (!qrToken || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "QR token and items are required",
      });
    }

    const table = await Table.findOne({
      qrToken,
      is_Active: true,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Invalid table QR",
      });
    }

    const restaurantId = table.restaurant_id || table.restaurent_id;

    let session = await TableSession.findOne({
      tableId: table._id,
      status: "ACTIVE",
    });

    if (!session) {
      return res.status(400).json({
        success: false,
        message: "No active table session",
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findOne({
        _id: item.menuItemId,
        $or: [
          { restaurant_id: restaurantId },
          { restaurantId: restaurantId },
        ],
        is_Active: true,
        is_Available: true,
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found or unavailable",
        });
      }

      const subtotal = menuItem.price * item.quantity;

      totalAmount += subtotal;

      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal,
      });
    }

    const lastOrder = await Order.findOne({ restaurantId }).sort({ orderNumber: -1 });

    const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

    const order = await Order.create({
      restaurantId,
      tableId: table._id,
      sessionId: session._id,
      orderNumber,
      totalAmount,
    });

    const savedItems = await OrderItem.insertMany(
      orderItems.map((item) => ({
        ...item,
        orderId: order._id,
      }))
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
      items: savedItems,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      restaurantId: req.restaurantId,
      status: {
        $in: ["NEW", "ACCEPTED", "PREPARING", "READY"],
      },
    })
      .populate("tableId", "table_Number")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get kitchen orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const updateOrderStatus = async(req, res)=>{
  try{
    const {orderId} = req.params;
    const {status} = req.body;

    const allowedStatuses = [
      "ACCEPTED",
      "PREPARING",
      "READY",
      "SERVED",
      "CANCELLED",
    ];

    if(!allowedStatuses.includes(status)){
      return res.status(400).json({
        success: false,
        message: "Invalid order Status",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: req.restaurantId,
    });

    if(!order){
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status update successfully",
      order,
    });
  }catch(error){
    console.error("Update order status error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getCustomerOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("tableId", "table_Number");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get customer order error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


export const getSessionBill = async(req, res)=>{
  try{
    const { sessionId } = req.params;

    const orders = await Order.find({
      sessionId,
      restaurantId: req.restaurantId,
      status: { $ne: "CANCELLED"},
    });

    if(!orders.length){
      return res.status(404).json({
        success: false,
        message: "No orders found for this session",
      });
    }

    const totalAmount = orders.reduce(
      (total, order) => total + order.totalAmount,
      0
    );
    return res.status(200).json({
      success: true,
      sessionId,
      orders,
      totalAmount,
    });
  } catch (error) {
    console.error("Get session bill error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};