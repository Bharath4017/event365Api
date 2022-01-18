
const VenueController = require('./../../controllers/index').VenueController;
const VenueUserController = require('./../../controllers/index').VenueUserController;
const CommanAuthController = require('./../../controllers/index').CommanAuthController;
const UserAuthController = require('./../../controllers/index').UserAuthController;
const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../../middlewares/passport')(passport);
const usercheck = require('./../../middlewares/usercheck');
const roleCheck = require('./../../middlewares/rolecheck');
const fileupload = require('../../middlewares/fileupload');

router.post('/organiser/createVenue',
    passport.authenticate('jwt', { session: false }),
    //[roleCheck.onlyVenuerAccess],
    fileupload.uploadS3.array('venueImages', 5),
    VenueController.createVenue);

// //User Edit by Venuer
router.put('/organiser/user/:id',
    passport.authenticate('jwt', { session: false }),
    //[roleCheck.venuerAccess],
    VenueUserController.editUser);

//User List by Venueowner
router.get('/organiser/users',
    passport.authenticate('jwt', { session: false }),
    VenueUserController.getUsers);

//venue detail
router.get('/organiser/venue/:id',
    passport.authenticate('jwt', { session: false }),
    VenueController.getVenue);

//my venue list
router.get('/organiser/myVenues',
    passport.authenticate('jwt', { session: false }),
    VenueController.myVenues);

//User all venue list
router.get('/organiser/usersVenues',
    passport.authenticate('jwt', { session: false }),
    VenueController.usersVenues);    

//venue list by Venueowner and host
router.get('/organiser/venues',
    passport.authenticate('jwt', { session: false }),
    VenueController.VenueList);

router.patch('/organiser/venue/:id',
    passport.authenticate('jwt', { session: false }),
   // [roleCheck.venuerAccess],
    fileupload.uploadS3.array('venueImages', 5),
    VenueController.updateVenue);

//venue delete by Venueowner 
router.delete('/organiser/venue/:id',
    passport.authenticate('jwt', { session: false }),
    // [roleCheck.venuerAccess],
    VenueController.deleteVenue);

router.post('/organiser/addUser',
    passport.authenticate('jwt', { session: false }),
    //[roleCheck.venuerAccess],
    VenueUserController.addUser);

//User delete by Venueowner
router.delete('/organiser/user/:id',
    passport.authenticate('jwt', { session: false }),
    VenueUserController.deleteUser);

// get host, member,promoter by venuer
router.get('/organiser/getUserByVenuer/:id',
    passport.authenticate('jwt', { session: false }),
    VenueUserController.getUserByVenuer);

// Venuer Profile
// router.post('/organiser/updateProfile',passport.authenticate('jwt',{session:false}),fileupload.uploadS3.array('profilePic',1),CommanAuthController.updateProfile);

// router.post('/organiser/editProfile',passport.authenticate('jwt',{session:false}),[roleCheck.venuerAccess],fileupload.uploadS3.array('profilePic',1),CommanAuthController.updateProfile);


router.get('/organiser/profileDetail', passport.authenticate('jwt', { session: false }), CommanAuthController.ProfileDetail);

// router.get('/organiser/profileDetail',passport.authenticate('jwt',{session:false}),[roleCheck.venuerAccess],CommanAuthController.ProfileDetail);

// Venue Images 
router.get('/organiser/venueimages/:id', passport.authenticate('jwt', { session: false }), CommanAuthController.venueimages);

//getSendRSVP
router.post('/organiser/getSendRSVP', passport.authenticate('jwt', { session: false }), VenueUserController.getSendRSVP);

//previously venue
router.get('/organiser/previousVenue', passport.authenticate('jwt', { session: false }), VenueController.previousEventValue);

// Sub venue detail
router.get('/organiser/subvenueDetail', passport.authenticate('jwt', { session: false }), VenueController.getSubvenueDetail);

// Lock the subvenue
router.post('/organiser/lockSubVenue', passport.authenticate('jwt', { session: false }), VenueController.lockSubVenue);

router.post('/organiser/lockVenueSubVenue', passport.authenticate('jwt', { session: false }), VenueController.lockVenuSubVenue);

router.post('/organiser/contactUs', passport.authenticate('jwt', {session: false}), UserAuthController.contactUs);

router.get('/organiser/getIssues', passport.authenticate('jwt', { session: false }), UserAuthController.getIssues);

module.exports = router;

