const Notification = require('../models/notification');
var http = require("https");
var moment = require('moment');

//YM 
module.exports.ticketBookednotifyHost = async (notif, user) => {
    console.log("support",notif, user)
    
    var options = {
      "method": "POST",
      "hostname": "fcm.googleapis.com", 
      // "port": null,
      "path": "/fcm/send",
      "headers": {
        "content-type": "application/json",
        "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
        "cache-control": "no-cache"
      }
    };
    // Notification table insert
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
  if(notif.users.isNotify=='true'){
    if(notif.users.webUser!=undefined){
      for (let index = 0; index < notif.users.webUser.length; index++) {
        var req = await http.request(options, function (res) {
          var chunks = [];
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
          res.on("end", function () {
            var body = Buffer.concat(chunks);
          });
        });
        let bodyData = {};
        const element = notif.users.webUser[index].deviceToken;
        let created_at =  today = new Date();
        bodyData = JSON.stringify({
           "data": {
             "notification": {
               "body": user.name + " booked ticket for " + notif.name,
               "title": "Ticket Booked",
               "msg": "",
               "created_at": created_at,
               "notificationType": 2,
               // "icon": '/var/www/html/moki_api/default_image.png',
               "click_action": 'https://test.365live.com/notification'
             }
           },
           "to": element
         });
         await req.write(bodyData);
         req.end();
      }
    }
  }
}

module.exports.ticketBookednotifyUser = async (notif, user) => {
    console.log("support",notif, user)
    
    var options = {
      "method": "POST",
      "hostname": "fcm.googleapis.com",
      // "port": null,
      "path": "/fcm/send",
      "headers": {
        "content-type": "application/json",
        "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
        "cache-control": "no-cache"
      }
    };
    // Notification table insert
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',notif.id).andWhere('userId',notif.userId)
  .andWhere('receiverId',user.id).andWhere('type','ticketBooked').andWhere('notificationType',2);
  if(!checknoti){
    let notifiyStore = await Notification.query().insertGraph({
        eventId: notif.id,
        userId: notif.userId,
        receiverId: user.id,
        msg: "You have successfully booked for the " + notif.name,
        type: "ticketBooked",
        notificationType: 2,
    
      }).returning("*");
    }
    if(user.isNotify=='true'){
    if(user.webUser!=undefined){
      for (let index = 0; index < user.webUser.length; index++) {
        var req = await http.request(options, function (res) {
          var chunks = [];
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
          res.on("end", function () {
            var body = Buffer.concat(chunks);
          });
        });
        let bodyData = {};
        const element = user.webUser[index].deviceToken;
        let created_at =  today = new Date();
        bodyData = JSON.stringify({
          "data": {
            "notification": {
              "body": "You have successfully booked for the " + notif.name,
              "title": "Ticket Booked",
              "msg": "",
              "created_at": created_at,
              "notificationType": 2,
              "click_action": 'https://test.365live.com/notification'
              // "icon": '/var/www/html/moki_api/default_image.png',
            }
          },
          "to": element
        });
        await req.write(bodyData);
        req.end();
      }
    }
  }
}

/**Notify to user on notification failed */
module.exports.PaymentNotificationWeb = async (ticketeBookingInfo, status) => {

    var options = {
        "method": "POST",
        "hostname": "fcm.googleapis.com",
        // "port": null,
        "path": "/fcm/send",
        "headers": {
          "content-type": "application/json",
          "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
          "cache-control": "no-cache"
        }
      };
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
    if(ticketeBookingInfo.users.webUser){
      for (let index = 0; index < ticketeBookingInfo.users.webUser.length; index++) {
        var req = await http.request(options, function (res) {
          var chunks = [];
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
          res.on("end", function () {
            var body = Buffer.concat(chunks);
          });
        });
        let bodyData = {};
        const element = ticketeBookingInfo.users.webUser[index].deviceToken;
        let created_at =  today = new Date();
        bodyData = JSON.stringify({
          "data": {
            "notification": {
              "title": "Payment status notification", 
              "eventId": ticketeBookingInfo.events.id,
                "userId": ticketeBookingInfo.users.id,
                "name": ticketeBookingInfo.users.name,
                "body": msg,
                "type": type,
                "notificationType": 4,
                "click_action": 'https://test.365live.com/notification'
              // "icon": '/var/www/html/moki_api/default_image.png',
              }
          },
          "to": element
        });
        await req.write(bodyData);
        req.end();
      }
    }
  }
}

 //Add Review (User to Host)
module.exports.reviewEvent = async (Event, user) => {
    console.log("Add Review --------",Event.users.userId);
    let err;
   
    var options = {
        "method": "POST",
        "hostname": "fcm.googleapis.com",
        // "port": null,
        "path": "/fcm/send",
        "headers": {
          "content-type": "application/json",
          "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
          "cache-control": "no-cache"
        }
      };
  
    // Notification table insert
    let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',Event.id).andWhere('userId',user.id)
    .andWhere('receiverId',Event.users.userId).andWhere('type','eventReview').andWhere('notificationType',1).runBefore((result, builder)=>{
      console.log(builder.toKnexQuery().toQuery())
      return result;
  });
  console.log();
    if(checknoti.length <=0){
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
      for (let index = 0; index < Event.users.webUser.length; index++) {
        var req = await http.request(options, function (res) {
          var chunks = [];
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
          res.on("end", function () {
            var body = Buffer.concat(chunks);
          });
        });
        let bodyData = {};
        const element = Event.users.webUser[index].deviceToken;
        let created_at =  today = new Date();
        bodyData = JSON.stringify({
          "data": {
            "notification": {
                "title":"New review added",
                "userId": user.id,
                "userName": user.name,
                "eventId": Event.id,
                "eventName": Event.name,
                "type": 'eventReview',
                "body": user.name + " gave feedback for " + Event.name,
                "notificationType": 1,
                "click_action": 'https://test.365live.com/notification'
              // "icon": '/var/www/html/moki_api/default_image.png',
            }
          },
          "to": element
        });
        await req.write(bodyData);
        req.end();
      }
    }
  } 

  // MArk Favorite User to Host
module.exports.markFav = async (host, CustomerFav, event) => {
    console.log("markFav--User to Host----");
    let err;
    var options = {
        "method": "POST",
        "hostname": "fcm.googleapis.com",
        // "port": null,
        "path": "/fcm/send",
        "headers": {
          "content-type": "application/json",
          "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
          "cache-control": "no-cache"
        }
      };
     
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
    //console.log(host.id);
    if(host.isNotify){
     // console.log('shdgf')
      for (let index = 0; index < host.webUser.length; index++) {
        var req = await http.request(options, function (res) {
          var chunks = [];
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
          res.on("end", function () {
            var body = Buffer.concat(chunks);
          });
        });
        let bodyData = {};
        const element = host.webUser[index].deviceToken;
        let created_at =  today = new Date();
        bodyData = JSON.stringify({
           "data": {
             "notification": {
              "title":"Favorite Event",  
              "eventId": event.id,
                "userId": CustomerFav.id,
                "name": CustomerFav.name,
                "body": "Your " + event.name + " has been set favorite by " + CustomerFav.name,
                "type": 'eventFav',
                "notificationType": 1,
                "click_action": 'https://test.365live.com/notification'
               // "icon": '/var/www/html/moki_api/default_image.png',
               //"click_action": notif.url
             }
           },
           "to": element
         });
        var dhb =  await req.write(bodyData);
       // console.log(dhb,'shf');
         req.end();
      }
    }
}

//Ticket checkIn - Member to Host
module.exports.checkIn = async (notif, user, Customer) => {
    console.log("checkIn --------");
    let err;
    var options = {
        "method": "POST",
        "hostname": "fcm.googleapis.com",
        // "port": null,
        "path": "/fcm/send",
        "headers": {
          "content-type": "application/json",
          "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
          "cache-control": "no-cache"
        }
      };
    
  
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
    if(notif.users.webUser){
      for (let index = 0; index < notif.users.webUser.length; index++) {
        var req = await http.request(options, function (res) {
          var chunks = [];
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
          res.on("end", function () {
            var body = Buffer.concat(chunks);
          });
        });
        let bodyData = {};
        const element = notif.users.webUser[index].deviceToken;
        let created_at =  today = new Date();
        bodyData = JSON.stringify({
           "data": {
             "notification": {
               "title": "Ticket Checkedin",
                "userId": user.id,
                "userName": user.name,
                "eventId": notif.id,
                "eventName": notif.name,
                "type": 'checkIn',
                "body": Customer + " successfully checkedin for " + notif.name,
                "notificationType": 2,
                "click_action": 'https://test.365live.com/notification'
               // "icon": '/var/www/html/moki_api/default_image.png',
               //"click_action": notif.url
             }
           },
           "to": element
         });
        var gv=  await req.write(bodyData);
        console.log(gv);
         req.end();
      }
    }
 }

 //Invite User - Host to User
module.exports.sendInviteUser = async (userList, hostList, eventInfo) => {
    console.log("sendInviteUser-web-----");
    let err;

    var options = {
        "method": "POST",
        "hostname": "fcm.googleapis.com",
        // "port": null,
        "path": "/fcm/send",
        "headers": {
          "content-type": "application/json",
          "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
          "cache-control": "no-cache"
        }
      };
  
      if(userList.length > 0){
        for (let i = 0; i < userList.length; i++) {
  
          let todayDate = new Date();
          let fromdate = moment(todayDate).format('YYYY-MM-DD HH:mm:ss');
          let todayTime = moment(todayDate).add(15, 'second').format('YYYY-MM-DD HH:mm:ss');
        
          let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',eventInfo.id).andWhere('userId',hostList.id)
          .andWhere('receiverId',userList[i].id).andWhere('type','Invited').andWhere('notificationType',2)
          .whereBetween('created_at', [fromdate, todayTime]).first().runAfter((result, builder) =>{
            console.log(builder.toKnexQuery().toQuery())
            return result;
            });  ;
           if(!checknoti){
             if(userList[i].webUser.length >0){
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
         console.log('webuser',userList[i].isNotify);
       if(userList[i].isNotify==true){  
         for (let index = 0; index < userList[i].webUser.length; index++) {
            var req = await http.request(options, function (res) {
              var chunks = [];
              res.on("data", function (chunk) {
                chunks.push(chunk);
              });
              res.on("end", function () {
                var body = Buffer.concat(chunks);
              });
            });
            let bodyData = {};
            const element = userList[i].webUser[index].deviceToken;
            let created_at =  today = new Date();
            bodyData = JSON.stringify({
               "data": {
                 "notification": {
                    "title":"New Invitation",
                    "userId": hostList.id,
                    "userName": hostList.name,
                    "profile": hostList.profilePic,
                    "eventId": eventInfo.id,
                    "eventName": eventInfo.name,
                    "type": "Invited",
                    "status": "pending",
                    "DateTime": created_at,
                    "body": hostList.name + " invited you to attend the event " + eventInfo.name,
                    "notificationType": 1,
                    "click_action": 'https://test.365live.com/notification'
                   // "icon": '/var/www/html/moki_api/default_image.png',
                   //"click_action": notif.url
                 }
               },
               "to": element
             });
             var shdf = await req.write(bodyData);
             console.log(shdf);
             req.end();
           }
        }
      }
      }
}


//Create Event - Host to User
module.exports.sendCreateEvent = async (userList, host, event) => {
    console.log("sendInviteUser android------", event);
    let err;

    var options = {
        "method": "POST",
        "hostname": "fcm.googleapis.com",
        // "port": null,
        "path": "/fcm/send",
        "headers": {
          "content-type": "application/json",
          "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
          "cache-control": "no-cache"
        }
      };

    console.log("getUserTokens", userList, "host: ", host)
    const deviceType = 'android';
    if(userList.length > 0){
      for (let i = 0; i < userList.length; i++) {
        
        // let eventImage = event.eventImages[0].eventImage;
        // console.log(eventImage,"eventImages------")

        if(userList[i].webUser.length > 0){
        let notifiyStore = await Notification.query().insertGraph({
          eventId: event.id,
          userId: host.id,
          receiverId: userList[i].id,
          msg: event.name + " happening on " + event.start,
          type: "eventOfInterest",
          status: "pending",
          notificationType: 1
        }).returning("*");
        //set value
      }
        for (let index = 0; index < userList[i].webUser.length; index++) {
          var req = await http.request(options, function (res) {
            var chunks = [];
            res.on("data", function (chunk) {
              chunks.push(chunk);
            });
            res.on("end", function () {
              var body = Buffer.concat(chunks);
            });
          });
          let bodyData = {};
          const element = userList[i].webUser[index].deviceToken;
          let created_at =  today = new Date();
          bodyData = JSON.stringify({
             "data": {
               "notification": {
                  "title":"Event Created",
                  "eventId": event.id,
                  "eventName": event.name,
                  "userId": event.userId,
                  "body": "eventOfInterest",
                  "type": 'eventOfInterest',
                  "dataTime": event.start,
                  "notificationType": 1,
                  "click_action": 'https://test.365live.com/notification'
                 // "icon": '/var/www/html/moki_api/default_image.png',
                 //"click_action": notif.url
               }
             },
             "to": element
           });
           await req.write(bodyData);
           req.end();
         }
      }
    }
}

  /**Notify to host on accept invite by user */
module.exports.notifytoAndroidHost = async (host, status, user, event) => {
    let err, msg, type;

    var options = {
        "method": "POST",
        "hostname": "fcm.googleapis.com",
        // "port": null,
        "path": "/fcm/send",
        "headers": {
          "content-type": "application/json",
          "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
          "cache-control": "no-cache"
        }
      };

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
    if(host.webUser){
      for (let index = 0; index < host.webUser.length; index++) {
        var req = await http.request(options, function (res) {
          var chunks = [];
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
          res.on("end", function () {
            var body = Buffer.concat(chunks);
          });
        });
        let bodyData = {};
        const element = host.webUser[index].deviceToken;
        let created_at =  today = new Date();
        bodyData = JSON.stringify({
          "data": {
            "notification": {
                "title":"Invite Accepted",
                "eventId": event.id,
                "userId": host.id,
                "name": user.name,
                "body": msg,
                "type": type,
                "notificationType": 2,
                "click_action": 'https://test.365live.com/notification'
              // "icon": '/var/www/html/moki_api/default_image.png',
              //"click_action": notif.url
            }
          },
          "to": element
        });
        await req.write(bodyData);
        req.end();
      }
    }
}


module.exports.OneDayBeforeEventReminder = async (eventData) => {
  let err, msg, type;

    var options = {
        "method": "POST",
        "hostname": "fcm.googleapis.com",
        // "port": null,
        "path": "/fcm/send",
        "headers": {
          "content-type": "application/json",
          "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
          "cache-control": "no-cache"
        }
      };

     
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
    //set value
    if(eventData.users){
      for(let j=0;j< eventData.users.webUser.length;j++){
       console.log(eventData.users.webUser[j].deviceToken,'sf',eventData.name);
        var req = await http.request(options, function (res) {
          var chunks = [];
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
          res.on("end", function () {
            var body = Buffer.concat(chunks);
          });
        });
        let bodyData = {};
        const element = eventData.users.webUser[j].deviceToken;
        let created_at =  today = new Date();
        bodyData = JSON.stringify({
          "data": {
            "notification": {
                "title":"Reminder",
                "eventId": eventData.id,
                "userId": eventData.userId,
                "body": "Event " + eventData.name + " will begin tommorow",
                "type": "reminder",
                "notificationType": 1,
                "click_action": 'https://test.365live.com/notification'
              // "icon": '/var/www/html/moki_api/default_image.png',
              //"click_action": notif.url
            }
          },
          "to": element
        });
        await req.write(bodyData);
        req.end();
      }
    }
}


module.exports.OneDayBeforeEventRemindertoUsers = async (eventData, userData) => {
  let err, msg, type;

    var options = {
        "method": "POST",
        "hostname": "fcm.googleapis.com",
        // "port": null,
        "path": "/fcm/send",
        "headers": {
          "content-type": "application/json",
          "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
          "cache-control": "no-cache"
        }
      };

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
    //set value
   
    if(userData.users){
      for(let k=0;k< userData.users.webUser.length;k++){
        console.log(userData.users.webUser[k].deviceToken,'devicetoken cron')
        var req = await http.request(options, function (res) {
          var chunks = [];
          res.on("data", function (chunk) {
            chunks.push(chunk);
          });
          res.on("end", function () {
            var body = Buffer.concat(chunks);
          });
        });
        let bodyData = {};
        const element = userData.users.webUser[k].deviceToken;
        let created_at =  today = new Date();
        bodyData = JSON.stringify({
          "data": {
            "notification": {
                "title":"Reminder",
                "eventId": eventData.id,
                "userId": userData.users.id,
                "body": "Event " + eventData.name + " will begin tommorow",
                "type": "reminder",
                "notificationType": 1,
                "click_action": 'https://test.365live.com/notification'
              // "icon": '/var/www/html/moki_api/default_image.png',
              //"click_action": notif.url
            }
          },
          "to": element
        });
        await req.write(bodyData);
        req.end();
      }
    }
}

module.exports.TodayEventRemindertoHost = async (eventData) => {
  let err, msg, type;

  var options = {
      "method": "POST",
      "hostname": "fcm.googleapis.com",
      // "port": null,
      "path": "/fcm/send",
      "headers": {
        "content-type": "application/json",
        "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
        "cache-control": "no-cache"
      }
    };

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
  //set value
  if(eventData.users){
    for(let j=0;j< eventData.users.webUser.length;j++){
      var req = await http.request(options, function (res) {
        var chunks = [];
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
        res.on("end", function () {
          var body = Buffer.concat(chunks);
        });
      });
      let bodyData = {};
      const element = eventData.users.webUser[j].deviceToken;
      let created_at =  today = new Date();
      bodyData = JSON.stringify({
        "data": {
          "notification": {
              "title":"Reminder",
              "eventId": eventData.id,
              "userId":  eventData.userId,
              "body": "Event " + eventData.name + " starts in 1 hour. Buckel up!",
              "type": "reminder",
              "notificationType": 1,
              "click_action": 'https://test.365live.com/notification'
            // "icon": '/var/www/html/moki_api/default_image.png',
            //"click_action": notif.url
          }
        },
        "to": element
      });
      await req.write(bodyData);
      req.end();
    }
  }
}

module.exports.TodayEventRemindertoUsers = async (eventData, userData) => {
  let err, msg, type;

  var options = {
      "method": "POST",
      "hostname": "fcm.googleapis.com",
      // "port": null,
      "path": "/fcm/send",
      "headers": {
        "content-type": "application/json",
        "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
        "cache-control": "no-cache"
      }
    };

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
  //set value
  if(userData.users){
    for(let k=0;k< userdata.users.webUser.length;k++){
      var req = await http.request(options, function (res) {
        var chunks = [];
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
        res.on("end", function () {
          var body = Buffer.concat(chunks);
        });
      });
      let bodyData = {};
      const element = userData.users.webUser[k].deviceToken;
      let created_at =  today = new Date();
      bodyData = JSON.stringify({
        "data": {
          "notification": {
              "title":"Reminder",
              "eventId": eventData.id,
              "userId": userData.users.id,
              "body": "Event " + eventData.name + " starts in 1 hour. Buckel up!",
              "type": "reminder",
              "notificationType": 1,
              "click_action": 'https://test.365live.com/notification'
            // "icon": '/var/www/html/moki_api/default_image.png',
            //"click_action": notif.url
          }
        },
        "to": element
      });
      await req.write(bodyData);
      req.end();
    }
  }
}

module.exports.ticketCancelled = async (userlist, host,checkStatus,event) => {
  console.log("support",checkStatus)
  
  var options = {
    "method": "POST",
    "hostname": "fcm.googleapis.com",
    // "port": null,
    "path": "/fcm/send",
    "headers": {
      "content-type": "application/json",
      "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
      "cache-control": "no-cache"
    }
  };

 if(checkStatus.ticketType=='regularNormal'){
   tickettypes = 5;
 } else {
   tickettypes = 4;
 }
  // Notification table insert
  let checknoti = await Notification.query().skipUndefined().select("id").andWhere('userId',host.id)
.andWhere('receiverId',userlist.id).andWhere('type','ticketCancelled').andWhere('notificationType',tickettypes);
if(!checknoti){
  let notifiyStore = await Notification.query().insertGraph({
      eventId: event.id,
      userId: host.id,
      receiverId: userlist.id,
      msg: "Your "+checkStatus.ticket_number_booked_rel[0].totalquantities+" "+checkStatus.ticketType+"  purchased for "+event.name+" has been cancelled by the Host",
      type: "ticketCancelled",
      notificationType: tickettypes,
  
    }).returning("*");
  }
  if(userlist.webUser!=undefined){
    for (let index = 0; index < userlist.webUser.length; index++) {
      var req = await http.request(options, function (res) {
        var chunks = [];
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
        res.on("end", function () {
          var body = Buffer.concat(chunks);
        });
      });
      let bodyData = {};
      const element = userlist.webUser[index].deviceToken;
      let created_at =  today = new Date();
      bodyData = JSON.stringify({
        "data": {
          "notification": {
            "body": "Your "+checkStatus.ticketType+"  purchased for event has been cancelled by the Host",
            "title": "Ticket Cancelled",
            "msg": "",
            "created_at": created_at,
            "notificationType": tickettypes,
            "click_action": 'https://test.365live.com/notification'
            // "icon": '/var/www/html/moki_api/default_image.png',
          }
        },
        "to": element
      });
      await req.write(bodyData);
      req.end();
    }
  }
}

module.exports.userticketCancelledtoUser = async (userlist, host,checkStatus,event) => {
  console.log("support",checkStatus)
  
  var options = {
    "method": "POST",
    "hostname": "fcm.googleapis.com",
    // "port": null,
    "path": "/fcm/send",
    "headers": {
      "content-type": "application/json",
      "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
      "cache-control": "no-cache"
    }
  };

 if(checkStatus.ticketType=='regularNormal'){
   tickettypes = 5;
 } else {
   tickettypes = 4;
 }
  // Notification table insert
  let checknoti = await Notification.query().skipUndefined().select("id").andWhere('receiverId',userlist.id).andWhere('type','userTicketCancelled').andWhere('notificationType',tickettypes);
if(!checknoti){
  let notifiyStore = await Notification.query().insertGraph({
      eventId: event.id,
      receiverId: userlist.id,
      msg: "You have cancelled "+checkStatus.totalQuantity+" "+checkStatus.ticketType+"  ticket for your event "+event.name+" ",
      type: "userTicketCancelled",
      notificationType: tickettypes,
  
    }).returning("*");
  }
  if(userlist.webUser!=undefined){
    for (let index = 0; index < userlist.webUser.length; index++) {
      var req = await http.request(options, function (res) {
        var chunks = [];
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
        res.on("end", function () {
          var body = Buffer.concat(chunks);
        });
      });
      let bodyData = {};
      const element = userlist.webUser[index].deviceToken;
      let created_at =  today = new Date();
      bodyData = JSON.stringify({
        "data": {
          "notification": {
            "body": "You have cancelled "+checkStatus.totalQuantity+" "+checkStatus.ticketType+"  ticket for your event "+event.name+" ",
            "title": "Ticket Cancelled",
            "msg": "",
            "created_at": created_at,
            "notificationType": tickettypes,
            "click_action": 'https://test.365live.com/notification'
            // "icon": '/var/www/html/moki_api/default_image.png',
          }
        },
        "to": element
      });
      await req.write(bodyData);
      req.end();
    }
  }
}

module.exports.userticketCancelledtoHost = async (userlist, host,checkStatus,event) => {
  console.log("support",checkStatus)
  
  var options = {
    "method": "POST",
    "hostname": "fcm.googleapis.com",
    // "port": null,
    "path": "/fcm/send",
    "headers": {
      "content-type": "application/json",
      "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
      "cache-control": "no-cache"
    }
  };

 if(checkStatus.ticketType=='regularNormal'){
   tickettypes = 5;
 } else {
   tickettypes = 4;
 }
  // Notification table insert
  let checknoti = await Notification.query().skipUndefined().select("id").andWhere('receiverId',host.id).andWhere('type','userTicketCancelled').andWhere('notificationType',tickettypes);
if(!checknoti){
  let notifiyStore = await Notification.query().insertGraph({
       eventId: event.id,
      //  userId: host.id,
      receiverId: host.id,
      msg: ""+userlist.name+" has cancelled "+checkStatus.totalQuantity + " " +checkStatus.ticketType+"  ticket for your event "+event.name+"",
      type: "userTicketCancelled",
      notificationType: tickettypes,
  
    }).returning("*");
  }
  if(host.webUser!=undefined){
    for (let index = 0; index < host.webUser.length; index++) {
      var req = await http.request(options, function (res) {
        var chunks = [];
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
        res.on("end", function () {
          var body = Buffer.concat(chunks);
        });
      });
      let bodyData = {};
      const element = host.webUser[index].deviceToken;
      let created_at =  today = new Date();
      bodyData = JSON.stringify({
        "data": {
          "notification": {
            "body": ""+userlist.name+" has cancelled "+checkStatus.totalQuantity + " " +checkStatus.ticketType+"  ticket for your event "+event.name+"",
            "title": "userTicketCancelled",
            "msg": "",
            "created_at": created_at,
            "notificationType": tickettypes,
            "click_action": 'https://test.365live.com/notification'
            // "icon": '/var/www/html/moki_api/default_image.png',
          }
        },
        "to": element
      });
      await req.write(bodyData);
      req.end();
    }
  }
}