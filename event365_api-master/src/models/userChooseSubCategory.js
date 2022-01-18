'use strict'

const Model = require('objection').Model 
const userChooseCategory  = require('./userChooseCategory');
const Event  = require('./events');
const subCategory  = require('./subCategory');
const Category  = require('./category');

class userChooseSubcategory extends Model{

    static get tableName(){
        return 'userChooseSubcategory'
    }

    static get jsonSchema(){
        return {
            type: 'object',
            
      
            properties: {
             // id: { type: 'integer' },
             
            }
    
        }
    }

    static get relationMappings(){
        return {
            userChooseSubcategory: {
                relation: Model.BelongsToOneRelation,
                modelClass: userChooseCategory,
                join: {
                    from: 'userChooseSubcategory.categoryId',
                    to: 'userChooseCategory.id'
                }
            },
            events: {
                relation: Model.BelongsToOneRelation,
                modelClass: Event,
                join: {
                    from: 'userChooseSubcategory.eventId',
                    to: 'userChooseSubcategory.id'
                }
            },
            category: {
                relation: Model.HasManyRelation,
                modelClass: Category,
                join: {
                    from: 'userChooseSubcategory.categoryId',
                    to: 'category.id'
                }
            },
            subCategory: {
                relation: Model.HasManyRelation,
                modelClass: subCategory,
                join: {
                    from: 'userChooseSubcategory.subCategoryId',
                    to: 'subCategory.id'
                }
            }
        }
    }
}

module.exports = userChooseSubcategory;