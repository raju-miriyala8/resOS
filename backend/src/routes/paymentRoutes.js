import express from "express"
import { createPayment } from "../controllers/paymentController.js"
import { authMiddleware } from "../midlewares/authMiddleware.js"
import { roleMiddleware } from "../midlewares/roleMiddleware.js"

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("OWNER", "MANAGER"), createPayment);

export default router;