import jwt from "jsonwebtoken"

export const authMiddleware = (req, res, next)=>{
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader){
            return res.status(401).json({
                success: "false",
                message: "you are not authourized to this..!"
            });
        }

        const token = authHeader.split(" ")[1];

        if(!token){
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format",
            });
        }

        const decode = jwt.verify(
            token, 
            process.env.JWT_SECRET
        );

        req.restaurantId = decode.restaurantId;
        req.role = decode.role;

        next();
    }catch(error){
        return res.status(401).json({
            success: false,
            message: "Invalid or token expired",
        });
    }
}