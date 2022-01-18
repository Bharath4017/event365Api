'use strict'

const Model = require('objection').Model;
const validator = require('validator');
const daysAvailable = require('./daysAvailability');
const subVenue = require('./subVenue');
const contact = require('./contactVia');
const Event = require('./events');
const User = require('./users');
const images = require('./venueImages');
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class Venue extends Model{

    static get tableName(){
        return 'venue'
    }

    static get jsonSchema(){
        return {
            type: 'object',
            required: [],
      
            properties: {
              id: { type: 'integer' },
              image_id: { type: 'string' },
             // venueName: { type: 'string', minLength: 2, maxLength: 255 },
            //  venueAddress :{ type: 'string', minLength:2, maxLength: 255},
             // fullName :{ type: 'string', minLength:2, maxLength: 255},
              
            }
        }
    }

    static get relationMappings(){
      return {
        users: {
          relation: Model.BelongsToOneRelation,
          modelClass: User,
          join: {
              from: 'venue.userId',
              to: 'users.id'
          }
      },
          daysAvailable: {
              relation: Model.HasManyRelation,
              modelClass: daysAvailable,
              join: {
                  from: 'venue.id',
                  to: 'daysAvailable.venueId'
              }
          },
          subVenues: {
            relation: Model.HasManyRelation,
            modelClass: subVenue,
            join: {
                from: 'venue.id',
                to: 'subVenue.venueId'
            }
        },
          events: {
            relation: Model.BelongsToOneRelation,
            modelClass: Event,
            join: {
                from: 'venue.eventId',
                to: 'events.id'
            }
        },
          contactVia :{
            relation : Model.HasManyRelation,
            modelClass : contact,
            join :{
              from : 'venue.id',
              to : 'contactVia.venueId'
            }
          },
          venueImages :{
            relation : Model.HasManyRelation,
            modelClass : images,
            join :{
              from : 'venue.id',
              to : 'venueImages.venueId'
            }
          },
          adminVenue: {
            relation: Model.BelongsToOneRelation,
            modelClass: __dirname+'/admin',
            join: {
                from: 'admin.id',
                to: 'venue.createByAdmin'
            }
        },
      }
    }

    async $beforeInsert() {
        await super.$beforeInsert();
    
        let result = await this.constructor.query().select('venueName').where('venueName', this.venueName).first();
        if (result) {
          throw new ValidationError({
            message: "Venue with this name already exists!",
            type: "ModelValidation",
            data: {
              status: "error",
              code: 406,
              message: "Venue already exists with this Name!"
            }
          });
        }
      }
}

module.exports = Venue;