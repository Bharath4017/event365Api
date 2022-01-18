'use strict'


const Model = require('objection').Model;
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class FreeTicketBooked extends Model {

  static get tableName() {
    return 'freeTicketBooked'
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],

      properties: {
        id: {
          type: 'integer'
        },
      }
    }
  }

  static get relationMappings() {
    const TicketBooked = require('./ticketBooked');
    return {
      free: {
        relation: Model.BelongsToOneRelation,
        modelClass: TicketBooked,
        join: {
          from: 'freeTicketBooked.ticketId',
          to: 'ticketBooked.id'
        }
      }
    }
}
}

module.exports = FreeTicketBooked;