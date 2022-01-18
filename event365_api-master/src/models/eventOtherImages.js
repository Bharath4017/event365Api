'use strict';

const Model = require('objection').Model;

class Gallery extends Model {
    static get tableName() {
        return 'eventOtherImages';
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
    const Event = __dirname + '/events';
    return {
      otherImagesEvent: {
          relation: Model.BelongsToOneRelation,
          modelClass: Event,
          join: {
              from: 'eventOtherImages.eventId',
              to: 'events.id'
          }
      }
  }
}
}

module.exports = Gallery;
