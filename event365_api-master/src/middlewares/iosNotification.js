//ios notification 
const dateformat = require('dateformat');
const Notification = require('./../models/notification'); 
const Event = require('./../models/events');
const TicketBooked = require('./../models/ticketBooked');
var moment = require('moment');
const apn = require('apn');
//start ios notification  

const settings = {
    apn: {
        token: {
            key: 'src/middlewares/ios_certs/AuthKey_9CWANM98T6.p8',
            keyId: '9CWANM98T6',
            teamId: '9JH37XY79W',
            production: false
        },
    },
};

const PushNotifications = require('node-pushnotifications');
const push = new PushNotifications(settings);
var options = {
    token: {
        key: 'src/middlewares/ios_certs/AuthKey_9CWANM98T6.p8',
        keyId: '9CWANM98T6',
        teamId: '9JH37XY79W',
    },
    production: false
};
var apnProvider = new apn.Provider(options);
module.exports.push = push;

// Event Create  (Host to User)
module.exports.sendCreateEvent = async (userList, host, event) => {
    console.log("sendCreateEvent- ios---------!!");
    console.log("sendCreateEvent", userList, "host: ", host)
    console.log("sendCreateEvent", userList, "host: ", event)
    let now = new Date(event.start);
    let DataEvent = dateformat(now, 'dddd, d mmmm yyyy');

    let err, data, topic = 'com.eventuser.app';
    if(userList.length > 0){
    for (let i = 0; i < userList.length; i++) {
        if(userList[i].iosUser.length > 0){
        let notifiyStore = await Notification.query().insertGraph({
            eventId: event.id,
            userId: host.id,
            receiverId: userList[i].id,
            msg: event.name + " will be happening on " + DataEvent,
            type: "eventOfInterest",
            status: "pending",
            notificationType: 1
        }).returning("*");
    }

        for(let j=0;j<userList[i].iosUser.length;j++){
        let UsersdeviceToken = userList[i].iosUser[j].deviceToken

        var note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.badge = 3;
        note.sound = "applause.caf"; //ping.aiff //tarzanwut.wav
        note.alert = {
            title: "New Event found in your interest",
            body: event.name + " will be happening on " + DataEvent,
            data: {
                "eventId": event.id,
                "message": "New Event Created !",
                "type": 'eventOfInterest',
                "notificationType": 1
            }
        };
        note.payload = {
            "eventId": event.id,
        };
        note.topic = topic;
        apnProvider.send(note, UsersdeviceToken).then((result) => {
            console.log("New Event Invite notification sent to iOS");
            console.log(result.failed);
        }).catch(err => {
            console.log('error sending notification');
            console.log(err, 'err');
        });
    }
  }
 }

}

//Mark Fav (User To Host)
module.exports.markFav = async (host, CustomerFav, event) => {
    console.log("markFav ios----------!!");
    let err, data, topic = 'com.eventhost.app';
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',event.id).andWhere('userId',CustomerFav.id)
    .andWhere('receiverId',host.id).andWhere('type','eventFav').andWhere('notificationType',1)
    if(checknoti.length<=0){
    let notifiyStore = await Notification.query().insertGraph({
        eventId: event.id,
        userId: CustomerFav.id,
        receiverId: host.id,
        msg: "Your " + event.name + " has been set favorite by " + CustomerFav.name,
        type: "eventFav",
        status: "pending",
        notificationType: 1
    }).returning("*");
}

if(host.isNotify){
    for(let i=0;i< host.iosUser.length;i++){
    let UsersdeviceToken = host.iosUser[i].deviceToken;
    //console.log(UsersdeviceToken)
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Event Favorite !",
        body: "Your " + event.name + " has been set favorite by " + CustomerFav.name,
        data: {
            "eventId": event.id,
            "userId": CustomerFav.id,
            "name": CustomerFav.name,
            "message": "Your " + event.name + " has been set favorite by " + CustomerFav.name,
            "type": 'eventFav',
            "notificationType": 1
        }
    };
    note.payload = {
        "eventId": event.id,
    };
    //  console.log(notifiyStore)
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("New Event Invite notification sent to iOS");
        //  console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
}
}
}

//userTicketBooked (User To Host)
module.exports.ticketBookednotifyHost = async (notif, user) => {
    console.log("userTicketBooked ios----------!!");
    let err, data, topic = 'com.eventhost.app';
    console.log(notif)
    console.log(notif.userId, user.id)
    // Notification table insert
  
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',notif.id).andWhere('userId',user.id)
    .andWhere('receiverId',notif.users.userId).andWhere('type','hostTicketBooked').andWhere('notificationType',2)
    if(checknoti.length<=0){ 
    let notifiyStore = await Notification.query().insertGraph({
        eventId: notif.id,
        receiverId: notif.users.userId,
        userId: user.id,
        msg: user.name + " booked ticket for " + notif.name,
        type: "hostTicketBooked",
        notificationType: 2
    }).returning("*");
}

if(notif.users.isNotify=='true'){
for(let i=0;i< notif.users.iosUser.length;i++){
       
    var UsersdeviceToken = notif.users.iosUser[i].deviceToken;
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "The customer has booked ticket.",
        body: user.name + " booked ticket for " + notif.name,
        data: {
            "userId": user.id,
            "userName": user.name,
            "eventId": notif.id,
            "eventName": notif.name,
            "type": "hostTicketBooked",
            "message": user.name + " booked ticket for " + notif.name,
            "notificationType": 2
        }
    };

    note.payload = {
        'messageFrom': 'Dr.G',
        "eventId": notif.id,
    };
    note.topic = topic;

    apnProvider.send(note, UsersdeviceToken).then((result) => {
        // console.log("Ticket Booked notification sent to iOS");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
}
}
}

//userTicketBooked (User To User)
module.exports.ticketBookednotifyUser = async (notif, user) => {
    console.log("userTicketBooked ios");
    let err, data, topic = 'com.eventuser.app';
    // Notification table insert
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',notif.id).andWhere('userId',notif.users.userId)
  .andWhere('receiverId',user.id).andWhere('type','ticketBooked').andWhere('notificationType',2)
  if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
        eventId: notif.id,
        userId: notif.users.userId,
        receiverId: user.id,
        msg: "You have successfully booked for the " + notif.name,
        type: "ticketBooked",
        notificationType: 2

    }).returning("*");
  }
  if(user.isNotify=='true'){
for(let i=0;i< user.iosUser.length;i++){
    var UsersdeviceToken = user.iosUser[i].deviceToken
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "You're ticked booked successfully",
        body: "You have successfully booked for the " + notif.name,
        data: {

            "eventId": notif.id,
            "type": 'ticketBooked',
            "message": "You have successfully booked for the " + notif.name,
            "notificationType": 2
        }
    };

    note.payload = {
        "eventId": notif.id,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        // console.log("Ticket Booked notification sent to iOS");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });

 }
}
}

//checkIn (User To Host)
module.exports.checkIn = async (notif, user, Customer) => {
    console.log("checkIn ios");
    let err, data, topic = 'com.eventhost.app';
    // Notification table insert
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
    for(let i=0;i<notif.users.iosUser.length;i++){
    let UsersdeviceToken = notif.users.iosUser[i].deviceToken
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Event365 Live",
        subtitle: "You have successfully checked-in",
        body: Customer + " successfully checkedin for " + notif.name,
        data: {
            // "userId": user.id,
            // "userName": user.name,
            "eventId": notif.id,
            "eventName": notif.name,
            "type": 'checkIn',
            "message": Customer + " successfully checkedin for " + notif.name,
            "notificationType": 2,
        }
    };
    note.payload = {
        "eventId": notif.id,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("Ticket checkIn notification sent to iOS");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
}
}

// Invite User  (Host to User)
module.exports.sendInviteUserIOS = async (userList, hostList, eventInfo) => {
    console.log("sendInviteUserIOS-----------");
    //  let userToken = userList[0].deviceToken

    let err, data, topic = 'com.eventuser.app';
if(userList.length > 0){
    for (let i = 0; i < userList.length; i++) {
        let todayDate = new Date();
        let fromdate = moment(todayDate).format('YYYY-MM-DD HH:mm:ss');
        let todayTime = moment(todayDate).add(15, 'second').format('YYYY-MM-DD HH:mm:ss');
      
        let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',eventInfo.id).andWhere('userId',hostList.id)
        .andWhere('receiverId',userList[i].id).andWhere('type','Invited').andWhere('notificationType',2)
        .whereBetween('created_at', [fromdate, todayTime]).first();
         if(!checknoti){
            if(userList[i].iosUser.length > 0){
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

 if(userList[i].isNotify==true){
  for(let j=0; j < userList[i].iosUser.length;j++){
            let created_at =  today = new Date();
        let UsersdeviceToken = userList[i].iosUser[j].deviceToken
        console.log(UsersdeviceToken, "---ios token-")
        var note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        note.badge = 3;
        note.sound = "ping.aiff";
        note.alert = {
            title: "Event365 Live",
            subtitle: "You have a new invitation",
            body: hostList.name + " invited you to attend the event " + eventInfo.name,
            data: {
                "eventId": eventInfo.id,
                "notificationType": 1
                // "message": "Invited Event",
                // "type": notifiyStore.type,
            }
        };
        note.category = 'Invited';
        // "eventId": eventId,
        note.payload = {
            "eventId": eventInfo.id,

        };
        note.topic = topic;
        apnProvider.send(note, UsersdeviceToken).then((result) => {
            console.log("notification sent to iOs");
            console.log(result.failed);
        }).catch(err => {
            console.log('error sending notification');
            console.log(err, 'err');
        });
    }
 }
}
}
}


//Review Add (User To Host)

module.exports.reviewEvent = async (notif, user) => {
    console.log("reviewEvent IOS ");
    let err, data, topic = 'com.eventhost.app';

    // Notification table insert
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',notif.id).andWhere('userId',user.id)
    .andWhere('receiverId',notif.users.userId).andWhere('type','eventReview').andWhere('notificationType',1)
    if(checknoti.length <=0){
    let notifiyStore = await Notification.query().insertGraph({
        eventId: notif.id,
        userId: user.id,
        receiverId: notif.users.userId,
        msg: user.name + " gave feedback for " + notif.name,
        type: "eventReview",
        notificationType: 1
    }).returning("*");
}
if(notif.users.isNotify==true){
    for(let i=0; i < notif.users.iosUser.length; i++){

    let UsersdeviceToken = notif.users.iosUser[i].deviceToken;
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Reviews",
        body: user.name + " gave feedback for " + notif.name,
        data: {
            "userId": user.id,
            "userName": user.name,
            "eventId": notif.id,
            "notificationType": 1
            // "eventName": notif.name,
            // "type": notifiyStore.type,
            // "message": "Ticket Booked !",
        }
    };
    note.payload = {
        "eventId": notif.id,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("Event Review notification sent to iOS");
        // console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });

 }
}
}

// Host to member  
module.exports.sendEditMember = async (MemberData, host, data) => {
    console.log("sendEditMember IOS--------", MemberData, host, data);
    let err, topic = 'com.eventhost.app';
    console.log(MemberData.deviceToken, "hjhkjhk");
    let notifiyStore = await Notification.query().insertGraph({
        // eventId: event.id,
        userId: host,
        receiverId: MemberData.id,
        msg: "Your Role is now of " + data.roles,
        type: "editMember",
        status: "pending",
    }).returning("*");
  
   for(let i=0;i< MemberData.iosUser.length;i++){
    let UsersdeviceToken = MemberData.iosUser[i].deviceToken;
    console.log(UsersdeviceToken)
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "applause.caf"; //ping.aiff //tarzanwut.wav
    note.alert = {
        title: "Member Roles and Permission Changed",
        body: "Your Role is now of " + data.roles,
        data: {
            // "eventId": event.id,
            "message": "Your Role is now of " + data.roles,
            "type": 'editMember',
        }
    };
    note.payload = {
        // "eventId": event.id,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("Edit Member notification sent to iOS");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
  }
}

// eventReminder User  ()
module.exports.eventReminder = async () => {
    console.log("eventReminder IOS-----------");
    let userId = req.user.id;
    let todayDate = new Date();
    console.log("user IOS-----------", userId);
    //  let userToken = userList[0].deviceToken
    let eventList = await TicketBooked.query().skipUndefined().select('eventId').where('userId', userId)

    let eventIds = Array.prototype.map.call(eventList, s => s.eventId)
    console.log(eventIds)

    //fetch Event Data
    const eventData = await Event.query().select('sellingStart', 'sellingStart', 'sellingEnd', 'start', 'end').eager('[users]').modifyEager('users', builder => {
        builder.select('id', 'name', 'deviceToken', 'deviceType');
    }).whereIn('id', eventIds).where("start", '=', todayDate);
    console.log(eventData);
    let err, data, topic = 'com.eventuser.app';
    let UsersdeviceToken = userList[i].deviceToken
    console.log(UsersdeviceToken, "---ios token-")
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Event365 Live",
        subtitle: "Reminder",
        body: "Invited Event",
        data: {
            "eventId": eventId,
            "notificationType": 1
            // "message": "Invited Event",
            // "type": notifiyStore.type,
        }
    };
    note.category = 'Reminder';
    // "eventId": eventId,
    note.payload = {
        "eventId": eventId,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOs");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
    ///  }
}

module.exports.autoReminder = async () => {
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Event365 Live",
        subtitle: "Reminder",
        body: "Invited Event",
        data: {
            "eventId": eventId,
            "notificationType": 1
            // "message": "Invited Event",
            // "type": notifiyStore.type,
        }
    };
    // note.category = notifiyStore.type;
    // "eventId": eventId,
    note.payload = {
        "eventId": eventId
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOs");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
}


/** Notify to host on accept invite by user */
module.exports.notifytoiosHost = async (host, status, user, event) => {
    let err, data, topic = 'com.eventhost.app';
    let type;
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
    // Notification table insert
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

if(host.isNotify=='true'){
    for(let i=0;i<host.iosUser.length;i++){
    let UsersdeviceToken = host.iosUser[i].deviceToken
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Invite Event",
        body: msg,
        data: {
            "userId": user.id,
            "userName": user.name,
            "eventId": event.id,
            "notificationType": 2,
            "eventName": event.name,
            // "message": "Ticket Booked !",
        }
    };
    note.payload = {
        "eventId": event.id,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("Invite Accepted or Rejected sent to iOS");
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
 }
}
}

// Host to member  
module.exports.PaymentNotificationIOS = async (ticketeBookingInfo, status) => {
    let err, topic = 'com.eventuser.app';
    if (status == 'failed') {
        msg = "Your transaction of " + ticketeBookingInfo.totalQuantity + " " + ticketeBookingInfo.ticketType + " for event" + ticketeBookingInfo.events.name + " has failed, any amount deducted should be refunded shortly.";
        type = 'paymentFailed';
        title = 'Payment request failed';
    } else if (status == 'success') {
        msg = "Your transaction of " + ticketeBookingInfo.totalQuantity + " " + ticketeBookingInfo.ticketType + " for event" + ticketeBookingInfo.events.name + " was successfull, click here to view your tickets";
        type = 'paymentSuccess';
        title = 'Payment request success';
    }
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',ticketeBookingInfo.events.id).andWhere('userId',ticketeBookingInfo.users.id)
  .andWhere('receiverId',ticketeBookingInfo.users.id).andWhere('type',type)
  if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
        eventId: ticketeBookingInfo.events.id,
        userId: ticketeBookingInfo.users.id,
        receiverId: ticketeBookingInfo.users.id,
        msg: msg,
        type: type,
        status: "pending",
    }).returning("*");
}

if(ticketeBookingInfo.users.isNotify=='true'){
    for(let i=0; i < ticketeBookingInfo.users.iosUser.length;i++){ 
    var UsersdeviceToken = ticketeBookingInfo.users.iosUser[i].deviceToken;
   
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "applause.caf"; //ping.aiff
    note.alert = {
        title: title,
        body: msg,
        data: {
            //"eventId": event.id,
            "message": msg
        }
    };
    note.payload = {
        // "eventId": event.id,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOS");
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
  }
}
}

module.exports.OneDayBeforeEventReminder = async (eventData) => {
    console.log(eventData,'eventdata');
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',eventData.id)
          .andWhere('receiverId',eventData.userId).andWhere('type','reminder')
          if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
        eventId: eventData.id,
        // userId: hostList.id,
        receiverId: eventData.userId,
        msg: "Event " + eventData.name + " will begin tommorow",
        type: "reminder",
        status: "pending",
        notificationType: 1
    }).returning("*");
}
  
for(let j=0;j< eventData.users.iosUser.length;j++){
    let UsersdeviceToken = eventData.users.iosUser[j].deviceToken
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Reminder",
        subtitle: "Reminder",
        body: "Event " + eventData.name + " will begin tommorow",
        data: {
            "eventId": eventData.id,
            // "message": "Invited Event",
            // "type": notifiyStore.type,
        }
    };
    //note.category = notifiyStore.type;
    // "eventId": eventId,
    note.payload = {
        "eventId": eventData.id,
    };
    note.topic = 'com.eventhost.app';
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOs");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
}
}

module.exports.OneDayBeforeEventRemindertoUsers = async (eventData, userData) => {
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',eventData.id)
    .andWhere('receiverId',userData.users.id).andWhere('type','reminder')
    if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
        eventId: eventData.id,
        //userId: hostList.id,
        receiverId: userData.users.id,
        msg: "Event " + eventData.name + " will begin tommorow",
        type: "reminder",
        status: "pending",
        notificationType: 1
    }).returning("*");
}

for(let k=0;k< userData.users.iosUser.length;k++){
    let UsersdeviceToken = userData.users.iosUser[k].deviceToken;
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Reminder",
        subtitle: "Reminder",
        body: "Event " + eventData.name + " will begin tommorow",
        data: {
            "eventId": eventData.id,
            // "message": "Invited Event",
            // "type": notifiyStore.type,
        }
    };
    //note.category = notifiyStore.type;
    // "eventId": eventId,
    note.payload = {
        "eventId": eventData.id,
    };
    note.topic = 'com.eventuser.app';
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOs");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
  }
}

module.exports.TodayEventRemindertoHost = async (eventData) => {
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',eventData.id)
    .andWhere('receiverId',eventData.userId).andWhere('type','reminder')
    if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
        eventId: eventData.id,
        // userId: hostList.id,
        receiverId: eventData.userId,
        msg: "Event " + eventData.name + " starts in 1 hour. Buckel up!",
        type: "reminder",
        status: "pending",
        notificationType: 1
    }).returning("*");
}

for(let j=0;j< eventData.users.iosUser.length;j++){
    let UsersdeviceToken = eventData.users.iosUser[j].deviceToken
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Reminder",
        subtitle: "Reminder",
        body: "Event " + eventData.name + " starts in 1 hour. Buckel up!",
        data: {
            "eventId": eventData.id,
            // "message": "Invited Event",
            // "type": notifiyStore.type,
        }
    };
    //note.category = notifiyStore.type;
    // "eventId": eventId,
    note.payload = {
        "eventId": eventData.id,
    };
    note.topic = 'com.eventhost.app';
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOs");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
  }
}

module.exports.TodayEventRemindertoUsers = async (eventData, userData) => {
    let checknoti1 = await Notification.query().skipUndefined().select("id").where('eventId',eventData.id)
    .andWhere('receiverId',userData.users.id).andWhere('type','reminder')
    if(!checknoti1){
    let notifiyStore = await Notification.query().insertGraph({
        eventId: eventData.id,
        //userId: hostList.id,
        receiverId: userData.users.id,
        msg: "Event " + eventData.name + " starts in 1 hour. Buckel up!",
        type: "reminder",
        status: "pending",
        notificationType: 1
    }).returning("*");
}
for(let k=0;k< userdata.users.iosUser.length;k++){
    let UsersdeviceToken = userData.users.iosUser[k].deviceToken;
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = {
        title: "Reminder",
        subtitle: "Reminder",
        body: "Event " + eventData.name + " starts in 1 hour. Buckel up!",
        data: {
            "eventId": eventData.id,
            // "message": "Invited Event",
            // "type": notifiyStore.type,
        }
    };
    //note.category = notifiyStore.type;
    // "eventId": eventId,
    note.payload = {
        "eventId": eventData.id,
    };
    note.topic = 'com.eventuser.app';
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOs");
        console.log(result.failed);
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
  }
}

// Host to user  
module.exports.ticketCancelled = async (userlist, host, checkStatus,event) => {
    let err, topic = 'com.eventuser.app';

    if(checkStatus.ticketType=='regularNormal'){
        tickettypes = 5;
      } else {
        tickettypes = 4;
      }
  
    let checknoti = await Notification.query().skipUndefined().select("id").andWhere('userId',host.id)
  .andWhere('receiverId',userlist.id).andWhere('type','ticketCancelled')
  if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
        eventId:event.id,
        userId: host.id,
        receiverId: userlist.id,
        msg: "Your "+checkStatus.ticket_number_booked_rel[0].totalquantities+" "+checkStatus.ticketType+"  purchased for "+event.name+" has been cancelled by the Host",
        type: "ticketCancelled",
        status: "pending",
    }).returning("*");
}
    for(let i=0; i < userlist.iosUser.length;i++){ 
    var UsersdeviceToken = userlist.iosUser[i].deviceToken;
   

    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "applause.caf"; //ping.aiff
    note.alert = {
        title: "TicketCancelled",
        body: "Your "+checkStatus.ticket_number_booked_rel[0].totalquantities+" "+checkStatus.ticketType+"  purchased for "+event.name+" has been cancelled by the Host",
        data: {
            //"eventId": event.id,
            "message": "Your "+checkStatus.ticket_number_booked_rel[0].totalquantities+" "+checkStatus.ticketType+"  purchased for "+event.name+" has been cancelled by the Host",
        }
    };
    note.payload = {
        // "eventId": event.id,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOS");
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
  }

}

module.exports.userticketCancelledtoHost = async (userlist, host, checkStatus,event) => {
    let err, topic = 'com.eventuser.app';

    if(checkStatus.ticketType=='regularNormal'){
        tickettypes = 5;
      } else {
        tickettypes = 4;
      }
  
    let checknoti = await Notification.query().skipUndefined().select("id").andWhere('userId',host.userId)
  .andWhere('receiverId',host.id).andWhere('type','userTicketCancelled')
  if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
        eventId:event.id,
        receiverId: host.id,
        msg: ""+userlist.name+" has cancelled "+checkStatus.totalQuantity + " " +checkStatus.ticketType+"  ticket for your event "+event.name+"",
        type: "userTicketCancelled",
        status: "pending",
    }).returning("*");
}
    for(let i=0; i < host.iosUser.length;i++){ 
    var UsersdeviceToken = host.iosUser[i].deviceToken;
   

    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "applause.caf"; //ping.aiff
    note.alert = {
        title: "TicketCancelled",
        body: ""+userlist.name+" has cancelled "+checkStatus.totalQuantity + " " +checkStatus.ticketType+"  ticket for your event "+event.name+"",
        data: {
            //"eventId": event.id,
            "message":""+userlist.name+" has cancelled "+checkStatus.totalQuantity + " " +checkStatus.ticketType+"  ticket for your event "+event.name+"",
        }
    };
    note.payload = {
        // "eventId": event.id,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOS");
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
  }

}

module.exports.userticketCancelledtoUser = async (userlist, host, checkStatus,event) => {
    let err, topic = 'com.eventuser.app';

    if(checkStatus.ticketType=='regularNormal'){
        tickettypes = 5;
      } else {
        tickettypes = 4;
      }
  
    let checknoti = await Notification.query().skipUndefined().select("id")
  .andWhere('receiverId',userlist.id).andWhere('type','userTicketCancelled')
  if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
        eventId:event.id,
        receiverId: userlist.id,
        msg: "You have cancelled "+checkStatus.totalQuantity+" "+checkStatus.ticketType+"  ticket for your event "+event.name+" ",
        type: "userTicketCancelled",
        status: "pending",
    }).returning("*");
}
    for(let i=0; i < userlist.iosUser.length;i++){ 
    var UsersdeviceToken = userlist.iosUser[i].deviceToken;
   

    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "applause.caf"; //ping.aiff
    note.alert = {
        title: "TicketCancelled",
        body: "You have cancelled "+checkStatus.totalQuantity+" "+checkStatus.ticketType+"  ticket for your event "+event.name+" ",
        data: {
            //"eventId": event.id,
            "message": "You have cancelled "+checkStatus.totalQuantity+" "+checkStatus.ticketType+"  ticket for your event "+event.name+" ",
        }
    };
    note.payload = {
        // "eventId": event.id,
    };
    note.topic = topic;
    apnProvider.send(note, UsersdeviceToken).then((result) => {
        console.log("notification sent to iOS");
    }).catch(err => {
        console.log('error sending notification');
        console.log(err, 'err');
    });
  }

}
//end ios notification