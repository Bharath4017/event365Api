const FreeRSVP = require('../../models/normalTicket');
const Event = require('../../models/events');
const TicketInfo = require('../../models/ticket_info');
const User = require('../../models/users');
const Payment = require('../../models/payment');
const TicketBooked = require('../../models/ticketBooked');
const AndroidNotification = require('./../../middlewares/androidNotification');
const iosNotification = require('./../../middlewares/iosNotification');
const WebNotification = require('./../../middlewares/webNotification');
const Notification = require('../../models/notification');
const userChooseSubCategory = require('./../../models/userChooseSubCategory');
const paidRegularRSVP = require('../../models/tableSeatingTicket');
const stripe = require('./../../middlewares/stripe');
const TransactionHistory = require('../../models/transactionHistory');
const bankDetails = require('../../models/bank_details');
const TicketNumber = require('../../models/ticketNumber');
const RefundTransaction = require('../../models/refundTransaction');
var moment = require("moment");
const Admin = require('../../models/admin');
const Coupan = require('../../models/coupan');
const CoupanApplied = require('../../models/coupanApplied');
const AdminNotification = require('./../../middlewares/push_notification');
const randomFunction = require('./../../utils/random');
const commonHelper = require('./../../utils/CommonHelper');
const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {
    ref, transaction
} = require('objection');
let knexConfig = require("../../../db/knex");
const knex = require("knex")(knexConfig["development"]);
/**
 * UserTicketInfo
 * @params req.body;
 * @return promise
 */

const UserTicketInfo = async (req, res) => {
   
    let todayDate = new Date();
    let todayTime = moment().format('YYYY-MM-DD HH:mm:ss');
    // console.log(todayTime);
    let eventId = req.params.eventId;
   
    //return;
    //Event - selling Date and time
    let EventTiming = await Event.query().skipUndefined().select('id','is_availability').where('id', eventId).where('is_availability', true)
    .eager('[coupan]')
    .modifyEager('coupan', builder => {
        return builder.select('coupanCode').where('eventId',eventId)
    }).first();
    if (!EventTiming) {
        return badRequestError(res, {}, "Event not found");
    }
    
    // FreeTicket
    let freeTicketInfo = await TicketInfo.query().skipUndefined().select('id' ,'discount', 'ticketType', 'ticketName','ticketNumber', 'totalQuantity', 'description', 'sellingStartDate', 'sellingStartTime', 'sellingEndDate', 'sellingEndTime','parsonPerTable')
    //added by sachine descusion
    .eager("[events.[users]]")
        .modifyEager("events", builder => {  
             builder.select("id")
            .modifyEager("users", builder => {
                builder.select('id', 'name as createdBy') 
            })
        })
    .where('eventId', eventId).where("ticketType", "freeNormal").andWhere('totalQuantity', '>', 0).whereNot("isTicketDisabled", true)
    .where(knex.raw('CONCAT("sellingStartDate", "sellingStartTime")'), '<=' ,todayTime)
    .where(knex.raw('CONCAT("sellingEndDate", "sellingEndTime")'), '>' ,todayTime)
   
    // regularTicketInfo RSVP
    let regularTicketInfo = await TicketInfo.query().skipUndefined().select('id' ,'discount', 'ticketType', 'ticketName','ticketNumber','totalQuantity', 'description', 'noOfTables', 'pricePerTable', 'parsonPerTable', 'pricePerTicket', 'discountedPrice', 'disPercentage', 'sellingStartDate', 'sellingStartTime', 'sellingEndDate', 'sellingEndTime','parsonPerTable')
  //added by sachine descusion
    .eager("[events.[users]]")
        .modifyEager("events", builder => {  
             builder.select("id")
            .modifyEager("users", builder => {
                builder.select('id', 'name as createdBy') 
            })
        })
    .where('eventId', eventId).where('ticketType', 'regularNormal').andWhere('totalQuantity', '>', 0).whereNot("isTicketDisabled", true)
    .where(knex.raw('CONCAT("sellingStartDate", "sellingStartTime")'), '<=' ,todayTime)
    .where(knex.raw('CONCAT("sellingEndDate", "sellingEndTime")'), '>' ,todayTime)
    
    // vipSeating
    let vipSeating = await TicketInfo.query().skipUndefined().select('id','discount','ticketType', 'ticketName','ticketNumber','totalQuantity', 'description', 'pricePerTicket', 'sellingStartDate', 'sellingStartTime', 'sellingEndDate', 'sellingEndTime','parsonPerTable')
    //added by sachine descusion
    .eager("[events.[users]]")
    .modifyEager("events", builder => {  
         builder.select("id")
        .modifyEager("users", builder => {
            builder.select('id', 'name as createdBy') 
        })
    })
    .where('eventId', eventId).where('ticketType', 'vipNormal').andWhere('totalQuantity', '>', 0).whereNot("isTicketDisabled", true)
    .where(knex.raw('CONCAT("sellingStartDate", "sellingStartTime")'), '<=' ,todayTime)
    .where(knex.raw('CONCAT("sellingEndDate", "sellingEndTime")'), '>' ,todayTime)
    
    // regularSeating
    let regularSeating = await TicketInfo.query().skipUndefined().select('id','discount', 'ticketType', 'ticketName','ticketNumber', 'noOfTables as totalQuantity', 'description', 'pricePerTicket', 'sellingStartDate', 'sellingStartTime', 'sellingEndDate', 'sellingEndTime','parsonPerTable')
     //added by sachine descusion
     .eager("[events.[users]]")
     .modifyEager("events", builder => {  
          builder.select("id")
         .modifyEager("users", builder => {
             builder.select('id', 'name as createdBy') 
         })
     })
    .where('eventId', eventId).andWhere('ticketType', 'regularTableSeating').whereNot("isTicketDisabled", true)
    .where(knex.raw('CONCAT("sellingStartDate", "sellingStartTime")'), '<=' ,todayTime)
    .where(knex.raw('CONCAT("sellingEndDate", "sellingEndTime")'), '>' ,todayTime)
    
    // regular paid
   
    let regularPaid = await TicketInfo.query().skipUndefined().select('id','discount', 'ticketType', 'ticketName','ticketNumber','totalQuantity', 'description', 'pricePerTicket', 'sellingStartDate', 'sellingStartTime', 'sellingEndDate', 'sellingEndTime','parsonPerTable')
    //added by sachine descusion
    .eager("[events.[users]]")
    .modifyEager("events", builder => {  
         builder.select("id")
        .modifyEager("users", builder => {
            builder.select('id', 'name as createdBy') 
        })
    })
    .where('eventId', eventId).andWhere('ticketType', 'regularPaid').andWhere('totalQuantity', '>', 0).whereNot("isTicketDisabled", true)
    .where(knex.raw('CONCAT("sellingStartDate", "sellingStartTime")'), '<=' ,todayTime)
    .where(knex.raw('CONCAT("sellingEndDate", "sellingEndTime")'), '>' ,todayTime)
    let returnData = {
        "event":EventTiming,
        "freeTicket": freeTicketInfo,
        "regularPaid": regularPaid,
        "vipTicket": {
            "vipTicketInfo": vipSeating,
            "vipSeating": []
        },
        "regularTicket": {
            "regularTicketInfo": regularTicketInfo,
            "regularSeating": regularSeating
        }
    };
  
    if(freeTicketInfo.length <= 0 && regularPaid.length<= 0 && vipSeating.length<=0 && regularTicketInfo.length<= 0 && regularSeating.length <=0){
       console.log('sd');
        return badRequestError(res, {}, Message("ticketNotFound"));
    }

    return okResponse(res, returnData, Message("ticketList"));
}

/**
 * GetClientSecret
 * @params req.body;
 * @return promise
 */

const GetClientSecret = async (req, res) => {
    console.log(req.body.amount);
    let chargeAmt = Math.round(req.body.amount*100);
    console.log(chargeAmt);
    let currency = req.body.currency;
    let customerId = req.user.customerId;
    let client_secret;
    let isPaymentMethodSave = (req.body.isPaymentMethodSave!=undefined)? req.body.isPaymentMethodSave : false;
    if(req.body.paymentMethod!=undefined){
       client_secret = await stripe.CreatePayment(chargeAmt, currency, customerId, req.body.paymentMethod, isPaymentMethodSave);
    }else{
       client_secret = await stripe.CreatePayment(chargeAmt, currency);
    }
    if(client_secret.statusCode!=undefined && client_secret.statusCode==400){
        return badRequestError(res, {}, client_secret.message);
    }
    
    return okResponse(res, client_secret, "Getting Client Secret successfully");
}

/**
 * GetClientSecret1
 * @params req.body;
 * @return promise
 */

 const GetClientSecret1 = async (req, res) => {
    let chargeAmt = req.body.amount;
    let currency = req.body.currency;
   
    let customerId = req.user.customerId;
    let client_secret;
    let isPaymentMethodSave = (req.body.isPaymentMethodSave!=undefined)? req.body.isPaymentMethodSave : false;
    if(req.body.paymentMethod!=undefined){
       client_secret = await stripe.CreatePayment1(chargeAmt, currency, customerId, req.body.paymentMethod, isPaymentMethodSave);
    }else{
       client_secret = await stripe.CreatePayment1(chargeAmt, currency);
    }
    if(client_secret.statusCode!=undefined && client_secret.statusCode==400){
        return badRequestError(res, {}, client_secret.message);
    }
     

     let [err, payment_confirm] = await to(stripe.PaymentConfirm(client_secret, req.body.paymentMethod));
     if (err) {
         return badRequestError(res, "", err);
     }
     let paymentStatus = payment_confirm.status
     
     return okResponse(res, client_secret, "Payment Confirm has been Success");
     
    
}


/**
 * GetEphemeralKey
 * @params req.body;
 * @return promise
 */

const GetEphemeralKey = async (req, res) => {
    let api_version = req.body.api_version;
    let customer = req.body.customer;
    let [err, key] = await to(stripe.GetephemeralKey(api_version, customer));
    if (err) {
        return badRequestError(res, "", err.message);
    }
    
    return okResponse(res, key, "Getting Client Secret successfully");
};

/**
 * UserTicketBooked
 * @params req.body
 * @return promise
 */

const UserTicketBooked = async (req, res) => {
    let type = req.params.type;
    let data = req.body;
    let dateobj = new Date();
    let r;
    let QRCode;
    let ticketNumber;
    let tempTicket = [];
    let QRkeyValue;
  
    r = Math.random().toString(36).substring(7);
    QRkeyValue = Math.random().toString(36).substring(2, 15, 7) + Math.random().toString(36).substring(2, 15) + req.user.id + req.params.eventId + dateobj.toISOString() + r;
    let getInfoTickect = await TicketInfo.query().select("id", "totalQuantity", "noOfTables", "parsonPerTable", "ticketType").where("eventId", req.params.eventId)
    
     .where((builder) => {
         data.map(r => {
             if(r.ticketType!='regularTableSeating'){
                 builder.orWhere("totalQuantity", ">=", r.totalQuantity).andWhere("totalQuantity", ">", 0).andWhere("id", r.ticketId)
                 
             }else if(r.ticketType=='regularTableSeating'){
                 builder.orWhere("noOfTables", ">=", r.totalQuantity).andWhere("noOfTables", ">", 0).andWhere("id", r.ticketId)
             }
         })
        })
        if (getInfoTickect.length != data.length) {
            return badRequestError(res, "", Message("ticketNotFound"));
        }
    
    for (let i = 0; i < data.length; i++) {
        //update remaining quantity
        let updateData;
        if(data[i].ticketType!='regularTableSeating'){
            updateData = { 'totalQuantity': knex.raw('?? - ' + data[i].totalQuantity, ['totalQuantity']) };
        }else if(data[i].ticketType=='regularTableSeating'){
            updateData = { 'noOfTables': knex.raw('?? - ' + data[i].totalQuantity, ['noOfTables']) };
        }
        let CheckTotalQuailty = await TicketInfo.query().context({
            eventId: req.params.eventId
        }).update(updateData).where("eventId", req.params.eventId).andWhere("id", data[i].ticketId)
        
        //set value
        data[i].userId = req.user.id;
        data[i].eventId = req.params.eventId;
        data[i].status = "notCheckedIn"
        data[i].QRkey = QRkeyValue
         //create ticket number
         ticketNumber = await randomFunction.randomSubstring(tempTicket,4,'ticket',data[i].totalQuantity)
         tempTicket.push(ticketNumber);
         data[i].ticket_number_booked_rel = ticketNumber.map(result => {
            QRCode = r+result+QRkeyValue+Math.random().toString(36).substring(7); 
            return { ticketNumber : result, status: 'booked', QRCode: QRCode}
        });
    }

    let [err, TicketData] = await to(transaction(TicketBooked.knex(), trx => {
    return (
        TicketBooked.query(trx)
            .insertGraphAndFetch(data, {
                relate: true,
            })
    );
    }));
    if (err) {
        return errorResponse(res, '', err.message);
    }
    //notification Process host
    let EventUserToken = await Event.query().skipUndefined().select("events.name", "events.id", "users.deviceToken", "users.deviceType", "users.id as userId").where("events.id", req.params.eventId)
    .leftJoinRelation("[users.[userLoginDetail]]").eager('users.[userLoginDetail]')
    .modifyEager('users', builder => {
        builder.select("users.id as userId","isNotify").where('is_active', true)
        .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser, userLoginDetail as webUser]')
        .modifyEager('androidUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
        })
        .modifyEager('iosUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
        }).modifyEager('webUser', builder =>{
            builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')
        })
    }).first();

    
    //notificat''ion Process user
    //added customer id in user query told by sachine
    let userData = await User.query().skipUndefined().select("id","name","customerId","isNotify")
       .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser, userLoginDetail as webUser]')
        .modifyEager('androidUser', builder =>{
            builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
        }) 
        .modifyEager('iosUser', builder =>{
            builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
        })
        .modifyEager('webUser', builder =>{
            builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')
        })
        .where("id", req.user.id).andWhere('is_active', true).first();
       
       
        //Android
        if((EventUserToken) && (EventUserToken.users)){
            if(EventUserToken.users.androidUser){
                let AndroidNotifi = await AndroidNotification.ticketBookednotifyHost(EventUserToken, userData);
            }
            
            if(userData.androidUser){
            let AndroidNotifi1 = await AndroidNotification.ticketBookednotifyUser(EventUserToken, userData);
            }
            
            //IOS
            if(EventUserToken.users.iosUser){
            let IOSnotifi = await iosNotification.ticketBookednotifyHost(EventUserToken, userData);
            }
            if(userData.iosUser){
            let IOSnotifi1 = await iosNotification.ticketBookednotifyUser(EventUserToken, userData);
            }
               
            //Website
            if(EventUserToken.users.webUser){
                let webNotifi = await WebNotification.ticketBookednotifyHost(EventUserToken, userData);
            }
            if(userData.webUser){
                let webNotifi1 = await WebNotification.ticketBookednotifyUser(EventUserToken, userData);
            }
        }
     
   
    return okResponse(res,{"QRkey":TicketData[0].QRkey,"ticketBookingId":TicketData[0].id,"customerId":userData.customerId},Message("ticketBooked"));
}

/**
 * TicketPaymentRequest
 * @params req.body
 * @return promise
 */
const TicketPaymentRequest = async (req, res) => {
    const data = req.body;
    let customer = data.customer;
    let paymentMethod = data.paymentMethod;
    let ticketBookingId = data.ticketBookingId;
    data.balanceAmount = data.amount;
    delete data.customer;
    delete data.paymentMethod;
    delete data.ticketBookingId;
       
    //payment entry to table
      let paymentData = await Payment.query().insertGraph({
        QRkey: data.QRkey,
        currency: data.currency,
        paymentMethod:data.paymentMethod,
        amount:data.amount,
        customer:data.customer,
        paymentType:data.paymentType,
        fees:data.fees,
        balanceAmount:data.amount


      }).returning("*");

     if(data.coupanCode) {

      let applyCoupan = await CoupanApplied.query().insertGraph({
        eventId: data.eventId,
        userId: req.user.id,
        coupanCode:data.coupanCode,
      }).returning("*");
      
    }
    //Notification Process
    let ticketBookingInfo = await TicketBooked.query().skipUndefined().select("eventId","userId","ticketType","totalQuantity").eager("[users.[userLoginDetail],events]")
    .modifyEager("users", builder => {
        builder.select("id", "name", "deviceType","deviceToken","isNotify")
        .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser,userLoginDetail as webUser]')
        .modifyEager('androidUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
        })
        .modifyEager('iosUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
        })
        .modifyEager('webUser', builder =>{

            builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')

        })
    })
    .modifyEager("events", builder => {
        builder.select("id", "name")
    })
    .where('id', ticketBookingId).first();
      
     if(data.paymentType=='stripe'){
    //Strip process
     let [err, client_secret] = await to(stripe.CreatePayment(data.amount, data.currency, customer, paymentMethod));
     if (err) {
         //Failed Payment Notification to Users
        
         if((ticketBookingInfo) && ticketBookingInfo.users){
         if (ticketBookingInfo.users.androidUser) {
             var AndroidNotifi = await AndroidNotification.paymentNotificationAndroid(ticketBookingInfo,'failed');
           }
         if(ticketBookingInfo.users.iosUser) { 
               var IOSNotifi = await iosNotification.PaymentNotificationIOS(ticketBookingInfo,'failed');
           }
         if(ticketBookingInfo.users.webUser) {
           let webNotifi = await WebNotification.PaymentNotificationWeb(ticketBookingInfo, 'failed');
         }
        }
           return badRequestError(res, "", err.message);
    }
    //get card list 
     if (client_secret) {
         let [err, card_list] = await to(stripe.GetCardList(customer));
         if (err) {
             return badRequestError(res, "", err.message);
         }
     }
     var resData = {
         client_secret: client_secret,
     }
    } else if(data.paymentType=='paypal'){
        if(data.status=='APPROVED'){
            var paymentStatus = 'succeeded';
        }
        let updatePayment = await Payment.query().context({
            QRkey: data.QRkey
        }).update({
            "status": paymentStatus,
            "paymentType":"paypal",
            "paymentId":data.paymentId

        }).where("QRkey", data.QRkey);

       var resData = '';
    } else if(data.paymentType=='applepay'){
        console.log('applepay');
        if(data.status=='APPROVED'){
            var paymentStatus = 'succeeded';
        }
        let updatePayment = await Payment.query().context({
            QRkey: data.QRkey
        }).update({
            "status": paymentStatus,
            "paymentType":"applepay",
            "paymentId":data.paymentId

        }).where("QRkey", data.QRkey);

        let [err, client_secret] = await to(stripe.CreatePayment(data.amount, data.currency, customer, paymentMethod));
        var resData = {
         client_secret: client_secret,
     }
    }
    //Success payment notification to userscd
    if((ticketBookingInfo) && ticketBookingInfo.users){
    if (ticketBookingInfo.users.androidUser) {
        var AndroidNotifi = await AndroidNotification.paymentNotificationAndroid(ticketBookingInfo,'success');
      }
    if(ticketBookingInfo.users.iosUser) {
          var IOSNotifi = await iosNotification.PaymentNotificationIOS(ticketBookingInfo,'success');
      }
     if(ticketBookingInfo.users.webUser) {
      let webNotifi = await WebNotification.PaymentNotificationWeb(ticketBookingInfo, 'success');
    }
}
      return okResponse(res, resData, "Success");
}

/**
 * TicketPaymentRequest
 * @params req.body.(data.customerId)
 * @return promise
 */
const PaymentConfirm = async (req, res) => {
   
    const data = req.body;
    let [err, payment_confirm] = await to(stripe.PaymentConfirm(data.paymentId, data.payment_method));
    if (err) {
        return badRequestError(res, "", err);
    }
    let paymentStatus = payment_confirm.status
   
    if (paymentStatus == "succeeded") {
        let updatePayment = await Payment.query().context({
            QRkey: data.QRkey
        }).update({
            "paymentId": payment_confirm.id,
            "status": payment_confirm.status,
            "paymentType":"stripe"

        }).where("QRkey", data.QRkey);
        //Amount Calculate (Host and Event)

        let GethostId = await TicketBooked.query().select('createdBy', "eventId").where('QRkey', data.QRkey).first();
       

        let PaymentInfo = await Payment.query().select('amount', 'id').where('paymentId', data.paymentId).where("status", "succeeded").first();
        if(!PaymentInfo){
            return badRequestError(res, "", "Payment detail not found");
        }
       

        let GethostAmount = await User.query().select('totalAmount', 'currentAmounts', 'adminPayment').where('id', GethostId.createdBy).first();
       
        let incomingPayment = PaymentInfo.amount;

        let deduction = parseFloat(incomingPayment * 5 / 100);
        let incominghostamount = incomingPayment - deduction
        let gethostAmount = GethostAmount.currentAmounts
        let totalAdminAmount = GethostAmount.adminPayment
        let TotalAdminAmount = totalAdminAmount + deduction
        let TotalHostAmount = gethostAmount + incominghostamount /100; //amount coversion stripe into actual 100 = 1$
        

        let GetEventAmount = await Event.query().select('totalPayment').where('id', GethostId.eventId).first();
      

        let totalEventAmount = GetEventAmount.totalPayment
        let TotalEventAmount = totalEventAmount + incomingPayment /100
       
        //Event Payment Update
        let EventAmount = await Event.query().update({
            totalPayment: TotalEventAmount,
        }).where("id", GethostId.eventId);
        
        //Host Payment Update
        let OrganiserAmount = await User.query().update({
            totalAmount: TotalHostAmount,
            currentAmounts: TotalHostAmount,
            adminPayment:TotalAdminAmount
        }).where("id", GethostId.createdBy);

        return okResponse(res, payment_confirm, "Payment Confirm has been Success");
    } else {
        return badRequestError(res, "", "Payment has been not success");
    }
}

/**
 * get User Ticket Booked
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */
const getUserTicketBooked = async (req, res) => {
    let data = [];
    let qrarr = [];
    let ticketData = await TicketBooked.query()
        .skipUndefined()
        .distinct('QRkey').select( 'id','eventId', 'ticketType','status','created_at').where("userId", req.user.id).orderBy('created_at', 'desc')

    let countticketData = await TicketBooked.query()
        .skipUndefined().count('id').where("userId", req.user.id)     
        for (let i = 0; i < ticketData.length; i++) {
            if(qrarr.includes(ticketData[i].QRkey)){
                continue;
            }
            qrarr.push(ticketData[i].QRkey)
        let PaymentUserData = await Event.query().select("id", "name", "start", "end","description2","description","eventCode")
            .skipUndefined()
            .where("id", ticketData[i].eventId).eager("[venueEvents as address,eventImages, ticketBooked.[ticket_number_booked_rel],eventOccurrence]")
            .modifyEager("address", builder => {
                builder.select("latitude", "longitude", "venueAddress")
            })
            .modifyEager("ticketBooked", builder => {
                builder.select("id","ticketType", "pricePerTicket","status","totalQuantity", "created_at").where("QRkey", ticketData[i].QRkey).groupBy("id")
                .modifyEager("ticket_number_booked_rel", builder => {
                    builder.select("id","ticketNumber","status", "QRCode")
                })
            })
            .modifyEager('eventImages', builder => {
                builder.select('id', 'eventImage').where('isPrimary',true)
            }).modifyEager('eventOccurrence', builder => {
                builder.select('eventId', 'eventOccurrence', 'occurredOn')
            })    

            for (let i = 0; i < PaymentUserData.length; i++) {
                let event_id = PaymentUserData[i].id;
        
                let eventsdate =[];
                var eventsdatess = [];
                var eventsdaily = [];
               
                for (let j=0;j<PaymentUserData[i].eventOccurrence.length;j++){
                   //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
                   let currentDate = moment().format('YYYY-MM-DD');
                   if(PaymentUserData[i].eventOccurrence[j].eventOccurrence=='weekly'){
                          // console.log(getDays(currentDate,1));
                      eventsdate = getDays(currentDate,PaymentUserData[i].eventOccurrence[j].occurredOn);
        
                   } else if(PaymentUserData[i].eventOccurrence[j].eventOccurrence=='monthly'){
                       //console.log(serachData[i].eventOccurrence[j].eventId)
                      // console.log(serachData[i].eventOccurrence[j].occurredOn);
                      var endOfMonth   = moment().endOf('month').format('DD');
                      if(endOfMonth >= PaymentUserData[i].eventOccurrence[j].occurredOn){
                       eventsdatess.push(PaymentUserData[i].eventOccurrence[j].occurredOn);
                      }
                         //[1,2,3,4,5]
                   } else if(PaymentUserData[i].eventOccurrence[j].eventOccurrence=='daily'){
                       eventsdaily.push(PaymentUserData[i].eventOccurrence[j].occurredOn);
                   }
                }
               
               //going user List
               //console.log(eventsdatess,'ee');
               let todayd = moment().format('DD');
               const found = eventsdatess.find(element => element >= todayd);
               let todayd22 = moment().format('YYYY-MM'); 
               if(found){
                   var eventsdate1 = todayd22+'-'+found;
                   eventsdate = moment(eventsdate1).format('YYYY-MM-DD')
               }
        
               var dcv = new Date();
               var nv = dcv.getDay()
               const foundDaily = eventsdaily.find(element => element >= nv);
               if(foundDaily){
                   var currentDate = moment().format('YYYY-MM-DD');
               eventsdate = getDays(currentDate,foundDaily);
               console.log(eventsdate);
               }
               
               if(eventsdate.length>0){
                PaymentUserData[i].recuringDate = eventsdate;
               } else {
                PaymentUserData[i].recuringDate = "";   
               }
               //console.log(serachData[i].recuringDate);
            }

        let PaymentData = await Payment.query().skipUndefined().select("QRkey").where("QRkey", ticketData[i].QRkey).orderBy('created_at', 'desc')
        if (PaymentUserData != null) {
           
            if (PaymentData != "" || ticketData[i].ticketType == "freeNormal") {
                data.push({
                    'QRkey': ticketData[i].QRkey,
                    events: PaymentUserData[0]
                });
            }
           
        }
    }
    

    let returnData = {
        "paymentUser": data,
        'countticketData':countticketData
    }
    return okResponse(res, returnData, "User Payment Details Fetched");
};


/**
 * get User Ticket Booked For Website (with pagination)
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */
const getUserTicketBookedWithPage = async (req, res) => {
    let data = [];
    let qrarr = [];
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : 10;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);

    let ticketData = await TicketBooked.query()
        .skipUndefined()
        .distinct('QRkey').select( 'id','eventId', 'ticketType')
        .where("userId", req.user.id)
        // .offset(offset).limit(limit).runAfter((result, builder)=>{
        //    // console.log(builder.toKnexQuery().toQuery())
        //     return result;
        // });

        //console.log(ticketData,'dhfg');
       
    let countticketData = await TicketBooked.query()
        .skipUndefined().select(knex.raw('count(distinct("QRkey")) as totalDataCount')).where("userId", req.user.id)   
        console.log(ticketData.length);  
        for (let i = 0; i < ticketData.length; i++) {
          // console.log(ticketData[i].QRkey);
            if(qrarr.includes(ticketData[i].QRkey)){
                continue;
            }
           
            qrarr.push(ticketData[i].QRkey)
            
            let PaymentUserData = await Event.query().select("id", "name", "start", "end","description2","description","eventCode", knex.raw('(select sum("totalQuantity") from "ticketBooked" where "events"."id" = "ticketBooked"."eventId" and "ticketBooked"."userId" = '+req.user.id+' AND "ticketBooked"."QRkey" = \''+ticketData[i].QRkey+'\') as totalQuantity'))
            .skipUndefined()
            .where("id", ticketData[i].eventId).eager("[venueEvents as address,eventImages, ticketBooked.[ticket_number_booked_rel,ticket_info],eventOccurrence]")
            .modifyEager("address", builder => {
                builder.select("latitude", "longitude", "venueAddress")
            })
            .modifyEager("ticketBooked", builder => {
                builder.select("id","ticketType", "pricePerTicket","status","totalQuantity", "created_at","cancelledBy","ticketId").where("QRkey", ticketData[i].QRkey).groupBy("id")
                .modifyEager("ticket_number_booked_rel", builder => {
                    builder.select("id","ticketNumber","status", "QRCode","cancelledBy")
                })
                .modifyEager('ticket_info', builder => {
                    builder.select('id','ticketName', 'description').where('isTicketDisabled', false)
                })
            })
           
            .modifyEager('eventImages', builder => {
                builder.select('id', 'eventImage').where('isPrimary',true)
            }).modifyEager('eventOccurrence', builder => {
                builder.select('eventId', 'eventOccurrence', 'occurredOn')
            }) 

            for (let i = 0; i < PaymentUserData.length; i++) {
                let event_id = PaymentUserData[i].id;
        
                let eventsdate =[];
                var eventsdatess = [];
                var eventsdaily = [];
               
                for (let j=0;j<PaymentUserData[i].eventOccurrence.length;j++){
                   //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
                   let currentDate = moment().format('YYYY-MM-DD');
                   if(PaymentUserData[i].eventOccurrence[j].eventOccurrence=='weekly'){
                          // console.log(getDays(currentDate,1));
                      eventsdate = getDays(currentDate,PaymentUserData[i].eventOccurrence[j].occurredOn);
        
                   } else if(PaymentUserData[i].eventOccurrence[j].eventOccurrence=='monthly'){
                       //console.log(serachData[i].eventOccurrence[j].eventId)
                      // console.log(serachData[i].eventOccurrence[j].occurredOn);
                      var endOfMonth   = moment().endOf('month').format('DD');
                      if(endOfMonth >= PaymentUserData[i].eventOccurrence[j].occurredOn){
                       eventsdatess.push(PaymentUserData[i].eventOccurrence[j].occurredOn);
                      }
                         //[1,2,3,4,5]
                   } else if(PaymentUserData[i].eventOccurrence[j].eventOccurrence=='daily'){
                       eventsdaily.push(PaymentUserData[i].eventOccurrence[j].occurredOn);
                   }
                }
               
               //going user List
               //console.log(eventsdatess,'ee');
               let todayd = moment().format('DD');
               const found = eventsdatess.find(element => element >= todayd);
               let todayd22 = moment().format('YYYY-MM'); 
               if(found){
                   var eventsdate1 = todayd22+'-'+found;
                   eventsdate = moment(eventsdate1).format('YYYY-MM-DD')
               }
        
               var dcv = new Date();
               var nv = dcv.getDay()
               const foundDaily = eventsdaily.find(element => element >= nv);
               if(foundDaily){
                   var currentDate = moment().format('YYYY-MM-DD');
               eventsdate = getDays(currentDate,foundDaily);
               console.log(eventsdate);
               }
               
               if(eventsdate.length>0){
                PaymentUserData[i].recuringDate = eventsdate;
               } else {
                PaymentUserData[i].recuringDate = "";
               }
               
               //console.log(serachData[i].recuringDate);
            }
            
           // console.log('paymentUser',PaymentUserData);

        let PaymentData = await Payment.query().skipUndefined().select("QRkey").where("QRkey", ticketData[i].QRkey).orderBy('created_at', 'desc')
        .runAfter((result, builder) =>{
           // console.log(builder.toKnexQuery().toQuery())
            return result;
         });
          
          //console.log(PaymentData);  
        if (PaymentUserData != null) {
            // console.log(PaymentUserData,'dfghd');
            if (PaymentData != "" || ticketData[i].ticketType == "freeNormal") {
              //  console.log(PaymentUserData,'11');
                data.push({
                    'QRkey': ticketData[i].QRkey,
                    events: PaymentUserData[0]
                });
                //console.log(data,'13');
            }
           
        }
    }
     //console.log(countticketData[0]);
    let returnData = {
        "paymentUser": data,
        'countticketData':countticketData[0].totaldatacount
    }
    return okResponse(res, returnData, "User Payment Details Fetched");
};



/**
 * getTickets (Edit Event)
 * @params 
 * @return promise
 */
const getEventTicket = async (req, res) => {
   
    let isCancelled;
    let soldOut;
    let freeNormal = [];
    let vipNormal = [];
    let regularNormal = [];
    let regularTableSeating = [];
    let vipTableSeating = [];
    let regularPaid = [];
    let [err, eventTicketInfo] = await to(TicketInfo.query().skipUndefined().select("id",'discount',"ticketName", "ticketType", "noOfTables", "pricePerTable", "description", "parsonPerTable", "actualQuantity", "pricePerTicket", "totalQuantity", "isTicketDisabled as isCancelled","cancellationChargeInPer", "sellingStartDate", "sellingStartTime", "sellingEndDate", "sellingEndTime", knex.raw('(select case when count(id) > 0 then true else false end from "ticketBooked" where "ticketId" = "ticket_info"."id" AND "status" != \'cancelled\') as "isTicketBooked"'))
    .where("eventId", req.params.eventId)
    .where('isTicketDisabled', false)
    
    );
    if (err) {
        return badRequestError(res, "", err.message);
    }

    for (let i = 0; i < eventTicketInfo.length; i++) {
     
        if (eventTicketInfo[i].ticketType == 'freeNormal') {
            
            freeNormal.push(eventTicketInfo[i]);
        } else if (eventTicketInfo[i].ticketType === "vipTableSeating") {
           
            vipTableSeating.push(eventTicketInfo[i]);
        } else if (eventTicketInfo[i].ticketType === "regularTableSeating") {
           
            regularTableSeating.push(eventTicketInfo[i]);
        } else if (eventTicketInfo[i].ticketType === "vipNormal") {
          
            vipNormal.push(eventTicketInfo[i]);
        } else if (eventTicketInfo[i].ticketType === "regularNormal") {
            regularNormal.push(eventTicketInfo[i]);
        } else if (eventTicketInfo[i].ticketType === "regularPaid") {
            regularPaid.push(eventTicketInfo[i]);
        } else {
          
        }
        
        if (eventTicketInfo[i].totalQuantity == 0) {
            soldOut = true;
        } else {
            soldOut = false;
        }
        eventTicketInfo[i].isSoldOut = soldOut;
       
    }

    let eventData = await Event.query().skipUndefined().select("start", "end", "sellingStart", "sellingEnd").where("id", req.params.eventId)
    .eager('[coupan]')
    .modifyEager('coupan', builder => {
        return builder.select('coupanCode').where('eventId',req.params.eventId)
    }).first();
    let returnData = {
        "event": eventData,
        "freeNormal": freeNormal,
        "regularPaid": regularPaid,
        "normalTicket": {
            "vipNormal": vipNormal,
            "regularNormal": regularNormal
        },
        "tableSeating": {
            "vipTableSeating": vipTableSeating,
            "regularTableSeating": regularTableSeating
        }
    };
    return okResponse(res, returnData, Message("ticketList"));
}
/**
 * EditTickets (Edit Event)
 * @params 
 * @return promise
 */
const editEventTicket = async (req, res) => {
   
    let data = req.body;
    let eventId = req.params.eventId
    let userId = req.user.id;
    let ticketAr = [];
    //update ticket
    if(data.ticketCreate.length > 0){

        for (let i = 0; i < data.ticketCreate.length; i++) {
            let discountPercentage = 5;
            data.ticketCreate[i].userId = userId;
            data.ticketCreate[i].eventId = eventId;
            data.ticketCreate[i].actualQuantity = data.ticketCreate[i].totalQuantity;
            if(data.ticketCreate[i].id){
                ticketAr.push(data.ticketCreate[i].id)
            }
        }
        //check if ticket booked
        if(ticketAr.length >0) {
            let checkBookedTicket = await TicketBooked.query().select('ticketBooked.id','ticketBooked.status').whereIn('ticketId', ticketAr)
            .eagerAlgorithm(TicketBooked.JoinEagerAlgorithm)
            .eagerOptions({
                joinOperation: "innerJoin"
            })
            .eager("[ticket_number_booked_rel]")
            .modifyEager("ticket_number_booked_rel", builder => {
                return builder.select("ticketNumber.id",'ticketNumber.status').whereNot('ticketNumber.status', 'cancelled').whereNot('ticketNumber.status', 'delete')     
            })
            .whereNot('ticketBooked.status', 'cancelled').whereNot('ticket_number_booked_rel.status', 'cancelled').whereNot('ticket_number_booked_rel.status', 'delete')
            .first();
            if(checkBookedTicket){
                return badRequestError(res, "", "You can not edit this ticket because it is already booked.");   
            }
        }
        let [err, eventTicketInfo] = await to(TicketInfo.query().upsertGraph(data.ticketCreate));
        console.log(eventTicketInfo);
        if (err) {
           
            if(err.stack.includes('duplicate', 'unique constraint')){
               
                return await editEventTicket(req, res);
            }else{
                console.log(err.message);
                return badRequestError(res, "", err.message);
            }
        }
        if (!eventTicketInfo) {
            return badRequestError(res, "", Message("ticketNotFound"));
        } else {
            let message = (data.ticketCreate[0].id) ? Message("ticketUpdate") : Message("ticketCreate")
            return okResponse(res, "", message);
        }
    }
    //ticketDisabled 
    if(data.ticketDisabled.length > 0){
        let QRelement = [];
        let ticketNumberId = [];
        let checkStatus = true;
        let checkTicketInfo = await TicketInfo.query().select('id').whereIn('id',data.ticketDisabled).where('isTicketDisabled', true).runAfter((result, builder)=>{
            console.log(builder.toKnexQuery().toQuery())
            return result;
        });
        //console.log(checkTicketInfo.length);
        if(checkTicketInfo.length > 0){
           // console.log('sfb');
            return badRequestError(res, "", "Ticket has been already deleted");
        }

        let selectTicketDetail = await TicketBooked.query().select('QRkey', 'ticketBooked.id', 'ticketBooked.ticketId', 'totalQuantity', 'pricePerTicket', knex.raw('("pricePerTicket"::float * "totalQuantity"::integer) as totalPrice'))
        .innerJoinRelation('ticket_number_booked_rel')
        .eager('ticket_number_booked_rel')
        .modifyEager('ticket_number_booked_rel', builder => {
            return builder.select(knex.raw('array_agg(DISTINCT \"id\") as ticketNumberId, count(id) as totalQuantities')).where('status', 'booked').groupBy('ticketBookedId').first();
        })
        .where('ticketBooked.status', 'notCheckedIn')
        .whereIn('ticketBooked.ticketId', data.ticketDisabled).where('ticket_number_booked_rel.status', 'booked').groupBy('ticketBooked.id')
        
       
        if(selectTicketDetail!=undefined && selectTicketDetail.length>0){
            for (let index = 0; index < selectTicketDetail.length; index++) {
                let totalAmount = (parseInt(selectTicketDetail[index].pricePerTicket)*parseInt(selectTicketDetail[index].ticket_number_booked_rel[0].totalQuantities))
                //let adminAmount = parseFloat(totalAmount * 5 / 100); //admin amount 
                //let hostamount = totalAmount - adminAmount; //host amount
                //console.log(hostamount, 'hostadmin amount', adminAmount);
                let stripeAmount = parseInt(totalAmount)*100; //convert for stripe payment 100 = 1$
                let selectPI =  await Payment.query().update({'balanceAmount' : knex.raw('?? - '+stripeAmount, ["balanceAmount"])}).where('QRkey', selectTicketDetail[index].QRkey).where('status', 'succeeded').where('balanceAmount', '>=', stripeAmount).returning('paymentId', 'id');
               
                if(selectPI != undefined && selectPI.length>0){
                    
                    let [err, data] = await to(stripe.refundAmountPI({token: selectPI[0].paymentId, amount: stripeAmount})) 
                    if( (err) || (!data)){
                        checkStatus = false; 
                    }
                    if(data){
                        //deduct from admin and host 
                        //await User.query().update({'totalAmount' : knex.raw('?? - '+hostamount, ["totalAmount"]), 'currentAmounts' : knex.raw('?? - '+hostamount, ["currentAmounts"]), 'adminPayment' : knex.raw('?? - '+adminAmount, ["adminPayment"])}).where('id', userId);
                        console.log(data,'data')
                        let addRefDetail = await RefundTransaction.query().insert({'amount': selectTicketDetail[index].totalprice, rf_id: data.id, status: data.status, 'paymentId': selectPI[0].id}).returning('id')
                        if(addRefDetail){
                        await TicketNumber.query().update({status: 'deleted', refundId : addRefDetail.id}).whereIn('id', selectTicketDetail[index].ticket_number_booked_rel[0].ticketnumberid)
                        await TicketBooked.query().update({status: 'deleted'}).where('id', selectTicketDetail[index].id)
                        await TicketInfo.query().update({isTicketDisabled: true}).where('id', selectTicketDetail[index].ticketId);
                        }
                    } 
                }
            }
        }
        if(checkStatus == true){
            let ticketDisabled = await TicketInfo.query().update({
                isTicketDisabled: true
            }).whereIn("id", data.ticketDisabled);
            return okResponse(res, "", Message("ticketCancelled"));
        }
    }
    return badRequestError(res, "", Message("SomeError"));
}

/**
 * balanceInfo Amount for Organiser
 * @params 
 * @return promise
 */
const balanceInfo = async (req, res) => {
    let userId = req.user.id
    let canWithdrawn;
   
    //get flag isVerified
    const OrganiserAmount = await User.query().select('isVerified', 'currentAmounts', 'isReleased').where('id', userId).first();
    if (OrganiserAmount.isReleased == true || OrganiserAmount.isVerified == true) {
        OrganiserAmount.canWithdrawn = true;
    } else {
        OrganiserAmount.canWithdrawn = false;
    }
    delete OrganiserAmount.isReleased;
    delete OrganiserAmount.isVerified;
    return okResponse(res, OrganiserAmount, Message("getTotalAmount"));
}

/**
 * withdrawnReq for pay Amount- Admin
 * @params 
 * @return promise
 */

const withdrawnReq = async (req, res) => {
    let data = req.body;
    let withdrawnAmount = data.withdrawnAmount;
    data.userId = req.user.id;
    let paymentStatus = false;
    let AmountData = 0;
    let withdrawnData;
    // check totalAmount to User
    let padingProcessCheck = await TransactionHistory.query().select('id').where('userId', req.user.id).where("transStatus", "pending").first();
    if(padingProcessCheck){
        return badRequestError(res, "", "Your withdrawn request is already pending");
    }
    let OrganiserTotalAmount = req.user.currentAmounts;
    if (withdrawnAmount != null) {
        
        if( (withdrawnAmount/100) > OrganiserTotalAmount){
            return badRequestError(res, "", "Insufficent balance");
        }
    }
    // insterted TransactionHistory Data
    if (req.user.isVerified == true && req.user.isReleased == true) {
        if (data.withdrawnAmount) {
            AmountData = OrganiserTotalAmount - withdrawnAmount;
        } else {
            AmountData = 0;
            withdrawnAmount = OrganiserTotalAmount;
        }
        paymentStatus = true;
    } else if (req.user.isReleased == false || req.user.isVerified == false) {
        let userData = await User.query().skipUndefined().select("name", "deviceToken", "id","deviceType", "userType").where("id", req.user.id).first();
        let adminData = await Admin.query().select('id','device_token').where('id', 1).first();
        
        
        //Notification Process (send to Admin)
        let adminNotifiy = await AdminNotification.releasedPayment(adminData, userData);
        
        data.withdrawnAmount = (data.withdrawnAmount != null) ? data.withdrawnAmount : OrganiserTotalAmount;
        let trnaExists = await TransactionHistory.query().select().skipUndefined().where('userId', req.user.id).first();
        if (trnaExists == null || trnaExists == "") {
            data.transStatus = "pending";
            TransaHisData = await TransactionHistory.query().upsertGraph(data).returning('*');
            // update useramount 
              await User.query().update({ 'currentAmounts': knex.raw('?? - ' + parseFloat(data.withdrawnAmount), ["currentAmounts"]) }).where("id",req.user.id);
        }
        var msg = (req.user.isVerified == false) ? "Your withdrawn Request send but Admin not Verifed your A/c" : "Your withdrawn Request send but Admin not Releasing Payment";
        return badRequestError(res, "", msg);
    }
    if (paymentStatus == true) {
        let selBank = await bankDetails.query().select('bankIdKey').skipUndefined().where('id', data.bankId).first();
        if (selBank) {
            data.bankId = selBank.bankIdKey;
        } else {
            return badRequestError(res, "", "Invalid bank detail");
        }
        const stripeAmount = withdrawnAmount ; //multiple for stripe payment (100 eq 1$)
        let createTransfer = await stripe.transferCreate({
            amount: stripeAmount,
            currency: req.user.currencyCode,
            stripe_account_id: req.user.accountId
        });
        if (createTransfer.status == true) {
            let paymentOrganiser = await stripe.payoutsCreate({
                amount: stripeAmount,
                currency: req.user.currencyCode,
                stripe_account_id: req.user.accountId,
                bankId: data.bankId
            });
            if (paymentOrganiser.status == false) {
                return badRequestError(res, "", paymentOrganiser.data.message);
            }
        } else {
            return badRequestError(res, "", createTransfer.data.message);
        }
        data.transStatus = "completed";
        let getBankId = await bankDetails.query().select('id').where('bankIdKey', data.bankId).first();
        delete data.bankId
        data.bankId = getBankId.id

        TransaHisData = await TransactionHistory.query().upsertGraph(data).returning('*');

        let withdrawnData = await User.query().update({
            currentAmounts: AmountData
        }).where('id', req.user.id);
        return okResponse(res, "", Message("withdrawnReq"));
    } else {
        return badRequestError(res, "", "something went wrong");
    }
}

/**
 * Transaction History show for Host
 * @params 
 * @return promise
 */

const transactionHistory = async (req, res) => {
  
    //pagination
    let data;
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : PER_PAGE;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);

    // TransaHisData for Host
    let [err, TransaHisData] = await to(TransactionHistory.query().select("withdrawnAmount", "created_at", "updated_at", "transStatus").eager('[bank_details]').modifyEager('bank_details', builder => {
        builder.select("AccountNo", "bankName")
    }).where('userId', req.user.id).andWhere("transStatus", req.query.transStatus).offset(offset).limit(limit));
    if (err) {
        return badRequestError(res, "", err.message);
    }
    let response = {
        transactionHistory: TransaHisData,
        page: page,
    };
    return okResponse(res, response, Message("transactionHistory"));
}

/**
 * sned Amount to admin and host
 * @params 
 * @return promise
 */ 
const getBookedEventData = async (req, res) => {
    
    let todayDate = new Date();
    // TransaHisData for Host
    let bookedData = await Event.query().select("events.id", "events.name",  "events.end","events.userId")
    .skipUndefined().eager("[ticketBooked]")
    .innerJoinRelation("ticketBooked.[ticket_number_booked_rel]")
    .eager("ticketBooked.[ticket_number_booked_rel]")
    .modifyEager("ticketBooked", builder => {
        builder.select("ticketBooked.id","ticketBooked.userId","ticketBooked.pricePerTicket",knex.raw('(select count("id") from "ticketNumber" where "status"= \'checkedIn\' AND "ticketNumber"."ticketBookedId" = "ticketBooked"."id") as guestCount'))
        .eager("ticket_number_booked_rel")
        .modifyEager("ticket_number_booked_rel", builder => {
            return builder.select("ticketNumber.id", "status","ticketNumber").whereNot("ticketNumber.status", 'cancelled').whereNot("ticketNumber.status", 'delete')
        })
    }).where("events.end", "<", todayDate).where("isDeleted",false).where("isArchived",false).whereNot("ticket_number_booked_rel.status", "cancelled").whereNot("ticket_number_booked_rel.status", "delete").where("isAmountCredit",false).limit(10)

    for(let i=0;i < bookedData.length;i++){
       
        var totalPayableAmount= 0;
        for(let j=0;j < bookedData[i].ticketBooked.length;j++){
       
          var amountss = bookedData[i].ticketBooked[j].pricePerTicket * bookedData[i].ticketBooked[j].guestcount;
          totalPayableAmount+= amountss;
        }
      
       if(totalPayableAmount!=0){  
          
        let adminAmount = parseFloat(totalPayableAmount * 5 / 100); //admin amout
        let incominghostamount = totalPayableAmount - adminAmount //hostAmount
        let TotalAdminAmount = adminAmount /100 //updated amount
        let TotalHostAmount = incominghostamount /100; //amount coversion stripe into actual 100 = 1$
        
       await User.query().update({ 'totalAmount': knex.raw('?? + ' + TotalHostAmount, ["totalAmount"]), 'currentAmounts': knex.raw('?? + ' + TotalHostAmount, ["currentAmounts"]), 'adminPayment': knex.raw('?? + ' + TotalAdminAmount, ["adminPayment"]) })
       .where('id', bookedData[i].userId)
       
       // update isamountCredit in event table
       await Event.query().update({ 'isAmountCredit': true})
       .where('id', bookedData[i].id)
       
       }
    }
    if (!bookedData) {
        return badRequestError(res, "", "Data Not found");
    }
    return okResponse(res, bookedData, "Data Found");
}

/**
 * withdrawnInfo
 * @params 
 * @return promise
 */ 

const withdrawnInfo = async (req, res) => {
    let userId = req.user.id
    //get flag isVerified
    const UserVerified = await User.query().select('isVerified', 'currentAmounts').where('id', userId).first();
    return okResponse(res, UserVerified, "Get your withdrawn Info");
}

const paymentBeforePostEvent = async (req, res) => {
    let userId = req.user.id
    let body = req.body;
    if(!body.amount){
        return badRequestError(res, "", "Minimum 100$ is required");
    }
    return okResponse(res, UserVerified, "Get your withdrawn Info");
}

const checkCoupanCode = async (req, res) => {
   
    let data = req.body;
    if(!data.coupanCode){
        return badRequestError(res, "", "Coupan Code is required");
    }
    if(!Array.isArray(data.ticketDetail)){
      
        return badRequestError(res, "", Message("requiredParams"));
    }

    const coupanVerified = await Coupan.query().select('id').where('coupanCode', data.coupanCode).first();
    if(!coupanVerified){
        return badRequestError(res, "", "Coupan Code is not valid");
    }
    
    let ticketArray = data.ticketDetail;
    // fetch eventIds
    let getTicketPrice = await TicketInfo.query().select( knex.raw('coalesce("pricePerTicket", 0) as "pricePerTicket"'), knex.raw('coalesce("totalQuantity", 0) as "totalQuantity"'), 'id', knex.raw('coalesce("noOfTables", 0) as "noOfTables"'), 'ticketType','discount').whereIn('id', data.ticketDetail.map(v => v.id)).runBefore((result, builder) => {
       
        return result;
    });
    let totalTicketPrice = 0;
    if(getTicketPrice.length > 0 && getTicketPrice.length == ticketArray.length){
        //loop for check ticket price according ticket id from db array
        for (let index = 0; index < getTicketPrice.length; index++) {
            const element = getTicketPrice[index];
           // console.log(element,'first');
            
            //loop for check ticket price according ticket id from req array
            for (let j = 0; j < data.ticketDetail.length; j++) {
                const elements = data.ticketDetail[j];
               // console.log(elements,'second');
                // if( (element.id == elements.id && element.ticketType != 'regularTableSeating') && ((parseFloat(element.pricePerTicket) != parseFloat(elements.pricePerTicket)) || (parseInt(element.totalQuantity) < parseInt(elements.totalQuantity) || !(parseInt(elements.totalQuantity))))){
                //     return badRequestError(res, "", Message("mismachtAmount")); 
                // }else if((element.id == elements.id && element.ticketType == 'regularTableSeating') && (parseFloat(element.pricePerTicket) != parseFloat(elements.pricePerTicket) || (parseInt(elements.totalQuantity) > parseInt(element.noOfTables) || !(parseInt(elements.totalQuantity))))){
                //     return badRequestError(res, "", Message("mismachtAmount")); 
                // }
                 if(element.id == elements.id){
                     if(element.discount){
                    var numVal1 = parseFloat(element.pricePerTicket) * elements.totalQuantity;
                    //console.log(numVal1);
                    //console.log(elements.discount,'discount');
                    var numVal2 = parseFloat(elements.discount) / 100;
                    
                    var totalValue = numVal1 - (numVal1 * numVal2);
                    console.log(totalValue);
                     totalTicketPrice = (parseFloat(totalValue)) + parseFloat(totalTicketPrice);
                     } else {
                        totalTicketPrice = (parseFloat(element.pricePerTicket) * elements.totalQuantity) + parseFloat(totalTicketPrice);
                     }
                 }
            }
        }
        //compaire total ticket price
    }else{
        return badRequestError(res, "", Message("ticketDetailNotFound")); 
    }
    
    return okResponse(res, totalTicketPrice, 'Coupan Applied Successully');
}


const validateAppleSession = async (req, res) => {
   
    const appleUrl =  req.body.url;

    // use set the certificates for the POST request
    httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        cert: fs.readFileSync(path.join(__dirname, '../../../certificate_sandbox.pem')),
        key: fs.readFileSync(path.join(__dirname, '../../../certificate_sandbox.key')),
    });
     
    response = await axios.post(
        appleUrl,
        {
            merchantIdentifier: 'merchant.com.test.365live.sandbox',
            domainName: 'test.365live.com',
            displayName: 'sandbox website event365',
        },
        {
            httpsAgent,
        }
    );
    return okResponse(res, response.data, 'Success');
}

function getDays(d,y) {
    d = new Date(d); 
   // console.log(d);
    //var day = d.getDay(),
      //  diff = d.getDate() - day + (day == 0 ? -6:y); // adjust when day is sunday
       d.setDate(d.getDate() + (((y + 7 - d.getDay()) % 7) || 7));
        console.log(d,'hb');
        return moment(d).format('YYYY-MM-DD');
  }

const refundTest = async (req,res) => {
  
 }

module.exports = {
    UserTicketInfo,
    UserTicketBooked,
    GetClientSecret,
    GetEphemeralKey,
    PaymentConfirm,
    TicketPaymentRequest,
    getUserTicketBooked,
    getEventTicket,
    editEventTicket,
    withdrawnReq,
    transactionHistory,
    balanceInfo,
    withdrawnInfo,
    paymentBeforePostEvent,
    refundTest,
    GetClientSecret1,
    getUserTicketBookedWithPage,
    getBookedEventData,
    checkCoupanCode,
    validateAppleSession
}