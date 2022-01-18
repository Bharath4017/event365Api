'use strict'

const Model = require('objection').Model;

class UserLoginDetails extends Model{

    static get tableName(){
        return 'userLoginDetails'
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
    static get relationMappings(){
    }
}

module.exports = UserLoginDetails;