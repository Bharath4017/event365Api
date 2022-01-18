const gcm = require('node-gcm');

//android notification start
const settings = {
  gcm: {
    id: 'AIzaSyB-ayT72TvwPlNh3N5-4urVxm9CxUTfIXQ'
  }
};
const PushNotifications = require('node-pushnotifications');
const push = new PushNotifications(settings);

var gcmSender = new gcm.Sender(settings.gcm.id);
module.exports.push = push;
const Event = require('../../models/events');
const {
    transaction
} = require('objection');
const iosNotification = require('../../middlewares/iosNotification');
const WebNotification = require('./../../middlewares/webNotification');
const Notification =  require('../../models/notification');
const TicketBooked = require('../../models/ticketBooked');
const androidNotification = require('../../middlewares/androidNotification');
var global = require('../../global_functions');
var global = require('../../global_constants');
var moment = require('moment');
const apn = require('apn');
var cron = require('cron');

module.exports = () => { 
  let job = new cron.CronJob('*/2 * * * *', async function () {
  
  let date = new Date();
  let currentDate = new Date();
  let currentDateSumTwoHours = new Date();
  date.setDate(date.getDate() + 1);
  currentDateSumTwoHours.setHours(currentDateSumTwoHours.getHours() + 1);

  const eventData = await Event.query().select('events.id','events.name','events.sellingStart','events.sellingEnd', 'events.start', 'events.end','events.eventType','events.userId')
  .leftJoinRelation("[users.[userLoginDetail],ticketBooked.[users.[userLoginDetail]]]")
  .eager('[users.[userLoginDetail], ticketBooked.[users.[userLoginDetail]]]')
  .modifyEager('users', builder => {
    builder.select('deviceToken', 'deviceType')
    .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser, userLoginDetail as webUser]')
        .modifyEager('androidUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
        })
        .modifyEager('iosUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
        }).modifyEager('webUser', builder =>{

            builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')
        })
   })
.where("start",'>=', date).where('oneDayNotifyStatus', false);
 
if(eventData){
  for (let i = 0; i < eventData.length; i++)
  {
    let checkuser = false;
    if(eventData[i].users.iosUser)
    {
      let checkuser = true;
      var IOSNotifi = await iosNotification.OneDayBeforeEventReminder(eventData[i]);
    
    } 

    if(eventData[i].users.webUser)
    {
      let checkuser = true;
      var WebNotifi = await WebNotification.OneDayBeforeEventReminder(eventData[i]);
    
    }

      if(eventData[i].users.androidUser){
        if(checkuser==false){
          let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',eventData[i].id)
          .andWhere('receiverId',eventData[i].userId).andWhere('type','reminder')
          if(!checknoti){
        let notifiyStore = await Notification.query().insertGraph({
           eventId: eventData[i].id,
           // userId: hostList.id,
           receiverId: eventData[i].userId,
            msg: "Event " +eventData[i].name+" will begin tommorow",
            type: "reminder",
            status: "pending",
            notificationType:1

          }).returning("*");
        }
       for(let j=0;j< eventData[i].users.androidUser.length;j++){
        let UsersdeviceToken =  eventData[i].users.androidUser[j].deviceToken
        var message = new gcm.Message({
          collapseKey: 'demo',
          priority: 'high',
          contentAvailable: true,
          delayWhileIdle: true,
          restrictedPackageName: 'com.ebabu.event365live.host',
          data: {
             "eventId": eventData[i].id,
             "type" : "eventReminder",
             "eventName":eventData[i].name,
             "message": "Event " +eventData[i].name+" will begin tommorow",
           }
        });
      
         var regTokens = [UsersdeviceToken];
         gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
           if (err) console.error(err);
           else console.log(response, "success Andorid");
         });
      }
    }
  }

    for (let j = 0; j < eventData[i].ticketBooked.length; j++) {
      var checkUser1 = false;
      if(eventData[i].ticketBooked[j].users.iosUser){
      if(eventData[i].ticketBooked[j].users.iosUser.length > 0)
      {
        var checkUser1 = true;
        var IOSNotifitousers = await iosNotification.OneDayBeforeEventRemindertoUsers(eventData[i],eventData[i].ticketBooked[j])
      }
    }
    if(eventData[i].ticketBooked[j].users.webUser){
      if(eventData[i].ticketBooked[j].users.webUser.length > 0)
    {
      let checkuser = true;
      var WebNotifi = await WebNotification.OneDayBeforeEventRemindertoUsers(eventData[i],eventData[i].ticketBooked[j]);
    
    }
  }
    if(eventData[i].ticketBooked[j].users.androidUser){
      if(eventData[i].ticketBooked[j].users.androidUser.length > 0){
          if(checkUser1==false){
            let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',eventData[i].id)
            .andWhere('receiverId',eventData[i].ticketBooked[j].users.id).andWhere('type','reminder')
            if(!checknoti){
        let notifiyStore = await Notification.query().insertGraph({
                eventId: eventData[i].id,
               // userId: hostList.id,
                receiverId: eventData[i].ticketBooked[j].users.id,
                msg: "Event " +eventData[i].name+" will begin tommorow",
                type: "reminder",
                status: "pending",
                notificationType:1
              }).returning("*");
            }
      for(let k=0;k< eventData[i].ticketBooked[j].users.androidUser.length;k++){
        if(eventData[i].ticketBooked[j].users.androidUser[k].deviceType !== null){
          let UsersdeviceToken = eventData[i].ticketBooked[j].users.androidUser[k].deviceToken
            var message = new gcm.Message({
              collapseKey: 'demo',
              priority: 'high',
              contentAvailable: true,
              delayWhileIdle: true,
              restrictedPackageName: 'com.ebabu.event365live.host',
              data: {
                 "eventId": eventData[i].id,
                 "type" : "eventReminder",
                 "eventName":eventData[i].name,
                 "message": "Event " +eventData[i].name+" will begin tommorow",
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
    }

    //update one day notify status
    let upadteOneDayNotifyStatus = await Event.query().update({
      oneDayNotifyStatus: true,
    }).where("id", eventData[i].id);  
  }
}
    
  const TodayEventNotification = await Event.query().select('events.id','events.name','events.sellingStart','events.sellingEnd', 'events.start', 'events.end','events.eventType','events.userId')
  .leftJoinRelation("[users.[userLoginDetail],ticketBooked.[users.[userLoginDetail]]]")
  .eager('[users.[userLoginDetail], ticketBooked.[users.[userLoginDetail]]]')
  .modifyEager('users', builder => {
    builder.select('id','deviceToken', 'deviceType')
    .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser, userLoginDetail as webUser]')
        .modifyEager('androidUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
        })
        .modifyEager('iosUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
        }).modifyEager('webUser', builder =>{

            builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')
        })
   })
    .where('oneHourNotifyStatus', false).whereBetween("start",[currentDate,currentDateSumTwoHours]);
    
   if(TodayEventNotification) {
    for (let i = 0; i < TodayEventNotification.length; i++) {
      let = checkNotification = false;
      if(TodayEventNotification[i].users.iosUser)
      {
        let = checkNotification = true;
        var IOSNotifiToday = await iosNotification.TodayEventRemindertoHost(TodayEventNotification[i]);   
      }

      if(TodayEventNotification[i].users.webUser)
      {
        let checkNotification = true;
        var WebNotifi = await WebNotification.TodayEventRemindertoHost(TodayEventNotification[i]);
      
      } 

      if(TodayEventNotification[i].users.androidUser){
          if(checkNotification==false){
            let checknoti = await Notification.query().skipUndefined().select("id").where('eventId',TodayEventNotification[i].id)
            .andWhere('receiverId',TodayEventNotification[i].userId).andWhere('type','reminder')
            if(!checknoti){
          let notifiyStore = await Notification.query().insertGraph({
              eventId: TodayEventNotification[i].id,
            //  userId: hostList.id,
              receiverId: TodayEventNotification[i].userId,
              msg: "Event " +TodayEventNotification[i].name+" starts in 1 hour. Buckel up!",
              type: "reminder",
              status: "pending",
              notificationType:1
            }).returning("*");
          }
            for(let j=0;j< TodayEventNotification[i].users.androidUser.length;j++){
          let UsersdeviceToken =  TodayEventNotification[i].users.androidUser[j].deviceToken
            var message = new gcm.Message({
              collapseKey: 'demo',
              priority: 'high',
              contentAvailable: true,
              delayWhileIdle: true,
              restrictedPackageName: 'com.ebabu.event365live.host',
              data: {
                 "eventId": TodayEventNotification[i].id,
                 "type" : "eventReminder",
                 "eventName":TodayEventNotification[i].name,
                 "message": "Event " +TodayEventNotification[i].name+" starts in 1 hour. Buckel up!",
               }
            });
            var regTokens = [UsersdeviceToken];
            gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
              if (err) console.error(err);
              else console.log(response, "success Andorid");
            });
          }
        }
      }

      for (let j = 0; j < TodayEventNotification[i].ticketBooked.length; j++) {
        let checkNoti = false;
        
        if(TodayEventNotification[i].ticketBooked[j].users.iosUser)
        {
          let checkNoti = true;
         var IOSNotifiTodaytoUsers = await iosNotification.TodayEventRemindertoUsers(TodayEventNotification[i],TodayEventNotification[i].ticketBooked[j]);   
        }

        if(TodayEventNotification[i].ticketBooked[j].users.webUser)
        {
          let checkNoti = true;
          var WebNotifi = await WebNotification.TodayEventRemindertoHost(TodayEventNotification[i],TodayEventNotification[i].ticketBooked[j]);
        
        } 
          if(TodayEventNotification[i].ticketBooked[j].users.androidUser){
            if(checkNoti==false){
              let checknoti1 = await Notification.query().skipUndefined().select("id").where('eventId',TodayEventNotification[i].id)
              .andWhere('receiverId',TodayEventNotification[i].ticketBooked[j].users.id).andWhere('type','reminder')
              if(!checknoti1){
           let notifiyStore = await Notification.query().insertGraph({
              eventId: TodayEventNotification[i].id,
             // userId: hostList.id,
              receiverId: TodayEventNotification[i].ticketBooked[j].users.id,
              msg: "Event " +TodayEventNotification[i].name+" starts in 1 hour. Buckel up!",
              type: "reminder",
              status: "pending",
              notificationType:1
            }).returning("*");
          }
         for(let k=0;k< TodayEventNotification[i].ticketBooked[j].users.androidUser.length;k++){    
          if(TodayEventNotification[i].ticketBooked[j].users.deviceToken !== null){
            let UsersdeviceToken = TodayEventNotification[i].ticketBooked[j].users.androidUser[k].deviceToken
              var message = new gcm.Message({
                collapseKey: 'demo',
                priority: 'high',
                contentAvailable: true,
                delayWhileIdle: true,
                restrictedPackageName: 'com.ebabu.event365live.host',
                data: {
                   "eventId": TodayEventNotification[i].id,
                   "type" : "eventReminder",
                   "eventName":TodayEventNotification[i].name,
                   "message": "Event " +TodayEventNotification[i].name+" starts in 1 hour. Buckel up!",
                 }
              });
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
      //update oneHournotify status
      let upadteOneHourNotifyStatus = await Event.query().update({
      oneHourNotifyStatus: true,
    }).where("id", TodayEventNotification[i].id);

    }
  }

   }, null, true);

}

