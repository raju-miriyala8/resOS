import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import Restaurant from "../models/restaurant.model.js";

export const registerRestaurant = async (req, res) => {
  try {
    console.log("register started processing")
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Restaurant name, email and password are required",
      });
    }

    const existingRestaurant = await Restaurant.findOne({ email });

    if (existingRestaurant) {
      return res.status(409).json({
        success: false,
        message: "Restaurant with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const restaurant = await Restaurant.create({
      name: name,
      email: email,
      password: passwordHash,
    });

    res.status(201).json({
      success: true,
      message: "Restaurant registered successfully",
      restaurantId: restaurant._id,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const create_owner_password = async(req, res)=>{
    try{
        const {restaurent_id, owner_password} = req.body;

        if(!restaurent_id || !owner_password){
            return res.status(400).json({
                status: false,
                message: "owner Password is needed"
            });
        }

        if(owner_password.length < 6){
            return res.status(400).json({
                status: false,
                message: "owner password must be atleast 6 characters"
            });
        }

        const restaurant = await Restaurant.findById(restaurent_id);

        if(!restaurant){
            return res.status(404).json({
                status: false,
                message: "restaurant not found"
            });
        }

        if(restaurant.owner_password){
            return res.status(409).json({
                status: false,
                message: "restaurant owner password already exits"
            });
        }

        const hashed_res_owner_pass = await bcrypt.hash(owner_password, 12);

        restaurant.owner_password = hashed_res_owner_pass;

        await restaurant.save();

        return res.status(200).json({
            success: true,
            message: "owner password created successfully"
        });
    }catch(error){
        console.error("Create owner password error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const loginRestaurant = async(req, res) =>{
  try{
    const {email, password} = req.body;

    if(!email || !password){
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const restaurant = await Restaurant.findOne({email});

    if(!restaurant){
      return res.status(401).json({
        success: false,
        message: "Restaurent not Found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      restaurant.password,
    )

    if(!isPasswordCorrect){
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        restaurantId: restaurant._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    )

    return res.status(200).json({
      success: true,
      message: "Restaurant login successfull",
      restaurentId: restaurant._id,
      token,
    });
  }catch(error){
    console.error("restaurant login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}

export const verifyRole = async(req, res)=>{
  try{
    const {role, password} = req.body;

    if(!role || !password){
      return res.status(400).json({
        success: false,
        message: "Role and password are required",
      });
    }

    const restaurant = await Restaurant.findById(req.restaurantId);

    if(!restaurant){
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    let rolePassword;

    if(role === "OWNER") {
      rolePassword = restaurant.owner_password;
    }else if(role === "MANAGER"){
      rolePassword = restaurant.managerPassword;
    }else if(role === "KITCHEN"){
      rolePassword = restaurant.kitchenPassword;
    }else{
      return res.status(400).json({
        success: false,
        message: "Invalid Role",
      });
    }

    if(!rolePassword){
      return res.status(400).json({
        success: false,
        message: `${role} password has not been created`,
      });
    }

    const isPasswordCorrect = await bcrypt.compare( password, rolePassword );

    if(!isPasswordCorrect){
      return res.status(401).json({
        success: false,
        message: "Invalid role Password",
      });
    }

    const roleToken = jwt.sign(
      {
        restaurantId: req.restaurantId,
        role: role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    )

    return res.status(200).json({
      success: true,
      message: `${role} authentication successful`,
      role,
      restaurantId: req.restaurantId,
      token: roleToken,
    });
  }catch(error){
    console.error("Verify role error: ", error);

    return res.status(500).json({
      success: false,
      message: "Somethig wen wrong",
    });
  }
};

export const createManagerPassword = async(req, res) => {
  try{
    const { managerPassword } = req.body;

    if(!managerPassword){
      return res.status(400).json({
        success: false,
        message: "manager password required",
      });
    }

    if(managerPassword.length < 6){
      return res.status(400).json({
        success: false,
        message: "manager password should be at least 6 characters",
      });
    }

    const restaurant = await Restaurant.findById(req.restaurantId);

    if(!restaurant){
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if(restaurant.managerPassword){
      return res.status(409).json({
        success: false,
        message: "Manager password already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(managerPassword, 12);
    restaurant.managerPassword = hashedPassword;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Manager password created successfully",
    });
  }catch(error){
    console.log("Create manager password error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};