'use strict'

const Model = require('objection').Model;

class daysAvailable extends Model{

    static get tableName(){
        return 'daysAvailable'
    }
    static get jsonSchema(){
        return {
            type: 'object',
            required: [],
      
            properties: {
                id: { type: 'integer' },
             // weekDayName :  { type: 'integer' }
            }
        }
    }   

    static get relationMappings(){
        const Venue = require('./venue');
        return {
            venue: {
                relation: Model.HasManyRelation,
                modelClass: Venue,
                join: {
                    from: 'daysAvailable.venueId',
                    to: 'venue.id'
                }
            }
        }
    }

}

module.exports = daysAvailable;