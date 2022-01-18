'use strict'

const Model = require('objection').Model
const userChooseSubcategory = require('./userChooseSubCategory');
const user = require('./users'); 

class UserChooseCategory extends Model{

    static get tableName(){
        return 'userChooseCategory'
    }

    static get jsonSchema(){
        return {
            type: 'object',
            //required: ['categoryId','userId'],
      
            properties: {
              id: { type: 'integer' },
            //   userId: { type:'integer' },
            //   categoryId: { type: 'integer' },
        
            }
    
        }
    }

    static get relationMappings(){
        return {
            userChooseCategory: {
                relation: Model.HasManyRelation,
                modelClass: userChooseSubcategory,
                join: {
                    from: 'userChooseCategory.id',
                    to: 'userChooseSubcategory.id'
                }
            },
            user: {
                relation : Model.BelongsToOneRelation,
                modelClass: user,
                join: {
                    from: 'userChooseCategory.userId',
                    to: 'user.id'
                }
            }
        }
    }
}

module.exports = UserChooseCategory;