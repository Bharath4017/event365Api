'use strict'


const Model = require('objection').Model;
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class bank_details extends Model{

    static get tableName(){
        return 'bank_details'
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
        const transactionHistory = require('./transactionHistory');
        const User = require('./users');
        return {
          transactionHistory: {
            relation: Model.HasManyRelation,
            modelClass: transactionHistory,
            join: {
              from: 'bank_details.id',
              to: 'transactionHistory.bankId'
            }
          },
          users: {
            relation: Model.BelongsToOneRelation,
            modelClass: User,
            join: {
              from: 'bank_details.userId',
              to: 'users.id'
            }
          },
          


        }
    }
}

module.exports = bank_details