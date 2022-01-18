'use strict'

const Model = require('objection').Model;
const Event = require('./events');
class Reviews extends Model{
    static get tableName() {
        return 'reviews';
    }

static get jsonSchema( ){
    return {
        type: 'object',
        required: [],
        properties: {
          id: { type: 'integer' },
          userId : { type: 'integer'},
          reviewText: { type: 'string', minLength: 2, maxLength: 255 }
        }
    }
}

static get relationMappings(){
    const User = require('./users');
    return {
        users: {
            relation: Model.BelongsToOneRelation,
            modelClass: User,
            join: {
                from: 'reviews.userId',
                to: 'users.id'
            }
        },
        events: {
            relation: Model.BelongsToOneRelation,
            modelClass: Event,
            join: {
              from: 'reviews.eventId',
              to: 'events.id'
            }
          }
        
    }
}
}

module.exports = Reviews;