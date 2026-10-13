export const roleMiddleware = (...allowedRoles)=>{
    return (req, res, next)=>{
        if(!req.role){
            return res.status(403).json({
                success: false,
                message: "Role not found",
            });
        }

        if(!allowedRoles.includes(req.role)){
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource",
            })
        }

        next();
    }
}