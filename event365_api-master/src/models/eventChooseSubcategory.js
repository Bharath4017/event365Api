'use strict'

const Model = require('objection').Model 
const userChooseCategory  = require('./userChooseCategory');
const Event  = require('./events');
const subCategory  = require('./subCategory');
const Category  = require('./category');

class eventChooseSubcategory extends Model{

    static get tableName(){
        return 'eventChooseSubcategory'
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
            events: {
                relation: Model.BelongsToOneRelation,
                modelClass: Event,
                join: {
                    from: 'eventChooseSubcategory.eventId',
                    to: 'events.id'
                }
            },
            categoryEventrelation: {
                relation: Model.BelongsToOneRelation,
                modelClass: Event,
                join: {
                    from: 'eventChooseSubcategory.eventId',
                    to: 'events.id'
                }
            },
            category: {
                relation: Model.HasManyRelation,
                modelClass: Category,
                join: {
                    from: 'eventChooseSubcategory.categoryId',
                    to: 'category.id'
                }
            },
            subCategory: {
                relation: Model.HasManyRelation,
                modelClass: subCategory,
                join: {
                    from: 'eventChooseSubcategory.subCategoryId',
                    to: 'subCategory.id'
                }
            }
        }
    }
}

module.exports = eventChooseSubcategory;