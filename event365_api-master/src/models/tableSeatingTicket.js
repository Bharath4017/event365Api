'use strict';

const Model = require('objection').Model;
const Event = require('./events');
const User = require('./users');

class TableSeatingTicket extends Model {
    static get tableName() {
        return 'tableSeatingTicket';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: [],
            properties: {
                id: {
                    type: 'integer'
                },
                evenetId: {
                    type: 'integer'
                },
                ticketName: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 255
                }
            }
        }
    }

    // static get relationMappings() {
    //     return {
    //         users: {
    //             relation: Model.BelongsToOneRelation,
    //             modelClass: User,
    //             join: {
    //                 from: 'tableSeatingTicket.userId',
    //                 to: 'users.id'
    //             }
    //         },
    //         events: {
    //             relation: Model.BelongsToOneRelation,
    //             modelClass: Event,
    //             join: {
    //                 from: 'tableSeatingTicket.eventId',
    //                 to: 'events.id'
    //             }
    //         }
    //     }
    // }
}


module.exports = TableSeatingTicket;