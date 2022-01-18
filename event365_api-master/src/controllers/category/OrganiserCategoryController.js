'use strict';

const Category = require('../../models/category');
const subCategory = require('../../models/subCategory');
const userChooseSubCategory = require('../../models/userChooseSubCategory');
const validator = require('validator');
const ValidationError = require('objection').ValidationError;
var global = require('../../global_functions');
var global = require('../../global_constants');
var knex = require('knex');

/**
 * getCategory
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const getCategory = async (req, res) => {

    let sub = await userChooseSubCategory.query().distinct('categoryId').where('userId', req.user.id);
    let category = await Category.query().select().where("isActive","true");
    
    for (var i = 0; i < category.length; i++) {
        for (var j = 0; j < sub.length; j++) {
          
            if (category[i].id == sub[j].categoryId) {
                category[i]['isActive'] = true;
                break;
            } else {
                category[i]['isActive'] = false;
            }
        }
    }
    if (sub.length == 0) {
        for (var i = 0; i < category.length; i++) {
            category[i]['isActive'] = false;
        }
    }
    if (!category) {
        return badRequestError(res,  "", err);
    } else {
        return okResponse(res, category, "category fetched! ");
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

    let [err, getSubCategory] = await to(subCategory.query().select().where("isActive","true").orderBy('created_at', 'desc'));
    
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
 * chooseSubCategory
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const chooseSubCategory = async (req, res) => {
    let data = req.body;

    let deleted = await userChooseSubCategory.query().delete().where('userId',req.user.id);
    for (let i = 0; i < data.length; i++) {
        data[i].userId = req.user.id;
        }
   
    let [err,subCategoryInserted] = await to(userChooseSubCategory.query().insertGraph(data,{relate:true}));
    if(err){
        return badRequestError(res,  "", "cannot insert category and subcategory");
    }
    return createdResponse(res, {}, "user chosed subCategory inserted");
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
    return createdResponse(res,'',"category with subCategory deleted");
   
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
    // }
}
 
/* getAllSubCategorybyCat
* @param {stores the requested parameters} req
* @param {stores the response} res
*/
const getAllSubCategory = async (req, res) => {
   let sub = await subCategory.query().select('id', 'subCategoryName').where("isActive","true");
   return okResponse(res, sub, "Get All Sub Category fetched");
}

/**
 * getCategories for Host side
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const getCategories = async (req, res) => {

    let sub = await userChooseSubCategory.query().distinct('categoryId')
    let category = await Category.query().select('id', 'categoryName').where("isActive","true");
    
    if (!category) {
        return badRequestError(res,  "", err);
    } else {
        return okResponse(res, category, "category fetched! ");
    }
}

/**
 * getSubCategries for Host side
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */
const getSubCategories = async (req, res) => {
    let catId = req.params.id;
    let subCat = await subCategory.query().select('id', 'subCategoryName').where('categoryId',catId);
    return okResponse(res, subCat, "Get All Sub Category fetched");
}

module.exports = {
    getCategory,
    getSubCategory,
    chooseSubCategory,
    deleteUserCategory,
    deleteUserallCategory,
    getAllSubCategory,
    getCategories,
    getSubCategories
}