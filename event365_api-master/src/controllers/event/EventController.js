const Event = require('../../models/events');
const Venue = require('../../models/venue');
const EventOccurrence = require('../../models/eventOccurrence');
const {
    transaction
} = require('objection');
const Category = require('../../models/category');
const Review = require('../../models/reviews');
const subCategory = require('../../models/subCategory');
const GalleryImages = require('../../models/gallery');
const EventOtherImages = require('../../models/eventOtherImages');
const User = require('../../models/users');
const venueEvents = require('../../models/venueEvents');
const SubVenueEvents = require('../../models/subVenueEvents');
const EventChooseSubcategory = require('../../models/eventChooseSubcategory');
const NormalTicket = require('../../models/normalTicket');
const TableSeatingTicket = require('../../models/tableSeatingTicket');
const RefundTransaction = require('../../models/refundTransaction');
const TicketBooked = require('./../../models/ticketBooked');
const TicketNumber = require('./../../models/ticketNumber');
const TicketInfo = require("./../../models/ticket_info");
const Coupan = require("./../../models/coupan");
const PaidEventPricing = require('./../../models/paidEventPrice');
const iosNotification = require('./../../middlewares/iosNotification');
const Payment = require('../../models/payment');
const UserChooseSubcategory = require('../../models/userChooseSubCategory');
const androidNotification = require('./../../middlewares/androidNotification');
const WebNotification = require('./../../middlewares/webNotification');
const randomFunction = require('./../../utils/random');
var global = require('../../global_functions');
var global = require('../../global_constants');
const latlong = require('./../../middlewares/latlong');
var moment = require('moment');
const stripe = require('./../../middlewares/stripe');
let knexConfig = require("../../../db/knex");
const knex = require("knex")(knexConfig["development"]);

/**
 * Create Event
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const CreateEvent = async (req, res) => {
    let data = req.body;
    let discountPercentage = 5;
    data.userId = req.user.id;
    let ticket_info = [];
    if (!data.name) {
        return badRequestError(res, "", "Please enter event Name");
    }
    if (data.free) {
        freeNormalTicket = JSON.parse(data.free);
    }
    if (data.vipSeatings || data.vipTableSeatings) {

        if (data.vipSeatings) {
            vipNormalTicket = JSON.parse(data.vipSeatings);
        }
        if (data.vipTableSeatings) {
            vipTableSeatingTicket = JSON.parse(data.vipTableSeatings);
        }
    }
    if (data.regularSeatings || data.regularTableSeatings) {
        if (data.regularSeatings) {
            regularNormalTicket = JSON.parse(data.regularSeatings);
        }
        if (data.regularTableSeatings) {
            regularTableSeatingTicket = JSON.parse(data.regularTableSeatings);
        }
    }
    //Category and SubCategories
    let subCategoryId1 = JSON.parse(data.subCategoryId);
    data.eventChooseSubcategory = await subCategoryId1.map((d) => {
        return {
            categoryId: data.categoryId,
            subCategoryId: d,
            userId: req.user.id
        }
    });

    // occurrence code
    let occurredOn = JSON.parse(data.occurredOn);
    data.eventOccurrence = await occurredOn.map((d) => {
        return {
            eventOccurrence: data.eventOccurrenceType,
            occurredOn: d
        }
    });
    if (data.venueId) {
      
        let venue = await Venue.query().skipUndefined().where('id', data.venueId).first();
     
        data.venueEvents = [{
            'venueId': data.venueId,
            'userId': req.user.id,
            'venueName': venue.venueName,
            'venueAddress': venue.venueAddress,
            'countryCode': venue.countryCode,
            'city': venue.city,
            'state': venue.state,
            'country':venue.country,
            'latitude': venue.latitude,
            'longitude': venue.longitude,
            'venueType': "regVenue"
        }]
        if (venue == '') {
            return notFoundError(res, "No Venue Found");
        } else {
            data.venueId = data.venueId
            delete data.nonRegisteredVenue
        }
    } else {
        delete data.venueId
        data.venueEvents = [{
            'userId': req.user.id,
            'venueName': data.venueName,
            'venueAddress': data.venueAddress,
            'latitude': data.venueLatitude,
            'countryCode': data.countryCode,
            'city': data.city,
            'state': data.state,
            'country':data.country,
            'longitude': data.venueLongitude,
            'venueType': "notRegVenue"
        }]
    }
    // ticket code

    if (data.vipSeatings) {
        Array.prototype.push.apply(ticket_info, await vipNormalTicket.map((type) => {
            return {
                userId: req.user.id,
                ticketType: "vipNormal",
                ticketName: type.ticketName,
                pricePerTicket: type.pricePerTicket,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                description: type.description,
                cancellationChargeInPer: type.cancellationChargeInPer
            }
        }))
    }

    if (data.vipTableSeatings) {
        Array.prototype.push.apply(ticket_info, await vipTableSeatingTicket.map((type) => {
            return {
                userId: req.user.id,
                ticketType: "vipTableSeating",
                ticketName: type.ticketName,
                pricePerTable: type.pricePerTable,
                discountedPrice: ((type.pricePerTable * discountPercentage) / 100),
                disPercentage: discountPercentage,
                parsonPerTable: type.personPerTable,
                noOfTables: type.noOfTables,
                description: type.description,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                pricePerTicket: type.pricePerTicket,
                cancellationChargeInPer: type.cancellationChargeInPer
            }
        }))
    }


    if (data.regularSeatings) {
        Array.prototype.push.apply(ticket_info, await regularNormalTicket.map((type) => {
            return {
                userId: req.user.id,
                ticketType: "regularNormal",
                ticketName: type.ticketName,
                pricePerTicket: type.pricePerTicket,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                description: type.description,
                cancellationChargeInPer: type.cancellationChargeInPer
            }
        }))
    }
    if (data.regularTableSeatings) {
        Array.prototype.push.apply(ticket_info, await regularTableSeatingTicket.map((type) => {
            return {
                userId: req.user.id,
                ticketType: "regularTableSeating",
                ticketName: type.ticketName,
                pricePerTable: type.pricePerTable,
                discountedPrice: ((type.pricePerTable * discountPercentage) / 100),
                disPercentage: discountPercentage,
                parsonPerTable: type.personPerTable,
                noOfTables: type.noOfTables,
                description: type.description,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                pricePerTicket: type.pricePerTicket,
                cancellationChargeInPer: type.cancellationChargeInPer
            }
        }))
    }

    if (data.free) {
        Array.prototype.push.apply(ticket_info, await freeNormalTicket.map((type) => {
            return {
                userId: req.user.id,
                ticketType: "freeNormal",
                ticketName: type.ticketName,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                description: type.description
            }
        }))
    }
    // Images code
  
    data.eventImages = await req.files.map((file) => {
        return {
            eventImage: file.location,
            isPrimary: false
        };
    });
    if(data.eventImages){
        data.eventImages[0].isPrimary = true;
    }

    //subvenue Events
    if (data.subVenueEvent && data.subVenueEvent !== '') {
        var sbvenue = JSON.parse(data.subVenueEvents)

        for (let x = 0; x < sbvenue.length; x++) {
            let updateSbvenue = await SubVenueEvents.query().patch({ status: "booked" }).where({ venueId: sbvenue[x].venueId, subVenueId: sbvenue[x].subVenueId, userId: req.user.id, status: 'reserve' });
        }
        
    }
    delete data.subVenueEvent;
    data.ticket_info = ticket_info;
   
    delete data.eventOccurrenceType;
    delete data.occurredOn;
    delete data.subCategoryId;
    delete data.categoryId;
    delete data.vipSeatings
    delete data.vipTableSeatings
    delete data.regularSeatings
    delete data.regularTableSeatings
    delete data.free
    delete data.free
    delete data.venueName;
    delete data.venueAddress;
    delete data.venueLatitude;
    delete data.venueLongitude;
    delete data.city;
    delete data.state;
    delete data.countryCode;

    let eventCreated = await Event.query().upsertGraph(data).returning("id");
   
    let categoryId = data.eventChooseSubcategory[0].categoryId;
    //catSubIds
    const catSubIds = await UserChooseSubcategory.query().select('userId').where('categoryId', categoryId);
    let UserIds = Array.prototype.map.call(catSubIds, s => s.userId)
    

    //fetch eventIds
    const getUserTokens = await User.query().select('id', 'name', 'deviceToken', 'isNotify', 'isRemind')
    .eager('[userLoginDetail as andoridUser, userLoginDetail as iosUser,userLoginDetail as webUser]')
    .modifyEager('andoridUser', builder =>{
        builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
    }) 
    .modifyEager('iosUser', builder =>{
        builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
    })
    .modifyEager('webUser', builder =>{
        builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')
    })

    .whereIn('id', UserIds);
   
    const hostData = await User.query().select('id', 'name', 'deviceType', 'profilePic').where('id', req.user.id).first();

    //Notification Process
    var AndroideventCreate = await androidNotification.sendCreateEvent(getUserTokens, hostData, eventCreated);
    var IOSeventCreate = await iosNotification.sendCreateEvent(getUserTokens, hostData, eventCreated);
    var webNotifi = await WebNotification.sendCreateEvent(getUserTokens,hostData, eventCreated);
    if (!eventCreated) {
        return badRequestError(res, '', ' err.message');
    }
    return okResponse(res, '', Message("eventCreate"));
}

/**
 * updateVenue
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const eventUpdate = async (req, res) => {
   
    let data = req.body;
    data.id = Number(req.params.id);
    // //eventOccurrence
    data.eventOccurrence = data.eventOccurrenceType;
   
    //venueImages
    //Update Process
    let [err, updateVenue] = await to(Event.query().skipUndefined().upsertGraph(data).return('id'));
    if (err) {
        return badRequestError(res, "", err.message);
    }
    return okResponse(res, {}, Message("eventUpdate"));
}

/**
 * Event Detail
 * @param {stores the requested parameters} req
 * @param {stores the response} res 
 */ 

const GetEventDetail = async (req, res) => {
    if(req.params.id==undefined){
        return notFoundError(res, Message("eventNotFond"));
    }
    [err, event] = await to(Event.query().skipUndefined().select('id','eventUrl','name', 'rating', 'reviewCount as ratingCount', 'is_availability AS isEventAvailable', 'ticketInfoURL', 'totalPayment', 'eventHelpLine','paidType').whereIn('userId', [req.user.id, req.user.createdBy])
    .andWhere("id", req.params.id)
    .eager("[eventImages, venueEvents, eventOtherImages as telentImages, eventOtherImages as sponserImages,coupan]")
    .modifyEager('coupan', builder => {
        return builder.select('coupanCode')
    })
    .modifyEager('eventImages', builder => {
        builder.select('eventImage', 'isPrimary')
    })
    .modifyEager('telentImages', builder => {
        builder.select('id', 'image', 'imageType').where('imageType', 'talents')
    })
    .modifyEager('sponserImages', builder => {
        builder.select('id', 'image', 'imageType').where('imageType', 'sponser')
    })
    .modifyEager('venueEvents', builder => {
        builder.select('latitude', 'longitude', 'venueAddress', 'countryCode',"city","state", 'country').first()
    }).where('isDeleted',false).where('isArchived',false).first());
    if (err) {
        return badRequestError(res, "", err.message);
    }
    if (!event) {
        return notFoundError(res, Message("eventNotFond"));
    }
    let totalRSVP = await TicketBooked.query().select( knex.raw('coalesce(sum("totalQuantity"),0) as "totalCount"') , knex.raw('array_agg(DISTINCT \"ticketBooked\".\"id\") as id')).where('eventId', req.params.id).first();
    let checkedInRSVP = await TicketNumber.query().count('id').whereIn('ticketBookedId', (totalRSVP.id)? totalRSVP.id : [0]).where('status', 'checkedIn').first()
    
    // event.isEditEvent = true;
    if (event.ticketInfoURL == null && event.eventHelpLine == null) {
        event.isExternalTicket = false;
    } else {
        event.isExternalTicket = true;
    }
    if (event) {
        if (totalRSVP) {
            event.totalRSVP = parseInt(totalRSVP.totalCount);
        }
        if (checkedInRSVP) {
            event.checkedInRSVP = parseInt(checkedInRSVP.count);
        }
        let roles = req.user.roles;
        if(roles){
            if (roles.includes("event_management")) {
                event.isEditEvent = true
            } else {
                event.isEditEvent = false;
            }
        }else{
            event.isEditEvent = false;
        }

        if (req.user.userType == "venuer" || req.user.userType == "promoter") {
            
            event.isViewPayment = true;
            
        } else {
            event.isViewPayment = false;
           
        }
        if(roles){
        for (var i = 0; i < roles.length; i++) {
            switch (roles[i]) {
                case 'event_management':
                break;
                case "payment_management":
                    event.isViewPayment = true;
                    break;
                default:
                    break;
            }
        }
     }
    } else {
      
        return notFoundError(res, Message("eventNotFond"));
    }
    return okResponse(res, event, Message("eventDetailsFond"));
}


/**
 * Event List (or My events)
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const GetEventList = async (req, res) => {
    let userId = req.user.id;
    let isCreateEvent;
    let GuestData = "";
    let guestCount;
  
    let todayDate = new Date();
    let todayTime = moment().format('HH:mm:ss');
    let lat = '0', lng = '0';
    if(req.query){
        if(req.query.lat){
            lat  = req.query.lat;
            lng = req.query.lng;
        }
    }
    let user = await User.query().select().where('id', userId).first();
   
    if (req.user.userType == "venuer" || req.user.userType == "promotor" || user.createdBy == userId) {
        isCreateEvent = true
      
    } else {
        isCreateEvent = false
        
    }
    //upComing Event
    let upcomingEvent = await Event.query().select('events.id','events.archivedBy','events.eventUrl','events.is_availability', 'events.name','events.description', 'events.start', 'events.end', "events.userLikeCount as currentLikeCount", "events.userDisLikeCount as currentDisLikeCount", knex.raw('(select count("userId") from "ticketBooked" where "status"= \'checkedIn\' AND "ticketBooked"."eventId" = "events"."id") as guestCount')
    ).skipUndefined().eager("[eventImages, venueEvents, ticketBooked,eventOccurrence]").modifyEager('eventImages', builder => {
        builder.select('eventImage', 'isPrimary')
    }).modifyEager('venueEvents', builder => {
        builder.select('latitude', 'longitude', 'venueAddress','country','state','city',
        knex.raw("(6371 * acos( cos( radians(latitude::decimal) ) * cos( radians( "+lat+" ) ) * cos( radians( "+lng+" ) - radians(longitude::decimal) ) + sin( radians(latitude::decimal) ) * sin( radians( "+lat+" ) ) ) ) as distance"))
    }).modifyEager('ticketBooked', builder => {
       builder.select("")
      .eager("[users]")
      .modifyEager('users', builder => {
       builder.select("profilePic", "name")
      });
   }).modifyEager('eventOccurrence', builder => {
    builder.select('eventId', 'eventOccurrence', 'occurredOn')
   })
   .whereIn('userId', [req.user.id, req.user.createdBy]).where('end', '>', todayDate).where('isDeleted',false).orderBy('end','desc')

   for (let i = 0; i < upcomingEvent.length; i++) {
    let event_id = upcomingEvent[i].id;

    let eventsdate =[];
        var eventsdatess = [];
        var eventsdaily = [];
       
        for (let j=0;j<upcomingEvent[i].eventOccurrence.length;j++){
           //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
           let currentDate = moment().format('YYYY-MM-DD');
           if(upcomingEvent[i].eventOccurrence[j].eventOccurrence=='weekly'){
                  // console.log(getDays(currentDate,1));
              eventsdate = getDays(currentDate,upcomingEvent[i].eventOccurrence[j].occurredOn);

           } else if(upcomingEvent[i].eventOccurrence[j].eventOccurrence=='monthly'){
               //console.log(serachData[i].eventOccurrence[j].eventId)
              // console.log(serachData[i].eventOccurrence[j].occurredOn);
              var endOfMonth   = moment().endOf('month').format('DD');
              if(endOfMonth >= upcomingEvent[i].eventOccurrence[j].occurredOn){
               eventsdatess.push(upcomingEvent[i].eventOccurrence[j].occurredOn);
              }
                 //[1,2,3,4,5]
           } else if(upcomingEvent[i].eventOccurrence[j].eventOccurrence=='daily'){
               eventsdaily.push(upcomingEvent[i].eventOccurrence[j].occurredOn);
           }
        }
       
       //going user List
       //console.log(eventsdatess,'ee');
       let todayd = moment().format('DD');
       const found = eventsdatess.find(element => element >= todayd);
       let todayd22 = moment().format('YYYY-MM'); 
       if(found){
           var eventsdate1 = todayd22+'-'+found;
           eventsdate = moment(eventsdate1).format('YYYY-MM-DD')
       }

       var dcv = new Date();
       var nv = dcv.getDay()
       const foundDaily = eventsdaily.find(element => element >= nv);
       if(foundDaily){
           var currentDate = moment().format('YYYY-MM-DD');
       eventsdate = getDays(currentDate,foundDaily);
       console.log(eventsdate);
       }
       
       if(eventsdate.length>0){ 
       upcomingEvent[i].recuringDate = eventsdate;
       } else {
       upcomingEvent[i].recuringDate = "";  
       }
       //console.log(serachData[i].recuringDate);
    
  
    //going user List
    let profilePic;
    upcomingEvent[i].GuestData = await TicketBooked.query().select("").eager('users as guestUser').modifyEager('guestUser', builder => {
        builder.select('profilePic', 'name').whereNot('profilePic', null)
    }).where('eventId', event_id).joinRelation('users').where('status', 'checkedIn'); //.whereNot('users.profilePic', null) 

    upcomingEvent[i].guestCount = await TicketBooked.query().count("userId").where('eventId', event_id).where('status', 'checkedIn');
  }

    //Past Event
    let pastEvent = await Event.query().select('events.id','events.is_availability','events.archivedBy','events.name','events.description', 'events.start', 'events.end', "events.userLikeCount as currentLikeCount", "events.userDisLikeCount as currentDisLikeCount", knex.raw('(select count("userId") from "ticketBooked" where "status"= \'checkedIn\' AND "ticketBooked"."eventId" = "events"."id") as guestCount')).skipUndefined().eager("[eventImages, venueEvents, ticketBooked,eventOccurrence]").modifyEager('eventImages', builder => {
        builder.select('eventImage', 'isPrimary')
    }).modifyEager('venueEvents', builder => {
        builder.select('latitude', 'longitude', 'venueAddress', knex.raw("(6371 * acos( cos( radians(latitude::decimal) ) * cos( radians( "+lat+" ) ) * cos( radians( "+lng+" ) - radians(longitude::decimal) ) + sin( radians(latitude::decimal) ) * sin( radians( "+lat+" ) ) ) ) as distance"))
    }).modifyEager('ticketBooked', builder => {
        builder.select("")
        .eager("[users]")
        .modifyEager('users', builder => {
            builder.select("profilePic", "name")
        });
    }).modifyEager('eventOccurrence', builder => {
        builder.select('eventId', 'eventOccurrence', 'occurredOn')
    })
    .whereIn('userId', [req.user.id, req.user.createdBy]).where('end', '<', todayDate).where('isDeleted',false)

    for (let i = 0; i < pastEvent.length; i++) {
        let event_id = pastEvent[i].id;

        let eventsdate =[];
        var eventsdatess = [];
        var eventsdaily = [];
       
        for (let j=0;j<pastEvent[i].eventOccurrence.length;j++){
           //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
           let currentDate = moment().format('YYYY-MM-DD');
           if(pastEvent[i].eventOccurrence[j].eventOccurrence=='weekly'){
                  // console.log(getDays(currentDate,1));
              eventsdate = getDays(currentDate,pastEvent[i].eventOccurrence[j].occurredOn);

           } else if(pastEvent[i].eventOccurrence[j].eventOccurrence=='monthly'){
               //console.log(serachData[i].eventOccurrence[j].eventId)
              // console.log(serachData[i].eventOccurrence[j].occurredOn);
              var endOfMonth   = moment().endOf('month').format('DD');
              if(endOfMonth >= pastEvent[i].eventOccurrence[j].occurredOn){
               eventsdatess.push(pastEvent[i].eventOccurrence[j].occurredOn);
              }
                 //[1,2,3,4,5]
           } else if(pastEvent[i].eventOccurrence[j].eventOccurrence=='daily'){
               eventsdaily.push(pastEvent[i].eventOccurrence[j].occurredOn);
           }
        }
       
       //going user List
       //console.log(eventsdatess,'ee');
       let todayd = moment().format('DD');
       const found = eventsdatess.find(element => element >= todayd);
       let todayd22 = moment().format('YYYY-MM'); 
       if(found){
           var eventsdate1 = todayd22+'-'+found;
           eventsdate = moment(eventsdate1).format('YYYY-MM-DD')
       }

       var dcv = new Date();
       var nv = dcv.getDay()
       const foundDaily = eventsdaily.find(element => element >= nv);
       if(foundDaily){
           var currentDate = moment().format('YYYY-MM-DD');
       eventsdate = getDays(currentDate,foundDaily);
       console.log(eventsdate);
       }
       
      if(eventsdate.length>0){
       pastEvent[i].recuringDate = eventsdate;
      } else {
        pastEvent[i].recuringDate = ""; 
      }
       //console.log(serachData[i].recuringDate);
    }

    let response = { 
        "isCreateEvent": isCreateEvent,
        'upcomingEvent': upcomingEvent,
        'pastEvent': pastEvent
    }

    return okResponse(res, response, Message("eventList"));
}

function getDays(d,y) {
    d = new Date(d); 
   // console.log(d);
    //var day = d.getDay(),
      //  diff = d.getDate() - day + (day == 0 ? -6:y); // adjust when day is sunday
       d.setDate(d.getDate() + (((y + 7 - d.getDay()) % 7) || 7));
        console.log(d,'hb');
        return moment(d).format('YYYY-MM-DD');
  }

/**
 * Home For Host side
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const Home = async (req, res) => {
   
    var response = {};
    response.isCreateEvent = false;
    response.isManageUser = false;
    let todayDate = new Date();
    let todayTime = moment().format('HH:mm:ss');
   
    let currentDateTime = todayDate
    
    // Host Info
    let user = await User.query().skipUndefined().select('id', 'name', 'profilePic', 'userType', 'createdBy', 'customerId', 'lastLoginTime','roles').where('id', req.user.id).first();

    // count for upcoming Event
    let countUpcomingEvent = await Event.query().skipUndefined().count().whereIn('userId', [req.user.id, req.user.createdBy]).andWhere('end', '>', todayDate).where('isDeleted',false)

    // count for Past Event
    let countPastEvent = await Event.query().skipUndefined().count().whereIn('userId', [req.user.id, req.user.createdBy]).andWhere('end', '<', todayDate).where('isDeleted',false)

   
    let RSVPCount = await Event.query().select("events.id")
    .joinRelation('[ticketBooked]')
    .eager("[ticketBooked]")
    .modifyEager('ticketBooked', builder => {
       builder.select("ticketBooked.id")
      .eager("[ticket_number_booked_rel]")
      .modifyEager('ticket_number_booked_rel', builder => {
       builder.select(knex.raw('coalesce(count("id")) as "totalCount"')).whereNot("ticketNumber.status",'cancelled').whereNot("ticketNumber.status",'delete').groupBy("ticketBookedId").first()
      });
   })
    .where('events.userId', req.user.id)
    .andWhere('events.end','>=',todayDate)
    .groupBy('events.id')
    
      
        var sum = 0;
        let tc = 0;
        if(RSVPCount.length>0){
                for(let i = 0; i < RSVPCount.length; i++){
                let totalc = RSVPCount[i].ticketBooked;
               
                for(let j = 0; j < totalc.length; j++){
                    tc = (totalc[j].ticket_number_booked_rel[0]) ? totalc[j].ticket_number_booked_rel[0].totalCount : 0;
                    sum = parseInt(tc)+sum;
                }
            }
        }
       
    // UpcomingEvent Listing
    let upcomingEvent = await Event.query().select('events.id', 'events.name', 'events.start', 'events.end','events.archivedBy').skipUndefined().eager("[eventImages, venueEvents]").modifyEager('eventImages', builder => {
        builder.select('eventImage', 'isPrimary')
    }).modifyEager('venueEvents', builder => {
        builder.select('latitude', 'longitude', 'venueAddress')
    }).whereIn('userId', [req.user.id, req.user.createdBy]).where('end', '>', todayDate).where('isDeleted',false);
    user.lastLoginTime = moment(user.lastLoginTime).format('YYYY-MM-DD HH:mm:ss');
    response = {
        'user': user,
        'countUpcomingEvent': parseInt(countUpcomingEvent[0].count),
        'countPastEvent': parseInt(countPastEvent[0].count),
        'countRSVP': parseInt(sum),
        'upcomingEvent': upcomingEvent
    }
    let roles = (req.user.roles) ? req.user.roles : [];
    if (roles.includes("event_management")) {
        response.isCreateEvent = true
    } else {
        response.isCreateEvent = false
    }
    if (roles.includes("user_management")) {
        response.isManageUser = true
    } else {
        response.isManageUser = false
    }
    await User.query().update({ 'lastLoginTime': currentDateTime }).where('id', req.user.id);
    return okResponse(res, response, Message("eventFond"));
}
/**
 * Delete Event
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const DeleteEvent = async (req, res) => {
   
    let data = req.params;
    let todayDate = new Date();
    let checkEvent = await Event.query().where('id', data.id).where('end', '>', todayDate).where('isDeleted', false).where('isArchived',false).where('is_active', true).first();
   // console.log(checkEvent);
    if (!checkEvent) {
        return badRequestError(res, "",'Event Is not available');
    }
    let getTicket = await TicketInfo.query().select(knex.raw('array_agg(DISTINCT "ticket_info"."id") as ticketBookedId'))
    .where('ticket_info.eventId', data.id)
    .first().runAfter((result, builder)=>{
        console.log(builder.toKnexQuery().toQuery())
        return result;
    });
    if(getTicket.ticketbookedid){
        const checkStatus = await TicketBooked.query().select('ticketBooked.id', 'ticketBooked.userId','ticketBooked.status', 'ticketId', 'pricePerTicket','ticketBooked.QRkey')
        .innerJoinRelation('[ticket_number_booked_rel]')
        .eager('[ticket_number_booked_rel]')
        .modifyEager('ticket_number_booked_rel', builder => {
            //return builder.select('ticketNumber.id', 'ticketNumber.status').where('ticketNumber.status', 'booked').whereIn('ticketNumber.id', [data.ticketNumberId]).first();
            return builder.select(knex.raw('array_agg(DISTINCT "ticketNumber"."id") as ticketNumberId, count("ticketNumber"."id") as totalQuantities')).where('ticketNumber.status', 'booked').groupBy('ticketBookedId').first();
        })
        .where('ticket_number_booked_rel.status', 'booked')
        .whereIn('ticketBooked.ticketId', getTicket.ticketbookedid)
        .groupBy('ticketBooked.userId','ticketBooked.id')
        .runAfter((result, builder)=>{
           // console.log(builder.toKnexQuery().toQuery())
            return result;
        });
       
        if (!checkStatus) {
            console.log('h')
            return badRequestError(res, {}, Message("userTicketCancelled"));
        }
        for(let i=0;i < checkStatus.length;i++){
            //console.log(checkStatus[i].ticket_number_booked_rel, 'checkStatus');
            console.log(checkStatus[i].ticket_number_booked_rel[0].ticketnumberid,'ticketnumber');
            
        let checkTicketDetail = await TicketInfo.query().select('id', 'cancellationChargeInPer', 'userId', 'ticketType').where('id', checkStatus[i].ticketId).first();
        if (!checkTicketDetail) {
            //console.log('h')
            //return badRequestError(res, {}, Message("ticketDetailNotFound"));
        }
        let ticketb = await to(TicketBooked.query().update({ status: 'cancelled',cancelledBy: 'partner'}).whereIn('id', [checkStatus[i].id]));
        console.log('errer');
        let [err, ticketData] = await to(TicketNumber.query().update({ status: 'cancelled', cancelledBy: 'partner' }).whereIn('id', [checkStatus[i].ticket_number_booked_rel[0].ticketnumberid]).where('status', 'booked'));
        if (err) {
            console.log(err,'er')
            //return badRequestError(res, {}, Message("alreadyCancel"));
        }
        console.log(ticketData, 'ticketData amount');
        if (ticketData) {
            if(checkTicketDetail.ticketType != 'freeNormal'){
                let getPayement = await Payment.query().select('amount','fees').where('QRkey', checkStatus[i].QRkey).where('status', 'succeeded').first().runAfter((result, builder)=> {
                    //console.log(builder.toKnexQuery().toQuery())
                     return result;
                });
                let totalAmount = parseFloat(getPayement.amount)-parseFloat(getPayement.fees*100);
                //let totalAmount = (parseInt(checkStatus[i].pricePerTicket)*parseInt(checkStatus[i].ticket_number_booked_rel[0].totalquantities))
                let stripeAmount = parseFloat(totalAmount);
               
                //console.log(stripeAmount);
                
                let selectPI = await Payment.query().update({ 'balanceAmount': knex.raw('?? - ' + parseFloat(stripeAmount), ["balanceAmount"]) }).where('QRkey', checkStatus[i].QRkey).where('status', 'succeeded').where('balanceAmount', '>=', parseFloat(stripeAmount)).returning('paymentId', 'id').runAfter((result, builder)=> {
                    //console.log(builder.toKnexQuery().toQuery())
                     return result;
                });
                console.log(selectPI, 'sel');
                if (selectPI != undefined && selectPI.length > 0) {
                    
                    let [err, Stripedata] = await to(stripe.refundAmountPI({ token: selectPI[0].paymentId, amount: stripeAmount }))
                    if ((err) || (!Stripedata)) {
                        console.log(err, 'err')
                        console.log(Stripedata, 'Stripedata')

                        let addRefDetail = await RefundTransaction.query().insert({ 'amount': totalAmount, status:"Failed", 'paymentId': selectPI[0].id }).returning('id');
                        //update status as booked if error got
                        [err, ticketData] = await to(TicketNumber.query().update({ status: 'booked', cancelledBy: '' }).whereIn('id', [checkStatus[i].ticket_number_booked_rel[0].ticketnumberid]).where('status', 'cancelled'));
                        // return badRequestError(res, {}, Message("PaymentFailed"));
                    }
                    if (Stripedata) {
                        console.log('stripedata',Stripedata);
                        //credit cancellation amount to host
                         //credit cancellation amount to host
                         await User.query().update({ 'totalAmount': knex.raw('?? + ' + totalAmount, ["totalAmount"]), 'currentAmounts': knex.raw('?? + ' + totalAmount, ["currentAmounts"])}).where('id', checkStatus[i].userId).runAfter((result, builder)=> {
                           // console.log(builder.toKnexQuery().toQuery())
                             return result;
                        });
                        //update refund status and increase ticket quantity
                        let addRefDetail = await RefundTransaction.query().insert({ 'amount': totalAmount, rf_id: Stripedata.id, status: Stripedata.status, 'paymentId': selectPI[0].id }).returning('id')
                        console.log('stripedata','0');
                        await TicketNumber.query().update({ refundId: addRefDetail.id }).whereIn('id', [checkStatus[i].ticket_number_booked_rel[0].ticketnumberid]);
                        await TicketInfo.query().update({ 'totalQuantity': knex.raw('?? + ' + 1 + '', ['totalQuantity']) }).where('id', checkStatus[i].ticketId);
                        await TicketBooked.query().update({ 'totalQuantity': knex.raw('?? - ' + 1 + '', ['totalQuantity']) }).where('id',checkStatus[i].id);
                    }
                }else{
                    [err, ticketData] = await to(TicketNumber.query().update({ status: 'booked', cancelledBy: '' }).whereIn('id', [checkStatus[i].ticket_number_booked_rel[0].ticketnumberid]).where('status', 'cancelled'));
                    // return badRequestError(res, {}, Message("PaymentFailed"));  
                }
            }else{
                await TicketBooked.query().update({ 'totalQuantity': knex.raw('?? - ' + 1 + '', ['totalQuantity']) }).where('id', checkStatus[i].id);
            }
            //check all ticket number status for changing ticket booked table status 
            let checkTicketNumberCount = await TicketNumber.query().count('id').where('ticketBookedId', checkStatus[i].id)
            .where(builder =>{
                builder.where('status', 'booked').orWhere('status', 'checkedIn')
            })
            .first().runAfter((result, builder) => {
                console.log(builder.toKnexQuery().toQuery())
                return result;
            });
            console.log(checkTicketNumberCount.count, 'count')
            if (checkTicketNumberCount.count < 1) {
                await TicketBooked.query()
                    .patch({
                        status: "cancelled"
                    })
                    .where({
                        userId: req.user.id,
                        id: checkStatus[i].id,
                    });
            }
            //update refund status and increase ticket quantity
            await TicketInfo.query().update({ 'totalQuantity': knex.raw('?? + ' + 1 + '', ['totalQuantity']) }).where('id', checkStatus[i].ticketId);
        }else{
            // return badRequestError(res, {}, Message("SomeError"));
        }
            const hostData = await User.query().select('id').where('id', req.user.id).first(); 
            const userData = await User.query().select('id', 'name', 'deviceType', 'deviceToken')
            .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser, userLoginDetail as webUser]')
                .modifyEager('androidUser', builder =>{
                    builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
                }) 
                .modifyEager('iosUser', builder =>{
                    builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
                })
                .modifyEager('webUser', builder =>{
                    builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')
                })
            .where('id', checkStatus[i].userId).first(); 
             //console.log(userData,'users');
            if(userData){
                if (userData.androidUser) {
                    let AndroideventCreate = await androidNotification.ticketCancelled(userData,hostData,checkStatus[i],checkEvent);
                }
                 if(userData.iosUser) {
                    let IOSeventCreate = await iosNotification.ticketCancelled(userData,hostData,checkStatus[i],checkEvent);
                }
                if(userData.webUser){
                    let webNotifi = await WebNotification.ticketCancelled(userData,hostData,checkStatus[i],checkEvent);
                }
            }
        
        }
       
    }
    let deletedEvent = await Event.query()
    .patch({
       isDeleted: true,isArchived: true
    })
    .where({
        id: data.id,
    });

  // let deletedEvent = await Event.query().deleteById(data.id);
   return okResponse(res, "", Message("eventDelete"));
    
}

/**
 * getEventsDates (calender event list)
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const getEventsDates = async (req, res) => {
   
    let todayDate = new Date();
    let EventListDates = await Event.query().skipUndefined().distinct('start').whereIn('userId', [req.user.id, req.user.createdBy])
        .where('end', '>', todayDate);

    if (!EventListDates || EventListDates == undefined || EventListDates == '') {
        return badRequestError(res, "", Message("eventNotFond"));
    }
    return okResponse(res, EventListDates, Message("eventList"));
}
/**
 * getEventDateDetails (calender event details)
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const getEventDateDetails = async (req, res) => {
   
    let date = req.body.date;
    let EventDateDetails = await Event.query().select('id', 'name', 'start', 'end').eager("[eventImages,venueEvents]").modifyEager('eventImages', builder => {
        builder.select('eventImage', 'isPrimary').first()
    }).modifyEager('venueEvents', builder => {
        builder.select('latitude', 'longitude', 'venueAddress').first()
    })
        .where(builder => {
            if (date)
                return builder.whereRaw('DATE(\"start\") >= \'' + date + '\' AND DATE(\"start\") <= \'' + date + '\'');
        })
    if (!EventDateDetails || EventDateDetails == undefined || EventDateDetails == '') {
        return badRequestError(res, "", Message("eventNotFond"));
    }
    return okResponse(res, EventDateDetails, Message("eventList"));
}

/**
 * UserEventDetail
 * @params req.body.property_id;
 * @return promise
 */
const getMoreEventDetail = async (req, res) => {
   
    let eventId = req.params.eventId;
    let isFavorite;

    if (req.params.auth) {
        if (req.params.auth && req.params.eventId && req.user.id) {
            let userCheckReview = await Review.query().whereIn('userId', [req.user.id, req.user.createdBy]);
            if (userCheckReview != '') {
                if (userCheckReview.userId = req.user.id) {
                    isReviewed = true;
                } else {
                    
                }
            } else {
                isReviewed = false;
            }
            let favData = await Favorite.query().where("userId", req.user.id).where("eventId", eventId);
            if (favData != '') {
                if (favData.userId = req.user.id) {
                    isFavorite = true;
                } else {
                    
                }
            } else {
                isFavorite = false;
            }
        }
    }
    let [err, event] = await to(Event.query().select().where('id', eventId).eager("[users as host,eventImages, venueEvents, eventChooseSubcategory as subCategoryId]").modifyEager('host', builder => {
        builder.select('id', 'name', 'profilePic')
    }).modifyEager('eventImages', builder => {
        builder.select('eventImage', 'isPrimary')
    }).modifyEager('subCategoryId', builder => {
        builder.select('categoryId', 'subCategoryId')
    }).first().modifyEager('venueEvents', builder => {
        builder.select('venueName', 'latitude', 'longitude', 'venueAddress').first()
    }));
    if (!event) {
        return errorResponse(res, "", Message("eventNotFond"));
    }
    let categoryId = event.subCategoryId[0].subCategoryId;
    

    let categoryData = await EventChooseSubcategory.query().distinct('subCategory:category.categoryName', 'subCategory.subCategoryName').joinRelation('subCategory.[category]').where('eventId', eventId);

    let venue;
  
    if (event.vanueId == 'undefined' || event.vanueId == '') {
        
        venue = await VenueNotReg.query().skipUndefined().select('venueName', 'venueAddress', 'latitude', 'longitude').where('eventId', req.params.id).first();

    } else {
       
        venue = await Venue.query().skipUndefined().select('venueName', 'venueAddress', 'latitude', 'longitude').where('eventId', req.params.id).first();
    }
   
    let reviewEvent = await Review.query().skipUndefined().select('id', 'reviewStar', 'reviewText', 'updated_at').where('eventId', eventId).eager("[users as reviewer]").modifyEager('reviewer', builder => {
        builder.select('id', 'name', 'profilePic')
    }).limit(3);

    event.isFavorite = isFavorite;
    event.venue = venue;
    event.categoryName = categoryData[0].categoryName;
    event.subCategories = categoryData;
    
    event.reviews = reviewEvent;
   
    delete event.subCategoryId
    if (err) {
        return badRequestError(res, "", Message("eventNotFond"))
    }
    return okResponse(res, event, Message("eventFond"));
}

/**
 * relatedEvent
 * @params req.body.property_id;
 * @return promise
 */

const relatedEvent = async (req, res) => {
    
    let eventId = req.params.eventId;

    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : 10;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);
    let todayDate = new Date();
    var str = req.query.subcategoryId; 
        var filkey = str.toString();
        var filter1 = filkey.split(',');
        

    let RelatedEvent = await Event.query().select("events.id","name","start","end","is_availability","userLikeCount as currentLikeCount", "userDisLikeCount as currentDisLikeCount")
     .skipUndefined()
     .joinRelation('[eventImages, venueEvents, eventChooseSubcategory]')
     .eager("[eventImages, venueEvents, eventChooseSubcategory, userLikes,favorite,eventOccurrence]")
     .modifyEager('eventImages', builder => {
        builder.select('eventImage', 'isPrimary')
    }).modifyEager('eventChooseSubcategory', builder => {
        builder.select(knex.raw('count(distinct("eventChooseSubcategory"."id")) as totalDataCount')).whereIn('subCategoryId',filter1)
        .andWhere('categoryId',req.query.categoryId).groupBy('eventId').orderBy(knex.raw('count(distinct("eventChooseSubcategory"."id"))'),'desc')
    }).modifyEager('venueEvents', builder => {
        builder.select('venueName', 'latitude', 'longitude', 'venueAddress', 'countryCode',"city","state", 'country')
    }).modifyEager('userLikes', builder => {
        builder.select('isLike', 'isDisLike')
        .where(builder => {
            if(req.user){
            builder.where("userId", req.user.id)
            }
        })
    }).modifyEager('favorite', builder => {
        builder.select('isFavorite')
        .where(builder => {
            if(req.user){
                builder.where("userId", req.user.id)
            }
        })
    }).modifyEager('eventOccurrence', builder => {
        builder.select('eventId', 'eventOccurrence', 'occurredOn')
       })
    .where('is_active',true)  
    .where('isDeleted',false)
    .where('isArchived',false)
    .where('events.id','!=', eventId)
    .andWhere('events.end','>=',todayDate)
    .whereIn('eventChooseSubcategory.subCategoryId',filter1)
    .andWhere('eventChooseSubcategory.categoryId',req.query.categoryId)
    .groupBy('eventChooseSubcategory.eventId','events.id')
    .orderBy(knex.raw('count(distinct("eventChooseSubcategory"."id"))'),'desc')
    .offset(offset).limit(limit)
     
     let filteredArr = [];
     for (let i = 0; i < RelatedEvent.length; i++) {
         let event_id = RelatedEvent[i].id;

         let eventsdate =[];
         var eventsdatess = [];
         var eventsdaily = [];
        
         for (let j=0;j<RelatedEvent[i].eventOccurrence.length;j++){
            //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
            let currentDate = moment().format('YYYY-MM-DD');
            if(RelatedEvent[i].eventOccurrence[j].eventOccurrence=='weekly'){
                   // console.log(getDays(currentDate,1));
               eventsdate = getDays(currentDate,RelatedEvent[i].eventOccurrence[j].occurredOn);
 
            } else if(RelatedEvent[i].eventOccurrence[j].eventOccurrence=='monthly'){
                //console.log(serachData[i].eventOccurrence[j].eventId)
               // console.log(serachData[i].eventOccurrence[j].occurredOn);
               var endOfMonth   = moment().endOf('month').format('DD');
               if(endOfMonth >= RelatedEvent[i].eventOccurrence[j].occurredOn){
                eventsdatess.push(RelatedEvent[i].eventOccurrence[j].occurredOn);
               }
                  //[1,2,3,4,5]
            } else if(RelatedEvent[i].eventOccurrence[j].eventOccurrence=='daily'){
                eventsdaily.push(RelatedEvent[i].eventOccurrence[j].occurredOn);
            }
         }
        
        //going user List
        //console.log(eventsdatess,'ee');
        let todayd = moment().format('DD');
        const found = eventsdatess.find(element => element >= todayd);
        let todayd22 = moment().format('YYYY-MM'); 
        if(found){
            var eventsdate1 = todayd22+'-'+found;
            eventsdate = moment(eventsdate1).format('YYYY-MM-DD')
        }
 
        var dcv = new Date();
        var nv = dcv.getDay()
        const foundDaily = eventsdaily.find(element => element >= nv);
        if(foundDaily){
            var currentDate = moment().format('YYYY-MM-DD');
        eventsdate = getDays(currentDate,foundDaily);
        console.log(eventsdate);
        }
        
        if(eventsdate.length>0){
        RelatedEvent[i].recuringDate = eventsdate;
        } else {
        RelatedEvent[i].recuringDate = ""; 
        }
        //console.log(serachData[i].recuringDate);
       
         //going user List
         let profilePic;
         RelatedEvent[i].GuestData = await TicketBooked.query().select("").eager('users as guestUser').modifyEager('guestUser', builder => {
             builder.select('profilePic', 'name').whereNot('profilePic', null)
         }).where('eventId', event_id).joinRelation('users').where('status', 'checkedIn'); //.whereNot('users.profilePic', null) 
     
         RelatedEvent[i].guestCount = await TicketBooked.query().count("userId").where('eventId', event_id).where('status', 'checkedIn');
     }
     filteredArr = RelatedEvent;
 
     let response = [],
         event_id = [],
         n = false,
         venulatlng = {},
         distance;
    
     //distance
     //if(req.query.latitude && req.query.longitude){
         let serachlatlong = {
             'lat': req.query.latitude,
             'lng': req.query.longitude
         }
         let miles = req.query.miles;
        
         filteredArr.forEach(eventLatLng => {
             venulatlng.lat = eventLatLng.venueEvents[0].latitude;
             venulatlng.lng = eventLatLng.venueEvents[0].longitude;
             n = latlong.nearby(serachlatlong, venulatlng, miles);
             //   returns the distance between two lat-long points
             if( (req.query.latitude && req.query.longitude) && (venulatlng.lat && venulatlng.lng) ){
                 distance = latlong.distance(serachlatlong, venulatlng);
             }else{
                 distance = 0;
             }
             eventLatLng.distance = distance;
             event_id = eventLatLng.id;
             
             response.push(eventLatLng);
             // if (n) response.push(eventLatLng); //old condition
             // else return;
         });
 
         if(response.length>0){
             if(req.query.latitude && req.query.longitude){
                 response.sort(function(a, b) { 
                     return a.distance - b.distance;
                 });
             }
             response.forEach((resSearch) => {
             
                 if (!resSearch.userLikes || resSearch.userLikes == null) {
                     resSearch.isLike = 0;
                 } else if (resSearch.userLikes.isLike == true) {
                     resSearch.isLike = 1;
                 } else if (resSearch.userLikes.isDisLike == true) {
                     resSearch.isLike = 2;
                 }
             })
         }


    return okResponse(res, response, Message("eventList"));
}

/**
 * getReview
 * @params req.body.property_id;
 * @return promise
 */
const getReview = async (req, res) => {
    let reviews = await Review.query().skipUndefined().select('id', 'reviewStar', 'reviewText', 'updated_at').where({
        id: req.query.id,
        eventId: req.params.eventId
    }).eager('[users as reviewer]').modifyEager('reviewer', builder => {
        builder.select('id', 'name', 'profilePic')
    });
    if (!reviews) {
        return notFoundError(Message("reviewNotFond"));
    }
    return okResponse(res, reviews, Message("reviewFond"));
}

/**r
 * Event IsAvailability Change Status
 * @param {stores the requested parameters} req.body.is_availability
 * @param {stores the requested parameters} req.params.userId
 * @param {stores the response parameters} res
 */
const eventIsAvailability = async (req, res) => {
   
    let data = req.body;

    let EventStatus = await Event.query()
        .patch({
            is_availability: data.is_availability
        })
        .where({
            id: data.id,
            userId: req.user.id
        });
    if(!EventStatus){
        return errorResponse(res, "", Message('SomeError')); 
    }

    return okResponse(res, [], "Event Status has been changed Successfully !");
};

/**
 * Edit Event ()
 * @params req.body;
 * @return promise
 */

const editEvent = async (req, res) => {
    let data = req.body;
    let id = parseInt(data.id)
    data.id = id
    data.userId = req.user.id;
    let ticket_info = [];
    let imageIds = [];

    // occurrence code
    if (data.occurredOn) {
        let occurredOn = JSON.parse(data.occurredOn);
        data.eventOccurrence = await occurredOn.map((d) => {
            return {
                eventOccurrence: data.eventOccurrenceType,
                occurredOn: d,
            }
        });
    }

    if (data.venueId) {
        let venue = await Venue.query().skipUndefined().where('id', data.venueId).first();
        data.venueEvents = [{
            'venueId': data.venueId,
            "eventId": id,
            'userId': req.user.id,
            'venueName': venue.venueName,
            'venueAddress': venue.venueAddress,
            'countryCode': venue.countryCode,
            'city': venue.city,
            'state': venue.state,
            'country': venue.country,
            'fullState':venue.fullState,
            'latitude': venue.latitude,
            'longitude': venue.longitude,
            'venueType': "regVenue"
        }]
        if (venue == '') {
            return notFoundError(res, "No Venue Found");
        } else {
            data.venueId = data.venueId
            delete data.nonRegisteredVenue
        }
    } else {
        delete data.venueId
        data.venueEvents = [{
            'userId': req.user.id,
            'venueName': data.venueName,
            "eventId": id,
            'venueAddress': data.venueAddress,
            'latitude': data.venueLatitude,
            'countryCode': data.countryCode,
            'city': data.city,
            'state': data.state,
            'country': data.country,
            'longitude': data.venueLongitude,
            'venueType': "notRegVenue"
        }]
    }

    // Images code
    if (req.files.images != undefined) {
       
        data.eventImages = await req.files.images.map((file) => {
            return {
                eventImage: file.location,
                eventId: id,
                isPrimary: false
            };
        });
    } else {
        delete data.eventImages
    }

    let telentImages;
    if(req.files.telentImages!=undefined){
        telentImages = await req.files.telentImages.map((file1) => {
           // console.log(file1.location,'rt');
             return {
                image :file1.location,
                imageType :"talents"
            }
        });
    }
    console.log(telentImages, 'telentImages')
    
    let sponserImages;
    if(req.files.sponserImages!=undefined){
        sponserImages = await req.files.sponserImages.map((file2) => {
            return {
                image :file2.location,
                imageType :"sponser"
            }
        });
    }
    console.log(sponserImages, 'sponserImages')
    let otherImageArr;
    if(telentImages!=undefined){
        otherImageArr = telentImages;
    }
    console.log(otherImageArr, 'otherImageArr telent')
    if(sponserImages!=undefined){
        otherImageArr = (telentImages!=undefined) ? [...telentImages, ...sponserImages] : sponserImages; 
    }
    console.log(otherImageArr, 'otherImageArr sponserImages')
    if(otherImageArr!=undefined){
        data.eventOtherImages = otherImageArr; 
    }
    
    console.log(otherImageArr, 'otherImageArr all')

    if (data.imageId && (data.imageId !== "" || data.imageId !== null)) {
        let [err, updateImage] = await to(GalleryImages.query().update({
            isPrimary: true
        }).where({ 'id': data.imageId }));

        let [errupdt, updtimg] = await to(GalleryImages.query().update({
            isPrimary: false
        }).whereNot({ 'id': data.imageId }).where('eventId', data.id));
    }
    //  else {
    //     let [errupdt, updtimg] = await to(GalleryImages.query().update({
    //         isPrimary: false
    //     }).where('eventId', data.id));
        
    // }
    
    //Delete other images
    let deleteOtherImage;
    if (data.talentImageIds) {
        deleteOtherImage = data.talentImageIds;
    }
    if (data.sponserImageIds) {
        deleteOtherImage = (deleteOtherImage) ? deleteOtherImage+','+data.sponserImageIds : data.sponserImageIds;
    }
    if(deleteOtherImage){
        let otherimageId = deleteOtherImage.split(",");
        await EventOtherImages.query().delete().whereIn('id', otherimageId);
    }

    data.ticket_info = ticket_info;
    delete data.sponserImageIds;
    delete data.talentImageIds;
    delete data.ticket_info;
    delete data.eventOccurrenceType;
    delete data.occurredOn;
    delete data.subCategoryId;
    delete data.categoryId;
    delete data.venueName;
    delete data.venueAddress;
    delete data.venueLatitude;
    delete data.venueLongitude;
    delete data.city;
    delete data.state;
   // delete data.countryCode;
    delete data.imageId;

    //event Delete
    if (data.imageIds) {
        let ids = data.imageIds;
        let imageId = ids.split(",");
        let deleteImages = await GalleryImages.query().delete().whereIn('id', imageId);
    }

    //Edit subvenue events
    if (data.subVenueEvent && data.subVenueEvent !== '') {
        data.subVenueEvent = JSON.parse(data.subVenueEvent)
       
    }

    // eventImages
    const options = {
        noDelete: ['eventImages', 'eventOtherImages']
    };


    if(data.hostAddress=='null'){
        data.hostAddress=null;
    }

    if(data.websiteUrl=='null'){
        data.websiteUrl=null;
    }

    if(data.otherWebsiteUrl=='null'){
        data.otherWebsiteUrl=null;
    }

    if(data.hostMobile=='null'){
        data.hostMobile=null;
    }
    
    let eventCreated = await Event.query().upsertGraph(data, options).returning('id');
    
    if (!eventCreated) {
        return badRequestError(res, '', ' err.message');
    }
    return okResponse(res, '', Message("eventUpdate"));
}
 
/**
 * UserEventDetail
 * @params req.body.property_id;
 * @return promise
 */

const getEventDetails = async (req, res) => { 
    let eventId = req.params.eventId;
    let [err, event] = await to(Event.query().select("id",'eventUrl',"name", "start", "end", "sellingStart", "eventType","paidType", "sellingEnd", "description2", "description", "ticketInfoURL", "eventHelpLine", "is_availability", "venueId","hostMobile","hostAddress","websiteUrl","otherWebsiteUrl","countryCode").where('id', eventId)
    .eager("[eventImages, eventChooseSubcategory as subCategoryId, eventOccurrence,subVenueEvent.[subVenues], eventOtherImages as telentImages, eventOtherImages as sponserImages]")
    .modifyEager('eventImages', builder => {
        builder.select( 'id','eventImage', 'isPrimary')
    })
    .modifyEager('telentImages', builder => {
        builder.select('id', 'image as eventImage', 'imageType').where('imageType', 'talents')
    })
    .modifyEager('sponserImages', builder => {
        builder.select('id', 'image as eventImage', 'imageType').where('imageType', 'sponser')
    })
    .modifyEager('subCategoryId', builder => {
        builder.select('id', 'categoryId', 'subCategoryId')
    }).first().modifyEager('eventOccurrence', builder => {
        builder.select("id", "eventOccurrence", "occurredOn")
    }));
    if (!event) {
        return errorResponse(res, "", Message("eventNotFond"));
    }
    let categoryId = event.subCategoryId[0].subCategoryId;
   
    let categoryData = await EventChooseSubcategory.query().distinct('subCategory:category.categoryName', 'subCategory:category.id as categoryId', 'subCategory.subCategoryName', 'subCategory.id as id').joinRelation('subCategory.[category]').where('eventId', eventId);

    let venue;
    if (event.vanueId == 'undefined' || event.vanueId == '') {
       
        event.isVenuReg = false;
        venue = await venueEvents.query().skipUndefined().select('id', 'venueName', 'venueAddress', 'city', 'state', 'countryCode', 'latitude', 'longitude').where('eventId', req.params.eventId).first();

    } else {
        
        event.isVenuReg = true;
        venue = await venueEvents.query().skipUndefined().select('venueId as id', 'venueName', 'venueAddress', 'latitude', 'state', 'city', 'countryCode', 'longitude').where('eventId', req.params.eventId).first();

    }
    if (event.ticketInfoURL == null && event.eventHelpLine == null) {
        event.isExternalTicket = false;
    } else {
        event.isExternalTicket = true;
    }
    if(event.eventOccurrence.length > 0){
    event.eventOccurrenceType = event.eventOccurrence[0].eventOccurrence;
    }
    event.venue = venue;
    event.categoryName = categoryData[0].categoryName;
    event.categoryId = categoryData[0].categoryId;
    event.subCategories = categoryData;
  
    delete event.subCategoryId
   
    if (err) {

        return badRequestError(res, "", Message("eventNotFond"))
    }
    return okResponse(res, event, Message("eventFond"));
}
const setPrimaryImage = async (req, res) => {
    let imageId = req.body.imageId;
    let [err, updateImage] = await to(GalleryImages.query().update({
        isPrimary: true
    }).where({ 'id': imageId }));
    if (err) {
        return badRequestError(res, "", "Something went wrong")
    }
    return okResponse(res, '', "Image set as primary");
}

// check custome url 
const checkCustomeUrl = async (req, res) => {
    let data = req.body;
    let event = await Event.query().select('eventUrl').where({ 'eventUrl': data.eventUrl }).first();
    if (event) {
        return badRequestError(res, "", "This url alredy exists")
    }
    return okResponse(res, '', "Url available");
}

//Paid Event Creation
const createPostEvent = async (req, res) => {
    let data = req.body;
    let ticketNumberArray = [];
    data.userId = req.user.id;
    let ticket_info = [];
    if (!data.name) {
        return badRequestError(res, "", "Please enter event Name");
    }

   

    //Category and SubCategories
    let subCategoryId1 = JSON.parse(data.subCategoryId);
    data.eventChooseSubcategory = await subCategoryId1.map((d) => {
        return {
            categoryId: data.categoryId,
            subCategoryId: d,
            userId: req.user.id
        }
    });

    // occurrence code
    if (data.occurredOn) {
        let occurredOn = JSON.parse(data.occurredOn);
        
        data.eventOccurrence = await occurredOn.map((d) => {
            return {
                eventOccurrence: data.eventOccurrenceType,
                occurredOn: d
            }
        });
    }

    if (data.venueId) {
        let venue = await Venue.query().skipUndefined().where('id', data.venueId).first();
        if (venue == '') {
            return notFoundError(res, "No Venue Found");
        } else {
            data.venueId = data.venueId
            delete data.nonRegisteredVenue
        }
        data.venueEvents = [{
            'venueId': data.venueId,
            'userId': req.user.id,
            'venueName': venue.venueName,
            'venueAddress': venue.venueAddress,
            'countryCode': venue.countryCode,
            'city': venue.city,
            'state': venue.state,
            'country': venue.country,
            'fullState':venue.fullState,
            'latitude': venue.latitude,
            'longitude': venue.longitude,
            'venueType': "regVenue"
        }]
        
    } else {
        delete data.venueId
        data.venueEvents = [{
            'userId': req.user.id,
            'venueName': data.venueName,
            'venueAddress': data.venueAddress,
            'latitude': data.venueLatitude,
            'countryCode': data.countryCode,
            'city': data.city,
            'state': data.state,
            'country': data.country,
            'longitude': data.venueLongitude,
            'venueType': "notRegVenue"
        }]
    }
    // ticket code
    // if (data.vip) {

    //VIP
    if (data.vipSeatings) {
        vipNormalTicket = JSON.parse(data.vipSeatings);
        //let vipticketnum;
        Array.prototype.push.apply(ticket_info, await Promise.all(vipNormalTicket.map(async (type) => {
           
            return {
                userId: req.user.id,
                ticketType: "vipNormal",
                ticketName: type.ticketName,
                pricePerTicket: type.pricePerTicket,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                description: type.description,
                cancellationChargeInPer: type.cancellationChargeInPer,
                sellingStartDate: type.sellingStartDate,
                sellingStartTime: type.sellingStartTime,
                sellingEndDate: type.sellingEndDate,
                sellingEndTime: type.sellingEndTime,
                discount:type.discount
                //ticketNumber: vipticketnum
            }
        })))
    }
    //Table/Seating
    if (data.tableSeatings) {
        vipTableSeatingTicket = JSON.parse(data.tableSeatings);
        let vipticketnumSeat;
        Array.prototype.push.apply(ticket_info, await Promise.all(vipTableSeatingTicket.map(async (type) => {
           
            return {
                userId: req.user.id,
                ticketType: "regularTableSeating",
                ticketName: type.ticketName,
               
                parsonPerTable: type.personPerTable,
                noOfTables: type.noOfTables,
                description: type.description,
               
                pricePerTicket: type.pricePerTicket,
                cancellationChargeInPer: type.cancellationChargeInPer,
                sellingStartDate: type.sellingStartDate,
                sellingStartTime: type.sellingStartTime,
                sellingEndDate: type.sellingEndDate,
                sellingEndTime: type.sellingEndTime,
                discount:type.discount
               
            }
        })))
    }
    //RSVP
    if (data.regularSeatings) {
        regularNormalTicket = JSON.parse(data.regularSeatings);
       
        Array.prototype.push.apply(ticket_info, await Promise.all(regularNormalTicket.map(async (type) => {
           
            return {
                userId: req.user.id,
                ticketType: "regularNormal",
                ticketName: type.ticketName,
               
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                description: type.description,
                discount:type.discount
               
            }
        })))
    }
    //Regular Paid
    if (data.regularPaid) {
        regularTableSeatingTicket = JSON.parse(data.regularPaid);
      
        Array.prototype.push.apply(ticket_info, await Promise.all(regularTableSeatingTicket.map(async (type) => {
           
            return {
                userId: req.user.id,
                ticketType: "regularPaid",
                ticketName: type.ticketName,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                pricePerTicket: type.pricePerTicket,
                description: type.description,
                cancellationChargeInPer: type.cancellationChargeInPer,
                sellingStartDate: type.sellingStartDate,
                sellingStartTime: type.sellingStartTime,
                sellingEndDate: type.sellingEndDate,
                sellingEndTime: type.sellingEndTime,
                discount:type.discount
               
            }
        })))
    }
  
    if (data.free) {
        freeNormalTicket = JSON.parse(data.free);
        
        Array.prototype.push.apply(ticket_info, await Promise.all(freeNormalTicket.map(async (type) => {
          
            return {
                userId: req.user.id,
                ticketType: "freeNormal",
                ticketName: type.ticketName,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                description: type.description,
                sellingStartDate: type.sellingStartDate,
                sellingStartTime: type.sellingStartTime,
                sellingEndDate: type.sellingEndDate,
                sellingEndTime: type.sellingEndTime,
                discount:type.discount
                
            }
        })))
    }

    // Images code
    data.eventImages = await req.files.images.map((file) => {
        return {
            eventImage: file.location,
            isPrimary: false
        };
    });
    if(data.eventImages){
        data.eventImages[0].isPrimary = true;
    }
    let telentImages;
    if(req.files.telentImages!=undefined){
        telentImages = await req.files.telentImages.map((file1) => {
           // console.log(file1.location,'rt');
             return {
                image :file1.location,
                imageType :"talents"
            }
        });
    }
    //console.log(telentImages, 'telentImages')
    
    let sponserImages;
    if(req.files.sponserImages!=undefined){
        sponserImages = await req.files.sponserImages.map((file2) => {
            return {
                image :file2.location,
                imageType :"sponser"
            }
        });
    }
   // console.log(sponserImages, 'sponserImages')
    let otherImageArr;
    if(telentImages!=undefined){
        otherImageArr = telentImages;
    }
    console.log(otherImageArr, 'otherImageArr telent')
    if(sponserImages!=undefined){
        otherImageArr = (telentImages!=undefined) ? [...telentImages, ...sponserImages] : sponserImages; 
    }
    console.log(otherImageArr, 'otherImageArr sponserImages')
    if(otherImageArr!=undefined){
        data.eventOtherImages = otherImageArr; 
    }
    
    console.log(otherImageArr, 'otherImageArr all')
    //subvenue Events
    var suvenuesData = data.subVenueEvent;
    delete data.subVenueEvent;

    data.ticket_info = ticket_info;
   
    delete data.eventOccurrenceType;
    delete data.occurredOn;
    delete data.subCategoryId;
    delete data.categoryId;
    delete data.vipSeatings;
    delete data.tableSeatings;
    delete data.regularSeatings;
    delete data.regularPaid;
    delete data.regularTableSeatings;
    delete data.free;
    delete data.venueName;
    delete data.venueAddress;
    delete data.venueLatitude;
    delete data.venueLongitude;
    delete data.city;
    delete data.state;
    delete data.paymentId;
    //delete data.countryCode;
    delete data.isEventPaid;
    data.eventCode = await randomFunction.randomInteger('event', 6);
    data.is_active = true;
    data.isDeleted = false;

    let couSt = await randomFunction.randomSubstring('', 3, 'coupan', 1);
   // console.log(couSt,'const');

   let couNo = await randomFunction.randomInteger('coupan', 3);
   console.log(couSt+couNo);

    data.coupan = [{
        'coupanCode':couSt+couNo
    }];
 
    let eventCreated = await Event.query().upsertGraph(data).returning("id");
    let categoryId = data.eventChooseSubcategory[0].categoryId;
    //catSubIds
    const catSubIds = await UserChooseSubcategory.query().select('userId').where('categoryId', categoryId);
    let UserIds = Array.prototype.map.call(catSubIds, s => s.userId)

    //fetch eventIds
    const getUserTokens = await User.query().select('id', 'name', 'deviceToken', 'isNotify', 'isRemind').whereIn('id', UserIds);

    const hostData = await User.query().select('id', 'name', 'deviceType', 'profilePic').where('id', req.user.id).first();
    if (!eventCreated) {
        return badRequestError(res, '', Message("someError"));
    }

    // Add subvenue detail with event Id
    if (suvenuesData && suvenuesData !== '') {
        var sbvenue = JSON.parse(suvenuesData)
        for (let x = 0; x < sbvenue.length; x++) {
            let updateSbvenue = await SubVenueEvents.query().patch({ status: "booked", eventId: eventCreated.id }).where({ venueId: sbvenue[x].venueId, subVenueId: sbvenue[x].subVenueId, userId: req.user.id, status: 'reserve' });
        }
       
    }
    //Notification Process
    
    if(data.paidType.toUpperCase()=='PAID'){
        if(data.amount > 0){
        var updateEvent = await Event.query().patch({ is_active:false}).where({ id:eventCreated.id});
        } else {
        var updateEvent = await Event.query().patch({ paidEventStatus: "success",is_active:true}).where({ id:eventCreated.id});
      }
    } else {
        var updateEvent = await Event.query().patch({ is_active:true}).where({ id:eventCreated.id});
    }
    
   
    return okResponse(res, {name: data.name, eventCode: data.eventCode, eventId:eventCreated.id}, Message("eventCreate"));
}

// for paid event 
const paidEventPaymentDone = async (req, res) => {
  
    let data = req.body;

    
        if(data.paymentId){
        console.log('sfnv');
       
        let [err, payment_confirm] = await to(stripe.PaymentConfirm(data.paymentId, data.payment_method));
        if (err) {
            return badRequestError(res, "", err);
        }
        let paymentStatus = payment_confirm.status
       
        if (paymentStatus == "succeeded") {
            data.paymentDetail = payment_confirm.id;
            data.MinPaidAmount = payment_confirm.amount;
            let payCreateDate = (payment_confirm.created.length < 13) ? parseInt(payment_confirm.created) * 1000 : payment_confirm.created;
            data.paymentDateTime = moment(new Date(payCreateDate)).format('YYYY-MM-DD HH:mm:ss')
            let invNo = await randomFunction.randomSubstring([], 4, 'invoice', 1);
            data.invoiceNo = invNo[0];

            let updateEvent = await Event.query().patch({ paidEventStatus: "success",is_active:true}).where({ id:data.eventId});
        } else {
            let updateEvent = await Event.query().patch({ paidEventStatus: "failed",is_active:false}).where({ id:data.eventId});
            return badRequestError(res, "", err);
        }
        delete data.paymentId;
    } else {
        delete data.paymentId; 
    }


 return okResponse(res, {eventId: data.eventId}, Message("eventCreate"));

}

//get host detail added on last event
const getHostDetail = async (req, res) => {
    let [err, event] = await to(Event.query().select("countryCode","hostMobile", "hostAddress", "websiteUrl","otherWebsiteUrl").where('userId', req.user.id).orderBy('id', 'desc').first());
    if (err || !event) {
        return errorResponse(res, "", Message("eventNotFond"));
    }
    return okResponse(res, event, "Detail successfully get");
}

//Get paid event price
const paidEventPrice = async (req, res) => {
    let data = req.body;
   
    if(!data.lastLoginTime){
        return errorResponse(res, "", "Last login time is required");
    }
    let lastLoginDate = moment(data.lastLoginTime).format('YYYY-MM-DD HH:mm:ss');
    let currentDateTime = moment(new Date());
     console.log(lastLoginDate);
    var duration = moment.duration(currentDateTime.diff(lastLoginDate));
    var days = Math.round(duration.asDays());
    let err, getPrice, userStatus, selectActiveRule;
    let getEventCount;
    if (parseInt(days) >= 14) {

        userStatus = 'Inactive';
    } else {
        userStatus = 'Active';

        selectActiveRule = await PaidEventPricing.query().select('ruleType').where('isActive', true).where('ruleForPartner', 'Active').first()
        .runAfter((result, builder)=>{
           // console.log(builder.toKnexQuery().toQuery())
            return result;
        });
        if (!selectActiveRule) {
            
            return errorResponse(res, "", Message("SomeError"));
        }
       
        if (selectActiveRule.ruleType == 'accountAge') {
           

            let accountCreatedAt = moment(req.user.created_at);
            var accountDuration = moment.duration(currentDateTime.diff(accountCreatedAt));
            var accountAge = Math.round(accountDuration.asDays());
           
        } else {
            getEventCount = await Event.query().count('id as eventCount').where('userId', req.user.id).first();
           
        }
    }
   
    [err, getPrice] = await to(PaidEventPricing.query().select('amount')
        .where('ruleForPartner', userStatus).where('isActive', true)
        .where(builder => {
            if (userStatus == 'Active') {
                if (selectActiveRule.ruleType == 'accountAge') {
                    if (accountAge >= 366) {
                       // builder.where('minValue', '>=', accountAge)
                    } else {
                        builder.where('minValue', '<=', accountAge).andWhere('maxValue', '>=', accountAge)
                    }
                } else {
                    if (getEventCount.eventCount >= 31) {
                       // builder.where('minValue', '>=', getEventCount.eventCount)
                    } else {
                        builder.where('minValue', '<=', getEventCount.eventCount).andWhere('maxValue', '>=', getEventCount.eventCount)
                    }
                }
            } else {
                if (days >= 365) {
                  //  builder.where('minValue', '>=', days)
                } else {
                    builder.where('minValue', '<=', days).andWhere('maxValue', '>=', days)
                }
            }
        }).first().runAfter((result, builder)=>{
           // console.log(builder.toKnexQuery().toQuery())
            return result;
        }))
      console.log(getPrice);
    if (err) {
        return errorResponse(res, "", Message("SomeError"));
    }
    return okResponse(res, getPrice, "Detail successfully get");
}


/**************************************************
 * @name contactListAttendees
 * @description Fetch all users and past attendees users
 * @param req.body.contactStatus  {status is the only required parameter}
 * @param res {stores the response object}
 **************************************************/

const contactListAttendees = async (req, res) => {
    let data = req.body;
    let page = (data.page) ? data.page : 1;
    let limit = data.limit ? data.limit : 10;
    let offset = data.offset ? data.offset : limit * (page - 1);
    var userDetail;
    var userDetail1;

    if(data.deviceType){
        var deviceType = data.deviceType;
    } else {
        var deviceType = '';
    }
   
    if (req.query.contactStatus == 1) {
        userDetail = await User.query().select("id", "name","profilePic", "email").where('userType', 'customer')
            .where(builder => {
                if (data.searchKey) {
                    return builder.where("name", "ilike", data.searchKey + "%");
                }
                if(data.searchLocation){
                   return builder.where('countryName', 'iLike', '%'+data.searchLocation+'%').orWhere('state', 'iLike', '%'+data.searchLocation+'%').orWhere('city', 'iLike', '%'+data.searchLocation+'%');
                  }
            })
            .orderBy('id', 'desc').offset(offset).limit(limit)
       
       userDetail1 = await User.query().countDistinct('id').where('userType', 'customer')
            .where(builder => {
                if (data.searchKey) {
                    return builder.where("name", "ilike", data.searchKey + "%");
                }
            })
            
    } else if (data.contactStatus == 2) {
        userDetail = await Event.query().select("events.id", "events.name", "events.start")
            .joinRelation('[ticketBooked.[users]]')
            .eager("[ticketBooked.[users]]")
            .modifyEager("ticketBooked", builder => {
                return builder.select("ticketBooked.userId").groupBy("ticketBooked.userId", "ticketBooked.eventId").where(builder => {
                });
            })
            .modifyEager("ticketBooked.users", builder => {
                return builder.select("users.name","users.profilePic", "users.email")
            })
            .where('events.userId', data.userId)
            .where(builder => {
                if (data.searchKey) {
                    return builder.where("ticketBooked:users.name", "ilike", data.searchKey + "%").orWhere("events.name", "ilike", data.searchKey + "%");
                }
            })
            .where(builder => {
                if (data.eventId) {
                    return builder.whereIn('events.id', data.eventId);
                }
            })
            .where(builder => {
                if (data.startDate && data.endDate) {
                    return builder.whereBetween('events.start', [data.startDate, data.endDate]);
                }
            })
            .groupBy("events.id", "events.userId")
            .offset(offset).limit(limit)

            userDetail1 = await Event.query().countDistinct("events.id")
            .joinRelation('[ticketBooked.[users]]')
            .eager("[ticketBooked.[users]]")
            .modifyEager("ticketBooked", builder => {
                return builder.select("ticketBooked.userId").groupBy("ticketBooked.userId", "ticketBooked.eventId").where(builder => {
                });
            })
            .modifyEager("ticketBooked.users", builder => {
                return builder.select("users.name","users.profilePic", "users.email")
            })
            .where('events.userId', data.userId)
            .where(builder => {
                if (data.searchKey) {
                    return builder.where("ticketBooked:users.name", "ilike", data.searchKey + "%");
                }
            })
            .where(builder => {
                if (data.eventId) {
                    return builder.whereIn('events.id', data.eventId);
                }
            })
            .where(builder => {
                if (data.startDate && data.endDate) {
                    return builder.whereBetween('events.start', [data.startDate, data.endDate]);
                }
            })
            .groupBy("events.id", "events.userId")
    }
   
    if(deviceType=='website'){
        return okResponse(res, {userDetail: userDetail, allDataCount: userDetail1}, "Contact list get successfully")
    } else {
        return okResponse(res, userDetail, "Contact list get successfully")
    }
};

const createStripeSessionId = async (req, res) => {
    let data = req.body;
   
    let getRes = await stripe.createSession(data);
    if(getRes.status==false){
        return errorResponse(res, "", getRes.data.message);
    }
   
    return okResponse(res, getRes.data, "Session id successfully get");
};
//add, update, get, delete
const stripeCard = async (req, res) => {
    let data = req.body;
    let customerId = req.user.customerId
    let getRes;
    let type = req.params.type;
    if(type == 1){
        getRes = await stripe.addCard(customerId,data);
       
    }else if(type ==2){
        getRes = await stripe.GetCardList(customerId);
    }else if(type ==3){
        getRes = await stripe.updateCard(customerId, data);
    }else if(type == 4){
        getRes = await stripe.DeleteCard(customerId,data);
    }
     
    if(getRes.status==false){
        return errorResponse(res, "", getRes.data.message);
    }
    
    return okResponse(res, getRes.data, "Successfully done");
};
module.exports = {
    CreateEvent,
    createPostEvent,
    paidEventPaymentDone,
    eventUpdate,
    GetEventDetail,
    GetEventList,
    Home,
    DeleteEvent,
    getEventsDates,
    getEventDateDetails,
    getMoreEventDetail,
    getReview,
    eventIsAvailability,
    editEvent,
    getEventDetails,
    setPrimaryImage,
    getHostDetail,
    paidEventPrice,
    contactListAttendees,
    createStripeSessionId,
    stripeCard,
    relatedEvent,
    checkCustomeUrl
}
