// const to = require('./middlewares').to;
const gcm = require('node-gcm');
const moment = require('moment');
const dateformat = require('dateformat');
const Notification = require('./../models/notification');
const Event = require('./../models/events');
const TicketBooked = require('./../models/ticketBooked');
var moment = require('moment');
const apn = require('apn');

const settings = {
  gcm: {
    id: 'AIzaSyB-ayT72TvwPlNh3N5-4urVxm9CxUTfIXQ'
  }
};
const PushNotifications = require('node-pushnotifications');
const push = new PushNotifications(settings);
const apn = require('apn');

var options = {
    token: {
        key: 'src/middlewares/ios_certs/AuthKey_9CWANM98T6.p8',
        keyId: '9CWANM98T6',
        teamId: '9JH37XY79W',
    },
  production: false
};

var apnProvider = new apn.Provider(options);
var gcmSender = new gcm.Sender(settings.gcm.id);
var gcmUserSender = new gcm.Sender(settings.gcm_user.id);
module.exports.push = push;


module.exports.sendPushNotif = async (notif, options) => {
  let err, topic;
  console.log('------admin notification---------------', notif);
  topic = 'com.valueyourbody.fitshuffle';
  let data = notif;
  const device = data.deviceToken;
  const deviceType = data.deviceType;
  const message_noti = data.content;
  const type_noti = data.type;

  // console.log('sendPushNotif calling');

  if (deviceType == 'android' || deviceType == 'Android') {

    packagename = 'com.fitshuffle';
    // console.log('sendPushNotif android');
    let body_data_in_pushnoti = {
      message: notif.content,
      type: notif.type,
      title: 'Workout Scheduled!',
      noti_count: notif.noti_count,
      orderId: notif.orderId,
      notificationId: notif.notificationId,
      orderstatusId: notif.orderstatusId
    };

    var message = new gcm.Message({
      collapseKey: 'demo',
      priority: 'high',
      contentAvailable: true,
      delayWhileIdle: true,
      restrictedPackageName: packagename,
      data: {
        // body:  notif.content,
        // message: notif.content,
        // type: notif.type,
        // noti_count: notif.noti_count,
        // orderId: notif.orderId,
        // notificationId:notif.notificationId,
        // orderstatusId:notif.orderstatusId,
        body: body_data_in_pushnoti,
      }
    });

    // Specify which registration IDs to deliver the message to
    var regTokens = [device];

    /////////////start//////////////
    // Actually send the message  
    // console.log('sendPushNotif before sendNoRetry');
    gcmSender.sendNoRetry(message, { registrationTokens: regTokens }, function (err, response) {
      // console.log('sendPushNotif in sendNoRetry');
      // console.log('----------send no retry----------');
      if (err) console.error(err);
      else console.log(response);
    });
  }
  else if (deviceType == 'ios') {
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = notif.noti_count;
    note.sound = "ping.aiff";
    note.alert = notif.content;
    note.message = notif.message_noti;
    note.type = notif.type_noti;
    note.time = moment().format('YYYY-MM-DD HH:MM');
    note.payload = { 'messageFrom': 'FitShuffle', 'message': message_noti, 'type': type_noti };
    note.topic = topic;
    // console.log('note payload is ; ', note);

    // console.log("------------------------------------");

    apnProvider.send(note, notif.deviceToken).then((result) => {
      console.log(result);
      console.log(result.failed[0].response);
      console.log("notification sent to ios");
      // console.log(result.failed);
    }).catch(err => {
      // console.log('error sending notification');
      // console.log(err);
    });
  }
}
















