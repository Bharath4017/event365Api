'use strict'

const Model = require('objection').Model
class app_content extends Model {

    static get tableName() {
        return 'app_content'
    }

    static get jsonSchema() {
        return {
            type: 'object',

            properties: {
                id: { type: 'integer' },
                
            }

        }
    }
}

module.exports = app_content;
