import express from "express"
import cors from "cors"
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import menuRoutes from "./routes/menuRoutes.js"
import tableSessionRoutes from "./routes/tableSessionRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());


app.get("/api/health", (req, res)=>{
    return res.json({
        success: true,
        message: "resOS is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/table-sessions", tableSessionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/staff", staffRoutes);

const PORT=process.env.PORT || 5000;

connectDb().then(() => {
    app.listen(PORT, ()=>{
        console.log(`Server is Running on ${PORT}`);
    });
});
