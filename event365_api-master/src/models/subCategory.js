'use strict'

const Model = require('objection').Model
const userChooseSubcategory = require('./userChooseSubCategory');
class subCategory extends Model{

    static get tableName(){
        return 'subCategory'
    }

    static get jsonSchema(){
        return {
            type: 'object',
            required: ['subCategoryName'],
      
            properties: {
            //  id: { type: 'integer' },
            //  categoryId: { type: 'integer'},
             // subCategoryName: { type: 'string', minLength: 2, maxLength: 255 },
        
            }
    
        }
    }

    static get relationMappings(){
        const Category = require('./category');

        return {
            category:{
                relation: Model.HasManyRelation,
                modelClass: Category,
                join: {
                    from: 'subCategory.categoryId',
                    to: 'category.id'
                }
            },
            userChooseSubcategory:{
                relation:Model.HasManyRelation,
                modelClass: userChooseSubcategory,
                join:{
                  from:'subCategory.id',
                  to:'userChooseSubcategory.subCategoryId'
                }
              },
        }
    }
}

module.exports = subCategory;