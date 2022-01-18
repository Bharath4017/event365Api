'use strict';

const Model = require('objection').Model;
class subVenueEvents extends Model {
    static get tableName() {
        return 'subVenueEvents'
    }
    static get jsonSchema() {
        return {
            type: 'object',
            required: [],

            properties: {
                id: { type: 'integer' }
            }
        }
    }
    static get relationMappings() {
        const subVenue = require('./subVenue');
        return {
            subVenues: {
                relation: Model.HasManyRelation,
                modelClass: subVenue,
                join: {
                    from: 'subVenueEvents.subVenueId',
                    to: 'subVenue.id'
                }
            },
        }
    }
}

module.exports = subVenueEvents;