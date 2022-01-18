'use strict'

const Model = require('objection').Model

const Event = require('./events');
const TicketBooked = require('./ticketBooked');
class Payment extends Model {

    static get tableName() {
        return 'payment'    
    }

    static get jsonSchema() {
        return {
            type: 'object',

            properties: {
                id: { type: 'integer' },
                
            }

        }
    }

    static get relationMappings() {
        
        return {
            ticketBooked: {
                relation: Model.HasManyRelation,
                modelClass: TicketBooked,
                join: {
                    from: 'payment.id',
                    to: 'ticketBooked.id'
                }
            }
        }
    }
}

module.exports = Payment; 

