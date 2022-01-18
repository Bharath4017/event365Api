const AdminAuthController = require('./admin/AuthController');
const NotificationController = require('./notification/NotificationController');
const AdminNotification = require('./notification/AdminNotification');
const AdminPanelController = require('./admin/AdminPanelController');
const UserAuthController = require('./user/AuthController');
const CornController = require('./user/CornController')();
const CommanAuthController = require('./common/AuthController');
const AdminCategoryController = require('./admin/AdminCategoryController');
const HostAuthController = require('./common/AuthController');
const VenueAuthController = require('./common/AuthController');
const CategoryController = require('./category/CategoryController');
const OrganiserCategoryController = require('./category/OrganiserCategoryController');
const UserEventController = require('./user/UserEventController');
const UserReviewController = require('./user/ReviewController');
const UserPaymentController = require('./user/PaymentController');
const EventController = require('./event/EventController');
const VenueController = require('./venuer/VenueController');
const VenueUserController = require('./venuer/VenueUserController');
const TicketController  = require('./ticket/TicketController');

const AWSController = require('./aws/aws');

module.exports = {
    AdminAuthController,
    AdminPanelController,
    CommanAuthController,
    AdminCategoryController,
    HostAuthController,
    UserAuthController,
    VenueAuthController,
    CategoryController,
    OrganiserCategoryController,
    UserEventController,
    UserReviewController,
    UserPaymentController,
    EventController,
    VenueController,
    VenueUserController,
    TicketController,
    AWSController,
    NotificationController,
    AdminNotification
}