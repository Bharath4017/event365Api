const Review = require('../../models/reviews');
const User = require('../../models/users');
const Event = require('../../models/events');
const ValidationError = require('objection').ValidationError;
var global = require('../../global_functions');
var global = require('../../global_constants');
//const Message = require('../../middlewares/message');
const AndroidNotification = require('./../../middlewares/androidNotification');
const iosNotification = require('./../../middlewares/iosNotification');
const WebNotification = require('./../../middlewares/webNotification');
var knex = require('knex');
const {
    ref
} = require('objection');

/**
 * createReview and Update Review
 * @params req.body.reviewStar
 * @params req.body.reviewText
 * @params req.body.eventId
 * @return promise
 */

const createReview = async (req, res) => {
  let data = req.body;
  let userid = req.user.id;
  data.userId = userid;
  if (!data.reviewText) {
    return badRequestError(res, "", "Please enter review text ");
  }

  let reviewed = await Review.query().select().where(
    'userId', userid).andWhere('eventId', data.eventId);

  if (reviewed != '') {
    if (reviewed.userId = userid) {
      reviewed = await Review.query().context({
        userId: userid
      }).update({
        "reviewStar": data.reviewStar,
        "reviewText": data.reviewText,

      }).where(
        'userId', userid).andWhere('eventId', data.eventId)
    } else {
      return badRequestError(res, "", Message("reviewNotFond"));
    }
  } else {
    reviewed = await Review.query().insertGraph(data, {
      relate: true
    });
  }
  if (!reviewed) {
    return badRequestError(res, "",  Message("reviewNotFond"));
  }

  //Notification Process

  let EventData = await Event.query().skipUndefined().select("events.name", "events.id", "users.deviceToken", "users.deviceType","users.name as hostName", "users.id as userId", "events.rating", "events.reviewCount").where("events.id", data.eventId)
  .leftJoinRelation("[users.[userLoginDetail]]").eager('users.[userLoginDetail]')
    .modifyEager('users', builder => {
        builder.select("users.id as userId","isNotify").where('is_active', true)
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

  // let userData = await User.query().skipUndefined().select("name", "deviceToken", "id").where("id", req.user.id).first();
  let userData = await User.query().skipUndefined().select("id","name","isNotify")
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
 
if((EventData) && EventData.users){    
   // console.log(EventData.users.userId);
  if (EventData.users.androidUser) {
    let AndroidNotifi = await AndroidNotification.reviewEvent(EventData, userData);
  } 
  if(EventData.users.iosUser) {
    let IOSeventCreate = await iosNotification.reviewEvent(EventData, userData);
  }
  if(EventData.users.webUser){
   // console.log(EventData.users.webUser) 
    let webNotifi = await WebNotification.reviewEvent(EventData, userData);
  }
}


  //Get totalRating
  let eventCount = await Review.query().count("id").where('eventId', data.eventId).first();

  let ReviewE = await Review.query().skipUndefined().select(Review.knex().raw("CASE WHEN sum (\"reviewStar\") is not null THEN sum(\"reviewStar\") ELSE 0 END as reviewStar")).where("id", ref("id")).where('eventId', data.eventId).first()
  //let ReviewTotalSum = ReviewE.reviewstar / 5
  let ReviewTotalSum = ReviewE.reviewstar / eventCount.count;
 
  let UserDataRes = await Event.query().patchAndFetchById(data.eventId, {
    rating: ReviewTotalSum,
    reviewCount: eventCount.count

  });
  return okResponse(res, {},  Message("reviewCreate"));

}

/**
 * deleteReview 
 * @params req.body.property_id;
 * @return promise
 */


const deleteReview = async (req, res) => {
  let data = req.body;
  userId = req.user.id;
  let [err, deleteReviewData] = await to(Review.query().delete()
    .where('eventId', data.eventId)
    .where('userId', req.user.id).first());
  if (err) {
    return badRequestError(res, "", err.message);
  }
  return okResponse(res, '',  Message("reviewDelete"));

}

/**
 * getReview 
 * @params req.body
 * @return promise
 */

const getReview = async (req, res) => {
  let page = (req.query.page) ? req.query.page : 1;
  let limit = req.query.limit ? req.query.limit : 10;
  let offset = req.query.offset ? req.query.offset : limit * (page - 1);
  let orderBys = (req.query.rating=='asc' || req.query.rating=='desc') ? req.query.rating : 'desc';
  let reviews = await Review.query().skipUndefined().select('id', 'reviewStar', 'reviewText', 'eventId', 'updated_at').where({
    id: req.query.id,
    eventId: req.params.eventId
  }).where((builder) => {
    if(req.query.rating!='asc' && req.query.rating!='desc' && req.query.rating){
      builder.andWhere('reviewStar',req.query.rating);
    } 
  })
  .eager('[users as reviewer]').modifyEager('reviewer', builder => {
    builder.select('id', 'name', 'profilePic')
  }).orderBy('id',orderBys).offset(offset).limit(limit)

  if (!reviews) {
    return notFoundError(Message("reviewNotFond"));
  }
  return okResponse(res, reviews, Message("reviewFond"));
}

module.exports = {
  createReview,
  deleteReview,
  getReview
}