'use strict';

const Model = require('objection').Model;

class Gallery extends Model {
    static get tableName() {
        return 'galleryImages';
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
              from: 'galleryImages.eventId',
              to: 'events.id'
          }
      }
  }
}
}

module.exports = Gallery;
