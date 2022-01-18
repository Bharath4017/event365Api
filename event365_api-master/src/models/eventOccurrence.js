'use strict'

const Model = require('objection').Model;

class eventOccurrence extends Model{

    static get tableName(){
        return 'eventOccurrence'
    }

    static get jsonSchema(){
        return {
            type: 'object',
            required: [],
      
            properties: {
            }
        }
    }   

    static get relationMappings(){
        const Event = require('./events');
        return {
            events: {
                relation: Model.BelongsToOneRelation,
                modelClass: Event,
                join: {
                    from: 'eventOccurrence.eventId',
                    to: 'events.id'
                }
            }
        }
    }

}

module.exports = eventOccurrence;