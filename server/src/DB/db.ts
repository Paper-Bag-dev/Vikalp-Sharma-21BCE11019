import mongoose from "mongoose";
mongoose.set('strictQuery', false);

const connectDb = async (uri:string) => {
  return mongoose.connect(uri, {dbName : "HeroGame"
  }).then(() => {
    console.log('Connected to Database Successfully');
  }).catch((error) => {
    console.log(error);
  })
}

export default connectDb;