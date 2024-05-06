const express = require('express')
const app = express()
const port = 3001;
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json();
const mongoose = require('mongoose');
const { Schema } = mongoose;
const jwt = require('jsonwebtoken');
const cors = require('cors');


const privateKey = 'gendwkjcnwiledbewdkewdhwewcwec'


app.use(cors())
mongoose.connect('mongodb+srv://admin:V5vZIzuMexZUO7Pr@cluster0.u1c7jsr.mongodb.net/ecom')
  .then(() => console.log('DB Connected!'))

  .catch((e) => {
    console.log("Datbase Not connected")
  })


const userSchema = new Schema({
  firstName: String,
  lastName: String,
  contact: String,
  email: String,
  password: String,
  confirmPassword: String,


});

const productSchema = new Schema({
  productId: String,
  productName: String,
  productRate: Number,
  productQnty: Number,
  productCategory: String,

})

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('product', productSchema);



//app.use(jsonParser)

app.get('/', function (req, res) {
  res.send('Hello World')
})
app.post('/register', jsonParser, (req, res) => {




  const { firstName, lastName, contact, email, password, confirmPassword } = req.body;
  const createNewUser = new User({
    firstName: firstName,
    lastName: lastName,
    contact: contact,
    email: email,
    password: password,
    confirmPassword: confirmPassword,

  })
  createNewUser.save().then((result) => {
    res.status(201).json({ msg: 'New user created Successfully!', result });
  })


})

function generateToken(payload) {
  const token = jwt.sign(payload, privateKey);
  return token
}
app.post('/login', jsonParser, (req, res) => {


  console.log(req.body)
  const { email, password } = req.body;
  User.findOne({ email: email }).then((result) => {



    if (result != null) {

      if (result.password === password) {
        res.status(200).send({ msg: 'Login Successfull', status: 'success', result, token: generateToken({ email: email, password: password }) })
      }
      else {
        res.status(500).send({ msg: 'plese enter valid E-mail & password', result })
      }

    } else {
      res.status(500).send({ msg: 'Please enter valid E-mail', result })
    }


  })


})

const verifyToken = (req, res, next) => {



  const token = req.headers.authorization;

  jwt.verify(token, privateKey, function (err, decoded) {
    console.log(decoded)

    if (err) {

      res.status(401).send({ msg: "Unauthorized access" })
    } else {
      next();
    }

  });

}

app.post("/product", verifyToken, jsonParser, (req, res) => {




  const { productId,
    productName,
    productRate,
    productQnty, productCategory } = req.body;
  const createNewProduct = new Product({
    productId: productId,
    productName: productName,
    productRate: productRate,
    productQnty: productQnty,
    productCategory: productCategory,

  })
  createNewProduct.save().then((result) => {
    res.status(201).json({ msg: 'New Product added successfully', result });

  }).catch((e) => {
    res.status(500).json({ msg: "Internal Server Error" });
  })

})

app.put("/product", verifyToken, jsonParser, (req, res) => {
  console.log(req.body)

  const { productId, productName, productQnty, productRate, productCategory, _id } = req.body;

  Product.findByIdAndUpdate({ _id: _id }, {
    $set: {
      productId: productId,
      productName: productName,
      productRate: productRate,
      productQnty: productQnty,
      productCategory: productCategory,

    }
  }).then((result) => {
    res.status(201).json({ "msg": "Updated Successfully!" })
  })

})

app.get("/product", verifyToken, (req, res) => {


  Product.find().then((result) => {
    res.status(200).json(result)
  })
})

app.delete("/product/:id",(req,res)=>{

  console.log(req.params.id)
  Product.findOneAndDelete({_id:req.params.id}).then((result)=>{
    res.status(200).json({msg:"Item Deleted Successfully",result})
  })
 

})

const json2xls = require('json2xls');
const fs = require('fs');
app.use(express.json())

app.get("/download",async(req,res)=>{

try{


const data = await Product.find({})
const jsonData = data.map((item,index)=>{
  return {
    Id:item.productId,
    Name:item.productName,
    Rate:item.productRate,
    Qnty:item.productQnty,
    Category:item.productCategory,

  }
})
if(jsonData){
  if(!jsonData || !Array.isArray(jsonData)){

    return res.status(400).json({msg:'Invalid Json Data'})
  }
 
 const xls = json2xls(jsonData);
 const fileName = 'data.xlsx';
 const filepath = `${__dirname}/${fileName}`;
 fs.writeFileSync(filepath, xls,'binary');
 res.setHeader('Content-Type','application/vnd.openxmlformat');
 res.setHeader('Content-Disposition','attachment; fileName='+fileName);
 res.sendFile(filepath,(err)=>{
   if(err){
     
     res.status(500),json({msg:'Internal Server Error'})
   }
     else{
       fs.unlinkSync(filepath)
     }
   })
 
 }else{
  res.status(400).json({msg:'Records Not Found'})
 }


}
 


catch(err){
  res.status(500).json({msg:"Intenal Server Error"})
}



})

app.listen(port, () => {
  console.log("server running on port:", port)
})
