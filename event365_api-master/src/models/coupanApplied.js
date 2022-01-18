'use strict';

const Model = require('objection').Model;

class CoupanApplied extends Model {
    static get tableName() {
        return 'coupanApplied';
    }

static get jsonSchema( ){
    return {
        type: 'object',
        //required: ['eventId'],//'eventVenue','latitude','longitude','deadlineDate', 'deadlineTime', 'paidType'],
        properties: {
          id: { type: 'integer' }
        }
    }
}

static get relationMappings() {
    const Event = require('./events');
    const User = require('./users');
    return {
      events: {
          relation: Model.BelongsToOneRelation,
          modelClass: Event,
          join: {
              from: 'coupanApplied.eventId',
              to: 'events.id'
          }
      },
      users: {
        relation: Model.BelongsToOneRelation,
        modelClass: Event,
        join: {
            from: 'coupanApplied.userid',
            to: 'users.id'
        }
    }
  }
}
}

module.exports = CoupanApplied;
