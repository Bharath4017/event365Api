'use strict'

const Model = require('objection').Model

class PaidEventPrice extends Model {

    static get tableName() {
        return 'paidEventPrice'
    }

    static get jsonSchema() {
        return {
            type: 'object',

            properties: {
                id: { type: 'integer' }
            }

        }
    }
    static get relationMappings() {
    }
}

module.exports = PaidEventPrice;
