const AdminAuthController = require('./../../controllers/index').AdminAuthController;
const AdminCategoryController = require('./../../controllers/index')
.AdminCategoryController;
const AdminPanelController = require('./../../controllers/index')
.AdminPanelController;
const Aws = require('./../../controllers/index').AWSController;
const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../../middlewares/passport')(passport);
const usercheck = require('./../../middlewares/usercheck');
const roleCheck = require('./../../middlewares/rolecheck');

const fileupload= require('../../middlewares/fileupload');

router.post('/admin/register', AdminAuthController.registerCustomer);
router.post('/admin/login', AdminAuthController.login);
router.get('/admin/logout', AdminAuthController.logout);
router.post('/admin/forgotPassword', AdminAuthController.requestForForgotPassword);
router.post('/admin/verify/:code', AdminAuthController.verifyAndUpdatePassword);
router.get('/admin/activateMyAccount/:code', AdminAuthController.activateCustomerAccount);
router.post('/admin/resendActivationLink', AdminAuthController.resendActivationLink);
router.get('/admin/verifyUserLink/:code', AdminAuthController.verifyUserLink);


//Event List
router.get('/admin/events/:type',passport.authenticate('jwt',{session:false}),AdminPanelController.eventList);
//new
router.get('/admin/events',passport.authenticate('jwt',{session:false}),AdminPanelController.eventList);

//User List
router.get('/admin/users',passport.authenticate('jwt',{session:false}),AdminPanelController.getUsers);

//getOrganisers
router.get('/admin/organisers/:userType',
//passport.authenticate('jwt',{session:false}),
AdminPanelController.getOrganisers);

//addUpdateOrganiser
router.post('/admin/addUpdateOrganiser',passport.authenticate('jwt',{session:false}),AdminPanelController.addUpdateOrganiser);

//Event List
router.get('/admin/eventTicketInfo/:id',passport.authenticate('jwt',{session:false}),AdminPanelController.eventTicketInfo);

//getCategory
router.get('/admin/category',passport.authenticate('jwt',{session:false}),AdminCategoryController.getAllCategory);

//addUpdateCategory
router.post('/admin/category',passport.authenticate('jwt',{session:false}),AdminCategoryController.addUpdateCategory);

//AddCategory
router.delete('/admin/category/:id',passport.authenticate('jwt',{session:false}),AdminCategoryController.deleteCategory);

//getSubCategory 
router.get('/admin/subCategory/:id',passport.authenticate('jwt',{session:false}),AdminCategoryController.getAllSubCat);

//addUpdateCategory
router.post('/admin/subCategory',passport.authenticate('jwt',{session:false}),AdminCategoryController.addUpdateSubCat);

//deleteSubCat
router.delete('/admin/subCategory/:id',passport.authenticate('jwt',{session:false}),AdminCategoryController.deleteSubCat);

//catStatus
router.put('/admin/catStatus',passport.authenticate('jwt',{session:false}),AdminCategoryController.catStatus);

//subCatStatus
router.put('/admin/subCatStatus',passport.authenticate('jwt',{session:false}),AdminCategoryController.subCatStatus);


//deleteOrganiser
router.delete('/admin/deleteOrganiser/:id',passport.authenticate('jwt',{session:false}),AdminPanelController.deleteOrganiser);

//getAllVenue
router.get('/admin/venue',passport.authenticate('jwt',{session:false}),AdminPanelController.getAllVenue);

//addUpdateVenue
router.post('/admin/venue',fileupload.uploadS3.array('venueImages',10),passport.authenticate('jwt',{session:false}),AdminPanelController.addUpdateVenue);
//router.post('/admin/venue',passport.authenticate('jwt',{session:false}),AdminPanelController.addUpdateVenue);

//deleteVenue
router.delete('/admin/venue/:id',passport.authenticate('jwt',{session:false}),AdminPanelController.deleteVenue);

//getAllVenue
router.get('/admin/dashboard',passport.authenticate('jwt',{session:false}),AdminPanelController.dashboard);

//getPaymentReq
// router.get('/admin/getPaymentReq', passport.authenticate('jwt',{session:false}),AdminPanelController.getPaymentReq);

//venueStatus
router.put('/admin/venueStatus',passport.authenticate('jwt',{session:false}),AdminPanelController.venueStatus);

//userStatus
router.put('/admin/userStatus',passport.authenticate('jwt',{session:false}),AdminPanelController.userStatus);

//eventStatus
router.put('/admin/eventStatus',passport.authenticate('jwt',{session:false}),AdminPanelController.eventStatus);

//transStatus
router.put('/admin/transStatus',passport.authenticate('jwt',{session:false}),AdminPanelController.transStatus);

//isReleasedStatus
router.put('/admin/isReleasedStatus', AdminPanelController.isReleasedStatus);

//isVerifiedStatus
router.put('/admin/isVerifiedStatus',AdminPanelController.isVerifiedStatus);

//transStatus
router.get('/admin/getAllevents',passport.authenticate('jwt',{session:false}),AdminPanelController.getAllevents);
router.get('/admin/getAllIssues', AdminPanelController.getAllIssues);

router.get('/admin/getIssuesQuery/:issueId', passport.authenticate('jwt',{session:false}), AdminPanelController.getIssuesQuery);
//addUpdateIssues
router.post('/admin/addUpdateIssues', AdminPanelController.addUpdateIssues);

//deleteIssues
router.delete('/admin/deleteIssue/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.deleteIssue);

//updateDeviceToken for Notification
router.post('/updateDeviceToken', AdminAuthController.updateDeviceToken);

//deleteIssues
router.put('/admin/statusIssue',AdminPanelController.statusIssues);

router.get('/admin/getUsePayment',AdminPanelController.getUsePayment);

router.get('/admin/getOrganiserPaymentReq',AdminPanelController.getOrganiserPaymentReq);

router.post('/upload/file', Aws.UploadImage);

router.post('/updateFCMtoken', AdminPanelController.updateFCMtoken);

router.get('/admin/paidEventList', passport.authenticate('jwt',{session:false}), AdminPanelController.paidEventList);

router.get('/admin/paidEventDetail/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.paidEventDetail);

router.post('/admin/addPaidEventRules', passport.authenticate('jwt',{session:false}), AdminPanelController.addRules);

router.get('/admin/allAdminList', passport.authenticate('jwt',{session:false}), AdminPanelController.getOtherAdminList);

router.post('/admin/notes', passport.authenticate('jwt',{session:false}), AdminPanelController.createNote);

router.get('/admin/notes', passport.authenticate('jwt',{session:false}), AdminPanelController.notesList);

router.post('/admin/highlightEvent', passport.authenticate('jwt',{session:false}), AdminPanelController.highlightEvent);

router.post('/admin/priorityEvent', passport.authenticate('jwt',{session:false}), AdminPanelController.priorityEvent);

router.post('/admin/exploreEvent', passport.authenticate('jwt',{session:false}), AdminPanelController.exploreEvent);

router.get('/admin/highlightEvent', passport.authenticate('jwt',{session:false}), AdminPanelController.highLightedEventList);

router.get('/admin/exploreEvent', passport.authenticate('jwt',{session:false}), AdminPanelController.ExploreEventList);

router.get('/admin/allCategorySubcategory', passport.authenticate('jwt',{session:false}), AdminCategoryController.getAllCategorySubCategory);

router.get('/admin/event/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.eventDetail);

router.get('/admin/attendeesList', passport.authenticate('jwt',{session:false}), AdminPanelController.attendeesList);

router.post('/admin/updateTicketCapacity', passport.authenticate('jwt',{session:false}), AdminPanelController.updateTicketCapacity);

router.get('/admin/rules', passport.authenticate('jwt',{session:false}), AdminPanelController.getRules);

router.get('/admin/venue/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.venueDetail);

router.get('/admin/exportAttendeesList', passport.authenticate('jwt',{session:false}), AdminPanelController.exportAttendeesList);

router.get('/admin/getVenueForMap', passport.authenticate('jwt',{session:false}), AdminPanelController.getVenueForMap);

router.get('/admin/subAdmin', passport.authenticate('jwt',{session:false}), AdminPanelController.subAdminList);

router.put('/admin/subAdmin/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.subAdminStatus);

router.post('/admin/subAdmin', passport.authenticate('jwt',{session:false}), [roleCheck.adminAccess], AdminPanelController.addUpdateSubAdmin);

router.get('/admin/subAdmin/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.subAdminDetail);

router.put('/admin/updateOrganiserStatus/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.updateOrganiserStatus);

router.get('/admin/userAttendEventList', passport.authenticate('jwt',{session:false}), AdminPanelController.userAttendEventList);

router.get('/admin/userDetail/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.userDetail);

router.get('/admin/exportUserAttendEvent/', passport.authenticate('jwt',{session:false}), AdminPanelController.userAttendEventExport);

router.get('/admin/exportUserList/', passport.authenticate('jwt',{session:false}), AdminPanelController.customerListExport);

router.delete('/admin/notes/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.deleteNotes);

router.delete('/admin/issuesQuery/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.deleteIssuesQuery);

router.post('/admin/eventArchive', passport.authenticate('jwt',{session:false}), AdminPanelController.eventArchive);

router.get('/admin/eventArchive', passport.authenticate('jwt',{session:false}), AdminPanelController.archiveEventList);

router.get('/admin/slider', passport.authenticate('jwt',{session:false}), AdminPanelController.getAllSlider);

router.post('/admin/slider',fileupload.uploadS3.array('image'),passport.authenticate('jwt',{session:false}), AdminPanelController.addUpdateSlider);

router.delete('/admin/slider/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.deleteSlider);

router.put('/admin/slider', passport.authenticate('jwt',{session:false}), AdminPanelController.updateSliderTime);

router.put('/admin/slider/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.chnageSliderStatus);

router.post('/admin/banner',passport.authenticate('jwt',{session:false}), AdminPanelController.addUpdateBanner);

router.get('/admin/banner',passport.authenticate('jwt',{session:false}), AdminPanelController.getBanner);

router.put('/admin/banner/:id', passport.authenticate('jwt',{session:false}), AdminPanelController.chnageBannerStatus);

//deleteEvents
router.delete('/admin/events/:id',passport.authenticate('jwt',{session:false}),AdminPanelController.deleteEvents);


module.exports = router;
