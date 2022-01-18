'use strict'

const Venue = require('../../models/venue');
const Event = require('../../models/events');
const User = require('../../models/users');
const VenueEvents = require('../../models/venueEvents');
const SubVenue = require('../../models/subVenue');
const SubVenueEvents = require('../../models/subVenueEvents');

const VenueImages = require('../../models/venueImages');
require('../../global_functions');
require('../../global_constants');
var daysAvailable = require('../../models/daysAvailability');
//var knex = require('knex');
var moment = require('moment');

const knex = require('knex')({
  client: 'postgres'
  // other params
});
const { transaction } = require('objection');
const fileupload = require('../../middlewares/fileupload');
const { DataSync } = require('aws-sdk');

/**
 * Create Vanue
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const createVenue = async (req, res) => {
  let data = req.body;
  let message;
  let days, contact;

  if (!data.latitude && !data.longitude) {
    return badRequestError(res, "", "please select valid address");
  } 

  //console.log(req.user.userLoginDetail[0], 'user');
  data.daysAvailable = JSON.parse(data.daysAvailable);
  if (data.subVenues && data.subVenues.length > 0) {
    data.subVenues = JSON.parse(data.subVenues);
  }
  // data.daysAvailable = await data.daysAvailable.map((daysAvailable) => {
  //   return {
  //     weekDayName: daysAvailable
  //   }
  // });
  if (data.contactVia) {
    contact = JSON.parse(data.contactVia);
    data.contactVia = await contact.map((contact) => {
      return {
        contactVia: contact,
        userId: req.user.id
      }
    });
  }
  if (data.websiteURL) {
    let websiteURL = await User.query().update({ "URL": data.websiteURL }).where("id", req.user.id);
  }

  data.venueImages = await req.files.map((file) => {
    return {
      venueImages: file.location,
      isPrimary: false
    };
  });
  // data.venueImages[0].isPrimary = true;

  data.userId = req.user.id;
  //console.log(data, 'data'); 
  // let [err, addVenue] = await to(Venue.query().skipUndefined().insertGraph(data).returning('*').runBefore((result, builder) =>{
  //   console.log(builder.toKnexQuery().toQuery())
  //   return result;
  //   }))

  //set ticket capacity
  if(data.venueCapacity!=undefined){
    data.allotedTicket = data.venueCapacity;
    data.ticketCapacityPercent = 100; //default 100%
  }
  data.is_active = true;
  let [err, addVenue] = await to(transaction(Venue.knex(), trx => {
                    return (
                        Venue.query(trx).context({'type': req.user.userLoginDetail[0].loginType})
                            .insertGraphAndFetch(data, {
                                relate: true,
                            })
                    );
               }));  
   
  if (err) {
   // console.log(err)
    return errorResponse(res, '', err.message);
  }
  return okResponse(res, '', Message("venueCreate"));
}

/**
 * Get Venue
 * Note: userType: 1-venue
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */
const getVenue = async (req, res) => {
  
  var data = req.query;
  console.log(data);
  if(req.params.id==undefined){
    return badRequestError(res, '', "Required parameter not found")
  }
  let todayDate = new Date();
  let todayTime = moment(todayDate).add(20, 'minutes').format('YYYY-MM-DD HH:mm:ss');
   
  let venue = await Venue.query().skipUndefined().select('id','userId','venueName', 'venueAddress','country','city','state','fullState','websiteURL', 'latitude', 'longitude', 'venueType', 'venueCapacity', 'shortDescription', 'isVenueAvailableToOtherHosts', 'city', 'reserveTime')
    .where('id', req.params.id)
    //.andWhere('userId', req.user.id)
    .eager('[daysAvailable,venueImages,subVenues]') 
    .modifyEager('daysAvailable', builder => {
      builder.select('id', 'weekDayName', 'fromTime', 'toTime')
    }).modifyEager('venueImages', builder => {
      builder.select('id', 'venueImages')
    }).first();
  // check event condition
  if(data.eventStartDateTime && data.eventEndDateTime){
    
  let events =  await Event.query().skipUndefined().select('events.id')
  .innerJoinRelation("[venueEvents]")
  .eager("[venueEvents]")
  .modifyEager('venueEvents', builder => {
    builder.select('eventId','venueId')
  })
  .where('venueEvents.venueId',  req.params.id)
  .where((builder) => {
    if(data.eventStartDateTime && data.eventEndDateTime){
      builder.whereRaw('((DATE(\"start\") <= \'' + data.eventStartDateTime + '\' AND DATE(\"end\") >= \'' + data.eventStartDateTime + '\') OR (DATE(\"start\") <= \'' + data.eventEndDateTime + '\' AND DATE(\"end\") >= \'' + data.eventEndDateTime + '\'))');
    }
  })
  .first()
  .runAfter((result, builder) =>{
    console.log(builder.toKnexQuery().toQuery())
    return result;
 }); 
   //console.log(events);
  // console.log(req.user);

  // discussing with sachin for remove this condition
  //  if(events){ 
    
  //   if(req.user.deviceType=='desktop'){
  //     events.isBooked = 'Yes'
  //     return okResponse(res, events, "venue is already booked on selected date time");
  //   } else {
  //     venue.isBooked = 'Yes'
  //     return okResponse(res, venue, "venue is already booked on selected date time");
  //   }
    
  //   } 
  }
  // admin side check- .where("is_active","true");
  if (!venue || venue == '' || undefined) {
    return errorResponse(res, "", Message("venueNotFond"));
  }

  venue.isBooked = 'No';

  return okResponse(res, venue, Message("venueFound"));
}

/**
 * Get Venue List
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const VenueList = async (req, res) => {
  let data = req.query;
  console.log(data);

  let miles = (data.miles) ? data.miles : 5;
  let venue = await Venue.query().skipUndefined().select('id', 'venueName', 'venueAddress', 'websiteURL', 'venueCapacity', 'ticketCapacityPercent', 'shortDescription',
    knex.raw( 
      "(acos(sin(venue.latitude::decimal * 0.0175) * sin(" +
      data.latitude +
      " * 0.0175) + cos(venue.latitude::decimal * 0.0175) * cos(" +
      data.latitude +
      " * 0.0175) * cos((" +
      data.longitude +
      " * 0.0175) - (venue.longitude::decimal * 0.0175))) * 6371) as distance"
    )
  )
    .eager('subVenues')
    .mergeNaiveEager('venueImages')
    .modifyEager('venueImages', builder => {
      builder.select('id', 'venueImages').limit(1)
    })
    
    .where(builder => {
      if (req.user.userType == "venuer") {
        builder.where('userId','IS',null) //changes with anshul discussion
      } else if (req.user.userType == "host" || req.user.userType == "promoter") {
        builder.where('isVenueAvailableToOtherHosts', true).orWhere('userId','IS',null)
      }
    })
    .where(builder => {
      if (data.latitude) {
        // console.log(knex.raw(
        //   "(acos(sin(venue.latitude::decimal * 0.0175) * sin(" +
        //   data.latitude +
        //   " * 0.0175) + cos(venue.latitude::decimal * 0.0175) * cos(" +
        //   data.latitude +
        //   " * 0.0175) * cos((" +
        //   data.longitude +
        //   " * 0.0175) - (venue.longitude::decimal * 0.0175))) * 6371) as distance"
        // ), 'distance')
        builder.whereRaw(
          "acos(sin(venue.latitude::decimal * 0.0175) * sin(" +
          data.latitude +
          " * 0.0175) + cos(venue.latitude::decimal * 0.0175) * cos(" +
          data.latitude +
          " * 0.0175) * cos((" +
          data.longitude +
          " * 0.0175) - (venue.longitude::decimal * 0.0175))) * 6371 <= " + miles + ""
        )
      }
      if (data.searchValue!='') {
        builder.where("venueName", 'iLike', '%' + data.searchValue + '%');
      }
    }).runAfter((result, builder) =>{
      //console.log(builder.toKnexQuery().toQuery())
      return result;
      });

  // .andWhere("isActive","true").orderBy('created_at', 'desc');
  let ids = [];
  venue.forEach(e => {
    ids.push(e.id);
  });
  let images = await VenueImages.query().skipUndefined().select('venueImages').whereIn('venueId', ids).first();
  venue.venueImages = images;
  for (var i = 0; i < venue.length; i++) {
    venue[i].distance = Math.sqrt(venue[i].distance).toFixed(2)
    if (req.user.userType == "venuer") {
      venue[i].isVenueOwner = true
      // venue[i].venueImages = images;
    } else {
      venue[i].isVenueOwner = false;
      //venue[i].venueImages = images;
    }
  }
  // console.log(venue);
  if (!venue || venue == '') {
    return errorResponse(res, "", Message("venueNotFond"));
  }
  return okResponse(res, venue, Message("venueList"));
}

/**
 * updateVenue
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const updateVenue = async (req, res) => {
  let data = req.body;
  let daysAvail, contact;
  data.id = Number(req.params.id);
  if (!data.venueName) {
    return badRequestError(res, "", "Please Enter Venue Name");
  }
  if (!data.venueAddress) {
    return badRequestError(res, "", "Please Give venueAddress");
  }

  if (!data.latitude && !data.longitude) {
    return badRequestError(res, "", "please select valid address");
  } 

  let venue = await Venue.query().skipUndefined().select('id', 'venueName').where('id','!=',req.params.id).where('venueName',data.venueName).first();
  console.log(venue);
  if(venue){
    return badRequestError(res, "", "This venue name alrady exists.");
  }
  //venueImages Delete
  if (data.imageIds) {
    let ids = data.imageIds;
    let imageId = ids.split(",");
    let deleteImages = await VenueImages.query().delete().whereIn('id', imageId);
  }

  //daysAvailable
  data.daysAvailable = JSON.parse(data.daysAvailable);
  // console.log(daysAvailable)
  // data.daysAvailable = await daysAvailable.map((daysAvailable) => {
  //   return {
  //     weekDayName: daysAvailable
  //   }
  // });

  //update venue capacity percentage

  // if(!data.ticketCapacityPercent){
  //   return badRequestError(res, '', 'Not valid ticket capacity')
  // }
  // if(parseInt(data.ticketCapacityPercent) < 100){
  //   return badRequestError(res, '', 'Ticket capacity should not be less than 100%')
  // }
  // data.allotedTicket = knex.raw('"venueCapacity" * "ticketCapacityPercent" / 100')

  if (data.subVenues && data.subVenues.length > 0) {
    data.subVenues = JSON.parse(data.subVenues);
  }

  //venueImages
  const options = {
    noDelete: ['venueImages']
  };

  data.venueImages = await req.files.map((file) => {
    return {
      venueImages: file.location
    };
  });

  

  //Update Process
  let [err, updateVenue] = await to(Venue.query().skipUndefined().context({'type': req.user.userLoginDetail[0].loginType}).upsertGraph(data, options));
  if (err) {
    return badRequestError(res, "", err.message);
  }
  return okResponse(res, {}, Message("venueUpdate"));
}

/**
 * deleteVenue
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const deleteVenue = async (req, res) => {
  let data = req.params;
  let checkVenue = await Event.query().select().where('venueId', data.id);

  if (checkVenue != "") {
    console.log("not Delete")
    return badRequestError(res, "", Message("venueNotDelete"));
  } else {
    let checkId = await Venue.query().select().where('id', data.id);
    console.log("checkId", checkId)
    if (checkId == "") {
      return badRequestError(res, "", "Error in deleting Venue");
    }
    let deletedVenue = await Venue.query().deleteById(data.id);
    return okResponse(res, "", Message("venueDelete"));
  }
}

const previousEventValue = async (req, res) => {
  console.log("Host Side: Get All Venues");
  //let data = req.body;

  let eventVenue = await Event.query().select('id')
    .eager("[eventVenue.[venueImages]]")
    .modifyEager('eventVenue', builder => {
      builder.select('id', 'venueName', 'venueAddress', 'websiteURL', 'venueCapacity', 'ticketCapacityPercent')
        .modifyEager('venueImages', builder => {
          builder.select('id', 'venueImages')
        })
    })
    .where('userId', req.user.id).whereNotNull('venueId')
    .orderBy('id', 'desc');
  if (eventVenue.length == 0) {
    return notFoundError(res, Message("venueNotFond"));
  }
  return okResponse(res, eventVenue, Message("venueList"));
}

const myVenues = async (req, res) => {
  //knex.raw("distinct('\"venueId\"')")
  var venueObjArr;
  console.log(req.user);
  if (req.user.userType == 'venuer') {
    let previouslyUsed = await VenueEvents.query().select('venueId as id', 'venueName', 'venueAddress', 'latitude', 'longitude', 'venueType')
      .mergeNaiveEager('venueImages')
      .modifyEager('venueImages', builder => {
        builder.select('id', 'venueImages').limit(1)
      })
      .where('userId', req.user.id).whereNotNull('venueId')
      .orderBy('id', 'desc')

    let mymap = new Map();
    const unique = previouslyUsed.filter(el => {
      const val = mymap.get(el.venueName);
      if (val) {
        if (el.id < val) {
          mymap.delete(el.venueName);
          mymap.set(el.venueName, el.id);
          return true;
        } else {
          return false;
        }
      }
      mymap.set(el.venueName, el.id);
      return true;
    });
    //.where('userId', req.user.id)
    let venue = await Venue.query().skipUndefined().select('id', 'venueName', 'venueAddress', 'websiteURL', 'venueCapacity', 'ticketCapacityPercent','is_active'
    )
      .mergeNaiveEager('venueImages')
      .modifyEager('venueImages', builder => {
        builder.select('id', 'venueImages').limit(1)
      })
      .where('userId', req.user.id)
      .orderBy('id', 'desc');
    // .andWhere("isActive","true").orderBy('created_at', 'desc');

    let ids = [];
    venue.forEach(e => {
      ids.push(e.id);
    });
    let images = await VenueImages.query().skipUndefined().select('venueImages').whereIn('venueId', ids).first();
    venue.venueImages = images;
    for (var i = 0; i < venue.length; i++) {
      if (req.user.userType == "venuer") {
        venue[i].isVenueOwner = true
        // venue[i].venueImages = images;
      } else {
        venue[i].isVenueOwner = false;
        //venue[i].venueImages = images;
      }
    }
    venueObjArr = { 'previouslyUsed': unique.length > 0 ? unique : [], 'myVenues': venue.length > 0 ? venue : [] }
  } else if (req.user.userType == 'host' || req.user.userType == 'promoter') {
    let previouslyUsed = await VenueEvents.query().select('venueId as id', 'venueName', 'venueAddress', 'latitude', 'longitude', 'venueType')
    .mergeNaiveEager('venueImages')
    .modifyEager('venueImages', builder => {
      builder.select('id', 'venueImages').limit(1)
    })
    .where('userId', req.user.id).whereNotNull('venueId')
    .orderBy('id', 'desc')

  let mymap = new Map();
  const unique = previouslyUsed.filter(el => {
    const val = mymap.get(el.venueName);
    if (val) {
      if (el.id < val) {
        mymap.delete(el.venueName);
        mymap.set(el.venueName, el.id);
        return true;
      } else {
        return false;
      }
    }
    mymap.set(el.venueName, el.id);
    return true;
  });
    let venue = await Venue.query().skipUndefined().select('id','userId','venueName', 'venueAddress', 'websiteURL', 'venueCapacity', 'ticketCapacityPercent','is_active'
    )
      .mergeNaiveEager('venueImages')
      .modifyEager('venueImages', builder => {
        builder.select('id', 'venueImages').limit(1)
      })
      .where('isVenueAvailableToOtherHosts', true)
      //.where('userId',req.user.id)
      .orderBy('id', 'desc');
      console.log(req.user.userLoginDetail[0].deviceType)
  if(req.user.userLoginDetail[0].deviceType=='desktop'){
    venueObjArr = { 'previouslyUsed': unique.length > 0 ? unique : [], 'myVenues': venue.length > 0 ? venue : [] }
  } else {
    venueObjArr = venue
  }
    
    //
  }
  return okResponse(res, venueObjArr, Message("venueList"));
}

// getVenue According to user 

const usersVenues = async (req, res) => {
  //knex.raw("distinct('\"venueId\"')")
  var venueObjArr;
  //console.log(req.user);
  if (req.user.userType == 'venuer') {
    let previouslyUsed = await VenueEvents.query().select('venueId as id', 'venueName', 'venueAddress', 'latitude', 'longitude', 'venueType')
      .mergeNaiveEager('venueImages')
      .modifyEager('venueImages', builder => {
        builder.select('id', 'venueImages').limit(1)
      })
      .where('userId', req.user.id).whereNotNull('venueId')
      .orderBy('id', 'desc') .runAfter((result, builder) =>{
        console.log(builder.toKnexQuery().toQuery(),'check event query')
        return result;
     });

    let mymap = new Map();
    const unique = previouslyUsed.filter(el => {
      const val = mymap.get(el.venueName);
      if (val) {
        if (el.id < val) {
          mymap.delete(el.venueName);
          mymap.set(el.venueName, el.id);
          return true;
        } else {
          return false;
        }
      }
      mymap.set(el.venueName, el.id);
      return true;
    });
    //.where('userId', req.user.id)
    let venue = await Venue.query().skipUndefined().select('id', 'venueName', 'venueAddress', 'websiteURL', 'venueCapacity', 'ticketCapacityPercent','is_active','createByAdmin'
    )
      .mergeNaiveEager('venueImages')
      .modifyEager('venueImages', builder => {
        builder.select('id', 'venueImages').limit(1)
      })
      .where('userId', req.user.id)
      // .orWhere('userId','IS',null)
      .orderBy('id', 'desc').runAfter((result, builder) =>{
        console.log(builder.toKnexQuery().toQuery(),'check event query')
        return result;
     });
    // .andWhere("isActive","true").orderBy('created_at', 'desc');

    let ids = [];
    venue.forEach(e => {
      ids.push(e.id);
    });
    let images = await VenueImages.query().skipUndefined().select('venueImages').whereIn('venueId', ids).first();
    venue.venueImages = images;
    for (var i = 0; i < venue.length; i++) {
      if (req.user.userType == "venuer") {
        venue[i].isVenueOwner = true
        // venue[i].venueImages = images;
      } else {
        venue[i].isVenueOwner = false;
        //venue[i].venueImages = images;
      }
    }
    venueObjArr = { 'previouslyUsed': unique.length > 0 ? unique : [], 'myVenues': venue.length > 0 ? venue : [] }
  } else if (req.user.userType == 'host' || req.user.userType == 'promoter' || req.user.userType == 'member') {
    let previouslyUsed = await VenueEvents.query().select('venueId as id', 'venueName', 'venueAddress', 'latitude', 'longitude', 'venueType')
    .mergeNaiveEager('venueImages')
    .modifyEager('venueImages', builder => {
      builder.select('id', 'venueImages').limit(1)
    })
    .where('userId', req.user.id).whereNotNull('venueId')
    .orderBy('id', 'desc')

  let mymap = new Map();
  const unique = previouslyUsed.filter(el => {
    const val = mymap.get(el.venueName);
    if (val) {
      if (el.id < val) {
        mymap.delete(el.venueName);
        mymap.set(el.venueName, el.id);
        return true;
      } else {
        return false;
      }
    }
    mymap.set(el.venueName, el.id);
    return true;
  });
    let venue = await Venue.query().skipUndefined().select('id','userId','venueName', 'venueAddress', 'websiteURL', 'venueCapacity', 'ticketCapacityPercent','is_active','createByAdmin'
    )
      .mergeNaiveEager('venueImages')
      .modifyEager('venueImages', builder => {
        builder.select('id', 'venueImages').limit(1)
      })
      .where('userId',req.user.id)
      .orderBy('id', 'desc').runAfter((result, builder) =>{
        console.log(builder.toKnexQuery().toQuery(),'check event query')
        return result;
     });
      console.log(req.user.userLoginDetail[0].deviceType)
  // if(req.user.userLoginDetail[0].deviceType=='desktop'){
  //   venueObjArr = { 'previouslyUsed': unique.length > 0 ? unique : [], 'myVenues': venue.length > 0 ? venue : [] }
  // } else {
  //   venueObjArr = venue
  // }

  venueObjArr = { 'previouslyUsed': unique.length > 0 ? unique : [], 'myVenues': venue.length > 0 ? venue : [] }
    
    //
  }
  return okResponse(res, venueObjArr, Message("venueList"));
}

const getSubvenueDetail = async (req, res) => {
  let venueId = req.query.venueId;
  let todayDate = new Date();
  let todayTime = moment(todayDate).format('YYYY-MM-DD HH:mm:ss');
  let [err, subVenue] = await to(SubVenue.query().select("id", "subVenueName", "subVenueCapacity").where('venueId', venueId))
  for (let i = 0; i < subVenue.length; i++) {
    
    let [err, checksubvenue] = await to(SubVenueEvents.query().select('id as subVenueEventId', 'venueId', 'subVenueId', 'reserveTime', 'userId', 'eventId').where('subVenueId', subVenue[i].id).first())
    if (checksubvenue) {
      
      console.log(checksubvenue.reserveTime);
      let reserveDateTime = moment(checksubvenue.reserveTime).format('YYYY-MM-DD HH:mm:ss')
      console.log('resele',reserveDateTime);
      subVenue[i].subVenueEventId = checksubvenue.subVenueEventId
      if ((req.user.id == checksubvenue.userId) && (req.query.eventId && (req.query.eventId == checksubvenue.eventId))) {
        subVenue[i].isBooked = 'No'
      } else if (reserveDateTime < todayTime) {
        subVenue[i].isBooked = 'No'
      }
      // commented by discusing anshul 
      // } else {
      //   subVenue[i].isBooked = 'yes'
      // }
    } else {
      subVenue[i].isBooked = 'No'
      subVenue[i].subVenueEventId = 0
    }
  }

  subVenue.forEach(sbvenue => {
    sbvenue.isBooked = 'No'
   }
  )
 
  return okResponse(res, subVenue, Message("venueList"));
}
//Old not in use
const lockSubVenue = async (req, res) => {
  let data = req.body;
  let todayDate = new Date();
  let todayTime = moment(todayDate).add(20, 'minutes').format('YYYY-MM-DD HH:mm:ss');
  data.subVenues.map(sbvenue => {
    sbvenue.reserveTime = todayTime;
    sbvenue.userId = req.user.id
  })
  let [err, addVenue] = await to(SubVenueEvents.query().upsertGraph(data.subVenues));
  if (err) {
    return errorResponse(res, '', err.message);
  }
  return okResponse(res, '', "Venue locked");
}
//new
const lockVenuSubVenue = async (req, res) => {
  //comment 20min conditions as per discussion with sidharth
 
  let data = req.body;

  if (!data.venueId) {
    return badRequestError(res, "", "VenueId is required");
  }
 
  let todayDate = moment.utc().format();
  console.log(todayDate, "- now in UTC"); 
  let currentTime = moment.utc(todayDate).local().format('YYYY-MM-DD HH:mm:ss');
  //let todayTime = moment.utc(todayDate).add(20, 'minutes').local().format('YYYY-MM-DD HH:mm:ss');

  if(data.subVenues){
   // let subv = Array.prototype.map.call(data.subVenues, s => s.subVenueId)

    let subVenueId = [];
        data.subVenues.map(sbvenue => {
      //sbvenue.reserveTime = todayTime;
      //sbvenue.userId = req.user.id
      subVenueId.push(sbvenue.subVenueId)
    })  

    let subVenueIdArr = subVenueId;
    console.log(subVenueIdArr);
    let events =  await Event.query().skipUndefined().select('events.id')
      .innerJoinRelation("[subVenueEvent]")
      .eager("[subVenueEvent]")
      .modifyEager('subVenueEvent', builder => {
        builder.select('venueEventId','venueId').whereIn('subVenueId', subVenueIdArr)
      })
      .whereIn('subVenueEvent.subVenueId', subVenueIdArr)
      .whereBetween('end',[data.eventStartDateTime, data.eventEndDateTime])
      .where('status','booked')
      .first()
      .runAfter((result, builder) =>{
        console.log(builder.toKnexQuery().toQuery(),'check event query')
        return result;
     });
  
     if(events){ 
      return errorResponse(res, '', "Subvenue is already booked on selected date time");
    } 
    return okResponse(res, '', "Subvenue Available");
     //comment for removing 20 min condition
  //   console.log('current Time now utc to local',currentTime);
  //   console.log('venueReserveTime',todayTime);

  //   let Subvenuess = await SubVenueEvents.query().select("reserveTime",'userId').whereIn('subVenueId', subVenueIdArr).andWhere('reserveTime','>',currentTime ).first().runAfter((result, builder) =>{
  //     console.log(builder.toKnexQuery().toQuery(),'check reservetime query')
  //     return result;
  //   });
  //  console.log(Subvenuess);
  
  //   if(Subvenuess){
  //     if(req.user.id!=Subvenuess.userId){
  //       return errorResponse(res, '', 'This subvenue is already reserve.');
  //     } else {
  //       return okResponse(res, '', 'Subvenue is Available');
  //     }
  //   }
    // if(data.type==1){
    //   let [err, addVenue] = await to(SubVenueEvents.query().upsertGraph(data.subVenues));
    //   if (err) {
    //     return errorResponse(res, '', err.message);
    //   }
    //   return okResponse(res, '', "Venue locked");
    // } else {
    // return okResponse(res, '', "Venue Available");
    // }
  } else {
    
    // when subvenue is not available then venue check and insert
     // check event condition
    let events =  await Event.query().skipUndefined().select('events.id')
    .innerJoinRelation("[venueEvents]")
    .eager("[venueEvents]")
    .modifyEager('venueEvents', builder => {
      builder.select('eventId','venueId')
    })
    .where('venueEvents.venueId', data.venueId)
    .whereBetween('end',[data.eventStartDateTime, data.eventEndDateTime])
    .first()
    .runAfter((result, builder) =>{
   // console.log(builder.toKnexQuery().toQuery())
      return result;
   });
     //console.log(events);
    if(events){ 
      return errorResponse(res, '', "venue is already booked on selected date time");
    } 
    return okResponse(res, '', "Venue Available");
     //comment for removing 20 min condition
    //check 20 min reserve condition
  //   let venues = await Venue.query().skipUndefined().select("reserveTime",'reservedByUser').where('id', data.venueId).andWhere('reserveTime','>',currentTime ).first()
  //   .runAfter((result, builder) =>{
  //     console.log(builder.toKnexQuery().toQuery())
  //     return result;
  //  });
   
  //   if(venues){
  //     if(req.user.id!=venues.reservedByUser){
  //       return errorResponse(res, '', 'This venue is already reserve.');
  //     } else {
  //       return okResponse(res, '', 'Venue is Available');
  //     }
  //   }
   
    // if(data.type==1){  //comment for removing 20 min condition
    //   let [err, addVenue] = await to(Venue.query().patch({ reserveTime: todayTime,reservedByUser:req.user.id }).where('id', '=', data.venueId));
    //   if (err) {
    //     return errorResponse(res, '', err.message);
    //   }
    //   return okResponse(res, '', "Venue locked");
    // }  else {
    //   return okResponse(res, '', "Venue Available");
    // }
 }
 
}

module.exports = {
  createVenue, 
  getVenue,
  VenueList,
  updateVenue,
  deleteVenue,
  previousEventValue,
  myVenues,
  getSubvenueDetail,
  lockSubVenue,
  lockVenuSubVenue,
  usersVenues
}