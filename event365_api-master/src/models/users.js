'use strict';

const Model = require('objection').Model;
const Review = require('./reviews');
const Fav = require('./favorite');
const contact = require('./contactVia');
const Likes = require('./userLikes');
const NormalTicket = require('./normalTicket');
const TableSeatingTicket = require('./tableSeatingTicket');
const ticket_info = require('./ticket_info');
const TicketBooked = require('./ticketBooked');
const recentSearch = require('./recentSearch');
const validator = require('validator');
const bankDetails = require('./bank_details');
const transactionHistory = require('./transactionHistory');
const Notification = require('./notification');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class User extends Model {

  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],

      properties: {
        id: { type: 'integer' },
        // name: { type: 'string', minLength: 2, maxLength: 255 },
        // email: { type: 'string', minLength: 1, maxLength: 255 },
        // phoneNo: { type: 'string', minLength: 10, maxLength: 15 },
        // deviceType: { type: 'string', minLength: 1, maxLength: 255 },
        // deviceToken: { type: 'string', minLength: 1, maxLength: 255 }
      }
    };
  }

  static get relationMappings() {
    const Event = require('./events');
    const nonRegisteredVenue = require('./nonRegisteredVenue');
    return {
      events: {
        relation: Model.HasManyRelation,
        modelClass: Event,
        join: {
          from: 'users.id',
          to: 'events.userId'
        }
      },

      reviews: {
        relation: Model.HasManyRelation,
        modelClass: Review,
        join: {
          from: 'users.id',
          to: 'reviews.userId'
        }
      },
      favorite: {
        relation: Model.HasManyRelation,
        modelClass: Fav,
        join: {
          from: 'users.id',
          to: 'favorite.userId'
        }
      },
      userLikes: {
        relation: Model.HasManyRelation,
        modelClass: Likes,
        join: {
          from: 'users.id',
          to: 'userLikes.userId'
        }
      },
      transactionHistory: {
        relation: Model.HasManyRelation,
        modelClass: transactionHistory,
        join: {
          from: 'users.id',
          to: 'transactionHistory.userId'
        }
      },

      contactVia: {
        relation: Model.HasManyRelation,
        modelClass: contact,
        join: {
          from: 'users.id',
          to: 'contactVia.userId'
        }
      },
      ticket_info: {
        relation: Model.HasManyRelation,
        modelClass: ticket_info,
        join: {
          from: 'events.id',
          to: 'ticket_info.eventId'
        }
      },

      normalTicket: {
        relation: Model.HasManyRelation,
        modelClass: NormalTicket,
        join: {
          from: 'events.id',
          to: 'normalTicket.eventId'
        }
      },
      tableSeatingTicket: {
        relation: Model.HasManyRelation,
        modelClass: TableSeatingTicket,
        join: {
          from: 'events.id',
          to: 'tableSeatingTicket.eventId'
        }
      },
      ticketBooked: {
        relation: Model.HasManyRelation,
        modelClass: TicketBooked,
        join: {
          from: 'users.id',
          to: 'ticketBooked.userId'
        }
      },
      recentSearch: {
        relation: Model.HasManyRelation,
        modelClass: recentSearch,
        join: {
          from: 'users.id',
          to: 'recentSearch.userId'
        }
      },
      notification: {
        relation: Model.HasManyRelation,
        modelClass: Notification,
        join: {
          from: 'users.id',
          to: 'notification.userId'
        }
      },
      notification: {
        relation: Model.HasManyRelation,
        modelClass: Notification,
        join: {
          from: 'users.id',
          to: 'notification.receiverId'
        }
      },
      nonRegisteredVenue: {
        relation: Model.HasManyRelation,
        modelClass: nonRegisteredVenue,
        join: {
          from: 'users.id',
          to: 'nonRegisteredVenue.userId'
        }
      },
      bank_details: {
        relation: Model.HasManyRelation,
        modelClass: bankDetails,
        join: {
          from: 'users.id',
          to: 'bank_details.userId'
        }
      },
      AdminbankDetails: {
        relation: Model.BelongsToOneRelation,
        modelClass: bankDetails,
        join: {
          from: 'users.id',
          to: 'bank_details.userId'
        }
      },
      userLoginDetail: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/userLoginDetails',
        join: {
          from: 'users.id',
          to: 'userLoginDetails.userId'
        }
      },
      userPreferenceCategory: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/category',
        join: {
          from: 'users.id',
          through: {
            // persons_movies is the join table.
            from: 'userChooseSubcategory.userId',
            to: 'userChooseSubcategory.categoryId'
          },
          to: 'category.id'
        }
      },
      coupanApplied: {
        relation: Model.HasManyRelation,
        modelClass:  __dirname + '/coupanApplied',
        join: {
          from: 'users.id',
          to: 'coupanApplied.userId'
        }
      },
    }
  }
  // async getJWT() {
  //   return await jwt.sign({
  //     userId: this.id
  //   }, CONFIG.jwt_encryption);
  // }
  async $beforeInsert() {
    await super.$beforeInsert();
    console.log('in before insert');
    if (!validator.isEmail(this.email || '')) {
      throw new ValidationError({
        message: "Not a valid email address!",
        type: "ModelValidation",
        data: {
          message: "Please enter a valid email address",
          code: 406,
          status: "error"
        }
      })
    }

    let result = await this.constructor.query().select('id').where('email', this.email).whereNull('loginType')
      .first();
    if (result) {
      console.log('should be come here')
      throw new ValidationError({
        message: "Account with this email already exists!",
        type: "ModelValidation",
        data: {
          status: "error",
          code: 406,
          message: "Account already exists with this email!"
        }
      });
    }
    this.password ? this.password = await bcrypt.hash(this.password, 10) : null;
  }

  async comparePassword(password) {
    if (!password) {
      return false;
    }
    let pass = await bcrypt.compare(password, this.password);
    return pass;
  }
  async getJWT() {
    return await jwt.sign({
      userId: this.id
    }, CONFIG.jwt_encryption);
  }
}

module.exports = User;
