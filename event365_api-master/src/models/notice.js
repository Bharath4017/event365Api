'use strict'

const Model = require('objection').Model

class Notice extends Model {

    static get tableName() {
        return 'notice'
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
       // const subCategory = require('./subCategory');

        return {
            // subCategory: {
            //     relation: Model.HasManyRelation,
            //     modelClass: subCategory,
            //     join: {
            //         from: 'category.id',
            //         to: 'subCategory.categoryId'
            //     }
            // },
          
        }
    }
}

module.exports = Notice;

