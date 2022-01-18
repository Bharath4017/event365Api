'use strict'


const Model = require('objection').Model;
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class RegularTicketBooked extends Model {

  static get tableName() {
    return 'regularTicketBooked'
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
        regular: {
            relation: Model.BelongsToOneRelation,
            modelClass: TicketBooked,
            join: {
              from: 'regularTicketBooked.ticketId',
              to: 'ticketBooked.id'
            }
          }
        }
    }
}

module.exports = RegularTicketBooked;