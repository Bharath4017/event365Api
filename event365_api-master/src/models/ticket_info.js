'use strict'


const Model = require('objection').Model;
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class ticket_info extends Model{

    static get tableName(){
        return 'ticket_info'
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
            relation: Model.BelongsToOneRelation,
            modelClass: User,
            join: {
              from: 'ticket_info.userId',
              to: 'users.id'
            }
          },
          events: {
            relation: Model.BelongsToOneRelation,
            modelClass: Event,
            join: {
                from: 'ticket_info.eventId',
                to: 'events.id'
            }
        },
        ticketInfoBooked:{
          relation:Model.HasManyRelation,
          modelClass: __dirname+'/ticketBooked',
          join:{
            from:'ticket_info.id',
            to:'ticketBooked.ticketId'
          }
        },
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

module.exports = ticket_info