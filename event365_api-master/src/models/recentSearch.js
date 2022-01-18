'use strict'


const Model = require('objection').Model;
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class recentSearch extends Model{

    static get tableName(){
        return 'recentSearch'
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
        const User = require('./users');
        const Event = require('./events');
        return {
          users: {
            relation: Model.HasManyRelation,
            modelClass: User,
            join: {
              from: 'recentSearch.userId',
              to: 'users.id'
            }
          },
          events: {
            relation: Model.HasManyRelation,
            modelClass: Event,
            join: {
                from: 'recentSearch.eventId',
                to: 'events.id'
            }
        },
        }
    }

}

module.exports = recentSearch