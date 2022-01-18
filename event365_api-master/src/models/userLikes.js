'use strict'

const Model = require('objection').Model;
const User = require('./users');
const Event = require('./events');
const userLikes = require('./userLikes');

class Likes extends Model{
    static get tableName() {
        return 'userLikes';
    }

static get jsonSchema( ){
    return {
        type: 'object',
        required: [],
        properties: {
          id: { type: 'integer' }
        }
    }
}

static get relationMappings(){
    return {
        users: {
            relation: Model.BelongsToOneRelation,
            modelClass: User,
            join: {
                from: 'userLikes.userId',
                to: 'users.id'
            }
        },
        events: {
            relation: Model.BelongsToOneRelation,
            modelClass: Event,
            join: {
              from: 'userLikes.eventId',
              to: 'events.id'
            }
          },
          userLikes: {
            relation: Model.BelongsToOneRelation,
            modelClass: userLikes,
            join: {
              from: 'userLikes.userId',
              to: 'eventUsers.userId'
            }
          }
    }
}
}

module.exports = Likes;
