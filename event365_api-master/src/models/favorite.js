'use strict'

const Model = require('objection').Model;
const User = require('./users');
const Event = require('./events');
class Favorites extends Model{
    static get tableName() {
        return 'favorite';
    }

static get jsonSchema( ){
    return {
        type: 'object',
        required: [],
        properties: {
          id: { type: 'integer' },
          userId : { type: 'integer'},
          isFavorite: { type: 'boolean', defaultTo: false }
        }
    }
}

static get relationMappings(){
    return {
        users: {
            relation: Model.BelongsToOneRelation,
            modelClass: User,
            join: {
                from: 'favorite.userId',
                to: 'users.id'
            }
        },
        events: {
            relation: Model.BelongsToOneRelation,
            modelClass: Event,
            join: {
              from: 'favorite.eventId',
              to: 'events.id'
            }
          }
        
    }
}
}

module.exports = Favorites;
