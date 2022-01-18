
const  NotificationController = require('./../../controllers/index').NotificationController;
const  AdminNotification = require('./../../controllers/index').AdminNotification;
const express = require('express');
const router = express.Router();
const passport = require('passport');
require('./../../middlewares/passport')(passport);
const usercheck = require('./../../middlewares/usercheck');
const roleCheck = require('./../../middlewares/rolecheck');


router.get('/organiser/countHostNotifications', passport.authenticate('jwt', { session: false }),NotificationController.countHostNotifications);

 router.get('/organiser/getAllNotification', passport.authenticate('jwt', { session: false }),NotificationController.hostNotifications);

 //Admin Notification
 router.get('/admin/getAllNotification', 
 //passport.authenticate('jwt', { session: false }),
 NotificationController.adminNotifications);

router.get('/admin/notificationCount',
//passport.authenticate('jwt',{session:false}), 
NotificationController.countAdminNotifications);


 router.get('/getUserRSVP', passport.authenticate('jwt', { session: false }),NotificationController.getUserRSVP);

 router.get('/getUserRSVPCount', passport.authenticate('jwt', { session: false }),NotificationController.getUserRSVPCount);

 router.get('/userAllNotification', passport.authenticate('jwt', { session: false }),NotificationController.userAllNotification);
 
//statusRSPV  Change Status
router.put('/statusRSPV',passport.authenticate('jwt',{session:false}), NotificationController.statusRSPV);

//statusRSPV  Change Status
router.get('/countUserNotifications',passport.authenticate('jwt',{session:false}), NotificationController.countUserNotifications);

//read all
router.put('/readAllNotification',passport.authenticate('jwt',{session:false}), NotificationController.readAllNotification);

// statusNotify Change Status for Host
router.put('/organiser/statusNotify',passport.authenticate('jwt',{session:false}), NotificationController.statusNotify);

//Admin Notification
router.put('/updateNotification',passport.authenticate('jwt',{session:false}), AdminNotification.updateNotification);

router.put('/fetchNotifications',passport.authenticate('jwt',{session:false}), AdminNotification.fetchNotifications);

router.put('/updateCheckNoticeAlert',passport.authenticate('jwt',{session:false}), AdminNotification.updateCheckNoticeAlert);

router.put('/updateNotificationReadStatus',passport.authenticate('jwt',{session:false}), AdminNotification.updateNotificationReadStatus);


module.exports = router;