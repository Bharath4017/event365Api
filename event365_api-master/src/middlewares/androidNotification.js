const gcm = require('node-gcm');
var moment = require('moment');

//android notification start
const settings = { 
  gcm: { 
    id: 'AIzaSyB-ayT72TvwPlNh3N5-4urVxm9CxUTfIXQ'
  }
};
 
const PushNotifications = require('node-pushnotifications');
const push = new PushNotifications(settings);
const Notification = require('./../models/notification');
var gcmSender = new gcm.Sender(settings.gcm.id);
module.exports.push = push;

//userTicketBooked - User to Host
module.exports.ticketBookednotifyHost = async (notif, user) => {
  //console.log(notif.users.androidUser, "ticketBookednotifyHost"); return;
  let err;
  const deviceType = 'android';
  

  // Notification table insert
  //User "username" booked ticket for event "eventname"
  //rs
  let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',notif.id).andWhere('userId',user.id)
  .andWhere('receiverId',notif.users.userId).andWhere('type','hostTicketBooked').andWhere('notificationType',2)
  if(checknoti.length<=0){
  let notifiyStore = await Notification.query().insertGraph({
    eventId: notif.id,
    userId: user.id,
    receiverId: notif.users.userId,
    msg: user.name + " booked ticket for " + notif.name,
    type: "hostTicketBooked",
    notificationType: 2

  }).returning("*");
}

if(notif.users.isNotify==true){
  for(let i=0;i< notif.users.androidUser.length;i++){
  
    const device = notif.users.androidUser[i].deviceToken; //event creator device token array
    console.log(device);

    var message = new gcm.Message({
      collapseKey: 'demo',
      priority: 'high',
      contentAvailable: true,
      delayWhileIdle: true,
      restrictedPackageName: 'com.ebabu.event365live.host',
      data: {
        "userId": user.id,
        "userName": user.name,
        "eventId": notif.id,
        "eventName": notif.name,
        "type": "hostTicketBooked",
        "message": user.name + " booked ticket for " + notif.name,
        "notificationType": 2
      }

    });
  
    console.log(message,"message");
    var regTokens = [device];
    console.log(regTokens,"token");
    gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
      if (err) console.error(err);
      else console.log(response);
    });
  }
}
}

module.exports.ticketBookednotifyUser = async (notif, user) => {
  //console.log(user,"userTicketBooked --------");
  let err;
  const deviceType = 'android';
  
   console.log(notif.users.userId,'userid');
   console.log(user.id);
   
  // You have successfully booked for the event "eventname"
  // Notification table insert
  let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',notif.id).andWhere('userId',notif.users.userId)
  .andWhere('receiverId',user.id).andWhere('type','ticketBooked').andWhere('notificationType',2);
  if(checknoti){
  let notifiyStore = await Notification.query().insertGraph({
    eventId: notif.id,
    userId: notif.users.userId,
    receiverId: user.id,
    msg: "You have successfully booked for the " + notif.name,
    type: "ticketBooked",
    notificationType: 2,

  }).returning("*");
}

if(user.isNotify==true){
  for(let i=0;i< user.androidUser.length;i++){
    const device = user.androidUser[i].deviceToken;

    var message = new gcm.Message({
      collapseKey: 'demo',
      priority: 'high',
      contentAvailable: true,
      delayWhileIdle: true,
      restrictedPackageName: 'com.ebabu.event365live',
      data: {
        "userId": user.id,
        "userName": user.name,
        "eventId": notif.id,
        "eventName": notif.name,
        "type": "ticketBooked",
        "message": "You have successfully booked for the " + notif.name,
        "notificationType": 2
      }

    });

    // console.log(message)
    var regTokens = [device];
    gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
      if (err) console.error(err);
      else console.log(response);
    });
  }
}
}

//Ticket checkIn - Member to Host
module.exports.checkIn = async (notif, user, Customer) => {
  console.log("checkIn --------");
  let err;
  const deviceType = 'android';
  
  let todayDate = new Date();
  let fromdate = moment(todayDate).utc().format('YYYY-MM-DD HH:mm:ss');
  let todayTime = moment(todayDate).utc().add(15, 'second').format('YYYY-MM-DD HH:mm:ss');
  console.log(fromdate);
  console.log(todayTime);

  // Notification table insert
  let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',notif.id).andWhere('userId',user.id)
  .andWhere('receiverId',notif.users.userId).andWhere('type','checkIn').andWhere('notificationType',2).whereBetween('created_at', [fromdate, todayTime]).runAfter((result, builder) =>{
        console.log(builder.toKnexQuery().toQuery())
        return result;
        });
  if(checknoti.length<=0){
  let notifiyStore = await Notification.query().insertGraph({
    eventId: notif.id,
    userId: user.id,
    receiverId: notif.users.userId,
    msg: Customer + " successfully checkedin for " + notif.name,
    type: "checkIn",
    notificationType: 1,

  }).returning("*");
}
 
  for(let i=0;i<notif.users.androidUser.length;i++){
  const device = notif.users.androidUser[i].deviceToken;
  if (deviceType == 'android') {
    var message = new gcm.Message({
      collapseKey: 'demo',
      priority: 'high',
      contentAvailable: true,
      delayWhileIdle: true,
      restrictedPackageName: 'com.ebabu.event365live.host',
      data: {
        "userId": user.id,
        "userName": user.name,
        "eventId": notif.id,
        "eventName": notif.name,
        "type": 'checkIn',
        "message": Customer + " successfully checkedin for " + notif.name,
        "notificationType": 2
      }

    });
    // console.log(message)
    var regTokens = [device];
    gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
      if (err) console.error(err);
      else console.log(response, "checkIn success Andorid");
    });
  }
}
}

//Invite User - Host to User
module.exports.sendInviteUser = async (userList, hostList, eventInfo) => {
  console.log("sendInviteUser-android-----");
  let err;
  if(userList.length > 0){
  for (let i = 0; i < userList.length; i++) {

    let todayDate = new Date();
    let fromdate = moment(todayDate).utc().format('YYYY-MM-DD HH:mm:ss');
    let todayTime = moment(todayDate).utc().add(15, 'second').format('YYYY-MM-DD HH:mm:ss');
    console.log(fromdate);
    console.log(todayTime);

  
  let checknoti = await Notification.query().skipUndefined().select("id","created_at").where('eventId',eventInfo.id).andWhere('userId',hostList.id)
  .andWhere('receiverId',userList[i].id).andWhere('type','Invited').whereBetween('created_at', [fromdate, todayTime]).andWhere('notificationType',2).first().runAfter((result, builder) =>{
    console.log(builder.toKnexQuery().toQuery())
    return result;
    });
   if(!checknoti){
    if(userList[i].androidUser.length > 0){
      console.log('sdbhf');
    let notifiyStore = await Notification.query().insertGraph({
      eventId: eventInfo.id,
      userId: hostList.id,
      receiverId: userList[i].id,
      msg: hostList.name + " invited you to attend the event " + eventInfo.name,
      type: "Invited",
      status: "pending",
      notificationType: 2

    }).returning("*");
  }
}
    //set value
    console.log('android',userList[i].androidUser);
  if(userList[i].isNotify==true){
    for(let j=0; j < userList[i].androidUser.length;j++){
    let UsersdeviceToken =userList[i].androidUser[j].deviceToken
    // console.log(UsersdeviceToken, "UsersdeviceToken")
    let created_at =  today = new Date();
    var message = new gcm.Message({
      collapseKey: 'demo',
      priority: 'high',
      contentAvailable: true,
      delayWhileIdle: true,
      restrictedPackageName: 'com.ebabu.event365live',
      data: {
        "userId": hostList.id,
        "userName": hostList.name,
        "profile": hostList.profilePic,
        "eventId": eventInfo.id,
        "eventName": eventInfo.name,
        "type": 'Invited',
        "status": 'pending',
        "DateTime": created_at,
        "message": hostList.name + " invited you to attend the event " + eventInfo.name,
        notificationType: 2
      }
    });
    // console.log(message, "Msg here")
    var regTokens = [UsersdeviceToken];
    gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
      if (err) console.error(err);
      else console.log(response, "success Andorid");
    });
  }
}
}
  }
}
//Create Event - Host to User
module.exports.sendCreateEvent = async (userList, host, event) => {
  console.log("sendInviteUser android------", event);
  let err;
  console.log("getUserTokens", userList, "host: ", host)
  const deviceType = 'android';

  if(userList.length > 0){
  for (let i = 0; i < userList.length; i++) {
    // let eventImage = event.eventImages[0].eventImage;
    // console.log(eventImage,"eventImages------")
    if(userList[i].androidUser.length > 0){
    let notifiyStore = await Notification.query().insertGraph({
      eventId: event.id,
      userId: host.id,
      receiverId: userList[i].id,
      msg: event.name + " happening on " + event.start,
      type: "eventOfInterest",
      status: "pending",
      notificationType: 1
    }).returning("*");
  }
    //set value
    if(userList[i].androidUser){
    for(let j=0;j<userList[i].androidUser.length;j++){
    let UsersdeviceToken = userList[i].androidUser[j].deviceToken
    
      var message = new gcm.Message({
        collapseKey: 'demo',
        priority: 'high',
        contentAvailable: true,
        delayWhileIdle: true,
        restrictedPackageName: 'com.ebabu.event365live',
        data: {
          "eventId": event.id,
          "eventName": event.name,
          "userId": event.userId,
          "message": "eventOfInterest",
          "type": 'eventOfInterest',
          "dataTime": event.start,
          "notificationType": 1
        }
      });
      // console.log(message, "Msg here")
      var regTokens = [UsersdeviceToken];
      gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
        if (err) console.error(err);
        else console.log(response, "New Event Invite notification sent to Andorid");
      });
    }
   }
  }
}
}

// MArk Favorite User to Host
module.exports.markFav = async (host, CustomerFav, event) => {
  console.log("markFav--User to Host----",host);
  let err;
  let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',event.id).andWhere('userId',CustomerFav.id)
  .andWhere('receiverId',host.id).andWhere('type','eventFav').andWhere('notificationType',1)
  if(checknoti.length<=0){
  let notifiyStore = await Notification.query().insertGraph({
    eventId: event.id,
    userId: CustomerFav.id,
    receiverId: host.id,
    //Your event "eventname" has been set favorite by "username"
    msg: "Your " + event.name + " has been set favorite by " + CustomerFav.name,
    type: "eventFav",
    status: "pending",
    notificationType: 1
  }).returning("*");
}
  //set value
  if(host.isNotify){
  for(let i=0;i< host.androidUser.length;i++){
  var UsersdeviceToken = host.androidUser[i].deviceToken;
  
  // if (deviceType == 'android') {
  var message = new gcm.Message({
    collapseKey: 'demo',
    priority: 'high',
    contentAvailable: true,
    delayWhileIdle: true,
    restrictedPackageName: 'com.ebabu.event365live.host',
    data: {
      "eventId": event.id,
      "userId": CustomerFav.id,
      "name": CustomerFav.name,
      "message": "Your " + event.name + " has been set favorite by " + CustomerFav.name,
      "type": 'eventFav',
      "notificationType": 1
    }

  });
  // console.log(message, "Msg here")
  var regTokens = [UsersdeviceToken];
  gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
    if (err) console.error(err);
    else console.log(response, "Event Fav notification sent to Andorid");
  });
  // }
}
  }
}

//Add Review (User to Host)
module.exports.reviewEvent = async (Event, user) => {
  console.log("Add Review --------");
  let err;
 

  // Notification table insert
  let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',Event.id).andWhere('userId',user.id)
  .andWhere('receiverId',Event.users.userId).andWhere('type','eventReview').andWhere('notificationType',1)
  if(checknoti.length<=0){
  let notifiyStore = await Notification.query().insertGraph({
    eventId: Event.id,
    userId: user.id,
    receiverId: Event.users.userId,
    msg: user.name + " gave rating & feedback for " + Event.name + '.' + 'Click here to view.',
    type: "eventReview",
    notificationType: 1
  }).returning("*");
}
 if(Event.users.isNotify==true){
  for(let i=0; i < Event.users.androidUser.length; i++){
    var  device = Event.users.androidUser[i].deviceToken;
  var message = new gcm.Message({
    collapseKey: 'demo',
    priority: 'high',
    contentAvailable: true,
    delayWhileIdle: true,
    restrictedPackageName: 'com.ebabu.event365live.host',
    data: {
      "userId": user.id,
      "userName": user.name,
      "eventId": Event.id,
      "eventName": Event.name,
      "type": 'eventReview',
      "message": user.name + " gave feedback for " + Event.name,
      "notificationType": 1
    }
  });
  // console.log(message)
  var regTokens = [device];
  gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
    if (err) console.error(err);
    else console.log(response, "reviewEvent Android");
  });
}
 }
}

module.exports.sendEditMember = async (MemberData, status, host, data) => {
  console.log("sendEditMember android --------", MemberData, host, data);
  let err;
  const deviceType = 'android';
 
  console.log(device, "devicedevice-----------------??-")
  // Notification table insert
  let notifiyStore = await Notification.query().insertGraph({

    userId: host,
    receiverId: MemberData.id,
    msg: "Your Role is now of " + data.roles,
    type: "editMember",
    status: "pending",

  }).returning("*");
   
 for(let i=0;i < MemberData.androidUser.length;i++){ 
  const device = MemberData.androidUser[i].deviceToken;
  console.log(device,'device');
    var message = new gcm.Message({
      collapseKey: 'demo',
      priority: 'high',
      contentAvailable: true,
      delayWhileIdle: true,
      restrictedPackageName: 'com.ebabu.event365live.host',
      data: {
        "userId": host,
        // "eventId": notif.id,
        // "eventName": notif.name,
        "roles": data.userType,
        "permission": data.roles,
        "type": 'editMember',
        "message": "Your Role is now of " + data.roles,
      }

    });
    console.log(message)
    var regTokens = [device];
    console.log(regTokens)
    gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
      if (err) console.error(err);
      else console.log("andorid", response);
    });
 }
}

/**Notify to host on accept invite by user */
module.exports.notifytoAndroidHost = async (host, status, user, event) => {
  let err, msg, type;
  if (status == 'accepted') {
    msg = user.name + " has accepted your invite for the event " + event.name;
    type = 'inviteAccepted'
  } else if (status == 'rejected') {
    msg = user.name + " has declined your invite for the event " + event.name;
    type = 'inviteDeclined'
  }

  let todayDate = new Date();
  let fromdate = moment(todayDate).utc().format('YYYY-MM-DD HH:mm:ss');
  let todayTime = moment(todayDate).utc().add(30, 'second').format('YYYY-MM-DD HH:mm:ss');

  let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',event.id).andWhere('userId',user.id)
  .andWhere('receiverId',host.id).andWhere('type',type).andWhere('notificationType',2)
  .whereBetween('created_at', [fromdate, todayTime]).first().runAfter((result, builder) =>{
    //console.log(builder.toKnexQuery().toQuery())
    return result;
    }); 
   if(!checknoti){ 
  let notifiyStore = await Notification.query().insertGraph({
    eventId: event.id,
    userId: user.id,
    receiverId: host.id,
    msg: msg,
    type: type,
    notificationType: 2
  }).returning("*");
}
  //set value
  for(let i=0;i < host.androidUser.length;i++){
  let UsersdeviceToken = host.androidUser[i].deviceToken
 
  var message = new gcm.Message({
    collapseKey: 'demo',
    priority: 'high',
    contentAvailable: true,
    delayWhileIdle: true,
    restrictedPackageName: 'com.ebabu.event365live.host',
    data: {
      "eventId": event.id,
      "userId": host.id,
      "name": user.name,
      "message": msg,
      "type": type,
      "notificationType": 2
    }

  });
  // console.log(message, "Msg here")
  var regTokens = [UsersdeviceToken];
  gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
    if (err) console.error(err);
    else console.log(response, "Event Accepted or rejected sent to Andorid");
  });
 }
}

/**Notify to user on notification failed */
module.exports.paymentNotificationAndroid = async (ticketeBookingInfo, status) => {
  let err, msg, type;
  if (status == 'failed') {
    msg = "Your transaction of " + ticketeBookingInfo.totalQuantity + " " + ticketeBookingInfo.ticketType + " for event" + ticketeBookingInfo.events.name + " has failed, any amount deducted should be refunded shortly.";
    type = 'paymentFailed'
  } else if (status == 'success') {
    msg = "Your transaction of " + ticketeBookingInfo.totalQuantity + " " + ticketeBookingInfo.ticketType + " for event" + ticketeBookingInfo.events.name + " was successfull, click here to view your tickets";
    type = 'paymentSuccess'
  }

  let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',ticketeBookingInfo.events.id).andWhere('userId',ticketeBookingInfo.users.id)
  .andWhere('receiverId',ticketeBookingInfo.users.id).andWhere('type',type).andWhere('notificationType',4)
  if(!checknoti){
  let notifiyStore = await Notification.query().insertGraph({
    eventId: ticketeBookingInfo.events.id,
    userId: ticketeBookingInfo.users.id,
    receiverId: ticketeBookingInfo.users.id,
    msg: msg,
    type: type,
    notificationType: 4
  }).returning("*");
}
  //set value
  if(ticketeBookingInfo.users.isNotify=='true'){
  for(let i=0; i < ticketeBookingInfo.users.androidUser.length;i++){

    var UsersdeviceToken = ticketeBookingInfo.users.androidUser[i].deviceToken;
  
 
  // if (deviceType == 'android') {
  var message = new gcm.Message({
    collapseKey: 'demo',
    priority: 'high',
    contentAvailable: true,
    delayWhileIdle: true,
    restrictedPackageName: 'com.ebabu.event365live',
    data: {
      "eventId": ticketeBookingInfo.events.id,
      "userId": ticketeBookingInfo.users.id,
      "name": ticketeBookingInfo.users.name,
      "message": msg,
      "type": type,
      "notificationType": 4
    }

  });
  // console.log(message, "Msg here")
  var regTokens = [UsersdeviceToken];
  gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
    if (err) console.error(err);
    else console.log(response, "Payment success or failed to Andorid");
  });
  // }
  }
 }
  
}

//Create Event - Host to User
module.exports.ticketCancelled = async (userList,host,checkStatus,event) => {
  console.log("ticketCancelled android------",event);
  let err;
  console.log("getUserTokens", checkStatus.ticket_number_booked_rel)
  const deviceType = 'android';

  if(checkStatus.ticketType=='regularNormal'){
    tickettypes = 5;
  } else {
    tickettypes = 4;
  }

  let checknoti = await Notification.query().skipUndefined().select("id").andWhere('userId',host.userId)
   .andWhere('receiverId',userList.id).andWhere('type','ticketCancelled').andWhere('notificationType',1);
  if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
      eventId:event.id,
      userId: host.id,
      receiverId: userList.id,
      msg: "Your "+checkStatus.ticket_number_booked_rel[0].totalquantities+" "+checkStatus.ticketType+"  purchased for "+event.name+" has been cancelled by the Host",
      type: "TicketCancelled",
      status: "pending",
      notificationType: tickettypes
    }).returning("*");
  }
    //set value
    if(userList.androidUser){
    for(let j=0;j<userList.androidUser.length;j++){
    let UsersdeviceToken = userList.androidUser[j].deviceToken
    
      var message = new gcm.Message({
        collapseKey: 'demo',
        priority: 'high',
        contentAvailable: true,
        delayWhileIdle: true,
        restrictedPackageName: 'com.ebabu.event365live',
        data: {
          "userId": host.userId,
          "message": "Your "+checkStatus.ticket_number_booked_rel[0].totalquantities+" "+checkStatus.ticketType+"  purchased for "+event.name+" has been cancelled by the Host",
          "type": 'TicketCancelled',
          "notificationType": tickettypes
        }
      });
      // console.log(message, "Msg here")
      var regTokens = [UsersdeviceToken];
      gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
        if (err) console.error(err);
        else console.log(response, "Ticket Cancelled notification sent to Andorid");
      });
    }
  
}
}

module.exports.userticketCancelledtoUser = async (userList,host,checkStatus,event) => {
  console.log("ticketCancelled android------",);
  let err;
  console.log("getUserTokens", userList)
  const deviceType = 'android';

  if(checkStatus.ticketType=='regularNormal'){
    tickettypes = 5;
  } else {
    tickettypes = 4;
  }

  let checknoti = await Notification.query().skipUndefined().select("id").andWhere('userId',host.userId)
   .andWhere('receiverId',userList.id).andWhere('type','ticketCancelled').andWhere('notificationType',1);
  if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
      eventId:event.id,
      receiverId: userList.id,
      msg: "You have cancelled "+checkStatus.totalQuantity+" "+checkStatus.ticketType+"  ticket for your event "+event.name+" ",
      type: "userTicketCancelled",
      status: "pending",
      notificationType: tickettypes
    }).returning("*");
  }
    //set value
    if(userList.androidUser){
    for(let j=0;j<userList.androidUser.length;j++){
    let UsersdeviceToken = userList.androidUser[j].deviceToken
    
      var message = new gcm.Message({
        collapseKey: 'demo',
        priority: 'high',
        contentAvailable: true,
        delayWhileIdle: true,
        restrictedPackageName: 'com.ebabu.event365live',
        data: {
          "userId": host.userId,
          "message": "You have cancelled "+checkStatus.totalQuantity+" "+checkStatus.ticketType+"  ticket for your event "+event.name+" ",
          "type": 'userTicketCancelled',
          "notificationType": tickettypes
        }
      });
      // console.log(message, "Msg here")
      var regTokens = [UsersdeviceToken];
      gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
        if (err) console.error(err);
        else console.log(response, "Ticket Cancelled notification sent to Andorid");
      });
    }
  
}
}

module.exports.userticketCancelledtoHost = async (userList,host,checkStatus,event) => {
  console.log("ticketCancelled android------",);
  let err;
  console.log("getUserTokens", userList)
  const deviceType = 'android';

  if(checkStatus.ticketType=='regularNormal'){
    tickettypes = 5;
  } else {
    tickettypes = 4;
  }

  let checknoti = await Notification.query().skipUndefined().select("id").andWhere('userId',host.userId)
   .andWhere('receiverId',userList.id).andWhere('type','ticketCancelled').andWhere('notificationType',1);
  if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
      eventId:event.id,
      receiverId: host.id,
      msg: ""+userList.name+" has cancelled "+checkStatus.totalQuantity + " " +checkStatus.ticketType+"  ticket for your event "+event.name+"",
      type: "userTicketCancelled",
      status: "pending",
      notificationType: tickettypes
    }).returning("*");
  }
    //set value
    if(userList.androidUser){
    for(let j=0;j<host.androidUser.length;j++){
    let UsersdeviceToken = host.androidUser[j].deviceToken
    
      var message = new gcm.Message({
        collapseKey: 'demo',
        priority: 'high',
        contentAvailable: true,
        delayWhileIdle: true,
        restrictedPackageName: 'com.ebabu.event365live',
        data: {
          "userId": host.id,
          "message":""+userList.name+" has cancelled "+checkStatus.totalQuantity + " " +checkStatus.ticketType+"  ticket for your event "+event.name+"",
          "type": 'userTicketCancelled',
          "notificationType": tickettypes
        }
      });
      // console.log(message, "Msg here")
      var regTokens = [UsersdeviceToken];
      gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
        if (err) console.error(err);
        else console.log(response, "Ticket Cancelled notification sent to Andorid");
      });
    }
  
}
}

