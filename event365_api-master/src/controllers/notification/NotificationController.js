const Event = require("../../models/events");
//const EventOccurrence = require('../../models/eventOccurrence');
const User = require("../../models/users");
const Notification = require("../../models/notification");
const TableSeatingTicket = require("../../models/tableSeatingTicket");
const TicketBooked = require("../../models/ticketBooked");
const TicketInfo = require("../../models/ticket_info");
var global = require("../../global_functions");
var global = require("../../global_constants");
var moment = require("moment");
const AndroidNotification = require('../../middlewares/androidNotification');
const IOSNotification = require('./../../middlewares/iosNotification');
const WebNotification = require('./../../middlewares/webNotification');
let knexConfig = require("../../../db/knex");
const knex = require("knex")(knexConfig["development"]);
/**
 * User Notification
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */
const hostNotifications = async (req, res) => {
  
  // PAGINATION
  let page = (req.query.page) ? req.query.page : 1;
  let limit = req.query.limit ? req.query.limit : PER_PAGE;
  let offset = req.query.offset ? req.query.offset : limit * (page - 1);
  if((!req.query.notificationType && req.query.notificationTab!='4')){
    return badRequestError(res, "", "Required parameter not found");
  }
  let notificationType = req.query.notificationType;
  let notificationTab = req.query.notificationTab;
  console.log(notificationTab);
  //fetch catSubIds
  notificationType =  notificationType.split(',').map(function(item) {
    if(item) return parseInt(item);
    else return 0;
  });

  if(notificationType!=""){
    const SenderIds = await Notification.query().select('userId').where('receiverId', req.user.id).whereIn("notificationType", notificationType)
    .where(builder => {
      if(notificationTab == '1'){ //Event Tab
          builder.whereIn('type', ['checkIn','eventOfInterest','eventFav','eventReview','reminder'])
      }else if(notificationTab == '2'){ //RSVP Tab
          builder.whereIn('type', ['Invited', 'inviteAccepted', 'inviteDeclined', 'hostTicketBooked', 'ticketBooked', 'TicketCancelled','TicketCancelledUser'])
      }else if(notificationTab == '3') { //transaction Tab
          builder.whereIn('type', ['hostTicketBooked','ticketBooked','paymentSuccess','paymentFailed','TicketCancelled', 'TicketCancelledUser'])
      }
  }).runBefore((result, builder)=>{
     console.log(builder.toKnexQuery().toQuery())
     return result;
 });
  
    let SenderIdss = Array.prototype.map.call(SenderIds, s => s.userId)
  }
  

  let NotificationList = await Notification.query()
    .skipUndefined().select("id", "eventId", "msg", "type", "created_at as dateTime", "notificationType").mergeNaiveEager("[users as sender]")
    .modifyEager("sender", builder => {
      builder.select("id", "name", "profilePic")
    })
    .where("receiverId", req.user.id)
    .where(builder => {
        if(notificationType!=""){ //for website
          builder.whereIn("notificationType", notificationType);
        }
        if(notificationTab == '1'){ //Event Tab
            builder.whereIn('type', ['checkIn','eventOfInterest','eventFav','eventReview','reminder'])
        }else if(notificationTab == '2'){ //RSVP Tab
            builder.whereIn('type', ['Invited', 'inviteAccepted', 'inviteDeclined', 'hostTicketBooked', 'ticketBooked', 'TicketCancelled','TicketCancelledUser'])
        }else if(notificationTab == '3') { //transaction Tab
            builder.whereIn('type', ['hostTicketBooked','ticketBooked','paymentSuccess','paymentFailed','TicketCancelled', 'TicketCancelledUser'])
        }
    }).orderBy("created_at", "desc").offset(offset).limit(limit);

    if (NotificationList == undefined || !NotificationList) {
      return badRequestError(res, "", "Notification list not found");
    }

    let notifiIds = Array.prototype.map.call(NotificationList, s => s.id)
    
    if(req.user.deviceType!='desktop'){
    let readNoti = await Notification.query().update({
      readstatus: true
    }).where(builder => {
      if(notificationType!=""){ //for website
        builder.whereIn("notificationType", notificationType);
      }
      if(notificationTab == '1'){ //Event Tab
        builder.whereIn('type', ['checkIn','eventOfInterest','eventFav','eventReview','reminder'])
      }else if(notificationTab == '2'){ //RSVP Tab
          builder.whereIn('type', ['Invited', 'inviteAccepted', 'inviteDeclined', 'hostTicketBooked', 'ticketBooked', 'TicketCancelled','TicketCancelledUser'])
      }else if(notificationTab == '3') { //transaction Tab
          builder.whereIn('type', ['hostTicketBooked','ticketBooked','paymentSuccess','paymentFailed','TicketCancelled', 'TicketCancelledUser'])
      }
    }).whereIn("id", notifiIds);
  }

    let countNoti = await Notification.query().count('id').where(builder => {
      if(notificationType!=""){ //for website
        builder.whereIn("notificationType", notificationType);
      }
      if(notificationTab == '1'){ //Event Tab
        builder.whereIn('type', ['checkIn','eventOfInterest','eventFav','eventReview','reminder'])
      }else if(notificationTab == '2'){ //RSVP Tab
          builder.whereIn('type', ['Invited', 'inviteAccepted', 'inviteDeclined', 'hostTicketBooked', 'ticketBooked', 'TicketCancelled','TicketCancelledUser'])
      }else if(notificationTab == '3') { //transaction Tab
          builder.whereIn('type', ['hostTicketBooked','ticketBooked','paymentSuccess','paymentFailed','TicketCancelled', 'TicketCancelledUser'])
      }
    }).where('receiverId', req.user.id).whereNot("type", "eventOfInterest").first();
    
    let response = {
      'NotificationList': NotificationList,
      "total": parseInt(countNoti.count),
      'page': page,
    }
    return okResponse(res, response, "List of Notification");
};

/**
 * get User RSVP List
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

const getUserRSVP = async (req, res) => {

  // PAGINATION 
  let page = (req.query.page) ? req.query.page : 1;
  let limit = req.query.limit ? req.query.limit : PER_PAGE;
  let offset = req.query.offset ? req.query.offset : limit * (page - 1);
 
  let NotificationList = await Notification.query()
    .skipUndefined().select("id", "eventId", "status", "msg", "status", "created_at as dateTime")
    .mergeNaiveEager("[users as sender]")
    .modifyEager("sender", builder => {
      builder.select("id", "name", "profilePic")
    })
    .where("receiverId", req.user.id).where("type", "Invited")
    .where((builder) => {
      if(req.query.status){
        builder.andWhere('status',req.query.status);
      } else {
        builder.whereNot("status", "rejected");
      }
    })
    .orderBy("created_at", "desc")
    .offset(offset).limit(limit)

    let RSPVacceptedCount = await Notification.query()
    .skipUndefined().count("id")
    .where("receiverId", req.user.id).where("type", "Invited")
    .where("status", "accepted")

    let RSPVpendingCount = await Notification.query()
    .skipUndefined().count("id")
    .where("receiverId", req.user.id).where("type", "Invited")
    .where("status", "pending")
    
  if (NotificationList == undefined || !NotificationList) {
    return badRequestError(res, "", err);
  }
  let response = {
    'RSPVList': NotificationList,
    'RSPVAcceptedCount':RSPVacceptedCount,
    'RSPVPendingCount':RSPVpendingCount,
    'page': page,
  }
  return okResponse(res, response, "RSVP User List");
};

/**
 * get User RSVP List
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

 const getUserRSVPCount = async (req, res) => {

    let RSPVacceptedCount = await Notification.query()
    .skipUndefined().count("id")
    .where("receiverId", req.user.id).where("type", "Invited")
    .where("status", "accepted")

    let RSPVpendingCount = await Notification.query()
    .skipUndefined().count("id")
    .where("receiverId", req.user.id).where("type", "Invited")
    .where("status", "pending")
    
 
  let response = {
    'RSPVAcceptedCount':RSPVacceptedCount,
    'RSPVPendingCount':RSPVpendingCount,
  }
  return okResponse(res, response, "RSVP user count List");
};

/**
 * user All Notification
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

const userAllNotification = async (req, res) => {
  // PAGINATION
  let page = (req.query.page) ? req.query.page : 1;
  let limit = req.query.limit ? req.query.limit : PER_PAGE;
  let offset = req.query.offset ? req.query.offset : limit * (page - 1);
  if((!req.query.notificationType)){
    return badRequestError(res, "", "Required parameter not found");
  }
  let notificationType = req.query.notificationType;
  let notificationTab = req.query.notificationTab;
  //fetch catSubIds
  notificationType =  notificationType.split(',').map(function(item) {
     if(item) return parseInt(item);
     else return 0;
  });
  const SenderIds = await Notification.query().select('userId').whereIn("notificationType", notificationType)
  .where('receiverId', req.user.id)
  .where(builder => {
    if(notificationTab){
    if(notificationTab == '1'){ //Event Tab
        builder.whereIn('type', ['checkIn','eventOfInterest','eventFav','eventReview','reminder'])
    }else if(notificationTab == '2'){ //RSVP Tab
        builder.whereIn('type', ['Invited', 'inviteAccepted', 'inviteDeclined', 'hostTicketBooked', 'ticketBooked', 'TicketCancelled','TicketCancelledUser'])
    }else if(notificationTab == '3') { //transaction Tab
      builder.whereIn('type', ['hostTicketBooked','ticketBooked','paymentSuccess','paymentFailed','TicketCancelled', 'TicketCancelledUser'])
    }else {
      builder.where('type', '')
    }
  }
  }).runAfter((result, builder) =>{
    console.log(builder.toKnexQuery().toQuery())
    return result;
    });

  let SenderIdss = Array.prototype.map.call(SenderIds, s => s.userId)
 

  let NotificationList = await Notification.query()
    .skipUndefined().select("id", "eventId", "msg", "type", "created_at as dateTime", "notificationType").mergeNaiveEager("[hostUser as sender]")
    .modifyEager("sender", builder => {
      builder.select("id", "name", "profilePic")
    })
    .where("receiverId", req.user.id)
    .whereIn("notificationType", notificationType)
    .where(builder => {
      if(notificationTab){
      if(notificationTab == '1'){ //Event Tab
          builder.whereIn('type', ['checkIn','eventOfInterest','eventFav','eventReview','reminder'])
      }else if(notificationTab == '2'){ //RSVP Tab
          builder.whereIn('type', ['Invited', 'inviteAccepted', 'inviteDeclined', 'hostTicketBooked', 'ticketBooked', 'TicketCancelled','TicketCancelledUser'])
      }else if(notificationTab == '3') { //transaction Tab
          builder.whereIn('type', ['hostTicketBooked','ticketBooked','paymentSuccess','paymentFailed','TicketCancelled', 'TicketCancelledUser'])
      }else{
        builder.where('type', '')
      }
    }
    })
    .orderBy("created_at", "desc").offset(offset).limit(limit);
  
  let notifiIds = Array.prototype.map.call(NotificationList, s => s.id)
  
  // let readNoti = await Notification.query().update({
  //   readstatus: true
  // }).whereIn("notificationType", notificationType).whereIn("id", notifiIds);

  if (NotificationList == undefined || !NotificationList) {
    return badRequestError(res, "", err);
  }
  let response = {
    'NotificationList': NotificationList,
    'page': page,
  }
  return okResponse(res, response, "RSVP User List");
};

/**
 * statusRSPV Change Status
 * @param {stores the requested parameters} req.body
 * @param {stores the requested parameters} req.params.userId
 * @param {stores the response parameters} res
 */

const statusRSPV = async (req, res) => {
  let data = req.body;
  let userData = req.user;
  let RSPVStatus = await Notification.query().patchAndFetchById(data.id, {
    status: data.status,
    updated_at: new Date()
  })
 
  let [err, hostInfo] = await to(User.query().select('id', 'name', 'deviceType', 'deviceToken')
  .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser,  userLoginDetail as webUser]')
  .modifyEager('androidUser', builder =>{
      builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
  }) 
  .modifyEager('iosUser', builder =>{
      builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
  })  
  .modifyEager('webUser', builder =>{
    builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')
  })
  .where('id', RSPVStatus.userId).first());
  let [errEvent, eventInfo] = await to(Event.query().select('id', 'name').where('id', RSPVStatus.eventId).first());
  if(!!eventInfo){
    if (hostInfo.androidUser) {
      
      var AndroidNotifi = await AndroidNotification.notifytoAndroidHost(hostInfo, data.status, userData, eventInfo);
    } 
    if (hostInfo.iosUser) {
      var IOSNotifi = await IOSNotification.notifytoiosHost(hostInfo, data.status, userData, eventInfo);
    }
  
    if (hostInfo.webUser) {
      var webNotifi = await WebNotification.notifytoAndroidHost(hostInfo,data.status, userData, eventInfo);
    }
  }

  return okResponse(res, [], "RSVP Status has been changed Successfully !");
};

/**
 * countUserNotifications 
 * @param {stores the response parameters} res
 */
const countUserNotifications = async (req, res) => {

  let eventCountNoti = await Notification.query().count('id').where('receiverId', req.user.id).where('notificationType', 1).where("readstatus", false).first();
  let rsvpCountNoti = await Notification.query().count('id').where('receiverId', req.user.id).where('notificationType', 2).where("readstatus", false).first();
  let transactionCountNoti = await Notification.query().count('id').where('receiverId', req.user.id).where('notificationType', 4).where("readstatus", false).first();
  let organizationCountNoti = await Notification.query().count('id').where('receiverId', req.user.id).where('notificationType', 3).where("readstatus", false).first();

  return okResponse(res, { 'eventCount': eventCountNoti, 'rsvpCount': rsvpCountNoti, 'transactionCount': transactionCountNoti, 'organizationCount': organizationCountNoti }, "count Notification!");
};

const countHostNotifications = async (req, res) => {
  
  let eventCountNoti = await Notification.query().count('id').where('receiverId', req.user.id).where('notificationType', 1).where("readstatus", false).first();
  let rsvpCountNoti = await Notification.query().count('id').where('receiverId', req.user.id).where('notificationType', 2).where("readstatus", false).first();
  let transactionCountNoti = await Notification.query().count('id').where('receiverId', req.user.id).where('notificationType', 4).where("readstatus", false).first();
  let organizationCountNoti = await Notification.query().count('id').where('receiverId', req.user.id).where('notificationType', 3).where("readstatus", false).first();
  return okResponse(res, { 'eventCount': eventCountNoti, 'rsvpCount': rsvpCountNoti, 'transactionCount': transactionCountNoti, 'organizationCount': organizationCountNoti }, "count Notification!");
};

/**
 * admin Notifications
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

const adminNotifications = async (req, res) => {
  
  // PAGINATION
  let page = (req.query.page) ? req.query.page : 1;
  let limit = req.query.limit ? req.query.limit : PER_PAGE;
  let offset = req.query.offset ? req.query.offset : limit * (page - 1);

  const SenderIds = await Notification.query().select('userId').where('receiverId', 1);
  

  let NotificationList = await Notification.query()
    .skipUndefined().select("id", "title", "body", "msg", "type", "created_at").mergeNaiveEager("[users as sender]")
    .modifyEager("sender", builder => {
      builder.select("id", "name", "profilePic")
    })
    .where("receiverId", 1).orderBy("created_at", "desc").offset(offset).limit(limit);

  let notifiIds = Array.prototype.map.call(NotificationList, s => s.id)

  let readNoti = await Notification.query().update({
    readstatus: true
  }).whereIn("id", notifiIds);

  if (NotificationList == undefined || !NotificationList) {
    return badRequestError(res, "", err);
  }

  let countNoti = await Notification.query().count('id').where('receiverId', 1).first();
  let resultData = {
    'notifications': NotificationList,
    "total": parseInt(countNoti.count),
    'page': page,
  }
  return okResponse(res, resultData, "List of Notification");
};

/**
 * countAdminNotifications
 * @param {stores the requested parameters} req.user.id
 * @param {stores the response parameters} res
 */

const countAdminNotifications = async (req, res) => {

  let countNoti = await Notification.query().count('id').where('receiverId', 1).where("readstatus", false).first();
  // countNoti =  Number(countNoti);
  return okResponse(res, countNoti, "count Notification!");
  
};


/**
 * statusNotify Change Status
 * @param {stores the requested parameters} req.body 
 * @param {stores the requested parameters} req.params.userId
 * @param {stores the response parameters} res
 */

const statusNotify = async (req, res) => {
  
  let data = req.body;

  let statusData = await User.query()
    .patch({
      isNotify: data.status
    })
    .where(" id", req.user.id);

  return okResponse(res, [], "Notify status has been changed Successfully");
};

/**
 * Mark as read all notification
 * @param {stores the response parameters} token
 */

const readAllNotification = async (req, res) => {
 
  var data = req.body;
  let receiverId = req.user.id;

  let notificationType = data.notificationType;

   notificationType =  notificationType.split(',').map(function(item) {
    if(item) return parseInt(item);
    else return 0;
  });

  let statusData = await Notification.query()
    .patch({
      readstatus: true
    })
    .where("receiverId", receiverId) 
    .andWhere('readstatus', false)
    //changes talk by arati
    .where(builder => {
      if (data.notificationType) {
           builder.whereIn("notificationType", notificationType);
      }
      if(data.notificationTab == '1'){ //Event Tab
          builder.whereIn('type', ['checkIn','eventOfInterest','eventFav','eventReview','reminder'])
      }else if(data.notificationTab == '2'){ //RSVP Tab
          builder.whereIn('type', ['Invited', 'inviteAccepted', 'inviteDeclined', 'hostTicketBooked', 'ticketBooked', 'TicketCancelled','TicketCancelledUser'])
      }else { //transaction Tab
          builder.whereIn('type', ['hostTicketBooked','ticketBooked','paymentSuccess','paymentFailed','TicketCancelled', 'TicketCancelledUser'])
      }
  }).runAfter((result, builder) =>{
    console.log(builder.toKnexQuery().toQuery())
    return result;
    });

  return okResponse(res, [], "Notification status has been changed successfully");
};
module.exports = {
  hostNotifications,
  userAllNotification,
  adminNotifications,
  countAdminNotifications,
  countUserNotifications,
  countHostNotifications,
  getUserRSVP,
  statusRSPV,
  statusNotify,
  readAllNotification,
  getUserRSVPCount
};