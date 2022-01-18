'use strict';
require('dotenv').config();
require('./../global_constants').CONFIG;
const stripe = require('stripe')(process.env.STRIPE);

const CreatePayment = async (chargeAmt, currency, customer, paymentMethod, isSavedMethod) => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount:chargeAmt,
        currency: currency,
        payment_method: paymentMethod,
        payment_method_types: ['card'],
        save_payment_method: isSavedMethod,
        customer: customer
    }).catch( err =>{
      return {statusCode: err.statusCode, message: err.message};
    });
    if(!paymentIntent.id){
      return paymentIntent;
    }else{
      return paymentIntent.client_secret;
    }
};

const CreatePayment1 = async (chargeAmt, currency, customer, paymentMethod, isSavedMethod) => {
  const paymentIntent = await stripe.paymentIntents.create({
      amount:chargeAmt,
      currency: currency,
      payment_method: paymentMethod,
      payment_method_types: ['card'],
      save_payment_method: isSavedMethod,
      setup_future_usage: 'off_session',
      customer: customer
  }).catch( err =>{
    return {statusCode: err.statusCode, message: err.message};
  });
  if(!paymentIntent.id){
    return paymentIntent;
  }else{
    const addCard = await addCard(customer, {'number':paymentMethod.number , 'exp_month': paymentMethod.exp_month, 'exp_year':paymentMethod.exp_year ,'cvc': paymentMethod.cvc})
    return paymentIntent.id;
  }
};

const GetephemeralKey = async (api_version, customer) => {
let key = await stripe.ephemeralKeys.create(
        {customer: customer},
        {stripe_version: api_version}
  );
  console.log("KEy-----",key);
  return key;
};

const GetCustomerID = async (body) => {
    const customer = await stripe.customers.create(body);
       return customer.id;
};

const PaymentConfirm = async (paymentId, payment_method)=> {
    console.log("Stripe -- PaymentConfirm", paymentId);
    return stripe.paymentIntents.retrieve(
        paymentId);
}

const GetCardList = async (customerId)=> {
    console.log("Stripe -- CardList", customerId);
    return stripe.customers.listSources(
        customerId, {limit: 10});
}
const DeleteCard = async (customerId, data)=> {
    console.log("Stripe -- Card Delete", customerId, data.cardId);
    return stripe.customers.deleteSource(
        customerId, data.cardId);
}

async function createAccount(req){
  var err, detail;
  [err, detail] =  await to(stripe.accounts.create(
      {
        type: 'custom',
        country: 'US', //req.countryCode,
        email: req.email,
        requested_capabilities: [
          'card_payments',
          'transfers',
        ],
      },
      ));
      if(err){
        return {status: false, data:err};
      }
      return {status: true, id: detail.id};
}

//link acount id verification process url return
async function createAccountLink(req) {
  var err, detail;
  [err, detail] =  await to(stripe.accountLinks.create({
     account: req.accountId,
     success_url: 'https://test.365live.com/api/successAccount?id='+req.uniqueCode,
     failure_url: 'https://test.365live.com/api/failedAccount',
     type: 'custom_account_verification',
     collect: 'eventually_due',
   }));
   if(err){
     return {status: false, data:err};
   }
   return {status: true, data:detail};
}

//create bank id using account id
async function createBank(detail) {
  var err, addBank;
  //console.log('aa'detail)
  [err, addBank] = await to(stripe.accounts.createExternalAccount(
                        detail.accountId,
                  {external_account: {
                      object: "bank_account",
                      country: detail.countryCode,
                      currency: detail.currency,
                      routing_number: detail.routing_number,
                      account_number: detail.account_number
                  }
                }));
  if(err){
    return {status: false , data: err};
  }
  return {status: true , data: addBank};
};


//Transfer
const transferCreate = async (detail) => {
  var err, detail;
  [err, detail] = await to(stripe.transfers.create(
    {
      amount: detail.amount,
      currency: detail.currency,
      destination: detail.stripe_account_id,
    }));
    if(err){
      return {status: false , data: err};
    }
    return {status: true , data: {}};
};

//Payout
const payoutsCreate = async (detail) => {
  var err, detail;
    [err, detail] = await to(stripe.payouts.create({
        amount: detail.amount,
        currency: detail.currency,
        destination: detail.bankId,
        //source_type: 'bank_account'
  }, {
      stripe_account: detail.stripe_account_id, //get from db
  }));
  if(err){
    return {status: false , data: err};
  }
  return {status: true , data: {}};
};

//get account detail
async function getAccountDetail(detail) {
  var err, detail;
  [err, detail] = await to(stripe.accounts.retrieve(detail.accountId));
  if(err){
    return false;
  }
  if(detail){
    //console.log(detail);
    if(detail.capabilities.transfers==='active'){
      return true;
    }
  }
  return false;
};

/**
 * Refund amount to customer
 */
async function refundAmount(req){
// console.log("Stripe -- PaymentConfirm", paymentId);
  return refund = await stripe.refunds.create({
    charge: req.token,
  });
}

/**
 * Refund amount to customer using PaymentIntent
 */
async function refundAmountPI(req){
  // console.log("Stripe -- PaymentConfirm", paymentId);
    let refund = await stripe.refunds.create({
      payment_intent: req.token,
      amount: req.amount
    });
    return refund;
  }
  
const createSession = async (params) => {
    let err, session;
    [err, session] = await to(stripe.checkout.sessions.create({
       payment_method_types: ['card'],
       line_items: params.line_items,
       mode: "payment",
       success_url: 'http://3.130.1.68/payment/success', //success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}'
       cancel_url: 'http://3.130.1.68/payment/failure'
      }));
   if(err) {
    return {status: false, data: err}
  }
  return {status: true, data: session.id}
  };

  
  const addCard = async (customerId, data)=> {
    let err, cardDetail;
    const token = await stripe.tokens.create({
      card: {
        number: data.number,
        exp_month: data.exp_month,
        exp_year: data.exp_year,
        cvc: data.cvc,
      },
    });
    [err, cardDetail] = await to(stripe.customers.createSource(
      
        customerId, {source : token.id}));
        return cardDetail;
  }

  const updateCard = async (customerId, data)=> {
    return stripe.customers.updateSource(
        customerId, data.cardId, {name:data.name,exp_month:data.exp_month,exp_year:data.exp_year,address_city:data.city,address_country:data.country,address_state:data.state,address_zip:data.zipcode});
  }

module.exports = {
    CreatePayment,
    CreatePayment1,
    GetephemeralKey,
    PaymentConfirm,
    GetCardList,
    DeleteCard,
    GetCustomerID,
    payoutsCreate,
    createBank,
    createAccount,
    createAccountLink,
    transferCreate,
    getAccountDetail,
    refundAmount,
    refundAmountPI,
    createSession,
    addCard,
    updateCard
}


