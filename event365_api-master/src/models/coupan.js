'use strict';

const Model = require('objection').Model;

class Coupan extends Model {
    static get tableName() {
        return 'coupan';
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
    return {
      events: {
          relation: Model.BelongsToOneRelation,
          modelClass: Event,
          join: {
              from: 'coupan.eventId',
              to: 'events.id'
          }
      }
  }
}
}

module.exports = Coupan;
