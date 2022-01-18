'use strict'

const Model = require('objection').Model;

class VenueImages extends Model{

    static get tableName(){
        return 'venueImages'
    }

    static get jsonSchema(){
        return {
            type: 'object',
            required: [],
      
            properties: {
              id: { type: 'integer' },
              venueImages :{ type: 'string'}
            }
        }
    }
    static get relationMappings(){
        const Venue = require('./venue');
        const venueEvents = require('./venueEvents');
        const venueImages = require('./venueImages');
        return {
            venue: {
                relation: Model.ManyToManyRelation,
                modelClass: Venue,
                join: {
                    from: 'venueImages.venueId',
                    to: 'venue.id'
                }
            },
            venueEvents: {
                relation: Model.ManyToManyRelation,
                modelClass: venueEvents,
                join: {
                    from: 'venueImages.venueId',
                    to: 'venueEvents.id'
                }
            }
        }
    }
}

module.exports = VenueImages;