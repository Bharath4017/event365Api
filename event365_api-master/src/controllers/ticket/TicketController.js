const Event = require("../../models/events");
// const EventOccurrence = require('../../models/eventOccurrence');
const User = require("../../models/users");
const NormalTicket = require("../../models/normalTicket");
const TableSeatingTicket = require("../../models/tableSeatingTicket");
const TicketBooked = require("./../../models/ticketBooked");
const TicketInfo = require("./../../models/ticket_info");
const TicketNumber = require("./../../models/ticketNumber");
const RefundTransaction = require('../../models/refundTransaction');
const Payment = require('../../models/payment');
const Notification = require('../../models/notification');
var global = require("../../global_functions");
var global = require("../../global_constants");
var moment = require("moment");
const AndroidNotification = require('./../../middlewares/androidNotification');
const IOSNotification = require('./../../middlewares/iosNotification');
const WebNotification = require('./../../middlewares/webNotification');
let knexConfig = require("../../../db/knex");
const knex = require("knex")(knexConfig["development"]);
const stripe = require('./../../middlewares/stripe');

/**
 * GetTicketOfEvent
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

const BookTicket = async (req, res) => {
    let data = req.body;
    data.userId = req.user.id;
    let [err, bookedTicket] = await to(
        TicketBooked.query()
            .skipUndefined()
            .insertGraph(data, {
                relate: true
            })
    );
   
    if (bookedTicket == undefined || !bookedTicket) {
        return badRequestError(res, "", err);
    }
    return createdResponse(res, {}, "Ticket Created");
};

/**
 * GetTicketOfEvent
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

const GetTicketOfEvent = async (req, res) => {
    let type = await Event.query()
        .skipUndefined()
        .where("id", req.params.eventId)
        .first();
   
    if (type.paidType == "free") {
        let [err, normalTicket] = await to(
            NormalTicket.query()
                .skipUndefined()
                .where("eventId", req.params.eventId)
                .andWhere("ticketType", "free")
        );
        let [error, tableSeatingTicket] = await to(
            TableSeatingTicket.query()
                .skipUndefined()
                .where("eventId", req.params.eventId)
                .andWhere("ticketType", "free")
        );
        if (err) {
            return badRequestError(res, "", "Error in fetching");
        }
        let response = {
            normalTicket,
            tableSeatingTicket
        };
        return okResponse(res, response, "Ticket for event");
    } else if (type.paidType == "paid") {
        let [err, normalTicket] = await to(
            NormalTicket.query()
                .skipUndefined()
                .where("eventId", req.params.eventId)
                .andWhere("ticketType", "paid")
        );
        let [error, tableSeatingTicket] = await to(
            TableSeatingTicket.query()
                .skipUndefined()
                .where("eventId", req.params.eventId)
                .andWhere("ticketType", "paid")
        );
        if (err) {
            return badRequestError(res, "", "Error in fetching");
        }
        let response = {
            normalTicket,
            tableSeatingTicket
        };
        return okResponse(res, response, "Ticket for event");
    } else {
        let [err, normalTicket] = await to(
            NormalTicket.query()
                .skipUndefined()
                .where("eventId", req.params.eventId)
        );
        let [error, tableSeatingTicket] = await to(
            TableSeatingTicket.query()
                .skipUndefined()
                .where("eventId", req.params.eventId)
        );
        if (err) {
            return badRequestError(res, "", "Error in fetching");
        }
        let response = {
            normalTicket,
            tableSeatingTicket
        };
        return okResponse(res, response, "Ticket for event");
    }
};

/**
 * Get All RSVP-
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

const AllRSVP = async (req, res) => {
  
    let response = {};

    //pagination
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : 10;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);
    
    let rspvType;
   
    //let status;
    // All Ticket
   
    if(Array.isArray(req.query.rspvType)==true){
        var str = req.query.rspvType;
        var filkey = str.toString();
        var filter1 = filkey.split(',');
        
        rspvType = await TicketBooked.query()
        .skipUndefined()
        .select("ticketType", "pricePerTicket","totalQuantity","ticketBooked.id")
        .innerJoinRelated('[users,ticket_number_booked_rel]')
        .eager("[users,ticket_number_booked_rel]")
        .modifyEager("users", builder => {
            builder.select("id", "name", "profilePic").where(builder => {
                if (req.query.search)
                    return builder.where("name", "ilike", req.query.search + "%");
            })
        .modifyEager("ticket_number_booked_rel", builder => {
                return builder.select("ticketNumber.id", "status","ticketNumber").whereNot("ticketNumber.status", 'cancelled').whereNot("ticketNumber.status", 'delete')
            })
        }).where("eventId", req.query.eventId).whereIn("ticketType", filter1).whereNot("ticket_number_booked_rel.status", 'cancelled').whereNot("ticket_number_booked_rel.status", 'delete')
        .groupBy("ticketBooked.id").offset(offset).limit(limit)

        rspvTypeCount = await TicketBooked.query()
        .skipUndefined()
        .select(knex.raw('count(distinct("ticketBooked"."id")) as totalDataCount'))
        .whereIn("ticketType", filter1)
        .innerJoinRelation('[users]')
        .eager("[users]")
        .modifyEager("users", builder => {
            builder.select("id").where(builder => {
                if (req.query.search)
                    return builder.where("name", "ilike", req.query.search + "%");
            })
          
        }).where("eventId", req.query.eventId).groupBy("ticketBooked.userId").first()
    } else {
        if (req.query.rspvType == 'all') {
           
            rspvType = await TicketBooked.query()
            .skipUndefined()
            .select("ticketType", "pricePerTicket","totalQuantity","ticketBooked.id")
            .innerJoinRelated('[users,ticket_number_booked_rel]')
            .eager("[users,ticket_number_booked_rel]")
            .modifyEager("users", builder => {
                builder.select("id", "name", "profilePic").where(builder => {
                    if (req.query.search)
                        return builder.where("name", "ilike", req.query.search + "%");
                })
            .modifyEager("ticket_number_booked_rel", builder => {
                    return builder.select("ticketNumber.id", "status","ticketNumber").whereNot("ticketNumber.status", 'cancelled').whereNot("ticketNumber.status", 'delete')
                })
            }).where("eventId", req.query.eventId).groupBy("ticketBooked.id").offset(offset).limit(limit)

            //Get Total record count for frontend pagination
            rspvTypeCount = await TicketBooked.query()
                .skipUndefined()
                .select(knex.raw('count(distinct("ticketBooked"."id")) as totalDataCount'))
                .innerJoinRelation('[users]')
                .eager("[users]")
                .modifyEager("users", builder => {
                    builder.select("id").where(builder => {
                        if (req.query.search)
                            return builder.where("name", "ilike", req.query.search + "%");
                    })
                  
                }).where("eventId", req.query.eventId).groupBy("ticketBooked.userId").first()
            }  else {
                rspvTypeCount = '';
              rspvType = await TicketBooked.query()
                         .skipUndefined()
                         .select("pricePerTicket", "ticketType")
                         .innerJoinRelated('[users,ticket_number_booked_rel]')
                         .eager("[users,ticket_number_booked_rel]")
                        .modifyEager("users", builder => {
                            builder.select("id", "name", "profilePic").where(builder => {
                                if (req.query.search)
                                    return builder.where("name", "ilike", req.query.search + "%");
                            });
                        }) .modifyEager("ticket_number_booked_rel", builder => {
                                return builder.select("ticketNumber.id","ticketNumber.status").whereNot('ticketNumber.status', 'cancelled').whereNot('ticketNumber.status','delete')
                        })
                        .where("eventId", req.query.eventId)
                        .where(builder => {
                            if(req.query.rspvType == 'vip'){
                                builder.andWhere("ticketType", "vipNormal")
                            }else if(req.query.rspvType == 'free'){
                                builder.andWhere("ticketType", "freeNormal") //discussed with gaurav
                            }else if(req.query.rspvType == 'regular'){
                                builder.andWhere("ticketType",'regularPaid')   
                            } else {
                                builder.andWhere("ticketType",'pending') 
                            }
                        })
                        .whereNot('ticketBooked.status', 'cancelled').whereNot('ticketBooked.status','delete')
                        .whereNot('ticket_number_booked_rel.status', 'cancelled').whereNot('ticket_number_booked_rel.status','delete')
                        .groupBy('ticketBooked.id');
                
            }
    
        // if (req.query.rspvType == 'free') {
            
        //     rspvType = await TicketBooked.query()
        //         .skipUndefined()
        //         .select("ticketType", "pricePerTicket")
        //         .where("ticketType", "freeNormal")
               
        //         .eager("[users]")
        //         .modifyEager("users", builder => {
        //             builder.select("id", "name", "profilePic").where(builder => {
        //                 if (req.query.search)
        //                     return builder.where("name", "ilike", req.query.search + "%");
        //             });
        //         }).where("eventId", req.query.eventId).offset(offset).limit(limit);
        // }
    
        //vip
       
        // if (req.query.rspvType == 'vip') {
           
        //     rspvType = await TicketBooked.query()
        //         .skipUndefined()
        //         .select("ticketType", "pricePerTicket")
        //         .where("ticketType", "vipNormal").andWhere("eventId", req.query.eventId).orWhere("ticketType", "vipTableSeating")
            
        //         .eager("[users]")
        //         .modifyEager("users", builder => {
        //             builder.select("id", "name", "profilePic").where(builder => {
        //                 if (req.query.search)
        //                     return builder.where("name", "ilike", req.query.search + "%");
        //             });
        //         }).where("eventId", req.query.eventId).offset(offset).limit(limit);
        //      }
    
        //regular
        // if (req.query.rspvType == 'regular') {
           
        //     rspvType = await TicketBooked.query()
        //         .skipUndefined()
        //         .select("ticketType", "pricePerTicket")
        //         .where("ticketType", "regularNormal").andWhere("eventId", req.query.eventId).orWhere("ticketType", "regularTableSeating")
        //         .eagerAlgorithm(TicketBooked.JoinEagerAlgorithm)
        //         .eagerOptions({
        //             joinOperation: "innerJoin"
        //         })
        //         .eager("[users]")
        //         .modifyEager("users", builder => {
        //             builder.select("id", "name", "profilePic").where(builder => {
        //                 if (req.query.search)
        //                     return builder.where("name", "ilike", req.query.search + "%");
        //             });
        //         }).where("eventId", req.query.eventId).offset(offset).limit(limit);
        //     }
    }

        
   if(rspvTypeCount){
       var totalcount = rspvTypeCount.totaldatacount;
   } else {
    var totalcount = 0;
   }

    response = {
        rspvType: rspvType,
        rspvCount: parseInt(totalcount),
        page: page,
    };

    return okResponse(res, response, Message("ticketList"));
};


/********************************************
     * @name checkIn
 * @description checks in a user with a particular ticket id
 * @param req.body.ticketId  {ticketId is the only required parameter}
 * @param res {stores the response object}
 ********************************************/



const checkIn = async (req, res) => {
    let data = req.body;
    if (req.user.userType == "customer") {
        return badRequestError(res, {}, "Account does not exist");
    }
    let checkMeIn;
    let [err, checkTicket] = await to(TicketNumber.query().select("ticketNumber.id")
        .where(builder => {
            if (data.type == 'QRkey') {
                builder.where('QRCode', data.QRkey);
            } else {
                builder.where('ticketNumber.ticketNumber', data.ticketNumber)
            }
        })
        .whereNot('ticketNumber.status', 'checkedIn')
        .whereNot('ticketNumber.status', 'cancelled')
        .whereNot('ticketNumber.status', 'deleted')
        .innerJoinRelation('ticketBooked_relation')
        .eager('ticketBooked_relation')
        .modifyEager('ticketBooked_relation', builder => {
            return builder.select('id', 'ticketId', 'totalQuantity')
                .eager('users')
                .modifyEager("users", builder => {
                    return builder.select("id", "name", "profilePic")
                })
        })
        .where('ticketBooked_relation.eventId', data.eventId).first());

    if (err) {
      
        return badRequestError(res, {}, err.Message);
    }
    if (checkTicket == undefined || checkTicket.length < 1) {
        return badRequestError(res, {}, "Ticket not available");
    }
    checkMeIn = await TicketNumber.query()
        .patch({
            status: "checkedIn"
        })
        .where(builder => {
            if (data.type == 'QRkey') {
                builder.where({
                    QRCode: data.QRkey,
                    id: checkTicket.id
                });
            } else {
                builder.where({
                    ticketNumber: data.ticketNumber,
                    id: checkTicket.id
                });
            }
        })

    let updateTicketStatus = await TicketBooked.query().update({ status: 'checkedIn' }).whereRaw('(select count(*) from "ticketNumber" where "ticketNumber"."status" = \'booked\' AND "ticketNumber"."ticketBookedId" = ?) < 1', checkTicket.ticketBooked_relation.id).where('id', checkTicket.ticketBooked_relation.id);
    let EventUserToken = await Event.query().skipUndefined().select("events.name", "events.id", "users.deviceToken", "users.deviceType", "users.id as userId", "users.createdBy")
    .where("events.id", req.body.eventId).leftJoinRelation("[users.[userLoginDetail]]").eager('users.[userLoginDetail]')
    .modifyEager('users', builder => {
        builder.select("users.id as userId").where('is_active', true)
        .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser,userLoginDetail as webUser]')
        .modifyEager('androidUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
        })
        .modifyEager('iosUser', builder =>{

            builder.select("deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
        })
        .modifyEager('webUser', builder =>{
            builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')
        })
    }).first();
    let userData = await User.query().skipUndefined().select("name", "deviceToken", "deviceType", "id") 
    .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser,userLoginDetail as webUser]')
    .modifyEager('androidUser', builder =>{
        builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
    }) 
    .modifyEager('iosUser', builder =>{
        builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
    })
    .modifyEager('webUser', builder =>{
        builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('loginType', 'Website')
    })
    .where("id", req.user.id).andWhere('is_active', true).first();

    let CustomerInfo = checkTicket.ticketBooked_relation.users.name
    if (EventUserToken.users.androidUser) {
        //Notification Process
        let AndroidNotifi = await AndroidNotification.checkIn(EventUserToken, userData, CustomerInfo);
    } 
    if(EventUserToken.users.iosUser) {
        let IOSeventCreate = await IOSNotification.checkIn(EventUserToken, userData, CustomerInfo);
    }
    if(EventUserToken.users.webUser){
       
    let webNotifi = await WebNotification.checkIn(EventUserToken,userData, CustomerInfo);
    }

    if (checkMeIn == undefined || !checkMeIn)
        return badRequestError(res, {}, Message("notCheckIn"));
    else return okResponse(res, {}, Message("checkIn"));
};


/**************************************************
 * @name fetchEventUsers
 * @description count and stuff of users booked at an event
 * @param req.body.ticketId  {ticketId is the only required parameter}
 * @param res {stores the response object}
 **************************************************/

const fetchCheckedIn = async (req, res) => {
    
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : PER_PAGE;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);
    let status;
    let userCheck = await User.query().select().where("id", req.user.id).where("userType", "customer").first()
        
    if (userCheck) {
        
        return badRequestError(res, {}, Message("invalidUser"));
    }
  
   if(req.query.deviceType=='website'){
   } else {
    if (!req.query.checkedIn)
    return badRequestError(res, {}, "Ticket status is required");
   } 
    

    if (req.query.checkedIn == "true") status = "checkedIn";
    else if (req.query.checkedIn == "false") status = "booked"; 
    else status = '';
    
    let users = await TicketBooked.query()
        .select() //"status", "ticketType"
        // .eagerAlgorithm(TicketBooked.JoinEagerAlgorithm)
        // .eagerOptions({
        //     joinOperation: "innerJoin"
        // })
        .innerJoinRelated('[events.[eventImages,venueEvents] ,users, ticket_number_booked_rel]')
        .eager("[events.[eventImages,venueEvents] ,users, ticket_number_booked_rel]")
        .modifyEager("events", builder => {  
             builder.select("name", "eventCode","start",'end',"description")
            .modifyEager("eventImages", builder => {
                builder.select('id', 'eventImage', 'isPrimary') 
            })
            .modifyEager("venueEvents", builder => {
                 builder.select('venueAddress') 
             })
        })
        .modifyEager("ticket_number_booked_rel", builder => {
            return builder.select("id", "status","ticketNumber", "ticketBookedId","QRCode").where(builder => {
                if(status!='') 
                   builder.where('ticketNumber.status', status)
                else 
                   builder.where('ticketNumber.status', '!=' ,'cancelled')
              
            });
           
        })
        .modifyEager("users", builder => {
            return builder.select("name", "profilePic").where(builder => {
                if (req.query.search)
                    return builder.where("name", "ilike", req.query.search + "%");
            });
        })
        .modifyEager("users.events", builder => {
            return builder
                .select("paidType")
                .where({
                    "events.id": req.query.eventId
                })
                
        }).where("ticketBooked.eventId", req.query.eventId)
          .where(builder => {
            if(status!='') 
               builder.where('ticket_number_booked_rel.status', status)
             else 
                builder.where('ticket_number_booked_rel.status', '!=' ,'cancelled').where('ticket_number_booked_rel.status', '!=' ,'delete')
               
          
        }).groupBy('ticketBooked.id')
         .offset(offset).limit(limit).runAfter((result, builder) =>{
            console.log(builder.toKnexQuery().toQuery())
            return result;
            });

            let usersCount = await TicketBooked.query()
            .select(knex.raw('count(distinct("ticketBooked"."id")) as totalDataCount')) //"status", "ticketType"
            .innerJoinRelation("[users, ticket_number_booked_rel]")
            .modifyEager("users", builder => {
                return builder.select("name", "profilePic").where(builder => {
                    if (req.query.search)
                        return builder.where("name", "ilike", req.query.search + "%");
                });
            })
            .where("eventId", req.query.eventId).where(builder => {
                if (req.query.search){
                    return builder.where("users.name", "ilike", req.query.search + "%");
                }
            })
            .where(builder => {
                if(status!='') 
                   builder.where('ticket_number_booked_rel.status', status)
                 else 
                    builder.where('ticket_number_booked_rel.status', '!=' ,'cancelled')
                   
              
            }).runAfter((result, builder) =>{
               
                return result;
                });
        
    if(req.query.deviceType=='website'){

        return okResponse(res, {users: users, allDataCount: parseInt(usersCount[0].totaldatacount)}, "checkInList")

    } else {

        return okResponse(res, users, Message("checkInList"));  
    }
   
};

/**
 * GetTicket detail
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */

 const getTicketDetail = async (req, res) => {
   
    let userCheck = await User.query().select().where("id", req.user.id).where("userType", "customer").first()
    if (userCheck) {
        return badRequestError(res, {}, Message("invalidUser"));
    }

    let users = await TicketBooked.query()
        .select() //"status", "ticketType"
        .eagerAlgorithm(TicketBooked.JoinEagerAlgorithm)
        .eagerOptions({
            joinOperation: "innerJoin"
        })
        .eager("[events.[eventImages ,venueEvents] ,users, ticket_number_booked_rel,ticket_info]")
        .modifyEager("events", builder => {  
             builder.select("name", "eventCode","start",'end',"description","description2")
            .modifyEager("eventImages", builder => {
                builder.select('id', 'eventImage', 'isPrimary') 
            })
            .modifyEager("venueEvents", builder => {
                 builder.select('venueAddress') 
             })
        }) 
        .modifyEager("ticket_number_booked_rel", builder => {
            return builder.select("id", "status","ticketNumber","QRCode");
        })
        .modifyEager('ticket_info', builder => {
            builder.select('id','ticketName', 'description').where('isTicketDisabled', false)
        })
        .modifyEager("users", builder => {
            return builder.select("name", "profilePic","email","address","phoneNo")
        })
        .where("ticketBooked.eventId", req.query.eventId)
        .where("ticketBooked.id", req.query.id)
        

    return okResponse(res, users, Message("checkInList"));
   
};

/**
 * Get All Payment
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

const getUsersPayments = async (req, res) => {
    
    let response = {};
    //pagination
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : PER_PAGE;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);
    let rspvType;
    //let status;
    // All Ticket
   let loginType = (req.user.userLoginDetail!=undefined) ? ((req.user.userLoginDetail.length> 0) ? req.user.userLoginDetail[0].loginType : 'Application') : 'Application';
    if(loginType=='website' || loginType=='Website'){
        var filter1 = [];
        if (req.query.rspvType){
            str = [req.query.rspvType];
            var filkey = str.toString();
            var filter1 = filkey.split(',');
        }
        var checkrspv = filter1.filter(item => item !== '').length;
      
        rspvType = await TicketBooked.query()
        .skipUndefined()
        .select("ticketBooked.id as ticketBookedId", "ticketId", "QRkey", "pricePerTicket", "ticketType")
        // .eagerAlgorithm(TicketBooked.JoinEagerAlgorithm)
        // .eagerOptions({
        //     joinOperation: "innerJoin"
        // })
        .innerJoinRelation('[users,ticket_number_booked_rel]')
        .eager("[users, ticket_number_booked_rel]")
        .modifyEager("users", builder => {
            builder.select("users.id", "name", "profilePic").where(builder => {
                if (req.query.search)
                    return builder.where("name", "ilike", req.query.search + "%");
            });
        })
        .modifyEager("ticket_number_booked_rel", builder => {
            return builder.select("ticketNumber.id",'ticketNumber.status').where(builder => {
                //if only getting cancelled ticket
                if(req.query.cancelled=='true' && checkrspv==0){
                    builder.where('ticketNumber.status', 'cancelled').where('ticketNumber.cancelledBy', 'partner')
                }
                else if(req.query.cancelled=='false'){ //if not getting cancelled ticket
                    builder.whereNot('ticketNumber.status', 'cancelled').whereNot('ticketNumber.status','delete')
                }else { //if want to get cancelled and other ticket also
                    builder.whereNot('ticketNumber.status', 'delete')
                }
            });
        })
        .where("eventId", req.query.eventId)
        .where(builder => {
            if(checkrspv > 0 && req.query.cancelled=='true'){
                builder.whereIn("ticketType", filter1).whereNot('ticket_number_booked_rel.status', 'delete');
            }
            if(req.query.cancelled=='true' && checkrspv==0){
                builder.andWhere('ticket_number_booked_rel.status', 'cancelled')
                // comment talk by anshul
                // .where('ticket_number_booked_rel.cancelledBy', 'partner')
            }
            else if(req.query.cancelled=='false'){
                builder.whereIn("ticketType", filter1).whereNot('ticketBooked.status', 'cancelled').whereNot('ticket_number_booked_rel.status', 'cancelled').whereNot('ticket_number_booked_rel.status', 'delete')
            }
        }).groupBy('ticketBooked.id').offset(offset).limit(limit).runAfter((result, builder)=>{
            console.log(builder.toKnexQuery().toQuery())
            return result;
        });
   
       
    } else {

        if (req.query.rspvType == 'cancelled') {
            console.log('jg');
             rspvType = await TicketBooked.query()
                 .skipUndefined()
                 .select("ticketBooked.id as ticketBookedId",   "ticketId", "QRkey", "pricePerTicket", "ticketType")
                 .innerJoinRelation('[users,ticket_number_booked_rel]')
                 .eager("[users,ticket_number_booked_rel]")
                 .modifyEager("users", builder => {
                     builder.select("users.id", "name", "profilePic").where(builder => {
                         if (req.query.search)
                             return builder.where("name", "ilike", req.query.search + "%");
                     });
                 }).modifyEager("ticket_number_booked_rel", builder => {
                     return builder.select("ticketNumber.id","ticketNumber.status").where('ticketNumber.status', 'cancelled').where('ticketNumber.cancelledBy', 'partner')
                 })
                 .where("eventId", req.query.eventId).where('ticket_number_booked_rel.status', 'cancelled').where('ticket_number_booked_rel.cancelledBy', 'partner')
                 .groupBy('ticketBooked.id').offset(offset).limit(limit).first().runAfter((result, builder)=>{
                     //console.log(builder.toKnexQuery().toQuery())
                     return result;
                 });
            
        }else{
            rspvType = await TicketBooked.query()
            .skipUndefined()
            .select("ticketBooked.id as ticketBookedId", "ticketId", "QRkey", "pricePerTicket", "ticketType")
            .innerJoinRelation('[users,ticket_number_booked_rel]')
            .eager("[users,ticket_number_booked_rel]")
            .modifyEager("users", builder => {
                builder.select("users.id", "name", "profilePic").where(builder => {
                    if (req.query.search)
                        return builder.where("name", "ilike", req.query.search + "%");
                });
            }) .modifyEager("ticket_number_booked_rel", builder => {
                    return builder.select("ticketNumber.id","ticketNumber.status").whereNot('ticketNumber.status', 'cancelled').whereNot('ticketNumber.status','delete')
            })
            .where("eventId", req.query.eventId)
            .where(builder => {
                if(req.query.rspvType == 'vip'){
                    builder.andWhere("ticketType", "vipNormal")
                }else if(req.query.rspvType == 'regular'){
                    builder.andWhere("ticketType", "regularPaid").orWhere("ticketType", 'freeNormal') //discussed with gaurav
                }else if(req.query.rspvType == 'tableSeatingBoth'){
                    builder.andWhere("ticketType", "regularTableSeating")
                }
            })
            .whereNot('ticketBooked.status', 'cancelled').whereNot('ticketBooked.status','delete')
            .whereNot('ticket_number_booked_rel.status', 'cancelled').whereNot('ticket_number_booked_rel.status','delete').groupBy('ticketBooked.id').offset(offset).limit(limit);
        }

            // if (req.query.rspvType == 'all') {
            
            //     rspvType = await TicketBooked.query()
            //     .skipUndefined()
            //     .select("ticketId", "QRkey", "pricePerTicket")
            //     .where("eventId", req.query.eventId).whereNot('ticketBooked.status', 'cancelled').whereNot('ticketBooked.status','delete')
            //     .innerJoinRelated('[users,ticket_number_booked_rel]')
            //     .eager("[users,ticket_number_booked_rel]")
            //     .modifyEager("users", builder => {
            //         builder.select("id", "name", "profilePic").where(builder => {
            //             if (req.query.search)
            //                 return builder.where("name", "ilike", req.query.search + "%");
            //         });
            //     }) .modifyEager("ticket_number_booked_rel", builder => {
                
            //             return builder.select("ticketNumber.id","ticketNumber.status").whereNot('ticketNumber.status', 'cancelled').whereNot('ticketNumber.status','delete')
            //     }).where("eventId", req.query.eventId).whereNot('ticket_number_booked_rel.status', 'cancelled').whereNot('ticket_number_booked_rel.status','delete').offset(offset).limit(limit);
            // }
            // if (req.query.rspvType == 'vip') {
                
            //     rspvType = await TicketBooked.query()
            //         .skipUndefined()
            //         .select("ticketId", "QRkey", "pricePerTicket")
            //         .where("eventId", req.query.eventId).whereNot('ticketBooked.status', 'cancelled').whereNot('ticketBooked.status','delete').whereNot('ticket_number_booked_rel.status', 'cancelled').whereNot('ticket_number_booked_rel.status','delete')
            //         // .eagerAlgorithm(TicketBooked.JoinEagerAlgorithm)
            //         // .eagerOptions({
            //         //     joinOperation: "innerJoin"
            //         // })
            //         .eager("[users, ticket_number_booked_rel]")
            //         .innerJoinRelated('[users,ticket_number_booked_rel]')
            //         .eager("[users,ticket_number_booked_rel]")
            //         .modifyEager("users", builder => {
            //             builder.select("id", "name", "profilePic").where(builder => {
            //                 if (req.query.search)
            //                     return builder.where("name", "ilike", req.query.search + "%");
            //             });
            //         }).modifyEager("ticket_number_booked_rel", builder => {
            //             return builder.select("ticketNumber.id","ticketNumber.status").whereNot('ticketNumber.status', 'cancelled').whereNot('ticketNumber.status','delete')
            //         })
            //         .where("eventId", req.query.eventId).whereNot('ticket_number_booked_rel.status', 'cancelled')
            //         .whereNot('ticket_number_booked_rel.status','delete').offset(offset).limit(limit);
            // }
            // //regular
            // if (req.query.rspvType == 'regular') {
            
            //     rspvType = await TicketBooked.query()
            //         .skipUndefined()
            //         .select("ticketId", "QRkey", "pricePerTicket", "ticketType")
            //         .innerJoinRelated('[users,ticket_number_booked_rel]')
            //         .eager("[users,ticket_number_booked_rel]")
            //         .modifyEager("users", builder => {
            //             builder.select("id", "name", "profilePic").where(builder => {
            //                 if (req.query.search)
            //                     return builder.where("name", "ilike", req.query.search + "%");
            //             });
            //         }).modifyEager("ticket_number_booked_rel", builder => {
            //             return builder.select("ticketNumber.id","ticketNumber.status").whereNot('ticketNumber.status', 'cancelled').whereNot('ticketNumber.status','delete')
            //         })
            //         .where("eventId", req.query.eventId).where("ticketType", "regularNormal")
            //         .whereNot('ticketBooked.status', 'cancelled').whereNot('ticketBooked.status','delete').whereNot('ticket_number_booked_rel.status', 'cancelled')
            //         .whereNot('ticket_number_booked_rel.status','delete').offset(offset).limit(limit);
            // }
            // if (req.query.rspvType == 'tableSeatingBoth') {
            
            //     rspvType = await TicketBooked.query()
            //         .skipUndefined()
            //         .select("ticketId", "QRkey", "pricePerTicket", "ticketType")
            //         .where("ticketType", "regularTableSeating")
            //         .whereNot('ticketBooked.status', 'cancelled').whereNot('ticketBooked.status','delete')
            //         .innerJoinRelated('[users,ticket_number_booked_rel]')
            //         .eager("[users,ticket_number_booked_rel]")
            //         .modifyEager("users", builder => {
            //             builder.select("id", "name", "profilePic").where(builder => {
            //                 if (req.query.search)
            //                     return builder.where("name", "ilike", req.query.search + "%");
            //             });
            //         }).modifyEager("ticket_number_booked_rel", builder => {
            //             return builder.select("ticketNumber.id","ticketNumber.status").whereNot('ticketNumber.status', 'cancelled').whereNot('ticketNumber.status','delete')
            //         })
            //         .where("eventId", req.query.eventId).whereNot('ticket_number_booked_rel.status', 'cancelled')
            //         .whereNot('ticket_number_booked_rel.status','delete').offset(offset).limit(limit);
            // }
    }
    response = {
        rspvType: rspvType,
        page: page,
    };

    return okResponse(res, response, Message("ticketList"));
};

/**
 * User Payment Details
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

 const userPaymentDetails = async (req, res) => {
    
    let PaymentData = await TicketBooked.query()
        .skipUndefined()
        .distinct("QRkey")
      
        .eager("[events, users]")
        .modifyEager("events", builder => {
            builder.select("name", "start", "end").eager("[venueEvents as address, ticketBooked]")
                .modifyEager("address", builder => {
                    builder.select("venueAddress").first()
                })
                .modifyEager("ticketBooked", builder => {
                    builder.select("ticketType", "pricePerTicket", "totalQuantity").where("QRkey", req.query.QRkey)
                    .where(builder =>{
                        if(req.query.ticketId!=undefined){
                            builder.where('ticketBooked.ticketId', req.query.ticketId)
                        }
                    })
                })
        })
        .modifyEager("users", builder => {
            builder.select("id", "name", "email", "latitude", "longitude")
        })
        .where("QRkey", req.query.QRkey)
        .where(builder =>{
            if(req.query.ticketId!=undefined){
                builder.where('ticketBooked.ticketId', req.query.ticketId)
            }
           
        }).first()
    let response = {
        paymentUser: PaymentData,
    }
    return okResponse(res, response, Message("userPaymentDetails"));
}

/**
 * User invite
 * @param {stores the requested parameters} req
 * @param {stores the response parameters} res
 */

const inviteUser = async (req, res) => {
    
    let userIds = req.body.id;
    //user List
    userList = await User.query().select("id", "name", "deviceToken", "deviceType","isNotify")
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
    .whereIn('id', userIds);

    //Host List
    let hostList = await User.query()
        .skipUndefined().select("id", "name", "deviceToken", "profilePic","isNotify")
        .where("id", req.user.id).first();

    //eventimfo
    let eventInfo = await Event.query()
        .skipUndefined().select("id", "name", "start", "end")
        .where("id", req.params.eventId).first();

            var AndroidNotifi = await AndroidNotification.sendInviteUser(userList, hostList, eventInfo);
       
            var IOSNotifi = await IOSNotification.sendInviteUserIOS(userList, hostList, eventInfo);

            let webNotifi = await WebNotification.sendInviteUser(userList,hostList, eventInfo);
        
           return okResponse(res, [], Message("inviteUser"));
};


/**
 * Ticket Cancelled
 * @param {stores the requested parameters} req.params.QRkey
 * @param {stores the requested parameters} req.params.userId
 * @param {stores the response parameters} res
 */


const ticketCancelled = async (req, res) => {
  
    let data = req.body;
    if(!data.userId || !data.QRkey){
        return badRequestError(res, {}, "Required parameter not found");
    }
    if(!data.ticketBookedId){
        return badRequestError(res, {}, "ticketBookedId parameter not found");
    }
    // let ticketData = await TicketBooked.query()
    //     .patch({
    //         status: "cancelled",
    //     })
    //     .where({
    //         QRkey: data.QRkey,
    //         userId: data.userId
    //     })
    //     .whereNot(status,'checkedIn');
    let todayDate = new Date();
    
    // let checkEvent = await Event.query().select('id').where('end', '>', todayDate).where('isDeleted', false).first();
    // if(!checkEvent){
    //     return badRequestError(res, "", "Event has been expired")
    // }

    let checkStatus = await TicketBooked.query().select('ticketBooked.id','ticketBooked.eventId', 'ticketBooked.status', 'ticketId', 'pricePerTicket','ticketBooked.ticketType')
        .innerJoinRelation('ticket_number_booked_rel')
        .eager('ticket_number_booked_rel')
        .modifyEager('ticket_number_booked_rel', builder => {
            //return builder.select('ticketNumber.id', 'ticketNumber.status').where('ticketNumber.status', 'booked').whereIn('ticketNumber.id', [data.ticketNumberId]).first();
            return builder.select(knex.raw('array_agg(DISTINCT "ticketNumber"."id") as ticketNumberId, count("ticketNumber"."id") as totalQuantities')).where('ticketNumber.status', 'booked')
            .where((builder) => {
                if(data.ticketNumberId){
                    builder.where('ticketNumber.id', data.ticketNumberId)
                }
            })
            .groupBy('ticketBookedId').first();
        })
        .where((builder) => {
            if(data.ticketNumberId){
                builder.where('ticket_number_booked_rel.id', data.ticketNumberId)
            }
        })
        .where('ticket_number_booked_rel.status', 'booked')
        .where({
            QRkey: data.QRkey,
            userId:  data.userId,
            'ticketBooked.id': data.ticketBookedId
        }).first().runAfter((result, builder)=>{
           // console.log(builder.toKnexQuery().toQuery())
            return result;
        });
       
   
        // let checkStatus11 = await TicketNumber.query().skipUndefined().count('id').where('status', 'booked').where('ticketBookedId',data.ticketBookId).first().runAfter((result, builder)=>{
        //     // console.log(builder.toKnexQuery().toQuery())
        //      return result;
        //  });
     
        //  if(checkStatus11.count<=0){
        //      let ticketb = await to(TicketBooked.query().update({ status: 'cancelled'}).whereIn('id', [data.ticketBookId]).where('status','notCheckedIn'));
        //     // return badRequestError(res, {}, Message("userTicketCancelled"));
        //  }
     
        
          
    if (!checkStatus) {
        //console.log('h')
       // let ticketb = await to(TicketBooked.query().update({ status: 'cancelled'}).whereIn('id', [data.ticketBookedId]).where('status','notCheckedIn'));
        return badRequestError(res, {}, Message("userTicketCancelled"));
    }
    
    let checkEvent = await Event.query().select('id').where('end', '>', todayDate).where('isDeleted', false).where('isArchived',false).where('is_active', true).where('id', checkStatus.eventId).first();
    if(!checkEvent){
        return badRequestError(res, "", "Event has been expired")
    }
    
    let checkTicketDetail = await TicketInfo.query().select('id', 'cancellationChargeInPer', 'userId', 'ticketType').where('id', checkStatus.ticketId).first();
    if (!checkTicketDetail) {
        //console.log('h')
        return badRequestError(res, {}, Message("ticketDetailNotFound"));
    }
    let [err, ticketData] = await to(TicketNumber.query().update({ status: 'cancelled', cancelledBy: 'partner' }).whereIn('id', checkStatus.ticket_number_booked_rel[0].ticketnumberid).where('status', 'booked').first()
    .runBefore((result, builder)=>{
         console.log(builder.toKnexQuery().toQuery())
         return result;
     }));
    if (err) {
       // console.log(err,'er')
        return badRequestError(res, {}, Message("alreadyCancel"));
    }
    //console.log(ticketData, 'ticketData amount');

    if (ticketData) {
        if(checkTicketDetail.ticketType != 'freeNormal'){

            
            let getPayement = await Payment.query().select('amount','fees').where('QRkey', data.QRkey).where('status', 'succeeded').first().runAfter((result, builder)=> {
                console.log(builder.toKnexQuery().toQuery())
                 return result;
            });

            if(data.ticketNumberId){
            
            var totalAmount = parseFloat(checkStatus.pricePerTicket);
            var  totalAmount = (parseInt(checkStatus.pricePerTicket)*parseInt(checkStatus.ticket_number_booked_rel[0].totalquantities))

            } else {

            var totalAmount = parseFloat(getPayement.amount)-parseFloat(getPayement.fees*100);

            }
           
            let stripeAmount = parseFloat(totalAmount);
            console.log(stripeAmount);
           
            let selectPI = await Payment.query().update({ 'balanceAmount': knex.raw('?? - ' + parseFloat(stripeAmount), ["balanceAmount"]) }).where('QRkey', data.QRkey).where('status', 'succeeded').where('balanceAmount', '>=', parseFloat(stripeAmount)).returning('paymentId', 'id').runAfter((result, builder)=> {
               // console.log(builder.toKnexQuery().toQuery())
                return result;
            });
            console.log(selectPI, 'sel');
            if (selectPI != undefined && selectPI.length > 0) {
                
                let [err, Stripedata] = await to(stripe.refundAmountPI({ token: selectPI[0].paymentId, amount: stripeAmount }))
                if ((err) || (!Stripedata)) {
                    console.log(err, 'err')
                    //console.log(Stripedata, 'Stripedata')
                    //update status as booked if error got
                    let addRefDetail = await RefundTransaction.query().insert({ 'amount': totalAmount, status:"Failed", 'paymentId': selectPI[0].id }).returning('id')
                    //console.log('stripedata','0');
                    await TicketNumber.query().skipUndefined().update({ refundId: addRefDetail.id }).whereIn('id', checkStatus.ticket_number_booked_rel[0].ticketnumberid);
                    [err, ticketData] = await to(TicketNumber.query().update({ status: 'booked', cancelledBy: null }).whereIn('id', checkStatus.ticket_number_booked_rel[0].ticketnumberid).where('status', 'cancelled'));
                    return badRequestError(res, {}, Message("RefundProcess"));
                }
                if (Stripedata) {
                    console.log('stripedata');
                    //credit cancellation amount to host
                    //update refund status and increase ticket quantity
                    let addRefDetail = await RefundTransaction.query().insert({ 'amount': totalAmount, rf_id: Stripedata.id, status: Stripedata.status, 'paymentId': selectPI[0].id }).returning('id')
                    //console.log('stripedata','0');
                    await TicketNumber.query().update({ refundId: addRefDetail.id }).whereIn('id', checkStatus.ticket_number_booked_rel[0].ticketnumberid);
                    await TicketInfo.query().update({ 'totalQuantity': knex.raw('?? + ' + 1 + '', ['totalQuantity']) }).where('id', checkStatus.ticketId);
                    //await TicketBooked.query().update({ 'totalQuantity': knex.raw('?? - ' + 1 + '', ['totalQuantity']) }).where('id', data.ticketBookedId);
                }
            }else{
                [err, ticketData] = await to(TicketNumber.query().skipUndefined().update({ status: 'booked', cancelledBy: null }).whereIn('id', checkStatus.ticket_number_booked_rel[0].ticketnumberid).where('status', 'cancelled'));
                if(data.ticketNumberId){
                 return badRequestError(res, {}, Message("RefundProcess"));  
                }
            }
        }else{
            //await TicketBooked.query().update({ 'totalQuantity': knex.raw('?? - ' + 1 + '', ['totalQuantity']) }).where('id', where('ticketBookedId', data.ticketBookedId));
        }
        //check all ticket number status for changing ticket booked table status 
        let checkTicketNumberCount = await TicketNumber.query().count('id').where('ticketBookedId', data.ticketBookedId)
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
                    id: checkStatus.id,
                });
        }
        //update refund status and increase ticket quantity
        await TicketInfo.query().update({ 'totalQuantity': knex.raw('?? + ' + 1 + '', ['totalQuantity']) }).where('id', checkStatus.ticketId);

    }else{

        return badRequestError(res, {}, Message("SomeError"));
    }


    const hostData = await User.query().select('id').where('id', req.user.id).first(); 

    const event = await Event.query().select('name','id').where('id', checkStatus.eventId)

    const userData = await User.query().select('id', 'name', 'deviceType', 'deviceToken','isNotify')
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
    .where('id', data.userId).first(); 
     // console.log(userData,'users');
    if(userData){
        if (userData.androidUser) {
            let AndroideventCreate = await AndroidNotification.ticketCancelled(userData,hostData,checkStatus,event);
        }
         if(userData.iosUser) {
            let IOSeventCreate = await IOSNotification.ticketCancelled(userData,hostData,checkStatus,event);
        }
        if(userData.webUser){
            let webNotifi = await WebNotification.ticketCancelled(userData,hostData,checkStatus,event);
        }
    }

  
    // //console.log("user List",ticketData);
    // //User Notification Process
    // let userInfo = await User.query()
    //   .skipUndefined().select("id", "name", "deviceToken").where("id", req.params.userId).first();
    //   //console.log("Host List", userInfo)
    // //Notification Process
    // var AndroidNotifi = await AndroidNotification.sendInviteUser(userList, hostList);
    return okResponse(res, [], Message("ticketCancelled"));
};

/**
 * Ticket Cancelled by User
 * @param {stores the requested parameters} req.params.QRkey
 * @param {stores the requested parameters} req.params.userId
 * @param {stores the response parameters} res
 */

const userTicketCancelled = async (req, res) => {
    let data = req.body;
    if (!data.ticketNumberId) {
        return badRequestError(res, "", "Ticket number required")
    }
    if(Array.isArray(data.ticketNumberId)){
        data.ticketNumberId  = data.ticketNumberId;
    }else{
        data.ticketNumberId = [data.ticketNumberId];
    }
    let todayDate = new Date();
    
    let checkStatus = await TicketBooked.query().select('ticketBooked.id', 'ticketBooked.eventId','ticketBooked.eventId','ticketBooked.ticketType', 'ticketBooked.status', 'ticketId', 'totalQuantity', 'pricePerTicket')
        .innerJoinRelation('ticket_number_booked_rel')
        .eager('ticket_number_booked_rel')
        .modifyEager('ticket_number_booked_rel', builder => {
            return builder.select('ticketNumber.id', 'ticketNumber.status').where('ticketNumber.status', 'booked').whereIn('ticketNumber.id', data.ticketNumberId).first();
        })
        .whereIn('ticket_number_booked_rel.id', data.ticketNumberId).where('ticket_number_booked_rel.status', 'booked')
        .where({
            QRkey: data.QRkey,
            userId: req.user.id,
            'ticketBooked.id': data.ticketBookId
        }).first().runAfter((result, builder)=>{
            console.log(builder.toKnexQuery().toQuery())
            return result;
        });
       console.log(checkStatus,'kj');
       
    if (!checkStatus) {
        return badRequestError(res, {}, Message("userTicketCancelled"));
    }

    let checkEvent = await Event.query().select('id').where('end', '>', todayDate).where('isDeleted', false).where('isArchived',false).where('is_active', true).where('id', checkStatus.eventId).first();
    if(!checkEvent){
        return badRequestError(res, "", "Event has been expired")
    }
    if (checkStatus.status == 'notCheckedIn') {
        let checkTicketDetail = await TicketInfo.query().select('id', 'cancellationChargeInPer', 'userId', 'ticketType').where('id', checkStatus.ticketId).first();
        if (!checkTicketDetail) {
            return badRequestError(res, {}, Message("ticketDetailNotFound"));
        }
        let [err, ticketData] = await to(TicketNumber.query().update({ status: 'cancelled',  cancelledBy: 'user' }).whereIn('id', data.ticketNumberId).where('status', 'booked'));
        if (err) {
           
            return badRequestError(res, {}, Message("alreadyCancel"));
        }
       

        if (ticketData) {
            if(checkTicketDetail.ticketType != 'freeNormal'){
                
                let totalAmount = parseFloat(checkStatus.pricePerTicket);
                
                let cancellationPercent = (checkTicketDetail.cancellationChargeInPer) ? parseFloat(checkTicketDetail.cancellationChargeInPer) : 0;
                let cancellationAmount = totalAmount * cancellationPercent / 100; //cancellation amount
                let remainPaidAmount = totalAmount - parseFloat(cancellationAmount);
                let stripeAmount = parseFloat(remainPaidAmount) * 100;
                let selectPI = await Payment.query().update({ 'balanceAmount': knex.raw('?? - ' + parseFloat(stripeAmount), ["balanceAmount"]) }).where('QRkey', data.QRkey).where('status', 'succeeded').where('balanceAmount', '>=', parseFloat(stripeAmount)).returning('paymentId', 'id')
                .runAfter((result, builder)=> {
                    console.log(builder.toKnexQuery().toQuery())
                    return result;
                });
                console.log(selectPI, 'sel');
                if (selectPI != undefined && selectPI.length > 0) {
                    
                    let [err, Stripedata] = await to(stripe.refundAmountPI({ token: selectPI[0].paymentId, amount: stripeAmount }))
                    if ((err) || (!Stripedata)) {
                        console.log(err);
                        [err, ticketData] = await to(TicketNumber.query().update({ status: 'booked',  cancelledBy: null }).whereIn('id', data.ticketNumberId));
                        let addRefDetail = await RefundTransaction.query().insert({ 'amount': remainPaidAmount, status:"Failed", 'paymentId': selectPI[0].id }).returning('id')
                        //update status as booked if error got
                        return badRequestError(res, {}, Message("RefundProcess"));
                    }
                    if (Stripedata) {
                        //credit cancellation amount to host
                        await User.query().update({ 'totalAmount': knex.raw('?? + ' + cancellationAmount, ["totalAmount"]), 'currentAmounts': knex.raw('?? + ' + cancellationAmount, ["currentAmounts"])}).where('id', checkTicketDetail.userId);
                       //update refund status and increase ticket quantity
                        let addRefDetail = await RefundTransaction.query().insert({ 'amount': remainPaidAmount, rf_id: Stripedata.id, status: Stripedata.status, 'paymentId': selectPI[0].id }).returning('id')
                        await TicketNumber.query().update({ refundId: addRefDetail.id }).whereIn('id', data.ticketNumberId);
                        await TicketInfo.query().update({ 'totalQuantity': knex.raw('?? + ' + 1 + '', ['totalQuantity']) }).where('id', checkStatus.ticketId);
                        //await TicketBooked.query().update({ 'totalQuantity': knex.raw('?? - ' + 1 + '', ['totalQuantity']) }).where('id', checkStatus.id); 
                    }
                   
                } else {
                   // console.log('sf')
                   let ticketData = await TicketNumber.query().update({ status: 'booked',  cancelledBy: null }).whereIn('id', data.ticketNumberId).runBefore((result, builder)=> {
                      //  console.log(builder.toKnexQuery().toQuery())
                        return result;
                    });
                   // console.log(err);
                    return badRequestError(res, {}, Message("RefundProcess"));  
                }
            } else {
                //await TicketBooked.query().update({ 'totalQuantity': knex.raw('?? - ' + 1 + '', ['totalQuantity']) }).where('id', checkStatus.id); 
            }
            //check all ticket number status for changing ticket booked table status 
            let checkTicketNumberCount = await TicketNumber.query().count('id').where('ticketBookedId', data.ticketBookId)
            .where(builder =>{
                builder.where('status', 'booked').orWhere('status', 'checkedIn')
            }).first().runAfter((result, builder) => {
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
                        id: data.ticketBookId,
                    });
            }
            //update refund status and increase ticket quantity
           
            await TicketInfo.query().update({ 'totalQuantity': knex.raw('?? + ' + 1 + '', ['totalQuantity']) }).where('id', checkStatus.ticketId);
        }else{
            return badRequestError(res, {}, Message("SomeError"));
        }

    } else if (checkStatus.status == 'checkedIn') {
        return badRequestError(res, {}, Message("cancelCheckedIn"));
    } else {
        return badRequestError(res, {}, Message("alreadyCancel"));
    }

    const event = await Event.query().select('name','id','userId').where('id', checkStatus.eventId).first();

    const hostData =  await User.query().select('id', 'name', 'deviceType', 'deviceToken')
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
    .where('id', event.userId).first();  

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
    .where('id', req.user.id).first(); 
     // console.log(userData,'users');
    if(userData){
        if (userData.androidUser) {
            let AndroideventCreate = await AndroidNotification.userticketCancelledtoUser (userData,hostData,checkStatus,event);
        }
         if(userData.iosUser) {
            let IOSeventCreate = await IOSNotification.userticketCancelledtoUser (userData,hostData,checkStatus,event);
        }
        if(userData.webUser){
            let webNotifi = await WebNotification.userticketCancelledtoUser (userData,hostData,checkStatus,event);
        }

        if (hostData.androidUser && userData) {
            let AndroideventCreate = await AndroidNotification.userticketCancelledtoHost (userData,hostData,checkStatus,event);
        }
         if(hostData.iosUser) {
            let IOSeventCreate = await IOSNotification.userticketCancelledtoHost (userData,hostData,checkStatus,event);
        }
        if(hostData.webUser){
            let webNotifi = await WebNotification.userticketCancelledtoHost (userData,hostData,checkStatus,event);
        }
    }


    return okResponse(res, [], Message("ticketCancelled"));
};

const getTicketByEventId = async (req, res) => {
    if (!req.params.id || !req.params.type) {
        return badRequestError(req, "", "Required parameter not found")
    }

    let ticketType = req.params.type;
    let eventDetail = await Event.query()
        .skipUndefined()
        .where("id", req.params.id)
        .first();
    if (!eventDetail) {

        return notFoundError(res, Message("eventNotFond"));
    }
    
    let [err, ticketDetail] = await to(
        TicketInfo.query().select('id', 'eventId', 'ticketName', 'noOfTables', 'pricePerTable', 'description', 'parsonPerTable', 'totalQuantity', 'pricePerTicket', 'cancellationChargeInPer', 'sellingStartDate', 'sellingStartTime', 'sellingEndDate', 'sellingEndTime')
            .skipUndefined()
            .where("eventId", req.params.id)
            .andWhere("ticketType", ticketType)
            .orderBy('id', 'desc')
    );
    if (err) {
        return badRequestError(res, "", err);
    }
    return okResponse(res, ticketDetail, "Ticket for event");

};

const createTicket = async (req, res) => {
    let data = req.body;
    if (!data.id) {
        return badRequestError(req, "", "Required parameter not found")
    }
    let todayDate = new Date();
    let ticket_info = [];
    //check event
    let checkEvent = await Event.query().select('id', 'userId').where('end', '>', todayDate).where('isDeleted', false).where('isArchived',false).where('is_active', true).where('isArchived', false).where('id', data.id).first();
    if(!checkEvent){
        return badRequestError(res, "", "Event has been expired")
    }
    if(req.user.id != checkEvent.userId){
        return badRequestError(req, "", Message('NotAuthorised'))
    }
    //VIP
    if (data.vipSeatings) {
        vipNormalTicket = (data.vipSeatings);
        Array.prototype.push.apply(ticket_info, await Promise.all(vipNormalTicket.map(async (type) => {
           
            return {
                userId: req.user.id,
                eventId: data.id,
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
                sellingEndTime: type.sellingEndTime
                //ticketNumber: vipticketnum
            }
        })))
    }
    //Table/Seating
    if (data.tableSeatings) {
        vipTableSeatingTicket = (data.tableSeatings);
        Array.prototype.push.apply(ticket_info, await Promise.all(vipTableSeatingTicket.map(async (type) => {
            return {
                userId: req.user.id,
                eventId: data.id,
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
                sellingEndTime: type.sellingEndTime
            }
        })))
    }
    //RSVP
    if (data.regularSeatings) {
        let regularNormalTicket = (data.regularSeatings);
        Array.prototype.push.apply(ticket_info, await Promise.all(regularNormalTicket.map(async (type) => {
            return {
                userId: req.user.id,
                eventId: data.id,
                ticketType: "regularNormal",
                ticketName: type.ticketName,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                description: type.description
            }
        })))
    }
    //Regular Paid
    if (data.regularPaid) {
        regularTableSeatingTicket = (data.regularPaid);
        Array.prototype.push.apply(ticket_info, await Promise.all(regularTableSeatingTicket.map(async (type) => {
            return {
                userId: req.user.id,
                eventId: data.id,
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
                sellingEndTime: type.sellingEndTime
            }
        })))
    }
    //Free
    if (data.free) {
        freeNormalTicket = (data.free);
        Array.prototype.push.apply(ticket_info, await Promise.all(freeNormalTicket.map(async (type) => {
            return {
                userId: req.user.id,
                eventId: data.id,
                ticketType: "freeNormal",
                ticketName: type.ticketName,
                totalQuantity: type.totalQuantity,
                actualQuantity: type.totalQuantity,
                description: type.description,
                sellingStartDate: type.sellingStartDate,
                sellingStartTime: type.sellingStartTime,
                sellingEndDate: type.sellingEndDate,
                sellingEndTime: type.sellingEndTime
            }
        })))
    }
    if(ticket_info.length<1){
        return okResponse(res, {}, "Ticket data is required");
    }
    let [err, add] = await to(TicketInfo.query().insert(ticket_info));
    if(err){
        return okResponse(res, {}, Message('SomeError'));
    }
    return okResponse(res, {}, "Ticket successfully created");
};

module.exports = {
    AllRSVP,
    GetTicketOfEvent,
    BookTicket,
    checkIn,
    fetchCheckedIn,
    getUsersPayments,
    userPaymentDetails,
    ticketCancelled,
    inviteUser,
    getTicketByEventId,
    userTicketCancelled,
    getTicketDetail,
    createTicket
};