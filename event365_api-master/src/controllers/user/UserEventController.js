'use strict';
var moment = require('moment');
const Event = require('../../models/events');
const Favorite = require('../../models/favorite');
const User = require('../../models/users');
const UserLikes = require('../../models/userLikes');
const Category = require('../../models/category');
const Review = require('../../models/reviews');
const TicketBooked = require('../../models/ticketBooked');
const recentSearch = require('../../models/recentSearch');
const Venue = require('../../models/venue');
const VenueImages = require('../../models/venueImages');
const UserChooseSubcategory = require('../../models/userChooseSubCategory');
const EventChooseSubcategory = require('../../models/eventChooseSubcategory');
const TicketInfo = require('../../models/ticket_info');
const VenueEvents = require('../../models/venueEvents');
const Gallery = require('../../models/gallery');
const latlong = require('./../../middlewares/latlong');
const iosNotification = require('./../../middlewares/iosNotification');
const androidNotification = require('./../../middlewares/androidNotification');
const WebNotification = require('./../../middlewares/webNotification');

require('../../global_functions');
require('../../global_constants');
var knex = require('knex');
const {
    ref
} = require('objection');


/**
 * UserEventDetail
 * @params get type
 * @return promise
 */

const UserEventDetail = async (req, res) => {
    
    //console.log(req.params);
    let eventId = req.params.eventId;
   
     let eventUrl = req.params.eventUrl;
    
    let isFavorite;
    let isReviewed;
    let isTickect;
    let is_availability;
    let todayDate = new Date();
    let [err, event] = await to(Event.query().skipUndefined().select("events.id","events.paidType","events.name", "events.start", "events.end", "events.reviewCount as ratingCount ", "events.rating", "events.sellingStart", "events.sellingEnd", "events.is_availability", "events.description AS description", "events.description2  AS additional_info ", "events.ticketInfoURL", "events.eventHelpLine", 'hostMobile',"events.countryCode", 'hostAddress', 'websiteUrl','otherWebsiteUrl', 'eventCode')
    .mergeNaiveEager('[users as host.[contactVia], eventImages  venueEvents as address, eventChooseSubcategory as subCategoryId, ticket_info, eventOtherImages as telentImages, eventOtherImages as sponserImages,eventOccurrence]')
    .modifyEager('host', builder => {
        builder.select('id', 'name', 'profilePic','phoneNo','email','URL')
        .mergeNaiveEager('contactVia').modifyEager('contactVia', builder => {
            builder.distinct('contactVia')
          })
    }).modifyEager('eventImages', builder => {
        builder.select('eventImage')
    }).first()
    .modifyEager('telentImages', builder => {
        builder.select('id', 'image as eventImage', 'imageType').where('imageType', 'talents')
    })
    .modifyEager('sponserImages', builder => {
        builder.select('id', 'image as eventImage', 'imageType').where('imageType', 'sponser')
    })
    .modifyEager('address', builder => {
        builder.select('latitude', 'longitude', 'venueAddress','venueName','city','state','country').first()
    }).modifyEager('subCategoryId', builder => {
        builder.select('categoryId', 'subCategoryId')
    }).modifyEager('ticket_info', builder => {
        builder.select('ticketType', 'pricePerTable', 'pricePerTicket', 'ticketName', 'noOfTables', 'ticketNumber').where('isTicketDisabled', false).whereNot('ticketType','regularNormal')
    }).modifyEager('eventOccurrence', builder => {
        builder.select('eventId', 'eventOccurrence', 'occurredOn')
    })
    .where('id', eventId)
    .where((builder) => {
        if(eventUrl){
            builder.where('eventUrl',eventUrl)
        }
    }).where('is_active', true).where('isDeleted',false).where('isArchived',false).first());
    if (err) {
        consol
        return errorResponse(res, "", "Something went wrong, try again");
    }

    //console.log(event);

    if (!event) {
        return errorResponse(res, "", Message("eventNotFond"));
    }

    let eventsdate =[];
    var eventsdatess = [];
    var eventsdaily = [];
  
    for (let j=0;j<event.eventOccurrence.length;j++){
       //console.log(event.eventOccurrence[j].occurredOn,'eventoc');
       let currentDate = moment().format('YYYY-MM-DD');
      
       if(event.eventOccurrence[j].eventOccurrence=='weekly'){
              // console.log(getDays(currentDate,1));
          eventsdate = getDays(currentDate,event.eventOccurrence[j].occurredOn);

       } else if(event.eventOccurrence[j].eventOccurrence=='monthly'){
           //console.log(event.eventOccurrence[j].eventId)
          // console.log(event.eventOccurrence[j].occurredOn);
          var endOfMonth   = moment().endOf('month').format('DD');
          if(endOfMonth >= event.eventOccurrence[j].occurredOn){
           eventsdatess.push(event.eventOccurrence[j].occurredOn);
          }
             //[1,2,3,4,5]
       } else if(event.eventOccurrence[j].eventOccurrence=='daily'){

           eventsdaily.push(event.eventOccurrence[j].occurredOn);
       }
     
    }
   
   //going user List
   //console.log(eventsdatess,'ee');
   let todayd = moment().format('DD');
   const found = eventsdatess.find(element => element >= todayd);
   let todayd22 = moment().format('YYYY-MM'); 
   if(found){
       eventsdate = todayd22+'-'+found;
   }

   var dcv = new Date();
   var nv = dcv.getDay()
   console.log(eventsdaily);
   
   let foundDaily = eventsdaily.find(
    element => 
    { 
        if (element >= nv ) {
        console.log('hg');
		return element 
    }  
} 
   );

   if(!foundDaily){
    foundDaily = eventsdaily.find(
    element => 
    { 
        if (element < nv ) {
		return element 
    }  
} 
   );
}
   console.log(foundDaily,'f');
   if(foundDaily){
       var currentDate = moment().format('YYYY-MM-DD');
       eventsdate = getDays(currentDate,foundDaily);
    
   }
   
   //console.log(event.end,'end');
   //console.log(event.start,'start');
   var etimed= moment(event.end).utc().format('YYYY-MM-DD');
   var stimed =  moment(event.start).utc().format('YYYY-MM-DD');
     eventsdate =  moment(eventsdate).format('YYYY-MM-DD');
   //  console.log(stimed,'start')
   //console.log(etimed,'end');
  // console.log(eventsdate);
  if(stimed <= eventsdate && etimed >= eventsdate){
      if(eventsdate.length>0){
   event.recuringStartDate = eventsdate;
   
   event.recuringEndDate = moment(eventsdate).format('YYYY-MM-DD');
      } else {
        event.recuringStartDate = "";
   
        event.recuringEndDate = ""; 
      }
  } else {
    event.recuringStartDate = "";
   
    event.recuringEndDate = "";
  }

   // console.log(event.recuringEndDate,'ds');

    let getFreeTicket = await TicketInfo.query().select('id').where({
        'eventId': event.id,
        'ticketType': 'freeNormal'
    }).first();
    //let categoryId = (event.subCategoryId) ? event.subCategoryId[0].subCategoryId : 0;
    let categoryData = await EventChooseSubcategory.query().distinct('subCategory:category.categoryName', 'subCategory:category.id as categoryId', 'subCategory.subCategoryName', 'subCategory.id as id').joinRelation('subCategory.[category]').where('eventId', eventId);
    // max value and min value
    
    if (event.ticket_info.length > 0) {
        let allPriceArray = [];
        for (var i = 0; i < event.ticket_info.length; i++) {
            if (event.ticket_info[i].ticketType === 'regularTableSeating') {
                allPriceArray.push(event.ticket_info[i].pricePerTable);
            } else if (event.ticket_info[i].ticketType === 'vipTableSeating') {
                allPriceArray.push(event.ticket_info[i].pricePerTable);
            } else {
                allPriceArray.push(event.ticket_info[i].pricePerTicket);
            }
        }

        allPriceArray = allPriceArray.filter(function (el) {
            return el != null;
        });

        var maxValue = Math.max.apply(null, allPriceArray);
        var minValue = Math.min.apply(null, allPriceArray);

        let tickeInfo = {};
        if (+maxValue && +minValue) {
            tickeInfo = {
                maxValue: maxValue,
                MinValue: minValue
            }
        } else {
            tickeInfo = {
                maxValue: null,
                MinValue: null
            }
        }
        if (getFreeTicket) {
            tickeInfo.type = 'free';
            
        } else {
            tickeInfo.type = null;
            
        }
       
        event.ticket_info = tickeInfo;
    } else {
        event.ticket_info = null;
    }

    //RaletedEvent
    let relatedEvent = await Event.query().skipUndefined().select('id', 'name', 'start', 'end').limit(5).where('end', '>', todayDate).eager('[eventImages, venueEvents as address]').modifyEager('eventImages', builder => {
        builder.select('eventImage')
    }).modifyEager('address', builder => {
        builder.select('latitude', 'longitude', 'venueAddress','city','state','country')
    }).where('end', '>', todayDate).where('is_active',true).where('isDeleted',false).where('isArchived',false);

    let reviewEvent = await Review.query().skipUndefined().select('id', 'reviewStar', 'reviewText', 'updated_at').where('eventId', eventId).eager('[users as reviewer]').modifyEager('reviewer', builder => {
        builder.select('id', 'name', 'profilePic')
    }).limit(10);
    let venueImages = await Event.query().distinct('venueEvents:venueImages.venueImages').joinRelation('venueEvents.[venueImages]').where('eventId', eventId);
    if (req.params.auth) {
        
        if (req.params.auth && req.params.eventId && req.user.id) {
            // userReview check
            let userCheckReview = await Review.query().select().where("userId", req.user.id).andWhere("eventId", req.params.eventId);
            if (userCheckReview != '') {
                if (userCheckReview.userId = req.user.id) {
                    isReviewed = true;
                } else {
                   
                }
            } else {
                isReviewed = false;
            }
            //UserFav check
            let favData = await Favorite.query().where("userId", req.user.id).where("eventId", eventId);
            if (favData != '') {
                if (favData[0].isFavorite == true) {
                    isFavorite = true;
                } else {
                    isFavorite = false;
                }
            } else {
                isFavorite = false;
            }
        }
    }
    //is_availability check 
    let TicketInfoData = await TicketInfo.query().skipUndefined().select('totalQuantity', 'isTicketDisabled', 'ticketType', 'eventId', "id").where('eventId', eventId)
        .andWhere('totalQuantity', '>', 0).andWhere('isTicketDisabled', false);


    if (todayDate > event.sellingEnd && TicketInfoData == "") {
       
        is_availability = false;
    }
    //Current Ticket
    if (todayDate < event.sellingEnd && event.is_availability == true && TicketInfoData != "") {
       
        is_availability = true;
    }
    //Future Ticket
    else if (todayDate < event.sellingEnd && event.is_availability == false) {
        is_availability = false;
    } else if (TicketInfoData == "") {
       
        is_availability = false;
    } else {
       
        is_availability = true;
    }


    // isExternalTicket check
    if (event.ticketInfoURL == "" || event.ticketInfoURL == null) {
        isTickect = false;
    } else {
        isTickect = true;
    }

    delete event.subCategoryId;
    event.isReviewed = isReviewed;
    event.isFavorite = isFavorite;
    event.is_availability = is_availability;
    event.isExternalTicket = isTickect;
   
    if(categoryData.length > 0){
    event.categoryName = categoryData[0].categoryName;
    }
    event.subCategories = categoryData;
    event.venueGallery = venueImages;
    event.reviews = reviewEvent;
    event.relatedEvents = relatedEvent;
    event.isPhoneVerified = req.user ? req.user.isPhoneVerified : 0;
    event.userCountryCode = req.user ? req.user.countryCode : "";
    event.phoneNo = req.user ? req.user.phoneNo : "";
    event.userName = req.user ? req.user.name : "";
    event.userAddress = req.user ? req.user.address : "";
    event.city = req.user ? req.user.city : "";
    event.state = req.user ? req.user.state : "";
    event.zip = req.user ? req.user.zip : "";
    event.latitude = req.user ? req.user.latitude : "";
    event.longitude = req.user ? req.user.longitude : "";

    if (err) {
     
        return badRequestError(res, "", Message("eventNotFond"))
    }
    return okResponse(res, event, Message("eventFond"));
}




/**
 * myFavEvents (UpComing and past)
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const myFavEvents = async (req, res) => {
   
    let currentDate1 = new Date();
    let userId = req.user.id
    const AttendentEvent = await Event.query().select('events.id', 'name', 'start', 'end').mergeNaiveEager('[favorite, eventImages,venueEvents as address,eventOccurrence]')
        .modifyEager('eventImages', builder => {
            builder.select('eventImage')
        }).modifyEager('address', builder => {
            builder.select('latitude', 'longitude', 'venueAddress').first()
        }).modifyEager('favorite', builder => {
            builder.select('isFavorite').where("userId", req.user.id)
        }).modifyEager('eventOccurrence', builder => {
            builder.select('eventId', 'eventOccurrence', 'occurredOn')
           })
        .joinRelation('favorite').where('end', '<', currentDate1).where('isFavorite', true)
        .where('favorite.userId', req.user.id).where('is_active',true).where('isDeleted',false).where('isArchived',false).where('eventType',0);

        for (let i = 0; i < AttendentEvent.length; i++) {
            let event_id = AttendentEvent[i].id;
    
            let eventsdate =[];
            var eventsdatess = [];
            var eventsdaily = [];
           
            for (let j=0;j<AttendentEvent[i].eventOccurrence.length;j++){
               //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
               let currentDate = moment().format('YYYY-MM-DD');
               if(AttendentEvent[i].eventOccurrence[j].eventOccurrence=='weekly'){
                      // console.log(getDays(currentDate,1));
                  eventsdate = getDays(currentDate,AttendentEvent[i].eventOccurrence[j].occurredOn);
    
               } else if(AttendentEvent[i].eventOccurrence[j].eventOccurrence=='monthly'){
                   //console.log(serachData[i].eventOccurrence[j].eventId)
                  // console.log(serachData[i].eventOccurrence[j].occurredOn);
                  var endOfMonth   = moment().endOf('month').format('DD');
                  if(endOfMonth >= AttendentEvent[i].eventOccurrence[j].occurredOn){
                   eventsdatess.push(AttendentEvent[i].eventOccurrence[j].occurredOn);
                  }
                     //[1,2,3,4,5]
               } else if(AttendentEvent[i].eventOccurrence[j].eventOccurrence=='daily'){
                   eventsdaily.push(AttendentEvent[i].eventOccurrence[j].occurredOn);
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
           //console.log(eventsdate);
           }
           
          if(eventsdate.length>0){
           AttendentEvent[i].recuringStartDate = eventsdate;
           AttendentEvent[i].recuringEndDate = eventsdate;
          } else {
           AttendentEvent[i].recuringStartDate = "";  
           AttendentEvent[i].recuringEndDate = "";
          }
           //console.log(serachData[i].recuringDate);
        }
   
        const UpcommingEvent = await Event.query().select('events.id', 'name', 'start', 'end').eager('[eventImages,favorite, venueEvents  as address,eventOccurrence]').modifyEager('eventImages', builder => {
        builder.select('eventImage')
    }).modifyEager('address', builder => {
        builder.select('latitude', 'longitude', 'venueAddress').first()
    }).modifyEager('favorite', builder => {
        builder.select('isFavorite').where("userId", req.user.id)
    }).joinRelation('favorite')
    .modifyEager('eventOccurrence', builder => {
        builder.select('eventId', 'eventOccurrence', 'occurredOn')
       }).where('end', '>', currentDate1).where('isFavorite', true).where('favorite.userId', req.user.id).where('is_active',true).where('isDeleted',false).where('isArchived',false).where('eventType',0);
   
    for (let i = 0; i < UpcommingEvent.length; i++) {
        let event_id = UpcommingEvent[i].id;

        let eventsdate =[];
        var eventsdatess = [];
        var eventsdaily = [];
       
        for (let j=0;j<UpcommingEvent[i].eventOccurrence.length;j++){
           //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
           let currentDate = moment().format('YYYY-MM-DD');
           if(UpcommingEvent[i].eventOccurrence[j].eventOccurrence=='weekly'){
                  // console.log(getDays(currentDate,1));
              eventsdate = getDays(currentDate,UpcommingEvent[i].eventOccurrence[j].occurredOn);

           } else if(UpcommingEvent[i].eventOccurrence[j].eventOccurrence=='monthly'){
               //console.log(serachData[i].eventOccurrence[j].eventId)
              // console.log(serachData[i].eventOccurrence[j].occurredOn);
              var endOfMonth   = moment().endOf('month').format('DD');
              if(endOfMonth >= UpcommingEvent[i].eventOccurrence[j].occurredOn){
               eventsdatess.push(UpcommingEvent[i].eventOccurrence[j].occurredOn);
              }
                 //[1,2,3,4,5]
           } else if(UpcommingEvent[i].eventOccurrence[j].eventOccurrence=='daily'){
               eventsdaily.push(UpcommingEvent[i].eventOccurrence[j].occurredOn);
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
      // console.log(eventsdate);
       }
       
      if(eventsdate.length >0){
        UpcommingEvent[i].recuringStartDate = eventsdate;
        UpcommingEvent[i].recuringEndDate = eventsdate;
      } else {
        UpcommingEvent[i].recuringStartDate = "";  
        UpcommingEvent[i].recuringEndDate = "";
      }
       //console.log(serachData[i].recuringDate);
    }

    let returnData = {
        "comingSoon": UpcommingEvent,
        "past": AttendentEvent
    };
    return okResponse(res, {
        ...returnData,
    }, Message("eventList"));
}

/**
 * My Booked Event  (WishList, UpComing and Attendent)
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const myBookedEvent = async (req, res) => {
    
    let currentDate = new Date();

    const bookedEvents = await TicketBooked.query().select("eventId").where("userId", req.user.id)
    let eventIDs = Array.prototype.map.call(bookedEvents, s => s.eventId)
   
    const UpcommingEvent = await Event.query().select('id', 'name', 'start', 'end', 'eventHelpLine').whereIn("id", eventIDs).where('is_active',true).where('isDeleted',false).where('isArchived',false).where('start', '>', currentDate).orWhere({
        'start': currentDate
    }).mergeNaiveEager('[eventImages, venueEvents as address,eventOccurrence]').modifyEager('eventImages', builder => {
        builder.select('eventImage').limit(1)
    }).modifyEager('address', builder => {
        builder.select('latitude', 'longitude', 'venueAddress').first()
    }).modifyEager('eventOccurrence', builder => {
        builder.select('eventId', 'eventOccurrence', 'occurredOn')
    });

    for (let i = 0; i < UpcommingEvent.length; i++) {
        let event_id = UpcommingEvent[i].id;
    
        let eventsdate =[];
            var eventsdatess = [];
            var eventsdaily = [];
           
            for (let j=0;j<UpcommingEvent[i].eventOccurrence.length;j++){
               //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
               let currentDate1 = moment().format('YYYY-MM-DD');
               if(UpcommingEvent[i].eventOccurrence[j].eventOccurrence=='weekly'){
                      // console.log(getDays(currentDate,1));
                  eventsdate = getDays(currentDate1,UpcommingEvent[i].eventOccurrence[j].occurredOn);
    
               } else if(UpcommingEvent[i].eventOccurrence[j].eventOccurrence=='monthly'){
                   //console.log(serachData[i].eventOccurrence[j].eventId)
                  // console.log(serachData[i].eventOccurrence[j].occurredOn);
                  var endOfMonth   = moment().endOf('month').format('DD');
                  if(endOfMonth >= UpcommingEvent[i].eventOccurrence[j].occurredOn){
                   eventsdatess.push(UpcommingEvent[i].eventOccurrence[j].occurredOn);
                  }
                     //[1,2,3,4,5]
               } else if(UpcommingEvent[i].eventOccurrence[j].eventOccurrence=='daily'){
                   eventsdaily.push(UpcommingEvent[i].eventOccurrence[j].occurredOn);
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
               var currentDate1 = moment().format('YYYY-MM-DD');
           eventsdate = getDays(currentDate1,foundDaily);
           console.log(eventsdate);
           }
           
           if(eventsdate.length>0){
           UpcommingEvent[i].recuringDate = eventsdate;
           } else {
           UpcommingEvent[i].recuringDate = "";   
           }
           //console.log(serachData[i].recuringDate);
        
      }

    const AttendentEvent = await Event.query().select('id', 'name', 'start', 'end', 'eventHelpLine').where('is_active',true).where('isDeleted',false).where('isArchived',false).whereIn("id", eventIDs).where('start', '<', currentDate).mergeNaiveEager('[eventImages, venueEvents as address,eventOccurrence]').modifyEager('eventImages', builder => {
        builder.select('eventImage').limit(1)
    }).modifyEager('address', builder => {
        builder.select('latitude', 'longitude', 'venueAddress').first()
    }).modifyEager('eventOccurrence', builder => {
        builder.select('eventId', 'eventOccurrence', 'occurredOn')
    });

    for (let i = 0; i < AttendentEvent.length; i++) {
        let event_id = AttendentEvent[i].id;
    
        let eventsdate =[];
            var eventsdatess = [];
            var eventsdaily = [];
           
            for (let j=0;j<AttendentEvent[i].eventOccurrence.length;j++){
               //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
               let currentDate1 = moment().format('YYYY-MM-DD');
               if(AttendentEvent[i].eventOccurrence[j].eventOccurrence=='weekly'){
                      // console.log(getDays(currentDate,1));
                  eventsdate = getDays(currentDate1,AttendentEvent[i].eventOccurrence[j].occurredOn);
    
               } else if(AttendentEvent[i].eventOccurrence[j].eventOccurrence=='monthly'){
                   //console.log(serachData[i].eventOccurrence[j].eventId)
                  // console.log(serachData[i].eventOccurrence[j].occurredOn);
                  var endOfMonth   = moment().endOf('month').format('DD');
                  if(endOfMonth >= AttendentEvent[i].eventOccurrence[j].occurredOn){
                   eventsdatess.push(AttendentEvent[i].eventOccurrence[j].occurredOn);
                  }
                     //[1,2,3,4,5]
               } else if(AttendentEvent[i].eventOccurrence[j].eventOccurrence=='daily'){
                   eventsdaily.push(AttendentEvent[i].eventOccurrence[j].occurredOn);
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
               var currentDate1 = moment().format('YYYY-MM-DD');
           eventsdate = getDays(currentDate1,foundDaily);
           console.log(eventsdate);
           }
           
           if(eventsdate.length>0){
            AttendentEvent[i].recuringDate = eventsdate;
           } else {
            AttendentEvent[i].recuringDate = "";   
           }
           //console.log(serachData[i].recuringDate);
        
      }
    if (!UpcommingEvent || !AttendentEvent) {
        return notFoundError("no event found");
    }
    let returnData = {
        "recommendData": UpcommingEvent,
        "attendentEvent": AttendentEvent
    };
    return okResponse(res, {
        ...returnData,
    }, "Event List successfully");
}


/**
 * All Event List  ()
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

 const allEventList = async (req, res) => {
    let data = req.body;
    let todayDate = new Date();
    let serachData = "";
    let filterWithStartDate = (data.filterWithStartDate) ? new Date(data.filterWithStartDate).getTime() : "";
     serachData = await Event.query().distinct("events.id", "events.name" , knex.raw("to_char(\"events\".\"start\", 'YYYY-MM-DD') as startDate"))
        .leftJoinRelation('[venueEvents as address]')
        .mergeNaiveEager('[venueEvents as address]')
        .modifyEager('address', builder => {
            builder.select('latitude', 'longitude')
        })
        .where('end', '>=', todayDate).where('is_active',true).where('isDeleted',false).where('isArchived',false).where('eventType',0)

       
    let selectedDate = [];
    let otherDate = [];
    let filteredArr = [];
    for (let i = 0; i < serachData.length; i++) {
        let event_id = serachData[i].id;
      
       
        if(filterWithStartDate){
           
            if(filterWithStartDate == new Date(serachData[i].startdate).getTime()){
              
                selectedDate.push(serachData[i]);  
            }else{

                otherDate.push(serachData[i]);
            }
        }else{

               otherDate.push(serachData[i]);
        }
    }
    filteredArr = (selectedDate.length >0 || otherDate.length > 0) ? [...selectedDate, ...otherDate] : [];

    //distance
    let serachlatlong = {
        'lat': req.body.latitude,
        'lng': req.body.longitude
    }
    let miles = req.body.miles;
   
    let response = [],
        event_id = [],
        n = false,
        venulatlng = {},
        distance;
  
    filteredArr.forEach(eventLatLng => {
        venulatlng.lat = eventLatLng.address[0].latitude;
        venulatlng.lng = eventLatLng.address[0].longitude;
        n = latlong.nearby(serachlatlong, venulatlng, miles);
        //   returns the distance between two lat-long points
        distance = latlong.distance(serachlatlong, venulatlng);
        
        event_id = eventLatLng.id;
        if (n) response.push(eventLatLng);
        else return;
    });
  

    if (!response || response == '') {
       
        return okResponse(res, response, Message("eventNotFond"));
    }
   
    //final Response
    return okResponse(res, response, Message("eventFond"));    
}

/**
 * Filter (Near by Event)
 * @params req.body
 * @return promise
 */

const NearBy = async (req, res) => {
 
    let data = req.body;
    let serachData = "";
    let GuestData = "";
    let guestCount;
    let userLikesCount;
    let userDisLikeCount;
    let todayDate = new Date();
    let filterWithStartDate = (data.filterWithStartDate) ? new Date(data.filterWithStartDate).getTime() : "";
    //Serach filter
    
    serachData = await Event.query().distinct("events.id","events.eventUrl","events.name","events.is_availability" ,"events.start", "events.end", "events.userLikeCount as currentLikeCount", "events.userDisLikeCount as currentDisLikeCount", knex.raw("to_char(\"events\".\"start\", 'YYYY-MM-DD') as startDate"))
        .leftJoinRelation('[ticket_info, venueEvents as address, eventChooseSubcategory]')
        .mergeNaiveEager('[users as host, ticket_info,eventImages,  venueEvents as address, eventChooseSubcategory.[category,subcategory], userLikes,favorite,eventOccurrence]')
        .modifyEager('ticket_info', builder => {
            builder.select('pricePerTicket')
        }).modifyEager('eventImages', builder => {
            builder.select('eventImage')
        }).modifyEager('host', builder => {
            builder.select("id", "name")
        }).modifyEager('eventChooseSubcategory', builder => {
            builder.select("categoryId", "subCategoryId")
            .eager('[category , subCategory]')
           .modifyEager('category', builder =>{
            builder.select("categoryName")
           })
           .modifyEager('subCategory', builder =>{
            builder.select("subCategoryName")
           })
        }).modifyEager('address', builder => {
            builder.select('latitude', 'longitude', 'venueAddress','countryCode',"city","state", 'country')
        }).modifyEager('userLikes', builder => {
            builder.select('isLike', 'isDisLike').where("userId", req.user.id)
        }).modifyEager('favorite', builder => {
            builder.select('isFavorite').where("userId", req.user.id)
        }).modifyEager('eventOccurrence', builder => {
            builder.select('eventId', 'eventOccurrence', 'occurredOn')
        })
        .orderBy('events.start', 'asc')
        .where('is_availability', true)
        .where('is_active', true)
        .where('isDeleted',false)
        .where('isArchived',false)
        .andWhere('end', '>=', todayDate).where((builder) => {
            if(data.keyword){
                builder.where('name', 'ilike' ,'%'+ data.keyword+ '%').orWhere('eventCode', 'ilike' ,'%'+ data.keyword+ '%')
            }
            if(!data.keyword){
                builder.where('eventType',0)
            }
            if (data.categoryId) {
               
                builder.where(function () {
                    this.where("eventChooseSubcategory.categoryId", data.categoryId);
                })
            }
       
            if (data.subCategoryId) {
              
                builder.where(function () {
                    this.whereIn("eventChooseSubcategory.subCategoryId", data.subCategoryId);
                })
            }
            if (data.startDate && data.endDate) {
                if(filterWithStartDate){
                    builder.whereRaw('((DATE(\"start\") <= \'' + data.startDate + '\' AND DATE(\"end\") >= \'' + data.startDate + '\')  OR (DATE(\"start\") BETWEEN \'' + data.startDate + '\' AND \'' + data.endDate + '\') )');
                }else{
                    builder.whereRaw('((DATE(\"start\") <= \'' + data.startDate + '\' AND DATE(\"end\") >= \'' + data.startDate + '\') OR (DATE(\"start\") <= \'' + data.endDate + '\' AND DATE(\"end\") >= \'' + data.endDate + '\') OR (DATE(\"start\") BETWEEN \'' + data.startDate + '\' AND \'' + data.endDate + '\') )');
                }
               
            }
            if (data.startDate && data.endDate === "") {
               
                builder.whereRaw('((DATE(\"start\") = \'' + data.startDate + '\') OR (DATE(\"start\") < \'' + data.startDate + '\' AND DATE(\"end\") >= \'' + data.startDate + '\'))');
            }
            if (data.cost) {
                
                //New condition
                builder.where(function () {
                   
                    this.where("ticket_info.pricePerTicket", '<=', data.cost);
                    this.orWhereNull("ticket_info.pricePerTicket");
                })
               
            }
        }).orderBy('events.start', 'desc').runAfter( (result, builder) => {
            //console.log(builder.toKnexQuery().toQuery())
            return result;
        });
   
    let selectedDate = [];
    let otherDate = [];
    let filteredArr = [];
    for (let i = 0; i < serachData.length; i++) {
        let event_id = serachData[i].id;
         let eventsdate =[];
         var eventsdatess = [];
         var eventsdaily = [];
        
         for (let j=0;j<serachData[i].eventOccurrence.length;j++){
            //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
            let currentDate = moment().format('YYYY-MM-DD'); 
            if(serachData[i].eventOccurrence[j].eventOccurrence=='weekly'){
                   // console.log(getDays(currentDate,1));
               eventsdate = getDays(currentDate,serachData[i].eventOccurrence[j].occurredOn);

            } else if(serachData[i].eventOccurrence[j].eventOccurrence=='monthly'){
                //console.log(serachData[i].eventOccurrence[j].eventId)
               // console.log(serachData[i].eventOccurrence[j].occurredOn);
               var endOfMonth   = moment().endOf('month').format('DD');
               if(endOfMonth >= serachData[i].eventOccurrence[j].occurredOn){
                eventsdatess.push(serachData[i].eventOccurrence[j].occurredOn);
               }
                  //[1,2,3,4,5]
            } else if(serachData[i].eventOccurrence[j].eventOccurrence=='daily'){
                eventsdaily.push(serachData[i].eventOccurrence[j].occurredOn);
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
        let foundDaily = eventsdaily.find(
            element => 
            { 
                if (element >= nv ) {
                console.log('hg');
                return element 
            }  
        } 
           );
        
           if(!foundDaily){
            foundDaily = eventsdaily.find(
            element => 
            { 
                if (element < nv ) {
                return element 
            }  
        } 
           );
        }
           console.log(foundDaily,'f');
        if(foundDaily){
            var currentDate = moment().format('YYYY-MM-DD');
            eventsdate = getDays(currentDate,foundDaily);
       // console.log(eventsdate);
        }
        
        if(eventsdate.length > 0){
            serachData[i].recuringDate = eventsdate;
           } else {
            serachData[i].recuringDate = "";  
           }
        //console.log(serachData[i].recuringDate);
       
        let profilePic;
        serachData[i].GuestData = await TicketBooked.query().select("").eager('users as guestUser').modifyEager('guestUser', builder => {
            builder.select('profilePic', 'name').whereNot('profilePic', null)
        }).where('eventId', event_id).joinRelation('users').where('status', 'checkedIn'); //.whereNot('users.profilePic', null) 
       
        //going user count 
        serachData[i].guestCount = await TicketBooked.query().count("userId").where('eventId', event_id).where('status', 'checkedIn');
        if(filterWithStartDate){
           
            if(filterWithStartDate == new Date(serachData[i].startdate).getTime()){
                
                selectedDate.push(serachData[i]);  
            }else{

                otherDate.push(serachData[i]);
            }
        }else{

               otherDate.push(serachData[i]);
        }
    }
    filteredArr = (selectedDate.length >0 || otherDate.length > 0) ? [...selectedDate, ...otherDate] : [];

    //distance
    let serachlatlong = {
        'lat': req.body.latitude,
        'lng': req.body.longitude
    }
    let miles = req.body.miles;
    
    let response = [],
        event_id = [],
        n = false,
        venulatlng = {},
        distance;
   
    filteredArr.forEach(eventLatLng => {
        if(eventLatLng.address.length > 0){
        venulatlng.lat = eventLatLng.address[0].latitude;
        venulatlng.lng = eventLatLng.address[0].longitude;
        }
        n = latlong.nearby(serachlatlong, venulatlng, miles);
        //   returns the distance between two lat-long points

        distance = latlong.distance(serachlatlong, venulatlng);
        if(req.body.latitude!='' && req.body.longitude!=''){
            eventLatLng.distance = distance;
            } else {
            eventLatLng.distance = 0;
            }
        event_id = eventLatLng.id;
        
        if(req.body.latitude!='' && req.body.longitude!=''){
        if (n) response.push(eventLatLng);
        else return;
        } else {
        response.push(eventLatLng);
        }
    });
    //console.log(response, 'response');
    let category = [];
    let category1 =  await EventChooseSubcategory.query().select('categoryId')
         .innerJoinRelation('[category]')
         .eager('category')
         .modifyEager('category', builder => {
             builder.select('id', 'categoryName','categoryImage','isActive','created_at','updated_at','searchCount').where('isActive', true).orderBy('searchCount','DESC')
         }).where('category.isActive',true).groupBy('categoryId','category.searchCount').orderBy('category.searchCount','DESC').runAfter((result, builder)=>{
            //console.log(builder.toKnexQuery().toQuery())
            return result;
        });
        //console.log(category.length);
           //let CategoryData = await Category.query().skipUndefined().select().orderBy('created_at', 'desc');
           for(let i=0;i < category1.length; i++){
              // console.log(category);
               for(let j=0;j< category1[i].category.length;j++){
                   //console.log(category1[i].category[j]);
                  let categoryer = category1[i].category[j];
                  category.push(categoryer);
               }
           }

    
    response.forEach((resSearch) => {
        
         //delete resSearch.eventChooseSubcategory;
         delete resSearch.ticket_info;
    })
    //if response empty
  
    if (!response || response == '') {
        response = {
            "category": category,
            "eventList": [],
            
        }
      
        return okResponse(res, response, Message("eventNotFond"));
    }
    //With Auth Users response
  
    response.forEach((resSearch) => {
      
        if (!resSearch.userLikes || resSearch.userLikes == null) {
            resSearch.isLike = 0;
        } else if (resSearch.userLikes.isLike == true) {
            resSearch.isLike = 1;
        } else if (resSearch.userLikes.isDisLike == true) {
            resSearch.isLike = 2;
        }
    })
    response = {
        "category": category,
        "eventList": response
        
    }
   
    //final Response
    return okResponse(res, response, Message("eventFond"));
}

function getDays(d,y) {
    d = new Date(d); 
    
    var day = d.getDay()
    //diff = d.setDate(d.getDate() - day + (day == 0 ? -6:y)); // adjust when day is sunday
    if(day==y){
        console.log(d,'dfjg');
        return moment().format('YYYY-MM-DD');
    } else {
       d.setDate(d.getDate() + (((y + 7 - d.getDay()) % 7) || 7));
        console.log(d,'hb');
        return moment(d).format('YYYY-MM-DD');
    }
  }

/**
 * Filter (Near by Event)
 * @params req.body
 * @return promise
 */

 const FeatureEvents = async (req, res) => {
 
    let data = req.body;
    let serachData = "";
    let GuestData = "";
    let guestCount;
    let userLikesCount;
    let userDisLikeCount;
    let todayDate = new Date();
    let filterWithStartDate = (data.filterWithStartDate) ? new Date(data.filterWithStartDate).getTime() : "";
    let userId = (req.user!=undefined) ? req.user.id : 0;
    
    //Serach filter
   
    serachData = Event.query().distinct("events.id","events.eventUrl","events.priority","events.name", "events.start", "events.end", "events.userLikeCount as currentLikeCount", "events.userDisLikeCount as currentDisLikeCount", knex.raw("to_char(\"events\".\"start\", 'YYYY-MM-DD') as startDate"))
        .leftJoinRelation('[ticket_info, venueEvents as address, eventChooseSubcategory]')
        .mergeNaiveEager('[users as host, ticket_info,eventImages,  venueEvents as address, eventChooseSubcategory.[category,subcategory], userLikes,favorite,eventOccurrence]')
        .modifyEager('ticket_info', builder => {
            builder.select('pricePerTicket')
        }).modifyEager('eventImages', builder => {
            builder.select('eventImage')
        }).modifyEager('host', builder => {
            builder.select("id", "name")
        }).modifyEager('eventChooseSubcategory', builder => {
            builder.select("categoryId", "subCategoryId")
            .eager('[category , subCategory]')
            .modifyEager('category', builder =>{
             builder.select("categoryName")
            })
            .modifyEager('subCategory', builder =>{
             builder.select("subCategoryName")
            })
        }).modifyEager('address', builder => {
            builder.select('latitude', 'longitude', 'venueAddress','countryCode',"city","state", 'country')
        }).modifyEager('eventOccurrence', builder => {
            builder.select('eventId', 'eventOccurrence', 'occurredOn')
        })
        if(userId!=0){
          serachData.modifyEager('userLikes', builder => {
            builder.select('isLike', 'isDisLike').where("userId", req.user.id)
          });
        }
        if(userId!=0){
            serachData.modifyEager('favorite', builder => {
              builder.select('isFavorite').where("userId", req.user.id)
            });
         }
        serachData.where('isHighLighted', true).where('is_active',true).where('isDeleted',false).where('isArchived',false)
        .andWhere('end', '>=', todayDate).where((builder) => {
            if(data.keyword){
                builder.where('name', 'ilike' ,'%'+ data.keyword+ '%').orWhere('eventCode', 'ilike' ,'%'+ data.keyword+ '%')
            }
            if(!data.keyword){
                builder.where('eventType',0)
            }
            if (data.categoryId) {
                
                builder.where(function () {
                    this.where("eventChooseSubcategory.categoryId", data.categoryId);
                })
            }
            if (data.subCategoryId) {
                
               
                builder.where(function () {
                    this.whereIn("eventChooseSubcategory.subCategoryId", data.subCategoryId);
                })
            }
            if (data.startDate && data.endDate) {
                if(filterWithStartDate){
                    builder.whereRaw('((DATE(\"start\") <= \'' + data.startDate + '\' AND DATE(\"end\") >= \'' + data.startDate + '\')  OR (DATE(\"start\") BETWEEN \'' + data.startDate + '\' AND \'' + data.endDate + '\') )');
                }else{
                    builder.whereRaw('((DATE(\"start\") <= \'' + data.startDate + '\' AND DATE(\"end\") >= \'' + data.startDate + '\') OR (DATE(\"start\") <= \'' + data.endDate + '\' AND DATE(\"end\") >= \'' + data.endDate + '\') OR (DATE(\"start\") BETWEEN \'' + data.startDate + '\' AND \'' + data.endDate + '\') )');
                }
            }
            if (data.startDate && data.endDate === "") {
               
                builder.whereRaw('((DATE(\"start\") = \'' + data.startDate + '\') OR (DATE(\"start\") < \'' + data.startDate + '\' AND DATE(\"end\") >= \'' + data.startDate + '\'))');
            }
            if (data.cost) {
                
                //New condition
                builder.where(function () {
                    
                    this.where("ticket_info.pricePerTicket", '<=', data.cost);
                    this.orWhereNull("ticket_info.pricePerTicket");
                })
            }
        }).orderBy('events.priority','asc').orderBy('events.start', 'asc')
       
   
    serachData = await serachData;
    let selectedDate = [];
    let otherDate = [];
    let filteredArr = [];
    for (let i = 0; i < serachData.length; i++) {
        let event_id = serachData[i].id;

        let eventsdate =[];
        var eventsdatess = [];
        var eventsdaily = [];
       
        for (let j=0;j<serachData[i].eventOccurrence.length;j++){
           //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
           let currentDate = moment().format('YYYY-MM-DD');
           if(serachData[i].eventOccurrence[j].eventOccurrence=='weekly'){
                  // console.log(getDays(currentDate,1));
              eventsdate = getDays(currentDate,serachData[i].eventOccurrence[j].occurredOn);

           } else if(serachData[i].eventOccurrence[j].eventOccurrence=='monthly'){
               //console.log(serachData[i].eventOccurrence[j].eventId)
              // console.log(serachData[i].eventOccurrence[j].occurredOn);
              var endOfMonth   = moment().endOf('month').format('DD');
              if(endOfMonth >= serachData[i].eventOccurrence[j].occurredOn){
               eventsdatess.push(serachData[i].eventOccurrence[j].occurredOn);
              }
                 //[1,2,3,4,5]
           } else if(serachData[i].eventOccurrence[j].eventOccurrence=='daily'){
               eventsdaily.push(serachData[i].eventOccurrence[j].occurredOn);
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
       let foundDaily = eventsdaily.find(
        element => 
        { 
            if (element >= nv ) {
            console.log('hg');
            return element 
        }  
    } 
       );
    
       if(!foundDaily){
        foundDaily = eventsdaily.find(
        element => 
        { 
            if (element < nv ) {
            return element 
        }  
    } 
       );
    }
       console.log(foundDaily,'f');
       if(foundDaily){
           var currentDate = moment().format('YYYY-MM-DD');
       eventsdate = getDays(currentDate,foundDaily);
       //console.log(eventsdate);
       }
       

       if(eventsdate.length > 0){
        serachData[i].recuringDate = eventsdate;
       } else {
        serachData[i].recuringDate = "";   
       }
       //console.log(serachData[i].recuringDate);
       
        //going user List
        let profilePic;
        serachData[i].GuestData = await TicketBooked.query().select("").eager('users as guestUser').modifyEager('guestUser', builder => {
            builder.select('profilePic').whereNot('profilePic', null)
        }).where('eventId', event_id).joinRelation('users').whereNot('users.profilePic', null).where('status', 'checkedIn');
        
        //going user count 
        serachData[i].guestCount = await TicketBooked.query().count("userId").where('eventId', event_id).where('status', 'checkedIn');
        if(filterWithStartDate){
           
            if(filterWithStartDate == new Date(serachData[i].startdate).getTime()){
               
                selectedDate.push(serachData[i]);  
            }else{
                otherDate.push(serachData[i]);
            }
        }else{
               otherDate.push(serachData[i]);
        }
    }
    filteredArr = (selectedDate.length >0 || otherDate.length > 0) ? [...selectedDate, ...otherDate] : [];
    //distance
    let serachlatlong = {
        'lat': req.body.latitude,
        'lng': req.body.longitude
    }
    let miles = req.body.miles;
  
    let response = [],
        event_id = [],
        n = false,
        venulatlng = {},
        distance;
   
    filteredArr.forEach(eventLatLng => {
        if(eventLatLng.address.length > 0){
        venulatlng.lat = eventLatLng.address[0].latitude;
        venulatlng.lng = eventLatLng.address[0].longitude;
        }
        n = latlong.nearby(serachlatlong, venulatlng, miles);
        //   returns the distance between two lat-long points
        distance = latlong.distance(serachlatlong, venulatlng);
        eventLatLng.distance = distance;
        event_id = eventLatLng.id;
        
        response.push(eventLatLng);
    });
    response.forEach((resSearch) => {
    
       // delete resSearch.eventChooseSubcategory;
        delete resSearch.ticket_info;
    })
    //category list
    let category = await Category.query();
    //if response empty
    if (!response || response == '') {
        response = {
            "category": category,
            "eventList": [],
        }
     
        return okResponse(res, response, Message("eventNotFond"));
    }
    //With Auth Users response
   
    response.forEach((resSearch) => {
      
       
        if (!resSearch.userLikes || resSearch.userLikes == null) {
            resSearch.isLike = 0;
        } else if (resSearch.userLikes.isLike == true) {
            resSearch.isLike = 1;
        } else if (resSearch.userLikes.isDisLike == true) {
            resSearch.isLike = 2;
        }
    })
    response = {
        "category": category,
        "eventList": response
    }
   
    //final Response
    return okResponse(res, response, Message("eventFond"));
  }

/**
 * Filter (Near by Event)
 * @params req.body
 * @return promise
 */
const NearByNoAuth = async (req, res) => {
 
    let data = req.body;
    let serachData = "";
    let GuestData = "";
    let guestCount;
    let userLikesCount;
    let userDisLikeCount;
    let todayDate = new Date(); 
    let filterWithStartDate = (data.filterWithStartDate) ? new Date(data.filterWithStartDate).getTime() : "";
    
    serachData = await Event.query().distinct("events.id","events.eventUrl","events.name", "events.start", "events.end", "events.userLikeCount as currentLikeCount", "events.userDisLikeCount as currentDisLikeCount", knex.raw("to_char(\"events\".\"start\", 'YYYY-MM-DD') as startDate"))
        .leftJoinRelation('[ticket_info, venueEvents as address, eventChooseSubcategory]')
        .mergeNaiveEager('[users as host, ticket_info,eventImages,  venueEvents as address, eventChooseSubcategory.[category,subCategory], userLikes,eventOccurrence]')
        .modifyEager('ticket_info', builder => { 
            builder.select('pricePerTicket')
        }).modifyEager('eventImages', builder => { 
            builder.select('eventImage')
        }).modifyEager('host', builder => {
            builder.select("id", "name")
        }).modifyEager('eventChooseSubcategory', builder => {
            builder.select("categoryId", "subCategoryId")
            .eager('[category , subCategory]')
            .modifyEager('category', builder =>{
             builder.select("categoryName")
            })
            .modifyEager('subCategory', builder =>{
             builder.select("subCategoryName")
            })
        }).modifyEager('address', builder => { 
            builder.select('latitude', 'longitude', 'venueAddress','countryCode',"city","state",'country')
        }).modifyEager('userLikes', builder => {
            builder.select('isLike', 'isDisLike')
        }).modifyEager('eventOccurrence', builder => {
            builder.select('eventId', 'eventOccurrence', 'occurredOn')
        })
        
        .where('is_active',true)
        .where('isDeleted',false)
        .where('isArchived',false)
        .andWhere('end', '>=', todayDate).where((builder) => {
            if(data.keyword){
                builder.where(function () {
                this.where('name', 'ilike' ,'%'+ data.keyword + '%').orWhere('eventCode', 'ilike' ,'%'+ data.keyword+ '%')
                })
            }
            if(!data.keyword){
                builder.where('eventType',0)
            }
            if (data.categoryId) {
               
                builder.where(function () {
                    this.where("eventChooseSubcategory.categoryId", data.categoryId);
                })
            }
            if (data.subCategoryId) {
               
              
                builder.where(function () {
                    this.whereIn("eventChooseSubcategory.subCategoryId", data.subCategoryId);
                })
            }
            if (data.startDate && data.endDate) {
                if(filterWithStartDate){
                    builder.whereRaw('((DATE(\"start\") <= \'' + data.startDate + '\' AND DATE(\"end\") >= \'' + data.startDate + '\')  OR (DATE(\"start\") BETWEEN \'' + data.startDate + '\' AND \'' + data.endDate + '\') )');
                }else{
                    builder.whereRaw('((DATE(\"start\") <= \'' + data.startDate + '\' AND DATE(\"end\") >= \'' + data.startDate + '\') OR (DATE(\"start\") <= \'' + data.endDate + '\' AND DATE(\"end\") >= \'' + data.endDate + '\') OR (DATE(\"start\") BETWEEN \'' + data.startDate + '\' AND \'' + data.endDate + '\') )');
                }
              
            }

            if (data.startDate && data.endDate === "") {
              
                builder.whereRaw('((DATE(\"start\") = \'' + data.startDate + '\') OR (DATE(\"start\") < \'' + data.startDate + '\' AND DATE(\"end\") >= \'' + data.startDate + '\'))');
            }
            if (data.cost) {
               
                //New condition
                builder.where(function () {
                   
                    this.where("ticket_info.pricePerTicket", '<=', data.cost);
                    this.orWhereNull("ticket_info.pricePerTicket");
                })
                            
            }
        }).orderBy('events.start', 'desc').runAfter( (result, builder) => {
           // console.log(builder.toKnexQuery().toQuery())
            return result;
        })

    
        let selectedDate = [];
        let otherDate = [];
        let filteredArr = [];
    for (let i = 0; i < serachData.length; i++) {
        let event_id = serachData[i].id;

        let eventsdate =[];
        var eventsdatess = [];
        var eventsdaily = [];
       
        for (let j=0;j<serachData[i].eventOccurrence.length;j++){
           //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
           let currentDate = moment().format('YYYY-MM-DD');
           if(serachData[i].eventOccurrence[j].eventOccurrence=='weekly'){
                  // console.log(getDays(currentDate,1));
              eventsdate = getDays(currentDate,serachData[i].eventOccurrence[j].occurredOn);

           } else if(serachData[i].eventOccurrence[j].eventOccurrence=='monthly'){
               //console.log(serachData[i].eventOccurrence[j].eventId)
              // console.log(serachData[i].eventOccurrence[j].occurredOn);
              var endOfMonth   = moment().endOf('month').format('DD');
              if(endOfMonth >= serachData[i].eventOccurrence[j].occurredOn){
               eventsdatess.push(serachData[i].eventOccurrence[j].occurredOn);
              }
                 //[1,2,3,4,5]
           } else if(serachData[i].eventOccurrence[j].eventOccurrence=='daily'){
               eventsdaily.push(serachData[i].eventOccurrence[j].occurredOn);
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
       let foundDaily = eventsdaily.find(
        element => 
        { 
            if (element >= nv ) {
            console.log('hg');
            return element 
        }  
    } 
       );
    
       if(!foundDaily){
        foundDaily = eventsdaily.find(
        element => 
        { 
            if (element < nv ) {
            return element 
        }  
    } 
       );
    }
       console.log(foundDaily,'f');
       if(foundDaily){
           var currentDate = moment().format('YYYY-MM-DD');
       eventsdate = getDays(currentDate,foundDaily);
      // console.log(eventsdate);
       }
       

       if(eventsdate.length > 0){
        serachData[i].recuringDate = eventsdate;
       } else {
        serachData[i].recuringDate = "";   
       }
       //console.log(serachData[i].recuringDate);
        
        //going user List
        serachData[i].GuestData = await TicketBooked.query().select("").eager('users as guestUser').modifyEager('guestUser', builder => {
            builder.select('profilePic', 'name')
        }).where('eventId', event_id).where('status', 'checkedIn')
      
        //going user count
        serachData[i].guestCount = await TicketBooked.query().count("userId").where('eventId', event_id).where('status', 'checkedIn')
        
        if(filterWithStartDate){
           
            if(filterWithStartDate == new Date(serachData[i].startdate).getTime()){
              
                selectedDate.push(serachData[i]);  
            }else{
                otherDate.push(serachData[i]);
            }
        }else{
            otherDate.push(serachData[i]);
        }
     
    }
  
    filteredArr = (selectedDate.length >0 || otherDate.length > 0) ? [...selectedDate, ...otherDate] : [];
    
    
    let serachlatlong = {
        'lat': req.body.latitude,
        'lng': req.body.longitude
    }
    let miles = req.body.miles;
 
    let response = [],
        event_id = [],
        n = false,
        venulatlng = {},
        distance;
    
    filteredArr.forEach(eventLatLng => {
        //console.log(eventLatLng);
        if(eventLatLng.address.length > 0){
        venulatlng.lat = eventLatLng.address[0].latitude;
        venulatlng.lng = eventLatLng.address[0].longitude;
        }
        n = latlong.nearby(serachlatlong, venulatlng, miles);
        //   returns the distance between two lat-long points
        distance = latlong.distance(serachlatlong, venulatlng);
        
        if(req.body.latitude!='' && req.body.longitude!=''){
        eventLatLng.distance = distance;
        } else {
        eventLatLng.distance = 0;
        }
        event_id = eventLatLng.id;
        if(req.body.latitude!='' && req.body.longitude!=''){
            if (n) response.push(eventLatLng);
            else return;
        } else {
            response.push(eventLatLng);
        }
        
    });
    let category = [];
    let category1 =  await EventChooseSubcategory.query().select('categoryId')
         .innerJoinRelation('[category]')
         .eager('category')
         .modifyEager('category', builder => {
             builder.select('id', 'categoryName','categoryImage','isActive','created_at','updated_at','searchCount').where('isActive', true).orderBy('searchCount','DESC')
         }).where('category.isActive',true).groupBy('categoryId','category.searchCount').orderBy('category.searchCount','DESC').runAfter((result, builder)=>{
            //console.log(builder.toKnexQuery().toQuery())
            return result;
        });
        //console.log(category.length);
           //let CategoryData = await Category.query().skipUndefined().select().orderBy('created_at', 'desc');
           for(let i=0;i < category1.length; i++){
              // console.log(category);
               for(let j=0;j< category1[i].category.length;j++){
                   //console.log(category1[i].category[j]);
                  let categoryer = category1[i].category[j];
                  category.push(categoryer);
               }
           }

    response.forEach((resSearch) => {
        
      
         //delete resSearch.eventChooseSubcategory;
         delete resSearch.ticket_info;
    })
    //if response empty
   
    if (filteredArr.length < 1) {
        response = {
            "category": category,
            "eventList": [],
        }
       
        return badRequestError(res, response, Message("eventNotFond"));
    }
    if (!response || response == '') {
        response = {
            "category": category,
            "eventList": [],
        }
      
        return okResponse(res, response, Message("eventNotFond"));
    }
  
    //Without  Auth Users response
    if (!req.params.auth) {
        response = {
            "category": category,
            "eventList": response
        }
    }
    //final Response
    return okResponse(res, response, Message("eventFond"));
}

/**
 * Search (Near by Event)  (login and Without login)
 * @params req.body.keyword (Event Name, categoryName)
 * @return promise
 */


const Search = async (req, res) => {
    let data = req.body;

    let recentSearchData;
    let recentSearchText;
    let response;
    let topEvent;
    let searchData;
    let todayDate = new Date();
   
    //pagination
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : PER_PAGE;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);

    //Top Five Events
    // topEvent = await Event.query().select("events.id", "events.name", "events.start", "events.end")
    //     .mergeNaiveEager('[eventImages,  venueEvents as address]')
    //     .modifyEager('eventImages', builder => {
    //         builder.select('eventImage').limit(1)
    //     }).modifyEager('address', builder => {
    //         builder.select('latitude', 'longitude', 'venueAddress', 'countryCode',"city","state", 'country')
    //     }).where('is_active',true).orderBy('userLikeCount', 'desc').limit(20);

    // Explore Events -- chnages by reshmi 
  
     topEvent = await Event.query().select("events.id", "events.name", "events.start", "events.end")
        .mergeNaiveEager('[eventImages,  venueEvents as address,eventOccurrence]')
        .modifyEager('eventImages', builder => {
            builder.select('eventImage').limit(1)
        }).modifyEager('address', builder => {
            builder.select('latitude', 'longitude', 'venueAddress', 'countryCode',"city","state", 'country')
        }).modifyEager('eventOccurrence', builder => {
            builder.select('eventId', 'eventOccurrence', 'occurredOn')
        })
        .where('is_active',true).where('isExploreEvent',true).orderBy('end', 'desc').limit(20);

        for (let i = 0; i < topEvent.length; i++) {
            let event_id = topEvent[i].id;
    
            let eventsdate =[];
            var eventsdatess = [];
            var eventsdaily = [];
           
            for (let j=0;j<topEvent[i].eventOccurrence.length;j++){
               //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
               let currentDate = moment().format('YYYY-MM-DD');
               if(topEvent[i].eventOccurrence[j].eventOccurrence=='weekly'){
                      // console.log(getDays(currentDate,1));
                  eventsdate = getDays(currentDate,topEvent[i].eventOccurrence[j].occurredOn);
    
               } else if(topEvent[i].eventOccurrence[j].eventOccurrence=='monthly'){
                   //console.log(serachData[i].eventOccurrence[j].eventId)
                  // console.log(serachData[i].eventOccurrence[j].occurredOn);
                  var endOfMonth   = moment().endOf('month').format('DD');
                  if(endOfMonth >= topEvent[i].eventOccurrence[j].occurredOn){
                   eventsdatess.push(topEvent[i].eventOccurrence[j].occurredOn);
                  }
                     //[1,2,3,4,5]
               } else if(topEvent[i].eventOccurrence[j].eventOccurrence=='daily'){
                   eventsdaily.push(topEvent[i].eventOccurrence[j].occurredOn);
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
          // console.log(eventsdate);
           }
           
           if(eventsdate.length>0){
           topEvent[i].recuringDate = eventsdate;
           } else {
            topEvent[i].recuringDate = "";   
           }
           //console.log(serachData[i].recuringDate);
        }

    // Search Data show
    searchData = await Event.query().distinct("events.id", "events.name", "events.start", "events.end", 'eventChooseSubcategory:category.categoryName')
        .joinRelation('venueEvents').joinRelation('eventChooseSubcategory.[category]')
        .mergeNaiveEager('[eventImages,  venueEvents as address, eventChooseSubcategory,eventOccurrence]')
        .modifyEager('eventImages', builder => {
            builder.select('eventImage').limit(1)
        }).modifyEager('address', builder => {
            builder.select('latitude', 'longitude', 'venueAddress', 'city','state','country').limit(1)
        }).modifyEager('eventChooseSubcategory', builder => {
            builder.select("").mergeNaiveEager('[category]').modifyEager('category', builder => {
                builder.select('categoryName')
            }).limit(1)
        }).modifyEager('eventOccurrence', builder => {
            builder.select('eventId', 'eventOccurrence', 'occurredOn')
        })
        .where('end', '>', todayDate).where('is_active',true)
        .where('isDeleted',false)
        .where('isArchived',false)
        .where((builder) => {
            if (data.keyword) {
               
                builder.where("events.name", 'ilike', '%' + data.keyword + '%').orWhere('events.eventCode', 'ilike' ,'%'+ data.keyword+ '%')
                    .orWhere("venueEvents.venueAddress", 'ilike', '%' + data.keyword + '%')
                    .orWhere("eventChooseSubcategory:category.categoryName", 'ilike', '%' + data.keyword + '%')
            }
            if(!data.keyword){
                builder.where('eventType',0)
            }
            if (data.city) {
                
                builder.andWhere("venueEvents.city", 'ilike', '%' + data.city + '%')
              
            }
            
        }).where((builder) => {
            if (data.city) {
                builder.andWhere("venueEvents.city", 'ilike', '%' + data.city + '%')
            }
        }).orderBy('start','desc').offset(offset).limit(limit).runAfter((result, builder)=>{
           // console.log(builder.toKnexQuery().toQuery())
            return result;
        });
   
    if (searchData == '' && topEvent == '') {
        return badRequestError(res, [], Message("eventNotFond"));
    }

    for (let i = 0; i < searchData.length; i++) {
        let event_id = searchData[i].id;

        let eventsdate =[];
        var eventsdatess = [];
        var eventsdaily = [];
       
        for (let j=0;j<searchData[i].eventOccurrence.length;j++){
           //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
           let currentDate = moment().format('YYYY-MM-DD');
           if(searchData[i].eventOccurrence[j].eventOccurrence=='weekly'){
                  // console.log(getDays(currentDate,1));
              eventsdate = getDays(currentDate,searchData[i].eventOccurrence[j].occurredOn);

           } else if(searchData[i].eventOccurrence[j].eventOccurrence=='monthly'){
               //console.log(serachData[i].eventOccurrence[j].eventId)
              // console.log(serachData[i].eventOccurrence[j].occurredOn);
              var endOfMonth   = moment().endOf('month').format('DD');
              if(endOfMonth >= searchData[i].eventOccurrence[j].occurredOn){
               eventsdatess.push(searchData[i].eventOccurrence[j].occurredOn);
              }
                 //[1,2,3,4,5]
           } else if(searchData[i].eventOccurrence[j].eventOccurrence=='daily'){
               eventsdaily.push(searchData[i].eventOccurrence[j].occurredOn);
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
      // console.log(eventsdate);
       }
       
       if(eventsdate.length > 0){
        searchData[i].recuringDate = eventsdate;
       } else {
        searchData[i].recuringDate = "";   
       }
       //console.log(serachData[i].recuringDate);
    }

    // without login Users response
    if (!req.params.auth) {
      
        if (data.keyword == "" && (data.city == "")) {
           
            response = {
                searchData: [],
                topEvents: topEvent,
                page: page 
            }
            return okResponse(res, response, Message("eventList"));
        } else {
            response = {
                searchData: searchData,
               
                topEvents: topEvent,
                page: page
            }
            return okResponse(res, response, Message("eventList"));
        }
    }
    // login Users response
    if (req.params.auth) {
        if ((searchData.length > 0)) {
            
            if(data.keyword){
                recentSearchData = await recentSearch.query().insert({
                    userId: req.user.id,
                    text: data.keyword,
                    eventId: searchData[0].id
                });
            }
        }
        recentSearchData = await recentSearch.query().select(knex.raw('distinct "text", \'order by id desc\'') ).omit(["?column?"]).where('userId', req.user.id).limit(5);
    } else {
        return badRequestError(res, [], Message("eventNotFond"));
    }
    if (searchData == '' && topEvent == '') {
        return badRequestError(res, [], Message("eventNotFond"));
    }
    //check search not match
    else if (data.keyword == "" && (data.city == "" || data.city != "")) {
        
        response = {
            searchData: [],
            recentSearch: recentSearchData,
            topEvents: topEvent,
            page: page
        }
        return okResponse(res, response, Message("eventList"));
    } else {
        // login Users response
        if (req.params.auth) {
           
            response = {
                searchData: searchData,
                recentSearch: recentSearchData,
                topEvents: topEvent,
                page: page
            }
        }
        return okResponse(res, response, Message("eventList"));
    }
}

/**
 * EventBySubCategory (without Auth Recommended)
 * @params req.body;
 * @return promise
 */

const EventBySubCategory = async (req, res) => {
    let subCategoryId = req.body.subCategoryId;


    //PAGINATION
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : PER_PAGE;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);

    //fetch eventIds
    const eventIds = await EventChooseSubcategory.query().select('eventId').whereIn('subCategoryId', subCategoryId);
    let eventIDs = Array.prototype.map.call(eventIds, s => s.eventId)

    //fetch Event Details
    let recommendData = await Event.query().skipUndefined().select('id', 'name', 'start', 'end').whereNot('eventType', 1).whereIn('id', eventIDs).eager('[users as host,eventImages, venueEvents as address]').modifyEager('host', builder => {
        builder.select('id', 'name', 'profilePic')
    }).modifyEager('eventImages', builder => {
        builder.select('eventImage')
    }).modifyEager('address', builder => {
        builder.select('latitude', 'longitude', 'venueAddress')
    }).where('is_active',true).where('isDeleted',false).where('isArchived',false).where('eventType',0).offset(offset).limit(limit);

    if (recommendData == '') {
        return okResponse(res, '', Message("fetchedRecommend"));
    }

    let response = {
        'eventList': recommendData,
        'page': page,
    }
    return okResponse(res, response, Message("fetchedRecommend"));
}

const isLikeAndDisLike = async (req, res) => {
    let data = req.body;
    let current_state = await UserLikes.query().skipUndefined().findOne({
        userId: req.user.id,
        eventId: data.eventId
    });
    let current_count = await Event.query().skipUndefined().findOne({
        id: data.eventId
    });
    if (!current_count || !current_count) {
        return badRequestError(res, "", "Please give correct eventId");
    }
   
    if (data.type == 0) {
       
        if (current_count.userLikeCount == 0 || current_count.userDisLikeCount == 0) {
            let liked = await current_count.$query().updateAndFetch({
                userLikeCount: 0
            })
            let del = await UserLikes.query().skipUndefined().delete().where({
                userId: req.user.id,
                eventId: data.eventId
            });
            return okResponse(res, {}, "Reset");
        } else {

            if (current_state == undefined || current_state == '') {
                return okResponse(res, {}, "Reset");
            }
            if (current_state.isLike == true) {
                let liked = await current_count.$query().updateAndFetch({
                    userLikeCount: current_count.userLikeCount - 1
                })
            } else {
                let disliked = await current_count.$query().updateAndFetch({
                    userDisLikeCount: current_count.userDisLikeCount - 1
                })
            }
        }
        let del = await UserLikes.query().skipUndefined().delete().where({
            userId: req.user.id,
            eventId: data.eventId
        });
        return okResponse(res, {}, "Reset");
    }
    if (data.type == 1) {
       
        if (data.type == 1 && !current_state) {
            let like = await UserLikes.query().skipUndefined().insert({
                userId: req.user.id,
                eventId: data.eventId,
                isLike: true,
                isDisLike: false,

            });
            let newlike = await current_count.$query().updateAndFetch({
                userLikeCount: current_count.userLikeCount + 1
            })
        } else {
           
            if (current_state.isLike == true) {
                return okResponse(res, {}, "Liked");
            } else {
                let like = await current_state.$query().updateAndFetch({
                    isLike: true,
                    isDisLike: false,
                }).where({
                    userId: req.user.id,
                    eventId: data.eventId
                });
                let liked = await current_count.$query().updateAndFetch({
                    userDisLikeCount: current_count.userDisLikeCount - 1,
                    userLikeCount: current_count.userLikeCount + 1
                })
            }
        }
        return okResponse(res, {}, "Liked");
    }
    if (data.type == 2) {
       
        if (data.type == 2 && !current_state) {
            let like = await UserLikes.query().skipUndefined().insert({
                userId: req.user.id,
                eventId: data.eventId,
                isLike: false,
                isDisLike: true
            })
            let newdislike = await current_count.$query().updateAndFetch({
                userDisLikeCount: current_count.userDisLikeCount + 1
            })
        } else {
            if (current_state.isLike == true) {
                let dislike = await current_state.$query().updateAndFetch({
                    isLike: false,
                    isDisLike: true
                });
                let disliked = await current_count.$query().updateAndFetch({
                    userLikeCount: current_count.userLikeCount - 1,
                    userDisLikeCount: current_count.userDisLikeCount + 1
                })
               
            } else {
                return okResponse(res, {}, "Disliked");
            }
        }
    }
    return okResponse(res, {}, "Disliked");
}

/**
 * Recommended
 * @params req.body.property_id;
 * @return promise
 */

const Recommended = async (req, res) => {
    let todayDate = new Date();
    const recommendData = await Event.query().select('id', 'name', 'start', 'end', 'reviewCount', 'categoryId', 'subCategoryId').eager('[users as host,eventImages, venueEvents]').modifyEager('host', builder => {
        builder.select('id', 'name', 'profilePic')
    }).modifyEager('eventImages', builder => {
        builder.select('eventImage').limit(2)
    }).modifyEager('venueEvents', builder => {
        builder.select('latitude', 'longitude', 'countryCode',"city","state", 'country')
    }).whereNot('eventType', 1).where('end', '>', todayDate).where('is_active',true).where('isDeleted',false).where('isArchived',false);
    if (!recommendData) {
        return notFoundError(Message("eventNotFond"));
    }
    return okResponse(res, recommendData, Message("eventFond"));

}

/**
 * markFav
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */


const CreateFavourite = async (req, res) => {
    
    let data = req.body;
    data.userId = req.user.id;
    data.isFavorite = req.body.isFavorite

    let FavData = await Favorite.query().where(
        'userId', req.user.id).andWhere('eventId', data.eventId);

  
    if (FavData != '') {
        if (FavData.userId = req.user.id) {

            FavData = await Favorite.query()
                .patch({
                    isFavorite: data.isFavorite
                })
                .where({
                    eventId: data.eventId,
                    userId: req.user.id
                });
        } else {
            return badRequestError(res, "", Message("notFavourite"));
        }

    } else {
        FavData = await Favorite.query().insertGraph(data);
    }
  

    //Notification Process

    const EventUser = await Event.query().select("userId", "name", "id").where('id', req.body.eventId).where('is_active',true).first();
    
    const CustomerFav = await User.query().select("id", "name","isNotify").where('id', req.user.id).first();

    const hostData = await User.query().select('id', 'name', 'deviceType', 'deviceToken','isNotify')
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
    .where('id', EventUser.userId).first();

    // favorite check (only favorite flag true then a notification to host)
   
    if (req.body.isFavorite == true) {
     if(hostData){
        if (hostData.androidUser) {
            let AndroideventCreate = await androidNotification.markFav(hostData, CustomerFav, EventUser);
        }
         if(hostData.iosUser) {
            let IOSeventCreate = await iosNotification.markFav(hostData, CustomerFav, EventUser);
        }
        if(hostData.webUser){
            let webNotifi = await WebNotification.markFav(hostData,CustomerFav, EventUser);
        }
    }

    } else {
        
    }
    return okResponse(res, {}, Message("Favourite"));

}


/**
 * getRecommend
 * @params req.body.property_id;
 * @return promise
 */

const getRecommend = async (req, res) => {
    let userId = req.user.id
    let GuestData = "";
    let guestCount;
    let userLikesCount;
    let userDisLikeCount;
    
    let todayDate = new Date();
    // PAGINATION
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : PER_PAGE;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);

    //fetch catSubIds
    const catSubIds = await UserChooseSubcategory.query().select('subCategoryId').where('userId', userId);
    let SubIds = Array.prototype.map.call(catSubIds, s => s.subCategoryId)
   

    //fetch eventIds
    const eventIds = await EventChooseSubcategory.query().select('eventId').whereIn('subCategoryId', SubIds);
    let eventIDs = Array.prototype.map.call(eventIds, s => s.eventId)
    
    //fetch Event Details
    let recommendData = await Event.query().skipUndefined().select('id', 'name', 'start', 'end',"userLikeCount as currentLikeCount", "userDisLikeCount as currentDisLikeCount").where('is_active', true).whereIn('id', eventIDs).where(function () {
        this.where('end', '>', todayDate).whereNot('eventType', 1)
    }).eager('[users as host,eventImages,  venueEvents as address, userLikes,favorite,eventOccurrence]')
    .modifyEager('host', builder => {
        builder.select('id', 'name', 'profilePic')
    }).modifyEager('eventImages', builder => {
        builder.select('eventImage')
    }).modifyEager('address', builder => {
        builder.select('latitude', 'longitude', 'venueAddress', 'countryCode',"city","state", 'country')
    }).modifyEager('userLikes', builder => {
        builder.select('isLike', 'isDisLike').where("userId", req.user.id)
    }).modifyEager('favorite', builder => {
        builder.select('isFavorite').where("userId", req.user.id)
    }).modifyEager('eventOccurrence', builder => {
        builder.select('eventId', 'eventOccurrence', 'occurredOn')
    })
    .where('isDeleted',false).where('isArchived',false).where('eventType',0).orderBy('start', 'asc').offset(offset).limit(limit);
     
    let filteredArr = [];
    for (let i = 0; i < recommendData.length; i++) {
        let event_id = recommendData[i].id;

        let eventsdate =[];
        var eventsdatess = [];
        var eventsdaily = [];
       
        for (let j=0;j<recommendData[i].eventOccurrence.length;j++){
           //console.log(serachData[i].eventOccurrence[j].occurredOn,'eventoc');
           let currentDate = moment().format('YYYY-MM-DD');
           if(recommendData[i].eventOccurrence[j].eventOccurrence=='weekly'){
                  // console.log(getDays(currentDate,1));
              eventsdate = getDays(currentDate,recommendData[i].eventOccurrence[j].occurredOn);

           } else if(recommendData[i].eventOccurrence[j].eventOccurrence=='monthly'){
               //console.log(serachData[i].eventOccurrence[j].eventId)
              // console.log(serachData[i].eventOccurrence[j].occurredOn);
              var endOfMonth   = moment().endOf('month').format('DD');
              if(endOfMonth >= recommendData[i].eventOccurrence[j].occurredOn){
               eventsdatess.push(recommendData[i].eventOccurrence[j].occurredOn);
              }
                 //[1,2,3,4,5]
           } else if(recommendData[i].eventOccurrence[j].eventOccurrence=='daily'){
               eventsdaily.push(recommendData[i].eventOccurrence[j].occurredOn);
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
       //console.log(eventsdate);
       }
       
       if(eventsdate.length > 0){
        recommendData[i].recuringDate = eventsdate;
       } else {
        recommendData[i].recuringDate = "";   
       }
       //console.log(serachData[i].recuringDate);
       
        //going user List
        let profilePic;
        recommendData[i].GuestData = await TicketBooked.query().select("").eager('users as guestUser').modifyEager('guestUser', builder => {
            builder.select('profilePic', 'name').whereNot('profilePic', null)
        }).where('eventId', event_id).joinRelation('users').where('status', 'checkedIn'); //.whereNot('users.profilePic', null) 
    
        recommendData[i].guestCount = await TicketBooked.query().count("userId").where('eventId', event_id).where('status', 'checkedIn');
    }
    filteredArr = recommendData;

    let countrecommendData = await Event.query().skipUndefined().select(knex.raw('count(distinct("id")) as totalDataCount')).where('is_active', true).whereIn('id', eventIDs).where(function () {
        this.where('end', '>', todayDate).whereNot('eventType', 1).where('isDeleted',false).where('isArchived',false)
    })
 
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
            venulatlng.lat = eventLatLng.address[0].latitude;
            venulatlng.lng = eventLatLng.address[0].longitude;
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
        response = {
            'eventList': response,
            'eventCount':countrecommendData[0].totaldatacount,
            'page': page,
        }
   
        if (recommendData == '') {
            return okResponse(res, response, Message("eventNotFond"));
        }
        return okResponse(res, response, Message("eventFond"));
    }

/**
 * EventByCategory (without Auth)
 * @params req.body;
 * @return promise
 */

const EventByCategory = async (req, res) => {
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : PER_PAGE;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);
    let data = req.body;
    let todayDate = new Date();

    // fetch eventIds
    const eventIds = await EventChooseSubcategory.query().select('eventId').where('categoryId', req.body.categoryId);
    let eventIDs = Array.prototype.map.call(eventIds, s => s.eventId)

    let recommendEvent = await Event.query().skipUndefined().select('id', 'name', 'start', 'end').whereNot('eventType', 1).whereIn('id', eventIDs).where(function () {
        this.where('end', '>', todayDate).whereNot('eventType', 1)
    }).eager('[eventImages, venueEvents as address]').modifyEager('eventImages', builder => {
        builder.select('eventImage')
    }).modifyEager('address', builder => {
        builder.select('latitude', 'longitude', 'venueAddress','city','state','country')
    }).where('is_active',true).where('isDeleted',false).where('isArchived',false)
    .orderBy('start', 'desc').offset(offset).limit(limit);

    if (!recommendEvent) {
        return notFoundError(Message("eventNotFond"))
    }
    let response = {
        'events': recommendEvent,
        'page': page,

    }
    return okResponse(res, response, Message("eventList"));
}

/**
 * Verify checkout detail
 * @params req.body;
 * @return promise
 */

const verifyCheckoutPayment = async (req, res) => {
    let data = req.body;
    //create array of ticket number
    if(!Array.isArray(data.ticketDetail)){
      
        return badRequestError(res, "", Message("requiredParams"));
    }
    let ticketArray = data.ticketDetail;
    // fetch eventIds
    let getTicketPrice = await TicketInfo.query().select( knex.raw('coalesce("pricePerTicket", 0) as "pricePerTicket"'), knex.raw('coalesce("totalQuantity", 0) as "totalQuantity"'), 'id', knex.raw('coalesce("noOfTables", 0) as "noOfTables"'), 'ticketType','discount').whereIn('id', data.ticketDetail.map(v => v.id)).runBefore((result, builder) => {
       
        return result;
    });
    let totalTicketPrice = 0;
    if(getTicketPrice.length > 0 && getTicketPrice.length == ticketArray.length){
        //loop for check ticket price according ticket id from db array
        for (let index = 0; index < getTicketPrice.length; index++) {
            const element = getTicketPrice[index];
            //loop for check ticket price according ticket id from req array
            for (let j = 0; j < data.ticketDetail.length; j++) {
                const elements = data.ticketDetail[j];
                if( (element.id == elements.id && element.ticketType != 'regularTableSeating') && ((parseFloat(element.pricePerTicket) != parseFloat(elements.pricePerTicket)) || (parseInt(element.totalQuantity) < parseInt(elements.totalQuantity) || !(parseInt(elements.totalQuantity))))){
                    return badRequestError(res, "", Message("mismachtAmount")); 
                }else if((element.id == elements.id && element.ticketType == 'regularTableSeating') && (parseFloat(element.pricePerTicket) != parseFloat(elements.pricePerTicket) || (parseInt(elements.totalQuantity) > parseInt(element.noOfTables) || !(parseInt(elements.totalQuantity))))){
                    return badRequestError(res, "", Message("mismachtAmount")); 
                }
                if(element.id == elements.id){
                  
                    if(elements.discount){
                        var numVal1 = parseFloat(element.pricePerTicket) * elements.totalQuantity;
                        //console.log(numVal1);
                        //console.log(elements.discount,'discount');
                        var numVal2 = parseFloat(elements.discount) / 100;
                        
                        var totalValue = numVal1 - (numVal1 * numVal2);
                       // console.log(totalValue,'a');
                         totalTicketPrice = (parseFloat(totalValue)) + parseFloat(totalTicketPrice);
                         } else {
                            // console.log('dshf')
                         totalTicketPrice = (parseFloat(element.pricePerTicket) * elements.totalQuantity) + parseFloat(totalTicketPrice);
                         }
                }
            }
        }
        //compaire total ticket price
        if(parseFloat(totalTicketPrice) != parseFloat(data.totalTicketPrice)){
           // console.log(totalTicketPrice);
            return badRequestError(res, "", Message("mismachtAmount"));
        }
    }else{

        return badRequestError(res, "", Message("ticketDetailNotFound")); 
    }
    
    return okResponse(res, totalTicketPrice, Message("detailVerify"));
}
module.exports = {
    myFavEvents,
    myBookedEvent,
    NearBy,
    NearByNoAuth,
    Search,
    EventByCategory,
    EventBySubCategory,
    UserEventDetail,
    isLikeAndDisLike,
    Recommended,
    CreateFavourite,
    getRecommend,
    verifyCheckoutPayment,
    FeatureEvents,
    allEventList
}
