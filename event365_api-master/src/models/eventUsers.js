'use strict';

const Model = require('objection').Model;
const Event = require('./events');
const User = require('./users');
const Like = require('./userLikes');
class EventUsers extends Model {
    static get tableName() {
        return 'eventUsers';
    }

static get jsonSchema( ){ 
    return {
        type: 'object',
        required: [],
        properties: {
          id: { type: 'integer' },
        }
    }
}

static get relationMappings() {
    
    return {
      events: {
          relation: Model.BelongsToOneRelation,
          modelClass: Event,
          join: {
              from: 'eventUsers.eventId',
              to: 'events.id'
          }
      },
      users: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname+"/users",
        join: {
            from: 'eventUsers.userId',
            to: 'users.id'
        }
    },
    // userLikes: {
    //     relation: Model.BelongsToOneRelation,
    //     modelClass: Like,
    //     join: {
    //         from: 'eventUsers.userId',
    //         to: 'userLikes.userId'
    //     }
    // }
  }
}
}


module.exports = EventUsers;
