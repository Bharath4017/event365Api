'use strict'


const Model = require('objection').Model;
var global = require('../global_functions');
var global = require('../global_constants');
const FreeTicketBooked = require('./freeTicketBooked');
const VipTicketBooked = require('./vipTicketBooked');
const RegularTicketBooked = require('./regularTicketBooked');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const Payment = require('./payment');
const bcrypt = require('bcrypt');

class TicketBooked extends Model {

  static get tableName() {
    return 'ticketBooked'
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],

      properties: {
        id: {
          type: 'integer'
        }
      }
    }
  }

  static get relationMappings() {
    const User = require('./users');
    const Event = require('./events');
    const ticket_info = require('./ticket_info');
    return {
      users: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'ticketBooked.userId',
          to: 'users.id'
        }
      },
      events: {
        relation: Model.BelongsToOneRelation,
        modelClass: Event,
        join: {
          from: 'ticketBooked.eventId',
          to: 'events.id'
        }
      },
      ticket_info:{
        relation : Model.HasManyRelation,
        modelClass : ticket_info,
        join :{
          from : 'ticketBooked.ticketId',
          to : 'ticket_info.id'
        }
      },
      free: {
        relation: Model.HasManyRelation,
        modelClass: FreeTicketBooked,
        join: {
          from: 'ticketBooked.id',
          to: 'freeTicketBooked.ticketId'
        }
      },
      vip: {
        relation: Model.HasManyRelation,
        modelClass: VipTicketBooked,
        join: {
          from: 'ticketBooked.id',
          to: 'vipTicketBooked.ticketId'
        }
      },
      payment: {
        relation: Model.HasManyRelation,
        modelClass: Payment,
        join: {
          from: 'ticketBooked.QRkey',
          to: 'payment.QRkey'
        }
      },
      regular: {
        relation: Model.HasManyRelation,
        modelClass: RegularTicketBooked,
        join: {
          from: 'ticketBooked.id',
          to: 'regularTicketBooked.ticketId'
        }
      },
      ticket_number_booked_rel:{
        relation:Model.HasManyRelation,
        modelClass: __dirname+'/ticketNumber',
        join:{
          from:'ticketBooked.id',
          to:'ticketNumber.ticketBookedId'
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

module.exports = TicketBooked;