'use strict'

const Model = require('objection').Model;

class ContactVia extends Model{

    static get tableName(){
        return 'contactVia'
    }

    static get jsonSchema(){
        return {
            type: 'object',
            required: [],
      
            properties: {
              id: { type: 'integer' },
              contactVia :{ type: 'string'}
            }
        }
    }

    static get relationMappings(){
        return {
            venue: {
                relation: Model.BelongsToOneRelation,
                modelClass: __dirname + '/venue',
                join: {
                    from: 'contactVia.venueId',
                    to: 'venue.id'
                }
            },
            users: {
                relation: Model.BelongsToOneRelation,
                modelClass: __dirname + '/users',
                join: {
                    from: 'contactVia.userId',
                    to: 'users.id'
                }
            }
        }
    }
}

module.exports = ContactVia;