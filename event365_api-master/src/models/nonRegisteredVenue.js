'use strict'


const Model = require('objection').Model;
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class NonRegisteredVenue extends Model{

    static get tableName(){
        return 'nonRegisteredVenue'
    }

    static get jsonSchema(){
        return {
            type: 'object',
            required: [],
      
            properties: {
              id: { type: 'integer' },
              venueAddress :{ type: 'string', minLength:2, maxLength: 255},
            }
        }
    }

    static get relationMappings() {
        const User = require('./users');
        const Event = require('./events');
        return {
          users: {
            relation: Model.BelongsToOneRelation,
            modelClass: User,
            join: {
              from: 'nonRegisteredVenue.userId',
              to: 'users.id'
            }
          },
          events: {
            relation: Model.BelongsToOneRelation,
            modelClass: Event,
            join: {
                from: 'nonRegisteredVenue.eventId',
                to: 'events.id'
            }
        }
        }
    }

    // async $beforeInsert() {
    //     await super.$beforeInsert();
    
    //     let result = await this.constructor.query().select('venueName').where('venueName', this.venueName).first();
    //     if (result) {
    //       throw new ValidationError({
    //         message: "Venue with this name already exists!",
    //         type: "ModelValidation",
    //         data: {
    //           status: "error",
    //           code: 406,
    //           message: "Venue already exists with this Name!"
    //         }
    //       });
    //     }
    //   }
    // async $beforeUpdate() {
    //     await super.$beforeUpdate();

    //     let result = await this.constructor.query().select('venueName','id').where('venueName', this.venueName).first();
    //     if (result) {
    //       throw new ValidationError({
    //         message: "Venue with this name already exists!",
    //         type: "ModelValidation",
    //         data: {
    //           status: "error",
    //           code: 406,
    //           message: "Venue already exists with this Name!"
    //         }
    //       });
    //     }
    //   }
}

module.exports = NonRegisteredVenue