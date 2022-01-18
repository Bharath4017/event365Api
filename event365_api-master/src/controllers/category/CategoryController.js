'use strict';

const Category = require('../../models/category');
const subCategory = require('../../models/subCategory');
const userChooseSubCategory = require('../../models/userChooseSubCategory');
const eventChooseSubcategory = require('../../models/eventChooseSubcategory');
const User = require('../../models/users');
const Notice = require('../../models/notice');
const Slider = require('../../models/slider');
const validator = require('validator');
const ValidationError = require('objection').ValidationError;
var global = require('../../global_functions');
var global = require('../../global_constants');
var knex = require('knex');
const Event = require('../../models/events');
const TicketInfo = require("./../../models/ticket_info");
var moment = require('moment');
const { val } = require('objection');

/**
 * getCategory
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
//category with user preferences
const getCategory = async (req, res) => {

   
    let category = await Category.query().select('id', 'categoryName', 'categoryImage', knex.raw('(select coalesce("is_active", false)  from "userChooseSubcategory" where "categoryId" = "category"."id" AND "userId"::integer = '+req.user.id+' GROUP BY "categoryId", "is_active") as "isActive"')).where("isActive","true").orderBy('created_at', 'desc')

    if (!category) {
        return badRequestError(res,  "", err);
    } else {
        let maxPricePerTable = await TicketInfo.query().select().max('pricePerTable').where("isTicketDisabled",false).first();
        let maxPricePerTicket = await TicketInfo.query().select().max('pricePerTicket').where("isTicketDisabled",false).first();
        let maxPrice =  maxPricePerTable.max > maxPricePerTicket.max ? maxPricePerTable : maxPricePerTicket;
        
        return okResponse(res, {category:category,maxPrice:maxPrice}, "category fetched! ");
    }
}
/**
 * getSubCategory
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */


const getSubCategory = async (req, res) => {
    let data = req.body;
    let sub = await userChooseSubCategory.query().select('id').distinct('subCategoryId').where('userId', req.user.id).whereIn('categoryId', data.categoryId);

    let [err, getSubCategory] = await to(subCategory.query().where("isActive","true").orderBy('created_at', 'desc'));
   
    for (var i = 0; i < getSubCategory.length; i++) {
        for (var j = 0; j < sub.length; j++) {
           
            if (getSubCategory[i].id == sub[j].subCategoryId) {
                getSubCategory[i]['isActive'] = true;
                break;
            } else {
                getSubCategory[i]['isActive'] = false;
            }
        }
    }
    if (sub.length == 0) {
        for (var i = 0; i < getSubCategory.length; i++) {
            getSubCategory[i]['isActive'] = false;
        }
    }
    
    if (err) {
        return badRequestError(res,  "", err);
    }
    return okResponse(res, getSubCategory, "sub category fetched");
}

/**
 * chooseSubCategory - recommend 2nd process
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const chooseSubCategory = async (req, res) => {
    let data = req.body;

    let deleted = await userChooseSubCategory.query().delete().where('userId',req.user.id);
    for (let i = 0; i < data.length; i++) {
        data[i].userId = req.user.id;
        }
   
    let [err,subCategoryInserted] = await to(userChooseSubCategory.query().insertGraph(data));
    if(err){
      
        return badRequestError(res,  "", "cannot insert category and subcategory");
    }

    let user = await User.query().select("id", "name", "profilePic", "isRemind", "isNotify", "customerId").where('id', req.user.id).first();

    return createdResponse(res, user,  "user chosed subCategory inserted");
}


/**
 * deleteUserCategory
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const deleteUserCategory = async (req, res) => {
    let data = req.body;
  
    let [err, deletedSubCategory] = await to(userChooseSubCategory.query().delete()
    .where((builder) => {
        if(data.subCategoryId){
          builder.andWhere('subCategoryId',data.subCategoryId);
        } 
      })
        .where('userId', req.user.id).where('categoryId', data.categoryId));
    if (err) {
        return badRequestError(res,  "", err.message);
    }
    return createdResponse(res,  "", "category with subCategory deleted");
   
}

/**
 * deleteUserallCategory
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
 const deleteUserallCategory = async (req, res) => {
    let data = req.body;
   
    let [err, deletedSubCategory] = await to(userChooseSubCategory.query().delete()
        .where('userId', req.user.id));
    if (err) {
        return badRequestError(res,  "", err.message);
    }
    return createdResponse(res,  "", "All category with subCategory deleted");
   
}
 
/* getAllSubCategorybyCat
* @param {stores the requested parameters} req
* @param {stores the response} res
*/

const getAllSubCategory = async (req, res) => {
   let sub = await subCategory.query().select('id', 'subCategoryName').where("isActive","true").orderBy('created_at', 'desc');
   return okResponse(res, sub, "Get All Sub Category fetched");
}

/* getAllSubCategorybyCatUser
* @param {stores the requested parameters} req
* @param {stores the response} res
*/

const getAllSubCategoryUser = async (req, res) => {
    let sub =[];
    let sub1 =  await eventChooseSubcategory.query().select('subCategoryId')
    .innerJoinRelation('[subCategory]')
    .eager('subCategory')
    .modifyEager('subCategory', builder => {
        builder.select('id','subCategoryName').where('isActive', true)
    }).where('subCategory.isActive',true).groupBy('subCategoryId').runAfter((result, builder)=>{
       //console.log(builder.toKnexQuery().toQuery())
       return result;
   });

   for(let i=0;i < sub1.length; i++){
    // console.log(category);
     for(let j=0;j< sub1[i].subCategory.length;j++){
         //console.log(category1[i].category[j]);
        let categoryer = sub1[i].subCategory[j];
        sub.push(categoryer);
     }
 }
    
        return okResponse(res, sub, "Get All Sub Category fetched");
 }


/**
 * getAllCategorys //Without login
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */


const getAllCategorys = async (req, res) => {
   console.log(req.user);
   
     let category = await Category.query().select().where("isActive","true").orderBy('created_at', 'desc')

    if (!category) {
        return badRequestError(res,"", err);
    } else {
        let maxPricePerTable = await TicketInfo.query().select().max('pricePerTable').where("isTicketDisabled",false).first();
        let maxPricePerTicket = await TicketInfo.query().select().max('pricePerTicket').where("isTicketDisabled",false).first();
        let maxPrice =  maxPricePerTable.max > maxPricePerTicket.max ? maxPricePerTable : maxPricePerTicket;
      
        return okResponse(res, {category:category,maxPrice:maxPrice}, "category fetched! ");
    }
}

/**
 * getAllCategorysUser //Without login
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */


 const getAllCategorysUser = async (req, res) => { 
    let category = [];
    let todayTime = moment().format('YYYY-MM-DD HH:mm:ss');
    let category1 =  await eventChooseSubcategory.query().select('categoryId')
         .innerJoinRelated('[category,events]')
         .eager('[category,events]')
         .modifyEager('category', builder => {
             builder.select('id', 'categoryName','categoryImage','isActive','created_at','updated_at','searchCount').where('isActive', true).orderBy('searchCount','DESC')
         }).modifyEager('events', builder => {
            builder.select('start', 'end','eventType','name').where('end','>=',todayTime).where('start','<=',todayTime).where('eventType',0)
        })
         .where('category.isActive',true)
         .where('events.end','>=',todayTime)
         .where('events.start','<=',todayTime)
         .where('events.eventType',0)
         .groupBy('categoryId','category.searchCount','eventId')
         .orderBy('category.searchCount','DESC').runAfter((result, builder)=>{
            //console.log(builder.toKnexQuery().toQuery())
            return result;
        });

        console.log(category.length);
           let CategoryData = await Category.query().skipUndefined().select().orderBy('created_at', 'desc');
           for(let i=0;i < category1.length; i++){
              // console.log(category);
               for(let j=0;j< category1[i].category.length;j++){
                   //console.log(category1[i].category[j].categoryName);
                  let categoryer = category1[i].category[j];
                    category.push(categoryer);
                
               }
           }
            
            const obj = [...new Map(category.map(item => [JSON.stringify(item), item])).values()];
           // console.log(obj);
      
     if (!category1) {
         return badRequestError(res,"", err);
     } else {
         let maxPricePerTable = await TicketInfo.query().select().max('pricePerTable').where("isTicketDisabled",false).first();
         let maxPricePerTicket = await TicketInfo.query().select().max('pricePerTicket').where("isTicketDisabled",false).first();
         let maxPrice =  maxPricePerTable.max > maxPricePerTicket.max ? maxPricePerTable : maxPricePerTicket;
       
         return okResponse(res, {category:obj,maxPrice:maxPrice}, "category fetched! ");
     }
 }

/**
 * eventStatus - Archived and Unarchived Event
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

 const updateCategoryCount = async (req, res) => {
 
    let data = req.body;
    if(data.categoryId==undefined){
      return badRequestError(res, "", "required parameter not found");
    }
    let catcount = await Category.query()
      .update({ 'searchCount': knex.raw('?? + ' + parseFloat(1), ["searchCount"]) })
      .where({
        id: data.categoryId
      });
  
      
    if(catcount){
      return okResponse(res, [], "category count has been updated Successfully !");
    }  
    return badRequestError(res, "", Message('SomeError'));
  };
  


/**
 * getSubCategorybyCategoryId - without login
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const getSubCategorybyCategoryId = async (req, res) => {
    let SubCategory
    let categoryId = req.body.categoryId;
    if(categoryId){
        let ids= req.body.categoryId;
        if(req.user!=undefined){
            SubCategory = await subCategory.query().select('*', knex.raw('(select coalesce("is_active", false)  from "userChooseSubcategory" where "subCategoryId" = "subCategory"."id" AND "userId"::integer = '+req.user.id+' GROUP BY "subCategoryId", "is_active") as "isActive"'))
            .whereIn('categoryId', ids).where("isActive","true")
            .eager('[category]')
            .modifyEager('category', builder => { 
            builder.select('categoryName')
        })
            .orderBy('created_at', 'desc');
        }else{
            SubCategory = await subCategory.query().select().whereIn('categoryId', ids).where("isActive","true")
            .eager('[category]')
            .modifyEager('category', builder => { 
            builder.select('categoryName')
        })
            .orderBy('created_at', 'desc');
        }
    }
    return okResponse(res, SubCategory, "SubCategory fetched");
  }

   /**
 * getAllBanner for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */
 
 const getBanner = async (req, res) => {

    var BannerData = await Notice.query().skipUndefined().select("id","bg_color","text","text_color","url","isActive").where('isActive',true).first();
  
  if (!BannerData) {
    return badRequestError(res,  "", "No details");
  }
  return okResponse(res, BannerData, "Get Banner List");
  }

     /**
 * getAllBanner for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */

 const getSlider = async (req, res) => {

 var SliderData = await Slider.query().skipUndefined().select("id","image","time","status").where('status',true);
  
  if (!SliderData) {
    return badRequestError(res,  "", "No Details");
  }
  return okResponse(res, SliderData, "Get Slider List");
  }

module.exports = {
    getCategory,
    getAllCategorys,
    getSubCategory,
    chooseSubCategory,
    deleteUserCategory,
    deleteUserallCategory,
    getAllSubCategory,
    getSubCategorybyCategoryId,
    getAllCategorysUser,
    updateCategoryCount,
    getAllSubCategoryUser,
    getBanner,
    getSlider
}