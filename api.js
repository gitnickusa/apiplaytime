const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require("fs");
const cors = require('cors');
const stripe = require('stripe')('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');
const multer = require('multer');
const Sequelize = require('sequelize');
const { Op } = require("sequelize");
const compression = require('compression');
const router = express.Router();
const  uuidv4 = require('uuid/v4');
const nodeMailer = require("nodemailer");
const Product = require('./Models/Product');
const ProductBooking = require('./Models/ProductBooking');
const Category = require('./Models/Category');

const options = {
  pool: {
    max: 10,
    min: 1,
    idle: 20000,
    acquire: 20000,
  },
};
const sequelize = new Sequelize('bounce_db', 'amit_events', 'Password@123', {
  host: 'a2nlmysql41plsk.secureserver.net',
  dialect:'mysql',
  options
});
sequelize.authenticate()
.then(data => console.log("database Connected"))
.catch(error => console.log("database Error", error));

function randomString (type) {
  return uuidv4().toString();
};
const Productt = Product(sequelize, Sequelize);
const Categories = Category(sequelize, Sequelize);
const ProductBook = ProductBooking(sequelize, Sequelize);

const app = express();
app.use(cors({origin: true}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

app.get('/', (req, res) => {
  res.status(200).json('success');
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only images.", false);
  }
};

const storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./Images/");
},
filename: function(req, file, callback) {
    callback(null, file.fieldname+"_"+Date.now()+"_"+file.originalname);
}
});

const upload= multer({ storage: storage, fileFilter: imageFilter }).single('file');
app.use('/Images', express.static('Images'));

router.post("/mailer", async(req, res) => {
  try {
    let transporter = nodeMailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
          user: 'bookings@playtimevents.online',
          pass: 'Anthony16$'
      }
  });
  let userMailOptions = {
      from: 'bookings@playtimevents.online',
      to: req.body.emailId,
      subject: req.body.subject,
      html: req.body.message
  };
  transporter.sendMail(userMailOptions, function (error, info) {
    console.log("error",error)
      if (!error) {
          res.status(200).json({
              message: 'Email Sent Successfully'
          });
      }
  });
  } catch(error) {
    console.log("errpr", error.message);
    return res.status(400).json(error.message);
  }
});
router.post("/product", upload, async(req, res) => {
    try {
      const img = fs.readFileSync("./Images/" + req.file.filename);     
      Productt.create({
        id: randomString(),
        productName: req.body.productName,
        shortDescription: req.body.shortDescription,
        productDetail: req.body.productDetail,
        count: req.body.count,
        size: req.body.size,
        category: req.body.category,
        price: req.body.price,
        image: img
      }).then((img) => {
        fs.writeFileSync("./Images/" + req.file.filename)
      }).catch(err => console.log("err",err))
      return res.status(200).json('Record saved successfully');
    } catch (error) {
      console.log(error);
      return res.send(`Error when trying upload images: ${error}`);
    }
});
router.post("/booking", async(req, res) => {
try {
  const data = req.body.item.map(x => {
    return {
      startDate:req.body.startDate,
      endDate: req.body.endDate,
      productId: x.productId,
      bookingCount: x.bookingCount
    }
  })
  const booking = await ProductBook.bulkCreate(data);
  return res.status(200).json(booking);
}
catch(error) {
  return res.status(400).json(error.message);
}
});
router.get("/booking", async(req, res) => {
  try {
    const start = req.query.startDate;
    const end = req.query.endDate;

    const data = await ProductBook.findAll({
      where: {
        [Op.or]: [
          {
            [Op.and] : [
              {
                startDate: {
                  [Op.lte]: start
                },
                endDate: {
                  [Op.gte]: start
                }
              }
            ]
          },{
            [Op.and] : [
              {
                startDate: {
                  [Op.lte]: end
                },
                endDate: {
                  [Op.gte]: end
                }
              }
            ]
          }
        ],
      }
    });
    return res.status(200).json(data);
  }
  catch(error) {
    return res.status(400).json(error.message);
  }
  });

router.put("/product/:id", upload,async(req, res) => {
  try { 
    console.log("id",req.params.id, req)
    const x = {
      productName: req.body.productName,
      shortDescription: req.body.shortDescription,
      productDetail: req.body.productDetail,
      size: req.body.size,
      count: req.body.count,
      category: req.body.category,
      price: req.body.price,
    }
    if(req.file) {
      img = fs.readFileSync("./Images/" + req.file.filename);     
      x.image = img;
    }
    Productt.update(x, {where: {id: req.params.id}}).then((img) => {
      console.log("x",img);
      if(req.file) {
        fs.writeFileSync("./Images/" + req.file.filename)
      }
    }).catch(err => console.log("err",err))
    return res.status(200).json('Record update successfully');
  } catch (error) {
    console.log(error.message);
    return res.send(`error: ${error}`);
  }
});
router.put("/category/:id",  upload, async(req, res) => {
  try {
    console.log("req.body",req.body);
    const x = {
      name: req.body.name,
      heading: req.body.heading,
      details: req.body.details,
      onHomePage: req.body.onHomePage,
    }
    let img;
    if(req.file) {
      img = fs.readFileSync("./Images/" + req.file.filename);     
      x.image = img;
    }
    console.log("x",x);
    Categories.update(x, {where: {id: req.params.id}}).then((img) => {
      console.log("x",img);
      if(req.file) {
        fs.writeFileSync("./Images/" + req.file.filename)
      }
    }).catch(err => console.log("err",err))
    return res.status(200).json('Record update successfully');
  } catch (error) {
    console.log(error.message);
    return res.send(`error: ${error}`);
  }
});
router.get("/products", async(req, res) => {
  try {    
    const products = await Productt.findAll({});
    return res.status(200).json(products);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});
router.get("/product/:id", async(req, res) => {
  try {    
    const product = await Productt.findOne({where: {id: req.params.id}});
    return res.status(200).json(product);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});
router.put("/count/:id", async(req, res) => {
  try {    
    const product = await Productt.findOne({where: {id: req.params.id}});
    if(!product) {
      return res.status(404).json("product Not Found");
    }

    await Productt.update({count: req.body.count}, {where: {id: req.params.id}});
    return res.status(200).json("Count updated successfully")
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});
router.delete("/product/:id", async(req, res) => {
  try {    
    const product = await Productt.findOne({where: {id: req.params.id}});
    if(!product) {
      return res.status(404).json("product Not Found");
    }

    await Productt.destroy({where: {id: req.params.id}});
    return res.status(200).json("Product details removed successfully")
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});
router.delete("/category/:id", async(req, res) => {
  try {    
    const product = await Categories.findOne({where: {id: req.params.id}});
    if(!product) {
      return res.status(404).json("Categories Not Found");
    }

    await Categories.destroy({where: {id: req.params.id}});
    return res.status(200).json("Categories details removed successfully")
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});
router.post("/createPayment", async (req, res) => {
  // Create a PaymentIntent with the order amount and currency
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd"
    });
  
    console.log(" paymentIntent.client_secret",  paymentIntent.client_secret);
  
    res.send({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});
router.get("/category", async (req, res) => {
  try {    
    const category = await Categories.findAll();
    return res.status(200).json(category);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
});
app.post('/category', upload, (req, res) => {
  try {
    const img = fs.readFileSync("./Images/" + req.file.filename);
    Categories.create({
      id: randomString(),
      name: req.body.name,
      details: req.body.details,
      heading: req.body.heading,
      onHomePage: req.body.onHomePage,
      image: img
    }).then((img) => {
      fs.writeFileSync("./Images/" + req.file.filename)
    }).catch(err => console.log("err",err))
    return res.status(200).json('Record saved successfully');
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
})

app.get('/', (req,res) => {
  return res.status(200).json({
      url:'Images\mukesh.jpg'
  })
})

app.use("/", router);

//Port
const port = process.env.PORT;
app.listen(port, ()=> console.log(`Listening at port ${port}....`));
module.exports = {app};
