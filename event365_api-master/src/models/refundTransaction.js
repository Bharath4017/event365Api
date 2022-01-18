'use strict';

const Model = require('objection').Model;
const validator = require('validator');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');



class RefundTransaction extends Model {

  static get tableName() {
    return 'refundTransaction';
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
            refundPayment: {
                relation: Model.BelongsToOneRelation,
                modelClass: __dirname + '/payment',
                join: {
                    from: 'refundTransaction.paymentId',
                    to: 'payment.id'
                }
            },
            refundTicketNumber: {
              relation: Model.HasManyRelation,
              modelClass: __dirname + '/ticketNumber',
              join: {
                  from: 'refundTransaction.id',
                  to: 'ticketNumber.rt_id'
               }
           }
        }
    }
}

module.exports = RefundTransaction;
