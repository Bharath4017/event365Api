'use strict'

const Model = require('objection').Model;
const validator = require('validator');
const daysAvailable = require('./daysAvailability');
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;

class subVenue extends Model{
    static get tableName(){
        return 'subVenue'
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

    async $beforeInsert(queryContext) {
        await super.$beforeInsert(queryContext);
        if(queryContext.type != 'Website' && queryContext.type != 'website'){
          let result = await this.constructor.query().select('subVenueName').where('subVenueName', this.subVenueName).first();
          if (result) {
            throw new ValidationError({
              message: "SubVenue with this name already exists!",
              type: "ModelValidation",
              data: {
                status: "error",
                code: 406,
                message: "SubVenue already exists with this Name!"
              }
            });
          }
        }
      }
}

module.exports = subVenue;