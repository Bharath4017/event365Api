'use strict'


const Model = require('objection').Model;
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class transactionHistory extends Model{

    static get tableName(){
        return 'transactionHistory'
    }

    static get jsonSchema(){
        return {
            type: 'object',
            required: [],
      
            properties: {
              id: { type: 'integer' }
            }
        }
    }

    static get relationMappings() {
        const bank_details = require('./bank_details');
        const User = require('./users');
        return {
            bank_details: {
            relation: Model.BelongsToOneRelation,
            modelClass: bank_details,
            join: {
              from: 'transactionHistory.bankId',
              to: 'bank_details.id'
            }
          },
          users: {
            relation: Model.BelongsToOneRelation,
            modelClass: User,
            join: {
              from: 'transactionHistory.userId',
              to: 'users.id'
            }
          },
          


        }
    }
}

module.exports = transactionHistory