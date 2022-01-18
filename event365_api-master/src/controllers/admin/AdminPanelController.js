'use strict';

const User = require('../../models/users');
const Category = require('../../models/category');
const SubCategory = require('../../models/subCategory');
const Event = require('../../models/events');
const Payment = require('../../models/payment');
const TicketInfo = require('../../models/ticket_info');
const bankDetails = require('../../models/bank_details');
const TicketBooked = require('../../models/ticketBooked');
const Venue = require('../../models/venue');
const Contact = require('../../models/contactUs');
const Admin = require('../../models/admin');
const AppContent = require('../../models/app_content');
const TransactionHistory = require('../../models/transactionHistory');
const VenueImages = require('../../models/venueImages');
const daysAvailable = require('../../models/daysAvailability');
const ValidationError = require('objection').ValidationError;
const EMAIL = require('./../../middlewares/email');
const validator = require('validator');
const stripe = require('./../../middlewares/stripe');
const PaidEventPricing = require('./../../models/paidEventPrice');
const Notes = require('../../models/notes');
const SubVenue = require('../../models/subVenue');
const Slider = require('../../models/slider');
const Notice = require('../../models/notice');
const AdminNotification = require('./../../middlewares/push_notification');
let knexConfig = require("../../../db/knex");
const knex = require("knex")(knexConfig["development"]);
require('../../global_functions');
require('../../global_constants');
//var knex = require('knex');
const {
  ref, transaction
} = require('objection');
var moment = require("moment");
var dateFormat = require('dateformat');

/**
 * Event List (or My events)
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const eventList = async (req, res) => {
  let data = req.query;
  let type = data.type;
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = (page == 1) ? 0 : (page-1)*100;
   
  let currentDate = new Date();
  let [err, eventData] = await to(Event.query().select('events.id', 'events.name', 'eventType', 'paidType', 'start', 'end', 'is_active','isDeleted','isArchived')
  .innerJoinRelation('eventChooseSubcategory')
  .mergeNaiveEager('[eventImages, venueEvents as address,eventCategories, eventSubCategories, users]')
  .modifyEager('eventImages', builder => {
    builder.select('eventImage').limit(1)
  }).modifyEager('address', builder => {
    builder.select('latitude', 'longitude', 'venueAddress').first()
  }).modifyEager('users', builder => {
    builder.select('name')
  }).modifyEager('eventCategories', builder => {
    builder.select('category.id','categoryName').where( builder => {
      if(data.categoryId){
        var catArr = data.categoryId.split(',');
        builder.whereIn('category.id', catArr);
      }
    }).groupBy("category.id", "eventChooseSubcategory.eventId");
  }).modifyEager('eventSubCategories', builder => {
    builder.select('subCategory.id','subCategoryName').where( builder => {
      if(data.subCategoryId){
        var array = data.subCategoryId.split(',');
        builder.whereIn('subCategory.id', array);
      }
    }).groupBy("subCategory.id", "eventChooseSubcategory.eventId");
  }).where('isArchived',false)
  .where('isDeleted',false)
  .where( builder => {
    if(type == 'current'){
      builder.where(knex.raw('DATE("start")'),currentDate)
    }else if(type == 'past'){
      builder.where('start', '<', currentDate);
    }else if(type == 'upcomming') {
      builder.where('start', '>', currentDate)
    }
    if(data.categoryId){
      var catArr = data.categoryId.split(',');
      builder.whereIn('eventChooseSubcategory.categoryId', catArr);
    }
    if(!!data.subCategoryId){

      var array = data.subCategoryId.split(',');
     
      builder.whereIn('eventChooseSubcategory.subCategoryId', array);
    }
    if(data.toDate && data.fromDate){

      builder.whereBetween( knex.raw('DATE("start")'), [data.toDate, data.fromDate]).whereBetween(knex.raw('DATE("end")'), [data.toDate, data.fromDate]);
     
    }
    if(data.searchValue){
      builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
    }
  }).groupBy('events.id', "eventChooseSubcategory.eventId")
  .orderBy('start', 'asc')
  .offset(offset).limit(limit).runAfter( (result, builder) => {
    console.log(builder.toKnexQuery().toQuery())
    return result;
}));
  if(err){
    return badRequestError(res, "", err)
  }
  if (!eventData) {
    return notFoundError("no event found");
  }

  //data count
  let dataCount =  Event.query().select( knex.raw("count(distinct(events.id)) as totalDataCount"));
  if(data.categoryId!="" || data.subCategoryId!=""){
    dataCount = dataCount.innerJoinRelation('eventChooseSubcategory')
  }
  dataCount.where( builder => {
    if(type == 'current'){
      builder.where('start', currentDate)
    }else if(type == 'past'){
      builder.where('start', '<', currentDate);
    }else if(type == 'upcomming') {
      builder.where('start', '>=', currentDate)
    }
    if(data.categoryId){
      var catArr = data.categoryId.split(',');
      builder.whereIn('eventChooseSubcategory.categoryId', catArr);
    }
    if(data.subCategoryId){
      var array = data.subCategoryId.split(',');
      builder.whereIn('eventChooseSubcategory.subCategoryId', array);
    }
    if(data.searchValue){
      builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
    }
  }).first()
  let totaldataCount = await dataCount;
  return okResponse(res, {eventList: eventData, totalDataCount: totaldataCount.totaldatacount}, "Event List successfully get");
}



/**
 * get User List 
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const getUsers = async (req, res) => {

  let UserData = await User.query().skipUndefined().select().where('userType', "customer").where('isPhoneVerified', 1).orderBy('updated_at', 'desc');
  if (!UserData) {
    return badRequestError("No Details");
  }
  let returnData = {
    "user_list": UserData
  };
  return okResponse(res, returnData, "Get All Customer List");
}


/**
 * get Organiser List 
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */


const getOrganisers = async (req, res) => {
  let data = req.query;
 
  let page = (data.page) ? data.page : 0;
  let limit = 100;
  let offset = limit * (page - 1);
  let userType = req.params.userType;
  let response = {};
  let query = User.query().skipUndefined().select().omit( [ 'password', 'emailOTP', 'deviceToken', 'token', 'roles', 'customerId', 'currentAmounts', 'totalAmount', 'adminPayment', 'phoneOTP', 'accountId' ] );
  if(userType!='customer'){
    query.eager('bank_details')
    .modifyEager('bank_details', builder => {
      builder.select('userId','bankName', 'AccountNo', 'routingNo').whereNot('bankName', null)
    })
     //.joinRelation('bank_details')
  }
  
  query.where('userType', userType)
  .where(builder => {
      if(data.searchValue){
        builder.where('name', 'iLike', '%'+data.searchValue+'%').orWhere('phoneNo', 'iLike', '%'+data.searchValue+'%').orWhere('email', 'iLike', '%'+data.searchValue+'%');
      }
      if(data.searchLocation){
        builder.where('countryName', 'iLike', '%'+data.searchLocation+'%').orWhere('state', 'iLike', '%'+data.searchLocation+'%').orWhere('city', 'iLike', '%'+data.searchLocation+'%');
      }
    
      if(data.sortBy==1){ //active
        builder.where('accountStatus', 'active');
      }else if(data.sortBy==2) { //inactive
        builder.where('accountStatus', 'inactive');
      }else if(data.sortBy==3) { //flagged
        builder.where('accountStatus', 'flagged');
      }
    })
    if(req.query.sortBy==4) { //asc
        query.orderBy('name', 'asc');
      }else if(req.query.sortBy==5) { //desc
        query.orderBy('name', 'desc');
      }else{
        query.orderBy('created_at', 'desc');
      }

      
    if(userType!='customer'){
      query.groupBy('users.id')
    }
    query.offset(offset).limit(limit).runAfter((result, builder)=>{
      console.log(builder.toKnexQuery().toQuery())
       return result;
   });;
    
    //total Count
    let dataCount  =  User.query().select( knex.raw("count(distinct(users.id)) as totalDataCount"))
    if(userType != 'customer'){
     // dataCount.joinRelation('bank_details')
    }
    dataCount.where('userType', userType)
    .where(builder => {
      if(data.searchValue){
        builder.where('name', 'iLike', '%'+data.searchValue+'%').orWhere('phoneNo', 'iLike', '%'+data.searchValue+'%').orWhere('email', 'iLike', '%'+data.searchValue+'%');
      }
      if(data.searchLocation){
        builder.where('countryName', 'iLike', '%'+data.searchLocation+'%').orWhere('state', 'iLike', '%'+data.searchLocation+'%').orWhere('city', 'iLike', '%'+data.searchLocation+'%');
      }
      if(req.query.sortBy==1){ //active
        builder.where('accountStatus', 'active');
      }else if(req.query.sortBy==2) { //inactive
        builder.where('accountStatus', 'inactive');
      }else if(req.query.sortBy==3) { //flagged
        builder.where('accountStatus', 'flagged');
      }
    }).first();
    let newdataCount = await dataCount;
    response.totalDataCount = newdataCount.totaldatacount;
   
  let UserData = await query;
  if (!UserData) {
    return badRequestError(res,"", "No Details");
  }
  response.user_list = UserData;
  return okResponse(res, response, "Get All Customer List");
}


/**
 * addUpdateOrganiser
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const addUpdateOrganiser = async (req, res) => {
 
  let data = req.body;

  let message;
  if (!data.name) {
    return badRequestError(res, "", "Please enter name");
  }

  if (!data.email) {
    return badRequestError(res, "", "Please enter Email !");
  }

  if (!data.password) {
    return badRequestError(res, "", "Please enter Password !");
  }
  if (!data.userType) {
    return badRequestError(res, "", "Please enter User Type !");
  }
  if (data.userType == 'venuer') {
    data.roles = '["venue_management","event_management","user_management","payment_management","checkin"]';
  }
  if (data.userType == 'host') {
    data.roles = '["event_management",payment_management","checkin"]';
  }
  if (data.userType == 'promoter') {
    data.roles = '["venue_management","event_management","user_management","payment_management","checkin"]';
  }

  let ranOtp = Math.floor(1000 + Math.random() * 9000);
  data.emailOTP = ranOtp;
  data.isEmailVerified = 1;

  EMAIL.sendEmail(data.email, "Account Activation", "Hello " + data.name + ", <br> Welcome to Event365 Live.<br> Your Email is: " + data.email + "<br> Your Password is: " + data.password + " <br> and Your Role is: " + data.userType + "<br>" + "Please Verify Your Phone No from App");

  let err, inserted_user;
  [err, inserted_user] = await to(User.query().insert(data).returning("id"));

  if (err) {
    return badRequestError(res, "", err.message);
  }
  inserted_user.createdBy = req.user.id;

  if (!data.id) {

    message = "Organiser has been successfully created";
  } else {
    message = "Organiser has been successfully updated";
  }

  let UserDataRes = await User.query().upsertGraph(inserted_user).returning('id');

  res.setHeader('Content-Type', 'application/json');
  delete inserted_user.password;

  return createdResponse(res,
    "", message);
}


/**
 * Delete Organiser
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const deleteOrganiser = async (req, res) => {

  let deletedUser = await User.query().deleteById(req.params.id);
  return okResponse(res, "", "User have been deleted suceessfully");
}


/**
 * Get Venue for Adimin
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const getAllVenue = async (req, res) => {

  let data = req.query;

  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = limit * (page - 1);
  let query = Venue.query().skipUndefined().select('id', 'venueName', 'venueAddress', 'websiteURL', 'latitude', 'longitude', 'is_active', 'venueCapacity', 'allotedTicket', 'ticketCapacityPercent')
  .eager('[daysAvailable,venueImages, users, subVenues]')
  .modifyEager('daysAvailable', builder => {
    builder.select('weekDayName')
  }).modifyEager('users', builder => {
    builder.select('name', 'email')
  }).modifyEager('venueImages', builder => {
    builder.select('id', 'venueImages')
  }).modifyEager('subVenues', builder => {
    builder.count('id as subVenueCount').groupBy('venueId').first()
  }).where( builder => {
    if(data.searchValue){
      builder.where('venueName', 'iLike', '%'+data.searchValue+'%').orWhere('venueAddress', 'iLike', '%'+data.searchValue+'%');
    }
  })
  if(data.sortBy!="") {
    query.orderBy('venueName', data.sortBy)
  }else {
    query.orderBy('id', 'desc')
  }
  query.offset(offset).limit(limit);
  let venueData = await query;
 
  //Total Count
  let queryCount = await Venue.query().skipUndefined().count('id as totalDataCount')
  .where( builder => {
    if(data.searchValue){
      builder.where('venueName', 'iLike', '%'+data.searchValue+'%').orWhere('venueAddress', 'iLike', '%'+data.searchValue+'%');
    }
  }).first();
  
  return okResponse(res, {venueList:venueData, totalDataCount:queryCount.totalDataCount}, Message("venueFound"));
}


/**
 * addUpdateVenue
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const addUpdateVenue = async (req, res) => {

  let data = req.body;
  let message;
  let days, contact;
  
 
  if(data.availability){
    data.daysAvailable = JSON.parse(data.availability);

  }
  delete data.availability;
  if(data.subVenue) {
    data.subVenues = JSON.parse(data.subVenue);
  }
  delete data.subVenue;

  if(req.files.length > 0){
    data.venueImages = await req.files.map((file) => {
      return {
        venueImages: file.location
      };
    });
   
 }
  
  //sub venue delete
  if(data.isSubVenueDeleted){
    await SubVenue.query().del().whereIn('id', JSON.parse(data.isSubVenueDeleted));
  }
  delete data.isSubVenueDeleted;
  //vailability delete
  if(data.isAvailabilityDeleted){
    await daysAvailable.query().del().whereIn('id', JSON.parse(data.isAvailabilityDeleted));
  }
  delete data.isAvailabilityDeleted;
  //image delete
  if(data.isImageDeleted){
    await VenueImages.query().del().whereIn('id', JSON.parse(data.isImageDeleted));
  }
  delete data.isImageDeleted;
  
  data.is_active = true;
  data.createByAdmin = req.user.id;
  if (!data.id) {
    message = "Venue has been successfully created";
    data.allotedTicket = data.venueCapacity;
    data.ticketCapacityPercent = 100; //default 100%
  } else {
    data.id = parseInt(data.id)
    data.allotedTicket = knex.raw('"venueCapacity" * "ticketCapacityPercent" / 100')
    message = "Venue has been successfully updated";
  }
 
  let [err, addVenue] = await to(transaction(Venue.knex(), trx => {
    return (
        Venue.query(trx)
            .upsertGraphAndFetch(data, {
              noDelete: true,
            })
    );
  }));
  if (err) {
      return errorResponse(res, '', err.message);
  }
  return createdResponse(res,"", message);
}


/**
 * deleteVenue
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const deleteVenue = async (req, res) => {
  let data = req.params;
  let checkVenue = await Event.query().select().where('venueId', data.id);

  if (checkVenue != "") {
    return badRequestError(res, "", Message("venueNotDelete"));
  } else {

    let checkId = await Venue.query().select().where('id', data.id);

    if (checkId == "") {
      return badRequestError(res, "", "Error in deleting Venue");
    }
    let deletedVenue = await Venue.query().deleteById(data.id);
    return okResponse(res, "", Message("venueDelete"));

  }
}


/**
 * get Admin dashboard  
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */


const dashboard = async (req, res) => {
 

  let UserCount = await User.query().count('id').where('userType', 'customer').first();
  let VenuerCount = await User.query().count('id').where('userType', 'venuer').first();
  let PromotorCount = await User.query().count('id').where('userType', 'promoter').first();
  let memberCount = await User.query().count('id').where('userType', 'member').first();
  let HostCount = await User.query().count('id').where('userType', 'host').first();
  let EventCount = await Event.query().count('id').first();
  let venueCount = await Venue.query().count('id').first();
  let subVenueCount = await SubVenue.query().count('id').first();

  let CatCount = await Category.query().count('id').first();
  let SubCatCount = await SubCategory.query().count('id').first();

 

  //Weekly Dates
  const today = moment();
  let weekStart = moment().startOf('isoWeek').format();
  let weekEnd = moment().endOf('isoWeek').format()

  let weeklyAmount = await Payment.query().select('amount').whereBetween('created_at', [weekStart, weekEnd]).where('status', 'succeeded');
  let weeklyAmountData = Array.prototype.map.call(weeklyAmount, s => parseFloat((s.amount)))
  let TotalWeeklyAmount = weeklyAmountData.reduce((a, b) => a + b, 0)
  let WeeklyPayment = TotalWeeklyAmount / 100;

  //monthly Dates
  const startOfMonth = moment().startOf('month').format();
  const endOfMonth = moment().endOf('month').format();
  let monthlyAmount = await Payment.query().select('amount').whereBetween('created_at', [startOfMonth, endOfMonth]).where('status', 'succeeded');

  let monthlyAmountData = Array.prototype.map.call(monthlyAmount, s => parseFloat((s.amount)))
  let TotalMonthlyAmount = monthlyAmountData.reduce((a, b) => a + b, 0)
  let MonthlyPayment = TotalMonthlyAmount / 100;

  //yearly Dates
  const startOfyearly = moment().startOf('year').format();
  const endOfyearly = moment().endOf('year').format();
  let yearlyAmount = await Payment.query().select('amount').whereBetween('created_at', [startOfyearly, endOfyearly]).where('status', 'succeeded');

  let yearlyAmountData = Array.prototype.map.call(yearlyAmount, s => parseFloat((s.amount)))
  let TotalyearlyAmount = yearlyAmountData.reduce((a, b) => a + b, 0)
  let yearlyPayment = TotalyearlyAmount / 100;

  let dashboardData = {
    "venue": venueCount,
    "subVenue": subVenueCount,
    "users": UserCount,
    "venuer": VenuerCount,
    "host": HostCount,
    "promoter": PromotorCount,
    "member": memberCount,
    "event": EventCount,
    "cat": CatCount,
    "subCat": SubCatCount,
    "yearlyPayment": yearlyPayment,
    "monthlyPayment": MonthlyPayment,
    "weeklyPayment": WeeklyPayment
    
  };

  return okResponse(res, dashboardData, "Get List of details");
}


/**
 * getPaymentReq
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const getPaymentReq = async (req, res) => {

  let PaymentReqData = await User.query().skipUndefined().select('id', 'name', 'isVerified', 'isReleased', 'phoneNo', 'countryCode', 'latitude', 'longitude', 'address', 'totalAmount', 'currentAmounts').eager('[events, ticket_info,bank_details, payment]')
    .modifyEager('events', builder => {
      builder.select('id', 'name', 'start', 'end')
    })
    .modifyEager('ticket_info', builder => {
      builder.select()
    })
    .modifyEager('bank_details', builder => {
      builder.select('bankName', 'AccountNo', 'routingNo')
    })
    .modifyEager('payment', builder => {
      builder.select()
    })
  if (!PaymentReqData || PaymentReqData == '' || undefined) {
    return notFoundError(res, Message("venueNotFond"));
  }
  return okResponse(res, PaymentReqData, "Get Payment Reqest");
}

/**
 * venueStatus - Status Change
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const venueStatus = async (req, res) => {

  let data = req.body;

  let venueStatus = await Venue.query()
    .patch({
      is_active: data.is_active
    })
    .where({
      id: data.id
    });

  return okResponse(res, [], "Venue Status has been changed Successfully !");
};

/**
 * userStatus - Status Change
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const userStatus = async (req, res) => {
 
  let data = req.body;

  let userStatus = await User.query()
    .patch({
      is_active: data.is_active
    })
    .where({
      id: data.id
    });

  return okResponse(res, [], "User Status has been changed Successfully !");
};


/**
 * eventStatus - Status Change
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const eventStatus = async (req, res) => {
 
  let data = req.body;

  let eventStatus = await Event.query()
    .patch({
      is_active: data.is_active
    })
    .where({
      id: data.id
    });

  return okResponse(res, [], "Event Status has been changed Successfully !");
};


/**
 * transStatus - Status Change
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const transStatus = async (req, res) => {
 
  let data = req.body;

  let eventStatus = await TransactionHistory.query()
    .patch({
      transStatus: data.transStatus
    })
    .where({
      id: data.id
    });

  return okResponse(res, [], "Status has been changed Successfully !");
};

/**
 * eventTicketInfo for Admin Side
 * @params req.body;
 * @return promise
 */

const eventTicketInfo = async (req, res) => {
 
  let todayDate = new Date();
  let todayTime = moment().format('HH:mm:ss');
  let eventId = req.params.id;

  //Event - selling Date and time
  let EventTiming = await Event.query().skipUndefined().select('sellingStart', 'sellingStart', 'sellingEnd', 'is_availability', 'name').where('id', eventId).first();
  if (!EventTiming) {
    return badRequestError(res, {}, "Event not found");
  }

  // Tickets 
  let returnData = await TicketInfo.query().skipUndefined().select('id', 'ticketType', 'ticketName', 'noOfTables', 'pricePerTable', 'description', 'totalQuantity', 'parsonPerTable', 'pricePerTicket', 'discountedPrice', 'isTicketDisabled', 'disPercentage', 'actualQuantity', 'eventId').where('eventId', eventId).andWhere('totalQuantity', '>', 0).orderBy('created_at', 'desc')

  let resultData = {
    "event": EventTiming.name,
    "tickets": returnData
  }

  /** Tickit Availbale checking Date and Time */
  //Past Ticket
  if (todayDate > EventTiming.sellingEnd) {
 
    return badRequestError(res, {}, Message("ticketNotFound"));
  }

  //Current Ticket
  else if (todayDate < EventTiming.sellingEnd && EventTiming.is_availability == true) {
  
    return okResponse(res, resultData, Message("ticketList"));
  }

  //Future Ticket
  else if (todayDate < EventTiming.sellingStart && todayDate < EventTiming.sellingEnd && EventTiming.is_availability == false) {
   
    let futureData = {
      futureTicket: EventTiming.sellingStart.toISOString().slice(0, 19).replace('T', ' ')
    }
    return ticketFutureErrRes(res, futureData, Message("ticketWillAvail"));
  } else {
    return badRequestError(res, {}, Message("ticketNotFound"));
  }

}
 
/**
 * getAllevents for Admin Side
 * @params req.body;
 * @return promise
 */

const getAllevents = async (req, res) => {
  let page = (req.query.page) ? req.query.page : 1;
  let limit = req.query.limit ? req.query.limit : 100;
  let offset = limit * (page - 1);
  let event = await Event.query()
    .select()
    .where((builder) => {
      if (req.query.search) {
        builder.where("name", 'ilike', '%' + req.query.search + '%')
      }
    })
    .where((builder) => {
      if (req.query.type) {
        if (req.query.type == "current") {
          let currentDate = new Date();
        
          builder.where("end", ">", currentDate);
        }
        if (req.query.type == "upcomming") {
          let currentDate = new Date();
          builder.where("end", '>', currentDate);
        }
        if (req.query.type == "past") {
          let currentDate = new Date();
          builder.where("end", '<', currentDate);
        }
      }
    })
    .where((builder) => {
      if (req.query.toDate) {
        let toDate = dateFormat(new Date(req.query.toDate), "yyyy-mm-dd");
        builder.andWhere('created_at', '>=', toDate + ' 00:00:59');
      }
      if (req.query.fromDate) {
        let fromDate = dateFormat(new Date(req.query.fromDate), "yyyy-mm-dd");
        builder.andWhere('created_at', '<=', fromDate + ' 23:59:59');
      }
    })
    .mergeNaiveEager('[eventImages, venueEvents as address, users ]').modifyEager('eventImages', builder => {
      builder.select('eventImage').limit(1)
    })
    .modifyEager('address', builder => {
      builder.select('latitude', 'longitude', 'venueAddress').first()
    })
    .modifyEager('users', builder => {
      builder.select('name', 'email').first()
    })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  return okResponse(res, event, "Event data fetched");
}


/**
 * Get Venue for Adimin
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const getAllIssues = async (req, res) => {
  let ListIssues = await AppContent.query().select("id", "heading", "isActive").where('type', 'issues');
  if (!ListIssues || ListIssues == '' || undefined) {
    return notFoundError(res, "Query List");
  }
  return okResponse(res, ListIssues, "Query List");
}


/**
 * getIssuesQuery
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const getIssuesQuery = async (req, res) => {
  let issueId = req.params.issueId;
  let ListIssues = await Contact.query().select("id", "message", "email", "issueId", "userId").eager("[users, issues]")
  .modifyEager("users", builder => {
    builder.select("id", "name", "email", "userType")
})
.modifyEager("issues", builder => {
  builder.select("heading as name")
})
.where('issueId', issueId);
  if (!ListIssues || ListIssues == '' || undefined) {
    return notFoundError(res, "", "Query list not found");
  }
  return okResponse(res, ListIssues, "Query List");
}




/**
 * Issues post
 * @params get type no params;
 * @return promise
 */


const addUpdateIssues = async (req, res) => {
 
  let data = req.body;
  data.type = "issues"
 
  let message;
  if (!data.heading) {
    return badRequestError(res, "", "Please enter Issue");
  }
  if (!data.id) {

    message = "Issue has been successfully created";
  } else {
    message = "Issue has been successfully updated";
  }

  let UserDataRes = await AppContent.query().upsertGraph(data).returning('id');


  return createdResponse(res,
    "", message);
}



/**
 * deleteIssues
 * @params get type no params;
 * @return promise
 */


const deleteIssue = async (req, res) => {
  let data = req.params;
  let check = await AppContent.query().select('id').where('id', data.id).first();
  if(check){
    let deletedVenue = await AppContent.query().deleteById(data.id);
    return okResponse(res, "", "Issue Deleted");
  }
  return okResponse(res, "", "Issue not found");
}


/**
 * userStatus - Status Change
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const statusIssues = async (req, res) => {

  let data = req.body;

  let statusIssues = await AppContent.query()
    .patch({
      isActive: data.isActive
    })
    .where({
      id: data.id
    });

  return okResponse(res, [], "Issue Status has been changed Successfully");
};



/**
 * getPaymentReq
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const getUsePayment = async (req, res) => {
  let data = req.query;
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = limit * (page - 1);

  let PaymentReqData = await TicketBooked.query().skipUndefined().select()
  .innerJoinRelation('[events, ticket_info,users, payment]')
  .eager('[events, ticket_info,users, payment]')
    .modifyEager('events', builder => {
      builder.select('id', 'name', 'start', 'end', 'userId', 'paidType')
      .eager('[users]')
        .modifyEager('users', builder => {
          builder.select('id', 'name')
        })
    })
    .modifyEager('ticket_info', builder => {
      builder.select()
    })
    .modifyEager('users', builder => {
      builder.select('id', 'name', 'email', 'phoneNo', 'address')
      .where(builder => {
        if(data.searchValue){
          builder.where('name', 'iLike', '%'+data.searchValue+'%');
        }
      })
    })

    .modifyEager('payment', builder => {
      builder.select("id", "status", "amount", "QRkey", "created_at")
    })
    .where(builder => {
    
      if(data.searchValue){
        builder.where('users.name', 'iLike', '%'+data.searchValue+'%');
      }
    }).offset(offset).limit(limit).runAfter( (result, builder) => {
      console.log(builder.toKnexQuery().toQuery())
      return result;
  });;

  if (!PaymentReqData || PaymentReqData == '' || undefined) {
    return notFoundError(res, Message("venueNotFond"));
  }
  return okResponse(res, PaymentReqData, "Get Payment Reqest");
}


/**
 * getOrganiserPaymentReq
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const getOrganiserPaymentReq = async (req, res) => {
  let data = req.query;
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = limit * (page - 1);

  let PaymentReqData = await TransactionHistory.query().skipUndefined().select( 'withdrawnAmount', 'transStatus')
    .innerJoinRelation('[users, bank_details]')
    .eager('[users, bank_details]')
    .modifyEager('users', builder => {
      builder.select('id', 'name', 'email', 'phoneNo', 'address', 'totalAmount', 'currentAmounts', 'isVerified', 'isReleased')
        .where((builder) => {
          if (req.query.search) {
            builder.where("name", 'ilike', '%' + req.query.search + '%')
          }
        })
        .eager('events')
        .modifyEager('events', builder => {
          builder.select('id', 'name', 'start', 'end', 'sellingStart', 'sellingEnd', 'eventType', 'paidType')
        })
    })
    .modifyEager('bank_details', builder => {
      builder.select('AccountNo', 'bankName', 'routingNo', 'active')
    })
    .where(builder => {
    
      if(data.searchValue){
        builder.where('users.name', 'iLike', '%'+data.searchValue+'%');
      }
    })
    .offset(offset).limit(limit);
  if (!PaymentReqData || PaymentReqData == '' || undefined) {
    return notFoundError(res, Message("venueNotFond"));
  }
  return okResponse(res, PaymentReqData, "Get Payment Reqest");
}

/**
 * isReleasedStatus - Status Change
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const isReleasedStatus = async (req, res) => {
 
  let data = req.body;
  let AmountData = 0;
  //organiser info
  let checkCurrentBalance = await User.query().select("currentAmounts", "accountId", "currencyCode", "accountId").where("id", data.id).first();

  //organiser withdrawnAmount req
  let checkReqBalance = await TransactionHistory.query().select("withdrawnAmount", "bankId", "id").where("userId", data.id).where("transStatus", "pending").first();
  if(checkReqBalance){
     let withdrawnAmount = checkReqBalance.withdrawnAmount;
     let OrgCurrentAmout = checkCurrentBalance.currentAmounts;
       AmountData = OrgCurrentAmout - withdrawnAmount;
     //check Balance req with current balance
     if (OrgCurrentAmout < withdrawnAmount) {
       return badRequestError(res, [], "Can not Relase a payment because Organiser current Amount is to Low !");
     }
  }else {
    return badRequestError(res, [], "Oops! required already completed, not found any pedding request");
  }

  // update isReleased flag
  let statusReleased = await User.query().patch({
    isReleased: data.isReleased
  }).where({
    id: data.id
  });

  let getBankId = await bankDetails.query().select('id').where('userId', data.id).first();

  //organiser get bankIdKey 
  let selBank = await bankDetails.query().select('bankIdKey').skipUndefined().where('id', getBankId.id).first();
  
  if (selBank) {
    data.bankId = selBank.bankIdKey;
  } else {
    return badRequestError(res, "", "Invalid bank detail");
  }

  const stripeAmount = withdrawnAmount; //multiple for stripe payment (100 eq 1$)
  let createTransfer = await stripe.transferCreate({
    amount: stripeAmount,
    currency: checkCurrentBalance.currencyCode,
    stripe_account_id: checkCurrentBalance.accountId
  });
  if (createTransfer.status == true) {
    let paymentOrganiser = await stripe.payoutsCreate({
      amount: stripeAmount,
      currency: checkCurrentBalance.currencyCode,
      stripe_account_id: checkCurrentBalance.accountId,
      bankId: data.bankId
    });
    
    if (paymentOrganiser.status == false) {
      return badRequestError(res, "", paymentOrganiser.data.message);
    }
  } else {
    return badRequestError(res, "", createTransfer.data.message);
  }

  let TransaHisData = await TransactionHistory.query().update({
    transStatus: "completed"
  }).where('id', checkReqBalance.id);

  let withdrawnData = await User.query().update({
    currentAmounts: AmountData
  }).where('id', data.id);
  return okResponse(res, "", Message("withdrawnReq"));
 
};


/**
 * isVerifiedStatus - Status Change
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const isVerifiedStatus = async (req, res) => {
  
  let data = req.body;

  let statusVerified = await User.query()
    .patch({
      isVerified: data.isVerified
    })
    .where({ 
      id: data.id
    });

  return okResponse(res, [], "Verified Status has been changed Successfully");
};



/**
 * updateFCMtoken
 * @params req.body
 * @return promise
 */


const updateFCMtoken = async (req, res) => {
  let data = req.body;

  let updated = await to(Admin.query().patch({
    device_token: data.device_token,
  }).where({ 'id': data.userId }));

  if (updated) {
   let AdminUPdate = await to(Admin.query().patch({
      device_token: "",
    }).where('device_token', data.device_token).whereNot('id', data.userId));

    return okResponse(res, {}, "Token updated successfully.");
  }
}

const paidEventList = async (req, res) => {
  let data = req.query;
  let eventData, where;
  let sortBy = (data.sortBy!=undefined) ? data.sortBy: 2;
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = (page == 1) ? 0 : (page-1)*100;
  let query = Event.query().select('events.id', 'name', 'MinPaidAmount', 'events.created_at')
    .whereNotNull('paymentDetail')
    .innerJoinRelation('eventChooseSubcategory')
    .mergeNaiveEager('[users, eventCategories, eventSubCategories]')
    .modifyEager('users', builder => {
      builder.select('name')
    })
    .modifyEager('eventCategories', builder => {
      builder.select('categoryName').groupBy("category.id",'eventChooseSubcategory.categoryId', "eventChooseSubcategory.eventId");
    })
    .modifyEager('eventSubCategories', builder => {
      builder.select('subCategoryName').groupBy("subCategory.id",'eventChooseSubcategory.subCategoryId', "eventChooseSubcategory.eventId");
    })
    .where(builder => {
      
      if(data.subCategoryId){
        var array = data.subCategoryId.split(',');
       
        builder.whereIn('eventChooseSubcategory.subCategoryId', array);
      }
      if(data.searchValue){
        builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
      }
    }).groupBy('events.id', "eventChooseSubcategory.eventId")
    if(sortBy == 1){
      query.orderBy('events.name', 'ASC')
    }else if(sortBy == 2) {
      query.orderBy('events.name', 'DESC')
    }else {
      query.orderBy('events.id', 'DESC')
    }
    query.offset(offset).limit(limit);
    eventData = await query;
    //total count
    let dataCount = Event.query().select( knex.raw('count(distinct(events.id)) as "totaldataCount"'))
    .whereNotNull('paymentDetail');
    if(data.categoryId!="" || data.subCategoryId!=""){
      dataCount = dataCount.innerJoinRelation('eventChooseSubcategory')
    }
    dataCount.where(builder => {
     
      if(data.subCategoryId){
        var array = data.subCategoryId.split(',');
        builder.whereIn('eventChooseSubcategory.subCategoryId', array);
      }
      if(data.searchValue){
        builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
      }
    }).first();
    let totalDataCount = await dataCount;
    return okResponse(res, { eventList :eventData, totalDataCount : totalDataCount.totaldataCount} ,"Event List successfully get");
}

const paidEventDetail = async (req, res) => {
  let eventData;
  eventData = await Event.query().select('id', 'name', 'description', 'start', 'end', 'eventHelpLine', 'hostMobile', 'hostAddress', 'websiteUrl', 'paymentDetail', 'MinPaidAmount', 'userLikeCount', 'userDisLikeCount', 'created_at', 'paymentDateTime', 'invoiceNo', 'eventType').whereNotNull('paymentDetail')
    .mergeNaiveEager('[users, eventImages, venueEvents, eventCategories, eventSubCategories, eventOccurrence]')
    .modifyEager('users', builder => {
      builder.select('name', 'email')
    })
    .modifyEager('venueEvents', builder => {
      builder.select('venueId','venueName', 'latitude', 'longitude', 'venueAddress')
    })
    .modifyEager('eventOccurrence', builder => {
      builder.select('eventOccurrence')
    })
    .modifyEager('eventImages', builder => {
      builder.select('eventImage','isPrimary')
    })
    .modifyEager('eventCategories', builder => {
      builder.select('categoryName')
    })
    .modifyEager('eventSubCategories', builder => {
      builder.select('subCategoryName')
    }).first();
    return okResponse(res, eventData, "Event List successfully get");
}
//add paid event amount calculation rules
const addRules = async (req, res) => {
  let data = req.body;
  let err, updateData;


  if(!data){
    return badRequestError(res, "", "Required parameter not found");
  }
  if(data.ruleType != 'inactiveAccount'){
    let updateRuleStatustrue = await PaidEventPricing.query().update({ 'isActive': true}).where('ruleType',data.ruleType).andWhere('isActive', false);
    let updateRuleStatus = await PaidEventPricing.query().update({ 'isActive': false}).whereNot('ruleType',data.ruleType).whereNot('ruleType', 'inactiveAccount').andWhere('isActive', true);
  }
  [err,updateData] = await to(PaidEventPricing.query().upsertGraph(data.rules));
  if(err){
    return badRequestError(res, "", err);
  }
   return okResponse(res, "", "Rules successfully updated");
}

const getOtherAdminList = async (req, res) => {
  
  let [err, list] = await to(Admin.query().select('id', 'first_name', 'last_name', 'user_type').whereNot('id', req.user.id).where('user_status', 'active'));
  if (!list) {
    return badRequestError(res, "", "Admin user not found");
  }
  return okResponse(res, list, "Admin user list successfully get");
}

const createNote = async (req, res) => {
  let data = req.body;
  if(!data.notes){
    return badRequestError("Notes required");
  }
  data.userId = req.user.id;
  let [err, eventCreated] = await to(Notes.query().insertGraph(data).returning("id"));
  if(err || !eventCreated){
     return badRequestError(res,"",err);
  }
  let adminData = await Admin.query().select('device_token').whereIn('id', data.shareNotes.map(c => c.userId)).whereNotNull('device_token');
  //Notification Process (send to Admin)
  if(adminData){
    let adminNotifiy = await AdminNotification.notes({'deviceToken':adminData}, {});
  }

  return okResponse(res, {}, "Notes Creation Successfull");
}

const notesList = async (req, res) => {
  let data = req.query;
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = (page == 1) ? 0 : (page-1)*100;
  let totalsend = 0, totalreceived = 0, totalDataCount =0;
  let [err,send] = await to(Notes.query().select('notes.id', 'notes', 'isPrivate', 'notes.created_at', knex.raw('(select first_name from admin where id = "userId")'), knex.raw('(select last_name from admin where id = "userId")'),knex.raw("(CASE WHEN \"userId\" = "+req.user.id+" THEN true ELSE false END) as isOwnNotes"))
  .eager('notesManyRelation')
  .modifyEager('notesManyRelation', builder => {
      builder.select('first_name', 'last_name' , 'user_type')
  })
  .where('notes.userId', req.user.id)
  .orderBy('notes.id', 'desc')
  .offset(offset).limit(limit));
  if(err){
    return badRequestError(res,"",err);
  }
  if(send){
    totalsend = await Notes.query().count('id').where('userId', req.user.id).first();
    totalDataCount = totalsend.count;
  }
  
  let [errs,received] = await to(Notes.query().select('notes.id', 'notes', 'isPrivate', 'notes.created_at', knex.raw('(select first_name from admin where id = "notes"."userId")'), knex.raw('(select last_name from admin where id = "notes"."userId")'), knex.raw("(CASE WHEN \"notes\".\"userId\" = "+req.user.id+" THEN true ELSE false END) as isOwnNotes"))
  //.innerJoinRelation('notesManyRelation')
  .join('sharedNotes', 'notes.id', '=', 'sharedNotes.notesId', 'AND', 'notes.userId', '=', req.user.id)
  .eager('notesManyRelation')
  .modifyEager('notesManyRelation', builder => {
      builder.select('first_name', 'last_name', 'user_type')
  })
  .where('sharedNotes.userId', req.user.id)  
  .orderBy('notes.id', 'desc')
  .offset(offset).limit(limit));
  if(errs){
      return badRequestError(res,"",errs);
  }
  if(received){
    totalreceived = await knex('sharedNotes').count('id').where('userId', req.user.id).first();
    totalDataCount = parseInt(totalDataCount) + parseInt(totalreceived.count);
  }
  if (!received && !send) {
    return badRequestError(res, "Notes not found");
  }
  let mergeArr = [...send, ...received];
  return okResponse(res, { notesData:mergeArr, totalDataCount: totalDataCount}, "Notes list successfully get");
}

const highlightEvent = async (req, res) => {
  let data = req.body;
  if(!data.eventId){
    return badRequestError(res, "", "Event id required");
  }
  let [err, updateHighlightStatus] = await to(Event.query().select('isHighLighted').findById(data.eventId)
      .patch({
          isHighLighted: data.isHighLighted
      }))
  if(err){
    return badRequestError(res, "", Message('SomeError'))
  } 
  if(updateHighlightStatus){
    return okResponse(res, "", Message("StatusChanges"));
  }
  return badRequestError(res, "", Message('eventNotFond'))
};

const priorityEvent = async (req, res) => {
  let data = req.body;
  if(!data.eventId){
    return badRequestError(res, "", "Event id required");
  }
  let priorityevent = await Event.query().select('priority','id').where('priority',data.priority).first();
  console.log(priorityevent);
  if(priorityevent){
    let updatep = await Event.query().select('priority').findById(priorityevent.id)
    .patch({
        priority: null
    })
  }
  let [err, updateHighlightStatus] = await to(Event.query().select('priority').findById(data.eventId)
      .patch({
          priority: data.priority
      }))
  if(err){
    return badRequestError(res, "", Message('SomeError'))
  } 
  if(updateHighlightStatus){
    return okResponse(res, "", Message("StatusChanges"));
  }
  return badRequestError(res, "", Message('eventNotFond'))
};

const highLightedEventList = async (req, res) => {
  let data = req.query;
  let sortBy = data.sortBy;
  let currentDate = new Date();
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = (page == 1) ? 0 : (page-1)*100;
  let joinData = '[eventChooseSubcategory';
  if(sortBy == 2){
    joinData = joinData+', ticket_info]';
  }else{
    joinData += ']';
  }

  let [err, eventData] = await to(Event.query().select('events.id', 'isHighLighted','isExploreEvent','priority','events.name', 'eventType', 'paidType', 'start', 'end', 'is_active', 'userLikeCount', 'userDisLikeCount', knex.raw('(select coalesce(sum("actualQuantity"), 0) from "ticket_info" where "ticket_info"."eventId" = "events"."id") as actualQuantity'), knex.raw('(select sum("totalQuantity") from "ticketBooked" where "ticketBooked"."eventId" = "events"."id") as attendeesCount'))
  .innerJoinRelation(`${joinData}`)
  .mergeNaiveEager('[eventCategories, eventSubCategories, ticket_info]')
  .modifyEager('users', builder => {
    builder.select('name')
  })
  .modifyEager('ticket_info', builder => {
    builder.select(knex.raw('round(sum("actualQuantity")/sum("pricePerTicket")) as averagePrice')).whereIn('ticketType', ['regularPaid','vipTableSeating','vipNormal']).groupBy('eventId')
  })
  .modifyEager('eventCategories', builder => {
    builder.select('category.id','categoryName').where( builder => {
      if(data.categoryId){
        var catArr = data.categoryId.split(',');
        builder.whereIn('category.id', catArr);
      }
    }).groupBy("category.id", "eventChooseSubcategory.eventId");
  })
  .modifyEager('eventSubCategories', builder => {
    builder.select('subCategory.id','subCategoryName').where( builder => {
      if(data.subCategoryId){
        var array = data.subCategoryId.split(',');
        builder.whereIn('subCategory.id', array);
      }
    }).groupBy("subCategory.id", "eventChooseSubcategory.eventId");
  }).where( builder => {
    if(sortBy == 1){ //paid
      builder.where('eventType', 1)
    }else if(sortBy == 0) {
      builder.where('eventType', 0)
    }
    if(data.categoryId){
      var catArr = data.categoryId.split(',');
      builder.whereIn('eventChooseSubcategory.categoryId', catArr);
    }
    if(data.subCategoryId){
      var array = data.subCategoryId.split(',');
     
      builder.whereIn('eventChooseSubcategory.subCategoryId', array);
    }
    if(data.searchValue){
      builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
    }
    if(data.startDate && data.endDate){
      builder.where(Knex.raw('DATE("events"."start")'), '>=', data.startDate).andWhere(Knex.raw('DATE("events"."start")'), '<=', data.endDate);
    }
  }).where("events.end",'>=',currentDate)
  .groupBy('events.id', "eventChooseSubcategory.eventId")
  .orderBy('isHighLighted', 'desc')
  .offset(offset).limit(limit));
  if(err){
    return badRequestError(res, "", err)
  }
  if (!eventData) {
    return notFoundError("no event found");
  }

  //data count
  let dataCount =  Event.query().select( knex.raw("count(distinct(events.id)) as totalDataCount"));
  if(data.categoryId!="" || data.subCategoryId!=""){
    dataCount = dataCount.innerJoinRelation(`${joinData}`)
  }
  dataCount.where( builder => {
    if(sortBy == 1){ //paid
      builder.where('eventType', 1)
    }else if(sortBy == 0) {
      builder.where('eventType', 0)
    }
    if(data.categoryId){
      var catArr = data.categoryId.split(',');
      builder.whereIn('eventChooseSubcategory.categoryId', catArr);
    }
    if(data.subCategoryId){
      var array = data.subCategoryId.split(',');
      builder.whereIn('eventChooseSubcategory.subCategoryId', array);
    }
    if(data.searchValue){
      builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
    }
    if(data.startDate){
      builder.where(Knex.raw('DATE("events"."start")'), '>=', data.startDate).andWhere(Knex.raw('DATE("events"."start")'), '<=', data.endDate);
    }
  }).first()
  let totaldataCount = await dataCount;
  return okResponse(res, {eventList: eventData, totalDataCount: totaldataCount.totaldatacount}, "Event List successfully get");
}


// Explore Event

const ExploreEventList = async (req, res) => {
  let data = req.query;
  let sortBy = data.sortBy;
  let currentDate = new Date();
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = (page == 1) ? 0 : (page-1)*100;
  let joinData = '[eventChooseSubcategory';
  if(sortBy == 2){
    joinData = joinData+', ticket_info]';
  }else{
    joinData += ']';
  }

  let [err, eventData] = await to(Event.query().select('events.id', 'isHighLighted','isExploreEvent','priority','events.name', 'eventType', 'paidType', 'start', 'end', 'is_active', 'userLikeCount', 'userDisLikeCount', knex.raw('(select coalesce(sum("actualQuantity"), 0) from "ticket_info" where "ticket_info"."eventId" = "events"."id") as actualQuantity'), knex.raw('(select sum("totalQuantity") from "ticketBooked" where "ticketBooked"."eventId" = "events"."id") as attendeesCount'))
  .innerJoinRelation(`${joinData}`)
  .mergeNaiveEager('[eventCategories, eventSubCategories, ticket_info]')
  .modifyEager('users', builder => {
    builder.select('name')
  })
  .modifyEager('ticket_info', builder => {
    builder.select(knex.raw('round(sum("actualQuantity")/sum("pricePerTicket")) as averagePrice')).whereIn('ticketType', ['regularPaid','vipTableSeating','vipNormal']).groupBy('eventId')
  })
  .modifyEager('eventCategories', builder => {
    builder.select('category.id','categoryName').where( builder => {
      if(data.categoryId){
        var catArr = data.categoryId.split(',');
        builder.whereIn('category.id', catArr);
      }
    }).groupBy("category.id", "eventChooseSubcategory.eventId");
  })
  .modifyEager('eventSubCategories', builder => {
    builder.select('subCategory.id','subCategoryName').where( builder => {
      if(data.subCategoryId){
        var array = data.subCategoryId.split(',');
        builder.whereIn('subCategory.id', array);
      }
    }).groupBy("subCategory.id", "eventChooseSubcategory.eventId");
  }).where( builder => {
    if(sortBy == 1){ //paid
      builder.where('eventType', 1)
    }else if(sortBy == 0) {
      builder.where('eventType', 0)
    }
    if(data.categoryId){
      var catArr = data.categoryId.split(',');
      builder.whereIn('eventChooseSubcategory.categoryId', catArr);
    }
    if(data.subCategoryId){
      var array = data.subCategoryId.split(',');
     
      builder.whereIn('eventChooseSubcategory.subCategoryId', array);
    }
    if(data.searchValue){
      builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
    }
    if(data.startDate){
      builder.where(Knex.raw('DATE("events"."start")'), '>=', data.startDate).andWhere(Knex.raw('DATE("events"."start")'), '<=', data.endDate);
    }
  }).groupBy('events.id', "eventChooseSubcategory.eventId")
  .orderBy('isExploreEvent', 'desc')
  .offset(offset).limit(limit));
  if(err){
    return badRequestError(res, "", err)
  }
  if (!eventData) {
    return notFoundError("no event found");
  }

  //data count
  let dataCount =  Event.query().select( knex.raw("count(distinct(events.id)) as totalDataCount"));
  if(data.categoryId!="" || data.subCategoryId!=""){
    dataCount = dataCount.innerJoinRelation(`${joinData}`)
  }
  dataCount.where( builder => {
    if(sortBy == 1){ //paid
      builder.where('eventType', 1)
    }else if(sortBy == 0) {
      builder.where('eventType', 0)
    }
    if(data.categoryId){
      var catArr = data.categoryId.split(',');
      builder.whereIn('eventChooseSubcategory.categoryId', catArr);
    }
    if(data.subCategoryId){
      var array = data.subCategoryId.split(',');
      builder.whereIn('eventChooseSubcategory.subCategoryId', array);
    }
    if(data.searchValue){
      builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
    }
    if(data.startDate){
      builder.where(Knex.raw('DATE("events"."start")'), '>=', data.startDate).andWhere(Knex.raw('DATE("events"."start")'), '<=', data.endDate);
    }
  }).first()
  let totaldataCount = await dataCount;
  return okResponse(res, {eventList: eventData, totalDataCount: totaldataCount.totaldatacount}, "Event List successfully get");
}

const eventDetail = async (req, res) => {
  let eventId = req.params.id;
  let eventData;
  eventData = await Event.query().select('id', 'eventCode', 'isHighLighted','isDeleted','isArchived', 'name', 'description', 'start', 'end', 'eventHelpLine', 'hostMobile', 'hostAddress', 'websiteUrl', 'paymentDetail', 'MinPaidAmount', 'userLikeCount', 'userDisLikeCount', 'eventType', 'created_at', knex.raw('(select coalesce(sum("totalQuantity"),0) from "ticketBooked" where "ticketBooked"."eventId" = "events"."id") as attendeesCount'), knex.raw('(select coalesce(sum("actualQuantity"), 0) from "ticket_info" where "ticket_info"."eventId" = "events"."id") as actualQuantity'))
    .mergeNaiveEager('[users, eventImages, venueEvents, eventCategories, eventSubCategories, eventOccurrence, ticket_info]')
    .modifyEager('users', builder => {
      builder.select('name', 'email')
    })
    .modifyEager('venueEvents', builder => {
      builder.select('venueId','venueName', 'latitude', 'longitude', 'venueAddress')
    })
    .modifyEager('eventOccurrence', builder => {
      builder.select('eventOccurrence')
    })
    .modifyEager('eventImages', builder => {
      builder.select('eventImage','isPrimary').orderBy('id', 'asc')
    })
    .modifyEager('eventCategories', builder => {
      builder.select('categoryName').groupBy('category.id', 'eventChooseSubcategory.eventId')
    })
    .modifyEager('eventSubCategories', builder => {
      builder.select('subCategoryName').groupBy('subCategory.id', 'eventChooseSubcategory.eventId')
    })
    .modifyEager('ticket_info', builder => {
      builder.select('id', 'sellingStartDate', 'sellingEndDate', 'ticketNumber')
    })
    .where('id', eventId).first();
    return okResponse(res, eventData, "Event List successfully get");
}

const attendeesList = async (req, res) => {
  let data = req.query;
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = limit * (page - 1);
  let eventId = data.eventId;
  let sortBy = data.sortBy;
 
  let query = TicketBooked.query().select("ticketId", knex.raw('(sum("totalQuantity")) as ticketQuantity, (sum("pricePerTicket"::float)) as totalPrice'))
  .innerJoinRelation('users')
  .eager('[users,ticket_info, ticket_number_booked_rel]')
  .modifyEager('users', builder =>{
    builder.select('id', 'name', 'email', 'phoneNo', 'address')
  })
  .modifyEager('ticket_info', builder =>{
    builder.select('id', 'ticketName', 'ticketType', 'ticketNumber')
  })
  .modifyEager("ticket_number_booked_rel", builder => {
    builder.select("id","ticketNumber","status")
  })
  .where('eventId', eventId)
  .where( builder => {
    if(sortBy == 3){
      builder.where('ticketType', 'freeNormal')
    }else if (sortBy == 4){
      builder.where('ticketType', 'regularPaid')
    }else if (sortBy == 5){
      builder.where('ticketType', 'regularNormal') //RSVP
    }else if (sortBy == 6){
      builder.where('ticketType', 'vipNormal') //VIP
    }else if (sortBy == 7){
      builder.where('ticketType', 'regularTableSeating') //Table Seating
    }
    if(data.searchValue){
      builder.where('users.name', 'iLike', '%'+data.searchValue+'%').orWhere('users.email', 'iLike', '%'+data.searchValue+'%').orWhere('users.phoneNo', 'iLike', '%'+data.searchValue+'%');
    }
  })
  .groupBy('users.id','ticketBooked.userId', 'ticketBooked.ticketId', 'ticketBooked.id')
  .orderBy('users.name', (sortBy==1) ? 'ASC' : 'DESC')
  .offset(offset).limit(limit)

  let [err, attendeesUser] = await to(query);
  if(err){
    return badRequestError(res, '', err)
  }
  
  let dataCount = TicketBooked.query().select(knex.raw('count(distinct("userId", "ticketId")) as dataCount'))
  .innerJoinRelation('users')
  .where('eventId', eventId)
  .where( builder => {
    if(sortBy == 3){
      builder.where('ticketType', 'freeNormal')
    }else if (sortBy == 4){
      builder.where('ticketType', 'regularPaid')
    }else if (sortBy == 5){
      builder.where('ticketType', 'regularNormal') //RSVP
    }else if (sortBy == 6){
      builder.where('ticketType', 'vipNormal') //VIP
    }else if (sortBy == 7){
      builder.where('ticketType', 'regularTableSeating') //Table Seating
    }
  }).first();
  let totalDataCount = await dataCount;
  return okResponse(res, {attendeesList:attendeesUser, totalDataCount:totalDataCount.datacount}, "Attendees list get successfully");
};

const updateTicketCapacity = async (req, res) => {
 
  let data = req.body;
  let id = parseInt(data.id)
  if(!data.ticketCapacityPercent){
    return badRequestError(res, '', 'Not valid ticket capacity')
  }
  if(parseInt(data.ticketCapacityPercent) < 100){
    return badRequestError(res, '', 'Ticket capacity should not be less than 100%')
  }
  let [err, updateCapacity] = await to(Venue.query().update({allotedTicket: knex.raw('"venueCapacity" * '+data.ticketCapacityPercent+' / 100'), ticketCapacityPercent:data.ticketCapacityPercent }).where('id', id));

  if (err) {
    return errorResponse(res, '', err.message);
  }
  return okResponse(res,"", "Ticket capacity successfully updated");
}

const getRules = async (req, res) => {
 
  let inactiveAccount = await PaidEventPricing.query().select('id', 'ruleForPartner', 'minValue', 'maxValue', 'amount', 'ruleType', 'isActive').where('ruleType', 'inactiveAccount').orderBy('id', 'asc');
  let postEvent = await PaidEventPricing.query().select('id', 'ruleForPartner', 'minValue', 'maxValue', 'amount', 'ruleType', 'isActive').where('ruleType', 'postEventCount').orderBy('id', 'asc');
  let accountAge = await PaidEventPricing.query().select('id', 'ruleForPartner', 'minValue', 'maxValue', 'amount', 'ruleType', 'isActive').where('ruleType', 'accountAge').orderBy('id', 'asc');
  if(inactiveAccount.length < 1 && postEvent.length < 1 && accountAge.length < 1) {
    return badRequestError(res, "", "Rules not found");
  }
  return okResponse(res, {inactiveAccount:inactiveAccount, postEvent:postEvent, accountAge:accountAge}, "Rules successfully get");
}

const venueDetail = async (req, res) => {
  if(!req.params.id){
    return notFoundError(res, Message("venueNotFond"))
  }
  let id = req.params.id;
  let venue = await Venue.query().skipUndefined().select('id', 'venueName', 'venueAddress', 'websiteURL', 'latitude', 'longitude','venueType', 'is_active', 'countryCode', 'city', 'allotedTicket', 'ticketCapacityPercent','venueCapacity','shortDescription','isVenueAvailableToOtherHosts')
  .where('id', id)
  .eager('[daysAvailable,venueImages,subVenues,adminVenue]')
  .modifyEager('adminVenue', builder => {
    builder.select('first_name','last_name','user_type', 'email_id')
  })
  .modifyEager('daysAvailable', builder => {
    builder.select('id','weekDayName','fromTime','toTime').orderBy('weekDayName', 'asc')
  }).modifyEager('subVenues', builder => {
    builder.select('id','subVenueName','subVenueCapacity')
  }).modifyEager('venueImages', builder => {
    builder.select('id', 'venueImages')
  }).first();


  if (!venue || venue == '' || undefined) {
    return notFoundError(res, Message("venueNotFond"));
  }
  return okResponse(res, venue, Message("venueFound"));
}

const exportAttendeesList = async (req, res) => {
  let data = req.query;
  let eventId = data.eventId;
  let sortBy = data.sortBy;
  let query = TicketBooked.query().select("ticketId")
  .innerJoinRelation('users')
  .eager('[users]')
  .modifyEager('users', builder =>{
    builder.select('id', 'name', 'email', 'phoneNo', 'address')
  })
  .where('eventId', eventId)
  .where( builder => {
    if(sortBy == 3){
      builder.where('ticketType', 'freeNormal')
    }else if (sortBy == 4){
      builder.where('ticketType', 'regularPaid')
    }else if (sortBy == 5){
      builder.where('ticketType', 'regularNormal') //RSVP
    }else if (sortBy == 6){
      builder.where('ticketType', 'vipNormal') //VIP
    }else if (sortBy == 7){
      builder.where('ticketType', 'regularTableSeating') //Table Seating
    }
    if(data.searchValue){
      builder.where('users.name', 'iLike', '%'+data.searchValue+'%').orWhere('users.email', 'iLike', '%'+data.searchValue+'%').orWhere('users.phoneNo', 'iLike', '%'+data.searchValue+'%');
    }
  })
  .groupBy('users.id','ticketBooked.userId', 'ticketBooked.ticketId')
  .orderBy('users.name', (sortBy==1) ? 'ASC' : 'DESC')
  
  let [err, attendeesUser] = await to(query);
  if(err){
    return badRequestError(res, '', err)
  }
  return okResponse(res,  attendeesUser, "Attendees list get successfully");
};

///Venue list for map view
const getVenueForMap = async (req, res) => {

  let venueData = await Venue.query().skipUndefined().select('id', 'venueName', 'venueAddress', 'latitude', 'longitude', 'venueCapacity', knex.raw('(select count("id") from "subVenue" where "subVenue"."venueId" = "venue"."id") as subVenueCount'))
  .orderBy('latitude', 'asc');
  if (!venueData || venueData == '' || undefined) {
    return notFoundError(res, Message("venueNotFond"));
  }
  return okResponse(res, venueData, Message("venueFound"));
}

const subAdminList = async (req, res) => {
  let data = req.query;
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = limit * (page - 1);
  let query = Admin.query().select('id', 'first_name', 'last_name', 'user_type', 'email_id', 'user_status', 'mobile_number')
  .whereNot('id', req.user.id)
  .where('user_type', 'sub_admin')
  .where(builder => {
    if(data.searchValue){
      builder.where('first_name', 'iLike', '%'+data.searchValue+'%').orWhere('last_name', 'iLike', '%'+data.searchValue+'%').orWhere('mobile_number', 'iLike', '%'+data.searchValue+'%').orWhere('email_id', 'iLike', '%'+data.searchValue+'%');
    }
  })
  if(data.sortBy){
    query = query.orderBy("first_name",data.sortBy)
  }else{
    query = query.orderBy("id",'desc')
  }
  query = query.offset(offset).limit(limit);
  let [err, list] = await to(query);
  if(err){
    return badRequestError(res, "", err);
  }
 

  let dataCount = await Admin.query().count('id as totalDataCount')
  .whereNot('id', req.user.id)
  .where('user_type', 'sub_admin')
  .where(builder => {
    if(data.searchValue){
      builder.where('first_name', 'iLike', '%'+data.searchValue+'%').orWhere('last_name', 'iLike', '%'+data.searchValue+'%').orWhere('mobile_number', 'iLike', '%'+data.searchValue+'%').orWhere('email_id', 'iLike', '%'+data.searchValue+'%');
    }
  }).first();
  let totalDataCount = dataCount.totalDataCount; 

  return okResponse(res, {subadminList : list, totalDataCount: totalDataCount}, "Sub-Admin list successfully get");
}

//Change Subadmin status 
const subAdminStatus = async (req, res) => {
  let data = req.body; //pending, active, flagged
  let id = req.params.id;
  let userStatus = await Admin.query().select('id').findById(id)
    .patch({
      user_status: data.status
    })
  if(!userStatus){
    return badRequestError(res, [], "Sub admin detail not found!");  
  }
  return okResponse(res, [], "Sub Admin Status has been changed Successfully !");
};


/**
 * add update sub admin
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const addUpdateSubAdmin = async (req, res) => {
  let data = req.body;
  let message;
  if(data.email_id==""){
    return badRequestError(res, "", 'Email id required')
  }
  if (!data.id) {
    message = "Sub-Admin profile has been successfully created";
    data.user_status = 'active';
    data.user_type = 'sub_admin';
    data.created_at = new Date();
    data.is_email_verified = true
  } else {
    data.id = parseInt(data.id)
    message = "Sub-Admin profile has been successfully updated";
  }
  if(data.subAdminPermission){
    data.subAdminPermission = JSON.stringify(data.subAdminPermission)
  }
 
  let [err, add] = await to(transaction(Admin.knex(), trx => {
    return (
        Admin.query(trx)
            .upsertGraph(data, {
                relate: true,
            })
    );
  }));
  if (err) {
   
      return errorResponse(res, '', err.message);
  }
  if(!data.id){
    EMAIL.sendEmail(data.email_id, "Account Creation", "Hii " + data.first_name + ", <br> Welcome to Event365 Live.<br><br>Please do not share this credentials with anyone for security reasons. You can login in event365live panel using below mentioned credentials " + "<br>" +" Login Id: " + "<b>" + data.email_id + "</b>" + "<br>" +" Password: "+ "<b>" +data.password+ "</b>"+"");
  }
  return createdResponse(res,"", message);
}

const subAdminDetail = async (req, res) => {
  let data = req.params.id;
  let [err, list] = await to(Admin.query().select('id', 'first_name', 'last_name', 'user_type', 'email_id', 'user_status', 'mobile_number', 'subAdminPermission')
  .where('id', data)
  .where('user_type', 'sub_admin'));
  if(err){
    return badRequestError(res, "", err);
  }
  if(!list) {
    return badRequestError(res, "", "Sub-Admin detail not found");
  }
  return okResponse(res, list, "Sub-Admin detail successfully get");
}

//Change Subadmin status 
const updateOrganiserStatus = async (req, res) => {
  let data = req.body; //pending, active, flagged
  let id = (req.params.id) ? req.params.id : 0;
  let jsonData = {
    accountStatus : data.status //active, inactive, flagged
  }
  if(data.status == 'inactive'){
    jsonData.is_active = false;
  }else{
    jsonData.is_active = true;
  }
  let userStatus = await User.query().findById(id).patch(jsonData)
  if(!userStatus){
    return badRequestError(res, "", "Account detail not found!");  
  }
  return okResponse(res, "", "Account status has been changed successfully !");
};

const userDetail = async (req, res) => {
  if(!req.params.id){
    return badRequestError(res, "", "Account detail not found!");  
  }
  let id = req.params.id;
  let UserData = await User.query().skipUndefined().select('id', 'name', 'email', 'countryCode', 'phoneNo', 'address', 'city', 'state', 'countryName', 'zip', 'created_at', 'profilePic', 'shortInfo', 'URL', 'is_active', 'loginType', 'accountStatus', knex.raw('(select sum("id") from "ticketBooked" where "ticketBooked"."userId" = '+id+') as totalEventAttend'), knex.raw('(select sum("totalQuantity") from "ticketBooked" where "ticketBooked"."userId" = '+id+') as totalTicketBooked'))
  .mergeNaiveEager('[userLoginDetail, userPreferenceCategory]')
  .modifyEager('userLoginDetail', builder => {
    builder.select('signInTime', 'signOutTime', 'sourceIp', 'loginType', 'status', 'currentStatus', 'browser', 'OS', 'platform')
  })
  .modifyEager('userPreferenceCategory', builder =>{
    builder.select('categoryName').where('isActive', true).where('is_active', true)
  })
  .where('userType', "customer")
  .where('id', id).first()
  if (!UserData) {
    return badRequestError("Account detail not found!");
  }
  return okResponse(res, UserData, "Get All Customer List");
}

const userAttendEventList = async (req, res) => {
  let data = req.query;
  let id = data.id;
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = (page == 1) ? 0 : (page-1)*100;
  let sortBy = data.sortBy;
  let joinRelation = '[eventChooseSubcategory, ticketBooked';
  if(sortBy == 3){
    joinRelation = joinRelation+ ', favorite]';
  }else if(sortBy==4 || sortBy==5){
    joinRelation = joinRelation+ ', userLikes]';
  }else {
    joinRelation = joinRelation+']';
  }
  let query = Event.query().select('events.id', 'eventCode', 'isHighLighted', 'events.name', 'start', 'end', 'paymentDetail', 'MinPaidAmount', 'eventType', 'events.created_at','paidType')
  .innerJoinRelation(`${joinRelation}`)
  .mergeNaiveEager('[eventCategories, eventSubCategories, userLikes, reviews, users, favorite, ticketBooked]')
  .modifyEager('users', builder => {
    builder.select('users.name', 'users.userType')
  })
  .modifyEager('favorite', builder => {
    builder.select('favorite.isFavorite').where('userId', id)
  })
  .modifyEager('userLikes', builder => {
    builder.select('isLike', 'isDisLike').where('userId', id)
  })
  .modifyEager('reviews', builder => {
    builder.select('reviewStar', 'reviewText').where('userId', id)
  })
  .modifyEager('ticketBooked', builder => {
    builder.select('ticketType', 'created_at', 'totalQuantity', 'pricePerTicket', 'status', 'invoiceNumber').where('userId', id)
  })
  .modifyEager('eventCategories', builder => {
    builder.select('category.id','categoryName').where( builder => {
      if(data.categoryId){
        var catArr = data.categoryId.split(',');
        builder.whereIn('category.id', catArr);
      }
    }).groupBy("category.id", "eventChooseSubcategory.eventId");
  }).modifyEager('eventSubCategories', builder => {
    builder.select('subCategory.id','subCategoryName').where( builder => {
      if(data.subCategoryId){
        var array = data.subCategoryId.split(',');
        builder.whereIn('subCategory.id', array);
      }
    }).groupBy("subCategory.id", "eventChooseSubcategory.eventId");
  })
  .where('ticketBooked.userId', id)
  .where( builder => {
    if(data.categoryId){
      var catArr = data.categoryId.split(',');
      builder.whereIn('eventChooseSubcategory.categoryId', catArr);
    }
    if(data.subCategoryId){
      var array = data.subCategoryId.split(',');
      builder.whereIn('eventChooseSubcategory.subCategoryId', array);
    }
    if(data.searchValue){
      builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
    }
    if(sortBy == 3){ //favourite
      builder.where('favorite.userId', id).where('favorite.isFavorite', true)
    }else if(sortBy == 4){ //like
      builder.where('userLikes.userId', id).where('userLikes.isLike', true)
    }else if(sortBy == 5){ //dislike
      builder.where('userLikes.userId', id).where('userLikes.isDisLike', true)
    }else if(sortBy == 6){
      builder.where('ticketType', 'freeNormal')
    }else if (sortBy == 7){
      builder.where('ticketType', 'regularPaid')
    }else if (sortBy == 8){
      builder.where('ticketType', 'regularNormal') //RSVP
    }else if (sortBy == 9){
      builder.where('ticketType', 'vipNormal') //VIP
    }else if (sortBy == 10){
      builder.where('ticketType', 'regularTableSeating') //Table Seating
    }
  }).groupBy('events.id', "eventChooseSubcategory.eventId", "ticketBooked.userId")
  if(sortBy == 1){
    query.orderBy('events.name', 'ASC')
  }else if(sortBy == 2){
    query.orderBy('events.name', 'DESC')
  }else{
    query.orderBy('events.id', 'DESC')
  }
  query.offset(offset).limit(limit);
 
  let [err, eventData] = await to(query);
  if(err){
    return badRequestError(res, "", err)
  }
  
  //data count
  let dataCount =  Event.query().select( knex.raw("count(distinct(events.id)) as totalDataCount"))
  .innerJoinRelation(`${joinRelation}`)
  .where('ticketBooked.userId', id)
  .where( builder => {
    if(data.categoryId){
      var catArr = data.categoryId.split(',');
      builder.whereIn('eventChooseSubcategory.categoryId', catArr);
    }
    if(data.subCategoryId){
      var array = data.subCategoryId.split(',');
      builder.whereIn('eventChooseSubcategory.subCategoryId', array);
    }
    if(data.searchValue){
      builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
    }
    if(sortBy == 3){ //favourite
      builder.where('favorite.userId', id).where('favorite.isFavorite', true)
    }else if(sortBy == 4){ //like
      builder.where('userLikes.userId', id).where('userLikes.isLike', true)
    }else if(sortBy == 5){ //dislike
      builder.where('userLikes.userId', id).where('userLikes.isDisLike', true)
    }else if(sortBy == 6){
      builder.where('ticketType', 'freeNormal')
    }else if (sortBy == 7){
      builder.where('ticketType', 'regularPaid')
    }else if (sortBy == 8){
      builder.where('ticketType', 'regularNormal') //RSVP
    }else if (sortBy == 9){
      builder.where('ticketType', 'vipNormal') //VIP
    }else if (sortBy == 10){
      builder.where('ticketType', 'regularTableSeating') //Table Seating
    }
  }).first()
 
  let totaldataCount = await dataCount;
  return okResponse(res, {eventList: eventData, totalDataCount: totaldataCount.totaldatacount}, "Event List successfully get");
}

const userAttendEventExport = async (req, res) => {
  let data = req.query;
  let id = data.id;
  let sortBy = data.sortBy;
  let joinRelation = '[eventChooseSubcategory, ticketBooked';
  if(sortBy == 3){
    joinRelation = joinRelation+ ', favorite]';
  }else if(sortBy==4 || sortBy==5){
    joinRelation = joinRelation+ ', userLikes]';
  }else {
    joinRelation = joinRelation+']';
  }
  let query = Event.query().select('events.id', 'eventCode', 'isHighLighted', 'events.name', 'start', 'end', 'paymentDetail', 'MinPaidAmount', 'eventType', 'events.created_at','paidType')
  .innerJoinRelation(`${joinRelation}`)
  .mergeNaiveEager('[eventCategories, eventSubCategories, userLikes, reviews, users, favorite]')
  .modifyEager('users', builder => {
    builder.select('users.name')
  })
  .modifyEager('favorite', builder => {
    builder.select('favorite.isFavorite').where('userId', id)
  })
  .modifyEager('userLikes', builder => {
    builder.select('isLike', 'isDisLike').where('userId', id)
  })
  .modifyEager('reviews', builder => {
    builder.select('reviewStar', 'reviewText').where('userId', id)
  })
  .modifyEager('ticketBooked', builder => {
    builder.select('ticketType', 'created_at', 'totalQuantity', 'pricePerTicket', 'status').where('userId', id)
  })
  .modifyEager('eventCategories', builder => {
    builder.select('category.id','categoryName').where( builder => {
      if(data.categoryId){
        var catArr = data.categoryId.split(',');
        builder.whereIn('category.id', catArr);
      }
    }).groupBy("category.id", "eventChooseSubcategory.eventId");
  }).modifyEager('eventSubCategories', builder => {
    builder.select('subCategory.id','subCategoryName').where( builder => {
      if(data.subCategoryId){
        var array = data.subCategoryId.split(',');
        builder.whereIn('subCategory.id', array);
      }
    }).groupBy("subCategory.id", "eventChooseSubcategory.eventId");
  })
  .where('ticketBooked.userId', id)
  .where( builder => {
    if(data.categoryId){
      var catArr = data.categoryId.split(',');
      builder.whereIn('eventChooseSubcategory.categoryId', catArr);
    }
    if(data.subCategoryId){
      var array = data.subCategoryId.split(',');
      builder.whereIn('eventChooseSubcategory.subCategoryId', array);
    }
    if(data.searchValue){
      builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
    }
    if(sortBy == 3){ //favourite
      builder.where('favorite.userId', id).where('favorite.isFavorite', true)
    }else if(sortBy == 4){ //like
      builder.where('userLikes.userId', id).where('userLikes.isLike', true)
    }else if(sortBy == 5){ //dislike
      builder.where('userLikes.userId', id).where('userLikes.isDisLike', true)
    }else if(sortBy == 6){
      builder.where('ticketType', 'freeNormal')
    }else if (sortBy == 7){
      builder.where('ticketType', 'regularPaid')
    }else if (sortBy == 8){
      builder.where('ticketType', 'regularNormal') //RSVP
    }else if (sortBy == 9){
      builder.where('ticketType', 'vipNormal') //VIP
    }else if (sortBy == 10){
      builder.where('ticketType', 'regularTableSeating') //Table Seating
    }
  }).groupBy('events.id', "eventChooseSubcategory.eventId", "ticketBooked.userId")
  if(sortBy == 1){
    query.orderBy('events.name', 'ASC')
  }else if(sortBy == 2){
    query.orderBy('events.name', 'DESC')
  }else{
    query.orderBy('events.id', 'DESC')
  }
  let [err, eventData] = await to(query);
  if(err){
    return badRequestError(res, "", err)
  }
  return okResponse(res, eventData, "Event List successfully get");
}

const customerListExport = async (req, res) => {
  let data = req.query;
  let userType = req.params.userType;
  let response = {};
  let query = User.query().skipUndefined().select().omit( [ 'password', 'emailOTP', 'deviceToken', 'token', 'roles', 'customerId', 'currentAmounts', 'totalAmount', 'adminPayment', 'phoneOTP', 'accountId' ] )
  .where('userType', userType)
  .where(builder => {
      if(data.searchValue){
        builder.where('name', 'iLike', '%'+data.searchValue+'%').orWhere('phoneNo', 'iLike', '%'+data.searchValue+'%').orWhere('email', 'iLike', '%'+data.searchValue+'%');
      }
      if(data.country){
        builder.where('countryName', 'iLike', '%'+data.country+'%')
      }
      if(data.state){
        builder.where('state', 'iLike', '%'+data.state+'%')
      }
      if(data.city){
        builder.where('city', 'iLike', '%'+data.city+'%')
      }
      if(data.sortBy==1){ //active
        builder.where('accountStatus', 'active');
      }else if(data.sortBy==2) { //inactive
        builder.where('accountStatus', 'inactive');
      }else if(data.sortBy==3) { //flagged
        builder.where('accountStatus', 'flagged');
      }
    })
    //total Count
  let UserData = await query;
  if (!UserData) {
    return badRequestError(res,"", "No Details");
  }
  return okResponse(res, UserData, "Get All Customer List");
}

const deleteNotes = async (req, res) => {
  if(req.params.id==undefined){
    return badRequestError(res, "", "Notes detail required");
  }
  let checkEvent = await Notes.query().select('id').where('id', req.params.id).where('userId', req.user.id).first();
  if (!checkEvent) {
      return badRequestError(res, "", Message("NotAuthorised"));
  }

  let deletedUser = await Notes.query().deleteById(req.params.id);
  return okResponse(res, "", Message("NotesDeleted"));
}


/**
 * eventStatus - Delete customer's query
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const deleteIssuesQuery = async (req, res) => {
  if(req.params.id==undefined){
    return badRequestError(res, "", "Required parameter not found");
  }
  let check = await Contact.query().select('id').where('id', req.params.id).first();
  if (!check) {
      return badRequestError(res, "", "Issues query not found");
  }
  let deletedUser = await Contact.query().deleteById(req.params.id);
  return okResponse(res, "", "Successfully Deleted");
}


/**
 * eventStatus - Archived and Unarchived Event
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const eventArchive = async (req, res) => {
 
  let data = req.body;
  if(data.isArchived==undefined || !data.id){
    return badRequestError(res, "", "required parameter not found");
  }
  let checkEvent = await Event.query().select("id","isDeleted").where('id', data.id).first();
  if(!checkEvent){ 
    return okResponse(res, [], "Event is not available");
  }
  if(checkEvent.isDeleted ==true && data.isArchived==false){
    return okResponse(res, [], "you can not unarchived this event because it have been deleted by host!");
  }
  // console.log(checkEvent);
  let eventStatus = await Event.query()
    .patch({
      isArchived: data.isArchived,
      archivedBy: data.archivedBy
    })
    .where({
      id: data.id
    });

    
  if(eventStatus){
    return okResponse(res, [], "Event Status has been changed Successfully !");
  }  
  return badRequestError(res, "", Message('SomeError'));
};

/**
 * eventStatus - Archived Event list
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const archiveEventList = async (req, res) => {
  let data = req.query;
  let eventData, where;
  let sortBy = (data.sortBy!=undefined) ? data.sortBy: 2;
  let page = (data.page) ? data.page : 1;
  let limit = 100;
  let offset = (page == 1) ? 0 : (page-1)*100;
  let type = data.type;
 
   
    let currentDate = new Date();
    let query = await Event.query().select('events.id', 'events.name', 'eventType', 'paidType', 'start', 'end', 'is_active','isDeleted','isArchived')
    .innerJoinRelation('eventChooseSubcategory')
    .mergeNaiveEager('[eventImages, venueEvents as address,eventCategories, eventSubCategories, users]')
    .modifyEager('eventImages', builder => {
      builder.select('eventImage').limit(1)
    }).modifyEager('address', builder => {
      builder.select('latitude', 'longitude', 'venueAddress').first()
    }).modifyEager('users', builder => {
      builder.select('name')
    }).modifyEager('eventCategories', builder => {
      builder.select('category.id','categoryName').where( builder => {
        if(data.categoryId){
          var catArr = data.categoryId.split(',');
          builder.whereIn('category.id', catArr);
        }
      }).groupBy("category.id", "eventChooseSubcategory.eventId");
    }).modifyEager('eventSubCategories', builder => {
      builder.select('subCategory.id','subCategoryName').where( builder => {
        if(data.subCategoryId){
          var array = data.subCategoryId.split(',');
          builder.whereIn('subCategory.id', array);
        }
      }).groupBy("subCategory.id", "eventChooseSubcategory.eventId");
    }).where( builder => {
      if(type == 'current'){
        builder.where('start', currentDate)
      }else if(type == 'past'){
        builder.where('start', '<', currentDate);
      }else if(type == 'upcomming') {
        builder.where('start', '>=', currentDate)
      }
      if(data.categoryId){
        var catArr = data.categoryId.split(',');
        builder.whereIn('eventChooseSubcategory.categoryId', catArr);
      }
      if(data.subCategoryId){
        var array = data.subCategoryId.split(',');
       
        builder.whereIn('eventChooseSubcategory.subCategoryId', array);
      }
      if(data.searchValue){
        builder.where('events.name', 'iLike', '%'+data.searchValue+'%');
      }
    }).where('isArchived', true).groupBy('events.id', "eventChooseSubcategory.eventId")
    .orderBy('id', 'DESC')
    .offset(offset).limit(limit)
    .runAfter((result, builder)=>{
          console.log(builder.toKnexQuery().toQuery())
          return result;
      });
   
    eventData = await query;
    //total count
    let dataCount = Event.query().select(knex.raw('count(distinct(events.id)) as "totaldataCount"'))
    .where('isArchived', true).first();
    let totalDataCount = await dataCount;
    
    return okResponse(res, { eventList :eventData, totalDataCount : totalDataCount.totaldataCount} ,"Archived event List successfully get");
}

/**
 * ExploreEvent - Archived and Unarchived Event
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

 const exploreEvent = async (req, res) => {
 
  let data = req.body;
  if(data.isExploreEvent==undefined || !data.id){
    return badRequestError(res, "", "required parameter not found");
  }
  let checkEvent = await Event.query().select("id","isDeleted").where('id', data.id).first();
  if(!checkEvent){ 
    return okResponse(res, [], "Event is not available");
  }
  // console.log(checkEvent);
  let eventStatus = await Event.query()
    .patch({
      isExploreEvent: data.isExploreEvent,
    })
    .where({
      id: data.id
    }).runAfter((result, builder) =>{
      console.log(builder.toKnexQuery().toQuery())
      return result;
   }); 

    
  if(eventStatus){
    return okResponse(res, [], "Event Status has been changed Successfully !");
  }  
  return badRequestError(res, "", Message('SomeError'));
};

/**
 * getAllSlider for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */

 const getAllSlider = async (req, res) => {

  var SliderData = await Slider.query().skipUndefined().select("id","image","time","status");

if (!SliderData) {
  return badRequestError(res,  "", "No details");
}
return okResponse(res, SliderData, "Get All Slider List");
}

/**
* addUpdateSlider for Admin  
* @param {stores the requested parameters} req.body
* @param {stores the respose} res 
*/
const addUpdateSlider = async (req, res) => {
let data = req.body;
let message;

if (!data.id) {
  message = "Slider added Successfully.";
} else {
  message = "Slider updated Successfully.";
}

if(req.files.length > 0){
  data.image = await req.files.map(file =>
    file.location.toString());
  data.image = data.image.toString();
}

let SliderData = await Slider.query().upsertGraph(data).returning("id");

let returnData = {
  "slider_list": SliderData,
};
// return response
return okResponse(res, {
  ...returnData,
}, message);
}


/**
* deleteCategory
* @param {stores the requested parameters} req
* @param {stores the response} res
*/

const deleteSlider = async (req, res) => {

  let SliderData = await Slider.query().select().where('id', req.params.id).first();
 
  if (SliderData == "") {
      return badRequestError(res, "", "Error in deleting Slider");
  }
  let deletedSlider = await Slider.query().deleteById(req.params.id);
  return okResponse(res, "", "Slider has been deleted successfully");
}

/**
 * UpdateSliderTime Status for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */

 const updateSliderTime = async (req, res) => {
  var data = req.body;

  let updateData = await Slider.query().update({
    time: data.time
  })

return okResponse(res,'', "Change Banner Status");
}

/**
* addUpdateBanner for Admin  
* @param {stores the requested parameters} req.body
* @param {stores the respose} res 
*/
const addUpdateBanner = async (req, res) => {
  let data = req.body;
  let message;
  
  if (!data.id) {
    message = "Banner added Successfully.";
  } else {
    message = "Banner updated Successfully.";
  }
  
  let BannerData = await Notice.query().update({
    bg_color: data.bg_color,text:data.text,text_color:data.text_color,url:data.url,isActive:data.isActive
  }).where('id',data.id).returning("id")
  
  let returnData = {
    "banner_list": BannerData,
  };
  // return response
  return okResponse(res, {
    ...returnData,
  }, message);
  }

  /**
 * getAllBanner for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */

 const getBanner = async (req, res) => {

  var BannerData = await Notice.query().skipUndefined().select().first();

if (!BannerData) {
  return badRequestError(res,  "", "No Details");
}
return okResponse(res, BannerData, "Get Banner List");
}

  /**
 * changeBanner Status for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */

  const chnageBannerStatus = async (req, res) => {
    var data = req.body;

    let updateData = await Notice.query().update({
      isActive: data.isActive
    }).where('id', req.params.id);

  return okResponse(res,'', "Update Banner successfully");
  }

  
  /**
 * change Slider Status for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */

  const chnageSliderStatus = async (req, res) => {
    var data = req.body;

    let updateData = await Slider.query().update({
      status: data.status
    }).where('id', req.params.id);

  return okResponse(res,'', "Update Banner successfully");
  }

  /**
 * Delete Events
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const deleteEvents = async (req, res) => {

  let deletedUser = await Event.query().deleteById(req.params.id);
  return okResponse(res, "", "Event has been deleted successfully");
}


module.exports = {
  eventList,
  getUsers,
  getOrganisers,
  addUpdateOrganiser,
  deleteOrganiser,
  getAllVenue,
  addUpdateVenue,
  deleteVenue,
  dashboard,
  venueStatus,
  userStatus,
  eventStatus,
  transStatus,
  eventTicketInfo,
  getAllevents,
  addUpdateIssues,
  getAllIssues,
  getIssuesQuery,
  deleteIssue,
  statusIssues,
  getUsePayment,
  getOrganiserPaymentReq,
  isReleasedStatus,
  isVerifiedStatus,
  updateFCMtoken,
  paidEventList,
  paidEventDetail,
  addRules,
  getOtherAdminList,
  createNote,
  notesList,
  highlightEvent,
  highLightedEventList,
  eventDetail,
  attendeesList,
  updateTicketCapacity,
  getRules,
  venueDetail,
  exportAttendeesList,
  getVenueForMap,
  subAdminList,
  userStatus,
  subAdminStatus,
  addUpdateSubAdmin,
  subAdminDetail,
  updateOrganiserStatus,
  userDetail,
  userAttendEventList,
  userAttendEventExport,
  customerListExport,
  deleteNotes,
  deleteIssuesQuery,
  eventArchive,
  archiveEventList,
  getAllSlider,
  addUpdateSlider,
  deleteSlider,
  updateSliderTime,
  addUpdateBanner,
  getBanner,
  chnageBannerStatus,
  priorityEvent,
  exploreEvent,
  ExploreEventList,
  chnageSliderStatus,
  deleteEvents
}