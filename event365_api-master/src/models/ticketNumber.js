'use strict';

const Model = require('objection').Model;
const validator = require('validator');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');



class TicketNumber extends Model {

  static get tableName() {
    return 'ticketNumber';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],

      properties: {
        id: { type: 'integer' }
      }
    };
  }

  static get relationMappings() {
        
        return {
            ticket_relation: {
                relation: Model.BelongsToOneRelation,
                modelClass: __dirname + '/ticket_info',
                join: {
                    from: 'ticketNumber.ticketId',
                    to: 'ticket_info.id'
                }
            },
            ticketBooked_relation: {
              relation: Model.BelongsToOneRelation,
              modelClass: __dirname + '/ticketBooked',
              join: {
                  from: 'ticketNumber.ticketBookedId',
                  to: 'ticketBooked.id'
              }
            },
            ticketNumberRefund: {
              relation: Model.BelongsToOneRelation,
              modelClass: __dirname + '/refundTrasaction',
              join: {
                  from: 'ticketNumber.rt_id',
                  to: 'refundTransaction.id'
              }
            }
        }
    }
}

module.exports = TicketNumber;
