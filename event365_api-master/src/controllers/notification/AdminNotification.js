const Notification = require("../../models/notification");
const User = require('../../models/users');
const Admin = require('../../models/admin');
const Knex = require('knex');

const knexConfig = require('../../../db/knex');
const knex = Knex(knexConfig[process.env.NODE_ENV || 'development']);

const {
  io
} = require("../../globals");


const updateNotification = async (data, type) => {
    let GetAdmin = await Admin.query().skipUndefined().select( "device_token", "id","device_type", "token").where('id', 1);
    let token = GetAdmin.token;

  try {
   
    if (type == "reqVerifyAC") {
      
      data.forEach(async (element) => {
        let createData = {
          title: element.title,
          msg: element.body,
          type: element.type,
          senderId:element.id,
          receiverId:GetAdmin[0].id
        };
        let r = await Notification.query().patch(createData).where("senderId", element.senderId).where("receiverId", GetAdmin[0].id)
          .where("type", "reqVerifyAC");
      });

    } else if (data[0].type == "reqReleaseAmount") {
     

    } else {
      let notificationUpdate = await Notification.query().insertGraph(data);
    }


  } catch (error) {
    
  }

  let i = 0;

  data.forEach(async userData => {
    
    let notificationDot = await Admin.query().update({
      "has_new_alerts": true
    }).where("id", userData.receiverId).returning("has_new_alerts");

    if (token.length > 0) {
      let notificationList = await Notification.query()
        .select("id", "title", "msg", "readstatus")
        .where("receiverId", userData.receiverId)
        .orderBy("created_at", "DESC")
        .offset(0)
        .limit(3);

      io.sockets.to(token[i]).emit("message", {
        notification: notificationList,
        notificationDot: notificationDot.has_new_alerts
      });
    }
    i++;
  });


};

const fetchNotifications = async (req, res) => {

  let page = (req.query.page) ? req.query.page : 1;
  let limit = req.query.limit ? req.query.limit : global.PER_PAGE;
  let offset = req.query.offset ? req.query.offset : limit * (page - 1);

  try {
    let notifications = await Notification.query()
      .select(
        "id",
        "type",
        "receiverId",
        "title",
        "body",
        "readstatus",
      )
      .where({
        receiverId: req.user.id
      }).offset(offset).limit(limit)
      .orderBy("time", "desc");
    let totalCount = await Notification.query()
      .count().where({
        receiverId: req.user.id
      }).first();

    let resultData = {
      notifications,
      total: totalCount.count
    };
    // return response
    return global.okResponse(res, {
      ...resultData,
    }, "");
  } catch (error) {
   
    throw global.badRequestError(error.message);
  }

};

const updateCheckNoticeAlert = async (req, res) => {
  let notificationDot = await Admin.query().update({
    "has_new_alerts": false
  }).where("id", req.user.id).returning("has_new_alerts");
  return global.okResponse(res, {
    ...notificationDot,
  }, "");
};

const updateNotificationReadStatus = async (id) => {

  let updateNotification = await Notification.query().update({
    'readstatus': true
  }).where("id", id);
};

module.exports = {
  updateNotification,
  fetchNotifications,
  updateCheckNoticeAlert,
  updateNotificationReadStatus
};