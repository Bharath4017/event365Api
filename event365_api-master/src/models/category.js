'use strict'

const Model = require('objection').Model

const userChooseSubcategory = require('./userChooseSubCategory');
class Category extends Model {

    static get tableName() {
        return 'category'
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: [],

            properties: {
                // id: { type: 'integer' },
                // categoryName: { type: 'string', minLength: 2, maxLength: 255 },
                // eventId: { type: 'integer' },
            }

        }
    }

    static get relationMappings() {
        const subCategory = require('./subCategory');

        return {
            subCategory: {
                relation: Model.HasManyRelation,
                modelClass: subCategory,
                join: {
                    from: 'category.id',
                    to: 'subCategory.categoryId'
                }
            },
            userChooseSubcategory:{
                relation:Model.HasManyRelation,
                modelClass: userChooseSubcategory,
                join:{
                  from:'category.id',
                  to:'userChooseSubcategory.categoryId'
                }
              },
            eventChooseSubcategoryrelation:{
                relation:Model.HasManyRelation,
                modelClass:  __dirname+'/eventChooseSubcategory',
                join:{
                  from:'category.id',
                  to:'eventChooseSubcategory.categoryId'
                }
              },
            preferenceCategory: {
                relation: Model.ManyToManyRelation,
                modelClass: __dirname+'/users',
                join: {
                  from: 'category.id',
                  through: {
                    // persons_movies is the join table.
                    from: 'userChooseSubCategory.categoryId',
                    to: 'userChooseSubCategory.userId'
                  },
                  to: 'users.id'
                }
            }
        }
    }
}

module.exports = Category;

