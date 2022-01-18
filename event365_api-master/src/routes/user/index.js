'use strict';
const Aws = require('./../../controllers/index').AWSController;
const {transaction} = require('objection');
const UserAuthController = require('./../../controllers/index').UserAuthController;

const UserEventController = require('./../../controllers/index').UserEventController;
const UserPaymentController = require('./../../controllers/index').UserPaymentController;
const UserReviewController = require('./../../controllers/index').UserReviewController;
const express = require('express');
const router = express.Router();
const passport = require('passport');
require('./../../middlewares/passport')(passport);
const usercheck = require('./../../middlewares/usercheck');
const roleCheck = require('./../../middlewares/rolecheck');
const fileupload = require('../../middlewares/fileupload');

//const autoReminder = require('./../../middlewares/iosNotification');

/**
 * Example full URL API :
 * @localURL localhost:8000/api/signup
 * @LiveURL http://18.220.188.129/api/signup
 */

//singnUp Only user, selfHost, selfPromoter//
router.post('/signup', UserAuthController.signup);

//2ndProcess - Email varifiy
router.post('/verifyEmail', UserAuthController.verifyEmail);

//3th Process - send otp your phoneNo
router.post('/sendPhoneOTP', UserAuthController.sendPhoneOTP);

//4th Process- send otp your phoneNo
router.post('/verifyPhone', UserAuthController.verifyPhone);

/** ForgotPassword Process: */
// 1st process- forgotPassword (Send OTP your Email) 
router.post('/forgot', UserAuthController.forgotPassword);

//1st process CommonforgotPassword
router.post('/commonforgot', UserAuthController.CommonforgotPassword);

// 2nd process- verifyResetPW
router.post('/verifyResetPW', UserAuthController.verifyResetPW);

// 3rd process- resetPassword
router.post('/resetPassword', UserAuthController.resetPassword);

// 3rd process- commonresetPassword
router.post('/commonresetPassword', UserAuthController.CommonresetPassword);

// 4th process- resetPassword
router.post('/resendOTP', UserAuthController.ResendOTP);

// 5th process- againResedOTP (Send OTP your Email) 
router.post('/againResedOTP', UserAuthController.againResedOTP);


// Login
router.post('/login', UserAuthController.loginUser);
// test msg
router.get('/test_send', UserAuthController.testMsg);
// Social Login
router.post('/social/login', UserAuthController.socialLogin);
router.post('/editProfile', passport.authenticate('jwt', {session: false}),
[roleCheck.customerAccess], UserAuthController.editProfile);

router.post('/updateProfile', fileupload.uploadS3.array('profilePic', 1), passport.authenticate('jwt', {session: false}),
[roleCheck.customerAccess],
    UserAuthController.updateProfile);

// router.post('/updateProfile',fileupload.uploadS3.array('profilePic', 1),passport.authenticate('jwt', { session: false }),usercheck.checkUser(),
// UserAuthController.updateProfile);


router.post('/changePassword', passport.authenticate('jwt', {session: false}), UserAuthController.changePassword);

router.post('/isRemindOrNotify', passport.authenticate('jwt', {session: false}), UserAuthController.isRemindOrNotify);

router.get('/getUser', passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserAuthController.getUser);

router.post('/contactUs', 
passport.authenticate('jwt', {session: false}), 
//[roleCheck.customerAccess],
UserAuthController.contactUs);

//without login
router.post('/contactUsNoAuth', 
//[roleCheck.customerAccess],
UserAuthController.contactUs);

router.post('/logout', passport.authenticate('jwt', {session: false}), UserAuthController.Logout);


/** user-event routes */

// NearBy auth and without auth (home)
router.post('/allEventList', UserEventController.allEventList);

// NearBy auth and without auth (home)
router.post('/nearBy', UserEventController.NearByNoAuth);

router.post('/nearBy/:auth', 
passport.authenticate('jwt', {session: false}),
[roleCheck.customerAccess], 
UserEventController.NearBy);

router.post('/featureEvent/:auth', passport.authenticate('jwt', {session: false}), [roleCheck.customerAccess], UserEventController.FeatureEvents);
router.post('/featureEvent',  UserEventController.FeatureEvents);

//Search API for User Home
router.post('/search', UserEventController.Search);
router.post('/search/:auth', passport.authenticate('jwt', {session: false}), [roleCheck.customerAccess],
UserEventController.Search);

//getUserEventDetail 
router.get('/getUserEventDetail/:eventId/:eventUrl?', UserEventController.UserEventDetail);

//getUserEventDetail  auth
router.get('/getUserEventDetail/:auth/:eventId/1/:eventUrl?',
passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserEventController.UserEventDetail);

//getFavourite 
router.get('/getFavourite', 
passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserEventController.myFavEvents);

router.get('/getEventList', 
passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserEventController.myBookedEvent);

// Recommended auth and without auth
// router.get('/Recommended', UserEventController.Recommended);

router.get('/getRecommend', 
passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserEventController.getRecommend);


router.post('/EventBySubCategory', UserEventController.EventBySubCategory);

router.post('/EventByCategory', UserEventController.EventByCategory);

router.post('/isLikeAndDisLike', passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserEventController.isLikeAndDisLike);


// favourite routes
router.put('/markFav', passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserEventController.CreateFavourite);

// payment routes //
router.get('/getTicketInfo/:eventId', passport.authenticate('jwt', {session: false}),
[roleCheck.customerAccess],
 UserPaymentController.UserTicketInfo);


// payment routes //
router.get('/getUserTicketBooked', passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserPaymentController.getUserTicketBooked);

// payment routes website//
router.get('/getUserTicketBookedWithPage', passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserPaymentController.getUserTicketBookedWithPage);

// User Ticket Booked //
router.post('/UserTicketBooked/:eventId', passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserPaymentController.UserTicketBooked);

// Test Stripe Payment
router.post('/GetClientSecret', passport.authenticate('jwt', {session: false}), 
UserPaymentController.GetClientSecret);
  
// TicketPaymentRequest
router.post('/TicketPaymentRequest', passport.authenticate('jwt', {session: false}), UserPaymentController.TicketPaymentRequest);

// PaymentConfirm
router.post('/PaymentConfirm', passport.authenticate('jwt', {session: false}), UserPaymentController.PaymentConfirm);

// GetephemeralKey
router.post('/GetEphemeralKey', passport.authenticate('jwt', {session: false}), UserPaymentController.GetEphemeralKey);

// review routes
router.post('/createReview', passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserReviewController.createReview);

router.get('/getReview/:eventId', passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserReviewController.getReview);

router.post('/deleteReview', passport.authenticate('jwt', {session: false}), 
[roleCheck.customerAccess],
UserReviewController.deleteReview),

// App Content routes //
router.get('/policy', UserAuthController.policy);

router.get('/terms', UserAuthController.terms);

router.get('/getIssues', UserAuthController.getIssues);

router.post('/testEmail',UserAuthController.sendMail);

//router.post('/getMaxCostByFilter', passport.authenticate('jwt', {session: false}), UserEventController.getMaxCostByFilter);
router.get('/refundTest',UserPaymentController.refundTest);

router.post('/beforeCheckout',UserEventController.verifyCheckoutPayment);

// For update host and admin amount after event end 
router.get('/getBookedEventData',UserPaymentController.getBookedEventData);

// for verify coupan code
router.post('/verifyCoupanCode',UserPaymentController.checkCoupanCode);

// for validate apple pay session
router.post('/validateSession',UserPaymentController.validateAppleSession);

module.exports = router;
