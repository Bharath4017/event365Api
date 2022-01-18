'use strict';

const Category = require('../../models/category');
const SubCategory = require('../../models/subCategory');
const UserChooseSubcategory = require('../../models/userChooseSubCategory');
const eventChooseSubcategory = require('../../models/eventChooseSubcategory');
const validator = require('validator');
const ValidationError = require('objection').ValidationError;
require('../../global_functions');
require('../../global_constants');
var knex = require('knex');

/**
 * getAllCategory for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */

const getAllCategory = async (req, res) => {

        var CategoryData = await Category.query().skipUndefined().select().orderBy('created_at', 'desc');
   
    if (!CategoryData) {
        return badRequestError("No Details");
    }
    return okResponse(res, CategoryData, "Get All Category List");
}

/**
 * addUpdateCategory for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */
const addUpdateCategory = async (req, res) => {
    let data = req.body;
    let message;
    
    if (!data.categoryName) {
        return badRequestError(res, "", "Please enter Category Name");
    }
    let checkCat = await Category.query().select().where("categoryName", data.categoryName).first();
    if (checkCat){
        return badRequestError(res, "", "This category is already exist");
    }
    if (!data.id) {

        message = "Category added Successfully.";
    } else {
        message = "Category updated Successfully.";
    }

    let CategoryData = await Category.query().upsertGraph(data).returning("id");

    let returnData = {
        "category_list": CategoryData,
    };
    // return response
    return okResponse(res, {
        ...returnData,
    }, message);
}




/**
 * deleteCategory
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const deleteCategory = async (req, res) => {
    
    let checkVenue = await eventChooseSubcategory.query().select().where('categoryId', req.params.id);

    if (checkVenue != "") {
        return badRequestError(res, "", "This Category can not be deleted because event available on this category");
    } else {

        let CategoryData = await Category.query().select().where('id', req.params.id).first();
       
        if (CategoryData == "") {
            return badRequestError(res, "", "Error in deleting Category");
        }
        let deletedVenue = await Category.query().deleteById(req.params.id);
        return okResponse(res, "", "Category has been deleted successfully");

    }
}


/**
 * getSubCatByCatId for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */

const getAllSubCat = async (req, res) => {
    let categoryId = req.params.id;
    let CategoryData = await SubCategory.query().skipUndefined().select().where('categoryId', categoryId).orderBy('created_at', 'desc');
    if (!CategoryData) {
        return badRequestError("No Details");
    }

    return okResponse(res, CategoryData, "Get All SubCategory List")
}



/**
 * addUpdateSubCat for Admin  
 * @param {stores the requested parameters} req.body
 * @param {stores the respose} res 
 */

const addUpdateSubCat = async (req, res) => {
    let data = req.body;
    let message;
    
    if (!data.subCategoryName) {
        return badRequestError(res, "", "Please enter Sub Category Name");
    }
    if(data.subCategoryName=='Other'){
        var checkCat = await SubCategory.query().select().skipUndefined().where("subCategoryName", data.subCategoryName).where('categoryId',data.categoryId).first();
    } else {
        var checkCat = await SubCategory.query().select().skipUndefined().where("subCategoryName", data.subCategoryName).first();
    }
    
    console.log(checkCat);
   
    if (checkCat){
        return badRequestError(res, "", "This Sub Category is already exist");
    }
    if (!data.id) {

        message = "Sub Category added Successfully.";
    } else {
        message = "Sub Category updated Successfully.";
    }

    let CategoryData = await SubCategory.query().skipUndefined().upsertGraph(data).returning("id");

    let returnData = {
        "sub_category_list": CategoryData,
    };
    // return response
    return okResponse(res, {
        ...returnData,
    }, message);
}

/**
 * deleteCategory
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const deleteSubCat = async (req, res) => {
    // let data = req.params.id;
    let checkVenue = await eventChooseSubcategory.query().select().where('subCategoryId', req.params.id).runAfter((result, builder)=>{
        console.log(builder.toKnexQuery().toQuery())
        return result;
    });

    console.log(checkVenue);
    if (checkVenue != "") {
       
        return badRequestError(res, "", "This Sub Category can not be deleted because event available on this Sub Category");
    } else {

        let SubCategoryData = await SubCategory.query().select().where('id', req.params.id).first();
       
        if (SubCategoryData == "") {
            return badRequestError(res, "", "Error in deleting Category");
        }
        let deletedSubCategory = await SubCategory.query().deleteById(req.params.id);
        return okResponse(res, "", "Sub Category has been deleted successfully");

    }
}

/**
 * catStatus - Status Change
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const catStatus = async (req, res) => {
    
    let data = req.body;

    let CategoryStatus = await Category.query()
        .patch({
            isActive: data.isActive
        })
        .where({
            id: data.id
        });

    return okResponse(res, [], "Category Status has been changed Successfully !");
};


/**
 * catStatus - Status Change
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */

const subCatStatus = async (req, res) => {
   
    let data = req.body;

    let CategoryStatus = await SubCategory.query()
        .patch({
            isActive: data.isActive
        })
        .where({
            id: data.id
        });

    return okResponse(res, [], "Category Status has been changed Successfully !");
};

const getAllCategorySubCategory = async (req, res) => {

    let CategoryData = await Category.query().skipUndefined().select('id', 'categoryName', 'created_at')
    .where('isActive', true)
    .eager('subCategory')
    .modifyEager('subCategory', builder => {
        builder.select('id', 'subCategoryName').where('isActive', true).orderBy('subCategoryName', 'ASC')
    })
    .orderBy('categoryName', 'ASC');
    if (!CategoryData) {
        return badRequestError("No Details");
    }
    return okResponse(res, CategoryData, "Get All Category List");
}
module.exports = {
    getAllCategory,
    addUpdateCategory,
    deleteCategory,
    getAllSubCat,
    addUpdateSubCat,
    deleteSubCat,
    catStatus,
    subCatStatus,
    getAllCategorySubCategory

}