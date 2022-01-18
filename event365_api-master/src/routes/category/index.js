const { transaction } = require('objection');
const CategoryController = require('./../../controllers/index').CategoryController;
const OrganiserCategoryController = require('./../../controllers/index').OrganiserCategoryController;
const express = require('express');
const router = express.Router();
const passport = require('passport');
require('./../../middlewares/passport')(passport);


// category routes for user

router.get('/getCategory', passport.authenticate('jwt', { session: false }), CategoryController.getCategory);

//without Login
router.get('/getAllCategorys', CategoryController.getAllCategorys);
router.get('/getAllCategorysUser/',CategoryController.getAllCategorysUser);
router.put('/updateCategoryCount/',passport.authenticate('jwt', { session: false }),CategoryController.updateCategoryCount);
router.post('/getSubCategorybyCategoryId', CategoryController.getSubCategorybyCategoryId);
router.post('/getSubCategorybyCategoryIdWithAuth', passport.authenticate('jwt', { session: false }), CategoryController.getSubCategorybyCategoryId);

router.post('/getSubCategory', passport.authenticate('jwt', { session: false }), CategoryController.getSubCategory);
router.post('/chooseSubCategory', passport.authenticate('jwt', { session: false }), CategoryController.chooseSubCategory);
router.delete('/deleteUserCategory', passport.authenticate('jwt', { session: false }), CategoryController.deleteUserCategory);
router.delete('/deleteUserallCategory', passport.authenticate('jwt', { session: false }), CategoryController.deleteUserallCategory);
router.get('/getAllSubCategory', CategoryController.getAllSubCategory);
router.get('/getAllSubCategoryUser', CategoryController.getAllSubCategoryUser);
module.exports = router;

// category route for organiser

router.get('/organiser/getCategories', OrganiserCategoryController.getCategories);

router.get('/organiser/getSubCategories/:id', OrganiserCategoryController.getSubCategories);

router.post('/organiser/chooseSubCategory', passport.authenticate('jwt', { session: false }), OrganiserCategoryController.chooseSubCategory);
router.delete('/organiser/deleteUserCategory', passport.authenticate('jwt', { session: false }), OrganiserCategoryController.deleteUserCategory);
router.delete('/organiser/deleteUserallCategory', passport.authenticate('jwt', { session: false }), CategoryController.deleteUserallCategory);
router.get('/organiser/getAllSubCategory',OrganiserCategoryController.getAllSubCategory);

router.get('/banner', CategoryController.getBanner);
router.get('/slider', CategoryController.getSlider);

module.exports = router;