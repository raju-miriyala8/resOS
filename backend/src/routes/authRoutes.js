import express from "express";
import { registerRestaurant, create_owner_password, loginRestaurant, verifyRole, createManagerPassword } from "../controllers/authController.js";
import { createKitchenPassword } from "../controllers/paymentController.js";
import { authMiddleware } from "../midlewares/authMiddleware.js";
import { roleMiddleware } from "../midlewares/roleMiddleware.js";

const router = express.Router();

router.post('/register', registerRestaurant);
router.post("/create-owner-pass", create_owner_password);
router.post("/login", loginRestaurant);
router.post("/verify-role", authMiddleware, verifyRole);

router.get("/protected", authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "You accessed a protected route",
    restaurantId: req.restaurantId,
  });
});

router.get(
  "/owner-manager",
  authMiddleware,
  roleMiddleware("OWNER", "MANAGER"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Owner/Manager route accessed",
      restaurantId: req.restaurantId,
      role: req.role,
    });
  }
);

router.post("/create-manager-password", authMiddleware, roleMiddleware("OWNER"), createManagerPassword);
router.post("/create-kitchen-password", authMiddleware, roleMiddleware("OWNER"), createKitchenPassword);

export default router;