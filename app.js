const express = require("express");
const app = express();
require("dotenv").config();
const port = 7007;
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());


app.get("/", function (req, res) {
    res.send("node is running... Port "+port)
})


function stripeAuth(req, res, next) {
  const bearerHeader = req.headers['authorization'];

  if (bearerHeader) {
    req.stripe = require("stripe")(bearerHeader);
    next();
  } else {
    // Forbidden
    res.status(403).json({
      success: false,
      msg: "Authorization required!"
    });
  }
}

app.post("/stripe/create-customer", stripeAuth, cors(), async (req, res) => {
  const stripe = req.stripe;
  var name = req.body.name;
  var address = req.body.address;
  var email = req.body.email;
  try {
    var customer = await stripe.customers.create({
      name: name,
      email: email,
      address: address
    });

    res.json({
      success: true,
      message: "Customer created successfully",
      CustomerID: customer.id
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.raw.message,
      code: error.raw.code
    });
  }
});




app.post("/stripe/create-card", stripeAuth, cors(), async (req, res) => {
  const stripe = req.stripe;

  var cardNumber = req.body.cardNumber;
  var expMonth = req.body.expMonth;
  var expYear = req.body.expYear;
  var cvc = req.body.cvc;
  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc,
      },
    });

    res.json({
      success: true,
      message: "Card created successfully",
      CardID: paymentMethod.id
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.raw.message,
      code: error.raw.code
    });
  }
});




app.post("/stripe/card-payment", stripeAuth, cors(), async (req, res) => {
  const stripe = req.stripe;

  var cardNumber = req.body.cardNumber;
  var expMonth = req.body.expMonth;
  var expYear = req.body.expYear;
  var cvc = req.body.cvc;

  var customerId = req.body.customerId;
  var amount = req.body.amount;
  var currency = req.body.currency;
  var description = req.body.description;



  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cvc,
      },
    });
    console.log(customerId)
    const payment = await stripe.paymentIntents.create({
      customer: customerId,
      amount: amount,
      currency: currency,
      description: description,
      payment_method: paymentMethod.id,
      confirm: true,
    });

    res.json({
      success: true,
      message: "Payment Successful",
      paymentId: payment.id,
      receipt_url: payment.charges.data[0].receipt_url,
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.raw.message,
      code: error.raw.code
    });
  }
});




app.post("/stripe/card-id-payment", stripeAuth, cors(), async (req, res) => {
  const stripe = req.stripe;

  var cardId = req.body.cardId;
  var customerId = req.body.customerId;

  var amount = req.body.amount;
  var currency = req.body.currency;
  var description = req.body.description;



  try {
    const payment = await stripe.paymentIntents.create({
      customer: customerId,
      amount: amount,
      currency: currency,
      description: description,
      payment_method: cardId,
      confirm: true,
    });

    res.json({
      success: true,
      message: "Payment Successful",
      paymentId: payment.id,
      receipt_url: payment.charges.data[0].receipt_url,
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.raw.message,
      code: error.raw.code
    });
  }
});




app.post("/stripe/capture-payment", stripeAuth, cors(), async (req, res) => {
  const stripe = req.stripe;

  var cardId = req.body.cardId;
  var customerId = req.body.customerId;

  var amount = req.body.amount;
  var currency = req.body.currency;
  var description = req.body.description;



  try {

    const paymentIntent = await stripe.paymentIntents.create({
      customer: customerId,
      amount: amount,
      currency: currency,
      description: description,
      payment_method_types: ['card'],
      capture_method: 'manual'
    });
   
    const paymentIntentConfirm = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      { payment_method: cardId }
    );

    res.json({
      success: true,
      message: "Payment successfully authorized",
      paymentId: paymentIntentConfirm.id,
      receipt_url: paymentIntentConfirm.charges.data[0].receipt_url,
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.raw.message,
      code: error.raw.code
    });
  }
});




app.post("/stripe/cancel-payment", stripeAuth, cors(), async (req, res) => {
  const stripe = req.stripe;

  var paymentId = req.body.paymentId;


  try {
    const paymentIntent = await stripe.paymentIntents.cancel(
      paymentId
    );
    res.json({
      success: true,
      message: "Payment successfully canceled",
      paymentId: paymentIntent.id,
      receipt_url: paymentIntent.charges.data[0].receipt_url,
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.raw.message,
      code: error.raw.code
    });
  }
});




app.post("/stripe/confirm-capture-payment", stripeAuth, cors(), async (req, res) => {
  const stripe = req.stripe;

  var paymentId = req.body.paymentId;


  try {
    const paymentIntent = await stripe.paymentIntents.capture(
      paymentId
    );
    res.json({
      success: true,
      message: "Payment Successful",
      paymentId: paymentIntent.id,
      receipt_url: paymentIntent.charges.data[0].receipt_url,
    });

  } catch (error) {
    res.json({
      success: false,
      message: error.raw.message,
      code: error.raw.code
    });
  }
});







app.listen(port, () => {
  console.log("Server started..."+port);
});




