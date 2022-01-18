
const EventController = require('./../../controllers/index').EventController;
const UserPaymentController = require('./../../controllers/index').UserPaymentController;
// const  UserAuthController = require('./../../controllers/index').UserAuthController;
const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../../middlewares/passport')(passport);
const usercheck = require('./../../middlewares/usercheck');
const roleCheck = require('./../../middlewares/rolecheck');
const fileupload = require('../../middlewares/fileupload');

// create event by venuer with role check
 
// router.post('/organiser/event',passport.authenticate('jwt',{session:false}),[roleCheck.venuerAccess,  
//     usercheck.checkUser(['event_management'])],fileupload.uploadS3.array('images'),EventController.CreateEvent);

router.post('/organiser/event', passport.authenticate('jwt', { session: false }), fileupload.uploadS3.array('images'), EventController.CreateEvent);

// Update event by venuer with role check
router.patch('/organiser/event/:id', passport.authenticate('jwt', { session: false }),//[roleCheck.venuerAccess,  
    // usercheck.checkUser(['event_management'])],
    fileupload.uploadS3.array('images'),
    EventController.eventUpdate);

// get event details 
router.get('/organiser/event/:id',
passport.authenticate('jwt', { session: false }),
[roleCheck.venuerAccessWithMember],
EventController.GetEventDetail);

router.delete('/organiser/event/:id', passport.authenticate('jwt', { session: false }), EventController.DeleteEvent);

// router.get('/organiser/events',passport.authenticate('jwt',{session:false}),EventController.GetEventList);

router.get('/organiser/events',
    passport.authenticate('jwt', { session: false })
    // [roleCheck.venuerAccess,  
    //usercheck.checkUser(['event_management'])]
    , EventController.GetEventList);

router.get('/organiser/home', passport.authenticate('jwt', { session: false }), EventController.Home);
// get event calender 1st 
router.get('/organiser/getEventsDates', passport.authenticate('jwt', { session: false }), EventController.getEventsDates);

// event calender 2nd 
router.post('/organiser/getEventDateDetails', passport.authenticate('jwt', { session: false }), EventController.getEventDateDetails);

//getMoreEventDetail 
router.get('/organiser/getMoreEventDetail/:eventId',
    passport.authenticate('jwt', { session: false }),
    [roleCheck.venuerAccessWithMember],
    EventController.getMoreEventDetail);

// related event 
router.get('/organiser/relatedEvent/:eventId', EventController.relatedEvent);

//Event is_availability  Change Status
router.put('/organiser/eventIsAvailability', passport.authenticate('jwt', { session: false }), EventController.eventIsAvailability);

// getReview
router.get('/organiser/getReview/:eventId', passport.authenticate('jwt', { session: false }), EventController.getReview);

//Edit Ticket
router.get('/organiser/getEventTicket/:eventId', passport.authenticate('jwt', { session: false }), UserPaymentController.getEventTicket);

//editEventTicket
router.post('/organiser/editEventTicket/:eventId', passport.authenticate('jwt', { session: false }), UserPaymentController.editEventTicket);

//Edit Event
router.post('/organiser/editEvent', passport.authenticate('jwt', { session: false }), fileupload.uploadS3.fields([{
    name: 'images'
  }, {
    name: 'telentImages'
  },{
    name: 'sponserImages'
  }]), EventController.editEvent);

// Edit Event
router.get('/organiser/getEventDetails/:eventId', passport.authenticate('jwt', { session: false }), EventController.getEventDetails);

// Host Total Amount
// router.get('/organiser/getTotalAmount', passport.authenticate('jwt', {session: false}), UserPaymentController.getTotalAmount);

// withdrawn Req for admin 
router.post('/organiser/withdrawnReq', passport.authenticate('jwt', { session: false }), UserPaymentController.withdrawnReq);

// balanceInfo Req for admin 
router.get('/organiser/balanceInfo', passport.authenticate('jwt', { session: false }), UserPaymentController.balanceInfo);

// balanceInfo Req for admin 
router.get('/organiser/withdrawnInfo', passport.authenticate('jwt', { session: false }), UserPaymentController.withdrawnInfo);

// transactionHistory for organiser
router.get('/organiser/transactionHistory', passport.authenticate('jwt', { session: false }), UserPaymentController.transactionHistory);

router.post('/organiser/setPrimaryImage', EventController.setPrimaryImage)

// GetephemeralKey
router.post('/organiser/GetEphemeralKey', passport.authenticate('jwt', { session: false }), UserPaymentController.GetEphemeralKey);

router.post('/organiser/postEvent', passport.authenticate('jwt', { session: false }), fileupload.uploadS3.fields([{
    name: 'images'
  }, {
    name: 'telentImages'
  },{
    name: 'sponserImages'
  }]), EventController.createPostEvent);

router.post('/organiser/paidEventPaymentDone', passport.authenticate('jwt', { session: false }),
  EventController.paidEventPaymentDone);  

router.post('/organiser/checkCustomeUrl',
EventController.checkCustomeUrl);  

router.post('/organiser/GetClientSecret', passport.authenticate('jwt', { session: false }),
    UserPaymentController.GetClientSecret);

router.post('/organiser/GetClientSecret1', passport.authenticate('jwt', { session: false }),
    UserPaymentController.GetClientSecret1);

router.get('/organiser/hostDetail', passport.authenticate('jwt', { session: false }),
    EventController.getHostDetail);

router.post('/organiser/paidEventPrice', passport.authenticate('jwt', { session: false }),
    EventController.paidEventPrice);

// Get event Past attendeed for particular host  
router.post('/organiser/contactListAttendees', EventController.contactListAttendees);

router.post('/createSessionId', passport.authenticate('jwt', { session: false }), EventController.createStripeSessionId);

router.post('/stripeCard/:type', passport.authenticate('jwt', { session: false }), EventController.stripeCard);

module.exports = router;
