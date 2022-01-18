'use strict';

const Model = require('objection').Model;
const Event = require('./events');
const User = require('./users');

class NormalTicket extends Model {
    static get tableName() {
        return 'normalTicket';
    }

static get jsonSchema( ){
    return {
        type: 'object',
        required: [],
        properties: {
          id: { type: 'integer' },
          eventId : { type: 'integer'}
        }
    }
}

static get relationMappings() {
    return {
      events: {
          relation: Model.BelongsToOneRelation,
          modelClass: Event,
          join: {
              from: 'normalTicket.eventId',
              to: 'events.id'
          }
      },
      users: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
            from: 'normalTicket.userId',
            to: 'users.id'
        }
    }
   }
}
}


module.exports = NormalTicket;
