const Aws = require('./../controllers/index').AWSController;
const CommanAuthController = require('./../controllers/index').CommanAuthController;
const EventController = require('./../controllers/index').EventController;
const express = require('express');
const router = express.Router();
const passport = require('passport');
require('./../middlewares/passport')(passport);
const usercheck = require('./../middlewares/usercheck');
const roleCheck = require('./../middlewares/rolecheck');
const fileupload = require('../middlewares/fileupload');

/**
 * Example full URL API :
 * @localURL localhost:8000/api/signup 
 * @liveURL http://18.220.188.129/api/signup 
 */

//singnUp (Venuer, Host, Promoter, Member
router.post('/organiser/signup', CommanAuthController.signup);

//socail-sign In  (Venuer, Host, Promoter, Member
router.post('/organiser/socialLogin', CommanAuthController.socialLogin);

// Update userType by userId for social login 
router.post('/organiser/updateSocialLoginData', CommanAuthController.updateSocialLoginData);

/** Common modules Process: */
//2ndProcess- Email varifiy
router.post('/organiser/verifyEmail', CommanAuthController.verifyEmail);
  
//3th Process- send otp your phoneNo
router.post('/organiser/sendPhoneOTP', CommanAuthController.sendPhoneOTP);

//4th Process- send otp your phoneNo
router.post('/organiser/verifyPhone', CommanAuthController.verifyPhone);

/** ForgotPassword Process: */
// 1st process- forgotPassword (Send OTP your Email) 
router.post('/organiser/forgot', CommanAuthController.forgotPassword);

// 2nd process- verifyResetPW
router.post('/organiser/verifyResetPW', CommanAuthController.verifyResetPW);

// 3rd process- resetPassword
router.post('/organiser/resetPassword', CommanAuthController.resetPassword);

// 4th process- resetPassword (Send OTP your phone) 
router.post('/organiser/resendOTP', CommanAuthController.ResendOTP);

// 5th process- againResedOTP (Send OTP your Email) 
router.post('/organiser/againResedOTP', CommanAuthController.againResedOTP);

// Login

router.post('/organiser/login', CommanAuthController.loginUser);

router.post('/organiser/editProfile', passport.authenticate('jwt', { session: false }), fileupload.uploadS3.array('profilePic', 1), CommanAuthController.editProfile);

router.post('/organiser/updateProfile', fileupload.uploadS3.array('profilePic', 1), passport.authenticate('jwt', { session: false }),
    CommanAuthController.updateProfile);

// router.post('/organiser/updateProfile',fileupload.uploadS3.array('profilePic', 1),passport.authenticate('jwt', { session: false }), usercheck.checkUser(),
// CommanAuthController.updateProfile);

router.post('/organiser/changePassword', passport.authenticate('jwt', { session: false }), CommanAuthController.changePassword);

router.post('/organiser/isRemindOrNotify', passport.authenticate('jwt', { session: false }), CommanAuthController.isRemindOrNotify);

router.get('/organiser/getUser/:id', CommanAuthController.getUser);

router.post('/organiser/contactUs', passport.authenticate('jwt', { session: false }), CommanAuthController.contactUs);

router.post('/organiser/logout', passport.authenticate('jwt', { session: false }), CommanAuthController.Logout);

//BankDetails
router.get('/organiser/bankDetails', passport.authenticate('jwt', { session: false }), CommanAuthController.getBankDetails);

router.post('/organiser/bankDetails', passport.authenticate('jwt', { session: false }), CommanAuthController.addBankDetails);

router.put('/organiser/bankDetails', passport.authenticate('jwt', { session: false }), CommanAuthController.editBankDetails);

router.delete('/organiser/bankDetails/:id', passport.authenticate('jwt', { session: false }), CommanAuthController.deleteBankDetails);

//settingInfo
router.get('/organiser/settingInfo', passport.authenticate('jwt', { session: false }), CommanAuthController.settingInfo);

router.get('/successAccount', CommanAuthController.successAccountLink);
router.get('/failedAccount', CommanAuthController.failedAccountLink);
router.post('/organiser/accountLink', passport.authenticate('jwt', { session: false }), CommanAuthController.accountLink);
router.post('/forgotPasswordCommon', CommanAuthController.forgotPasswordWebsite);
router.post('/loginCommon', CommanAuthController.loginWebsite);
router.post('/socialLoginCommon', CommanAuthController.socialLoginWebsite);
router.post('/createAccountId', passport.authenticate('jwt', { session: false }), CommanAuthController.createAccountId);

module.exports = router;

