'use strict'


const Model = require('objection').Model;
var global = require('../global_functions');
var global = require('../global_constants');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
class venueEvents extends Model {
    static get tableName() {
        return 'venueEvents'
    }

    static get jsonSchema() {
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
        const venueImages = require('./venueImages');
        return {
            users: {
                relation: Model.HasManyRelation,
                modelClass: User,
                join: {
                    from: 'venueEvents.userId',
                    to: 'users.id'
                }
            },
            events: {
                relation: Model.HasManyRelation,
                modelClass: Event,
                join: {
                    from: 'venueEvents.eventId',
                    to: 'events.id'
                }
            },
            venueImages: {
                relation: Model.HasManyRelation,
                modelClass: venueImages,
                join: {
                    from: 'venueEvents.venueId',
                    to: 'venueImages.venueId'
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

module.exports = venueEvents