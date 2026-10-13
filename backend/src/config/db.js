import mongoose from "mongoose"

const connectDb = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("mongoDb connected Successfully");
    }catch(error){
        console.log(`mongoDb connection Error ${error.message}`);
        process.exit(1);
    }
}

export default connectDb;