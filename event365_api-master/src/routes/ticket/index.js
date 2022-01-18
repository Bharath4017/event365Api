const {transaction} = require('objection');
const TicketController = require('./../../controllers/index').TicketController;
const express = require('express');
const router = express.Router();
const passport = require('passport');
require('./../../middlewares/passport')(passport);
const usercheck = require('./../../middlewares/usercheck');
const stripe = require('./../../middlewares/stripe');
const roleCheck = require('./../../middlewares/rolecheck');

router.post('/organiser/bookTicket', passport.authenticate('jwt', {session: false}), TicketController.BookTicket);

router.get('/organiser/allRSVP', TicketController.AllRSVP);

router.put('/organiser/checkin', passport.authenticate('jwt', {session: false}), TicketController.checkIn);

//router.put('/checkin',passport.authenticate('jwt',{session:false}),TicketController.checkIn);

router.get('/organiser/fetchCheckedInUser', passport.authenticate('jwt', {session: false}), TicketController.fetchCheckedIn);
router.get('/organiser/ticketDetail', passport.authenticate('jwt', {session: false}), TicketController.getTicketDetail);
router.get('/organiser/ticketForEvent/:eventId',passport.authenticate('jwt', {session: false}), TicketController.GetTicketOfEvent);

//get Users payments (Ticket List)
router.get('/organiser/getUsersPayments', passport.authenticate('jwt', {session: false}), TicketController.getUsersPayments);

// Ticket info Details
router.get('/organiser/userPaymentDetails',passport.authenticate('jwt', {session: false}), TicketController.userPaymentDetails);

// Cancelled Ticket by Host
router.put('/organiser/ticketCancelled', passport.authenticate('jwt', {session: false}), TicketController.ticketCancelled);

// Cancelled Ticket by User
router.put('/userTicketCancelled', passport.authenticate('jwt', {session: false}), TicketController.userTicketCancelled);

// for Host Post invite Users
router.post('/organiser/inviteUser/:eventId', passport.authenticate('jwt', {session: false}), TicketController.inviteUser);

//for Host Post invite Users
router.post('/organiser/createBank', stripe.createBank);

router.post('/createAccount', stripe.createAccount);

router.get('/organiser/ticket/:id/:type', passport.authenticate('jwt', {session: false}), TicketController.getTicketByEventId);

router.post('/organiser/createTicket', passport.authenticate('jwt', {session: false}), TicketController.createTicket);
module.exports = router;


