'use strict';

const Model = require('objection').Model;
const Gallery = require('./gallery');
const category = require('./category');
const subCategory = require('./subCategory');
const Favorite = require('./favorite');
const Likes = require('./userLikes');
const eventUsers = require('./eventUsers');
const NormalTicket = require('./normalTicket');
const TableSeatingTicket = require('./tableSeatingTicket');
const ticket_info = require('./ticket_info');
const VenueEvents = require('./venueEvents');
const SubVenueEvents = require('./subVenueEvents');
const Coupan = require('./coupan');
const EventOtherImages = require('./eventOtherImages');

class Event extends Model {

  static get tableName() {
    return 'events';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [], //'eventVenue','latitude','longitude','deadlineDate', 'deadlineTime', 'paidType'],

      properties: {
        id: { type: 'integer' },
      }
    }
  }

  static get relationMappings() {
    const User = require('./users');
    const Reviews = require('./reviews');
    const eventOccurrence = require('./eventOccurrence');
    const TicketBooked = require('./ticketBooked');
    const venue = require('./venue');
    const nonRegisteredVenue = require('./nonRegisteredVenue');
    const eventChooseSubcategory = require('./eventChooseSubcategory');
    const CoupanApplied = require('./coupanApplied');
    const TicketNumber = require('./ticketNumber');
    return {
      users: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'events.userId',
          to: 'users.id'
        }
      },
      eventImages: {
        relation: Model.HasManyRelation,
        modelClass: Gallery,
        join: {
          from: 'events.id',
          to: 'galleryImages.eventId'
        }
      },
      eventOtherImages: {
        relation: Model.HasManyRelation,
        modelClass: __dirname+'/eventOtherImages',
        join: {
          from: 'events.id',
          to: 'eventOtherImages.eventId'
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
      ticket_info: {
        relation: Model.HasManyRelation,
        modelClass: ticket_info,
        join: {
          from: 'events.id',
          to: 'ticket_info.eventId'
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
      category: {
        relation: Model.HasOneRelation,
        modelClass: category,
        join: {
          from: 'events.id',
          to: 'category.eventId'
        }
      },
      subCategory: {
        relation: Model.HasOneRelation,
        modelClass: subCategory,
        join: {
          from: 'events.id',
          to: 'subCategory.eventId'
        }
      },
      reviews: {
        relation: Model.HasOneRelation,
        modelClass: Reviews,
        join: {
          from: 'events.id',
          to: 'reviews.eventId'
        }
      },

      favorite: {
        relation: Model.HasOneRelation,
        modelClass: Favorite,
        join: {
          from: 'events.id',
          to: 'favorite.eventId'
        }
      },
      userLikes: {
        relation: Model.HasOneRelation,
        modelClass: Likes,
        join: {
          from: 'events.id',
          to: 'userLikes.eventId'
        }
      },
      eventUsers: {
        relation: Model.HasManyRelation,
        modelClass: eventUsers,//__dirname+"/eventUsers",
        join: {
          from: 'events.id',
          to: 'eventUsers.eventId'
        }
      },
      venueEvents: {
        relation: Model.HasManyRelation,
        modelClass: VenueEvents,
        join: {
          from: 'events.id',
          to: 'venueEvents.eventId'
        }
      },
      subVenueEvent: {
        relation: Model.HasManyRelation,
        modelClass: SubVenueEvents,
        join: {
          from: 'events.id',
          to: 'subVenueEvents.eventId'
        }
      },
      eventOccurrence: {
        relation: Model.HasManyRelation,
        modelClass: eventOccurrence,
        join: {
          from: 'events.id',
          to: 'eventOccurrence.eventId'
        }
      },
      eventChooseSubcategory: {
        relation: Model.HasManyRelation,
        modelClass: eventChooseSubcategory,
        join: {
          from: 'events.id',
          to: 'eventChooseSubcategory.eventId'
        }
      },
      nonRegisteredVenue: {
        relation: Model.HasManyRelation,
        modelClass: nonRegisteredVenue,
        join: {
          from: 'events.id',
          to: 'nonRegisteredVenue.eventId'
        }
      },
      venue: {
        relation: Model.BelongsToOneRelation,
        modelClass: venue,
        join: {
          from: 'events.id',
          to: 'venue.eventId'
        }
      },
      ticketBooked: {
        relation: Model.HasManyRelation,
        modelClass: TicketBooked,
        join: {
          from: 'events.id',
          to: 'ticketBooked.eventId'
        }
      },
      eventCategories: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/category',
        join: {
          from: 'events.id',
          through: {
            // persons_movies is the join table.
            from: 'eventChooseSubcategory.eventId',
            to: 'eventChooseSubcategory.categoryId'
          },
          to: 'category.id'
        }
      },
      eventSubCategories: {
        relation: Model.ManyToManyRelation,
        modelClass: __dirname + '/subCategory',
        join: {
          from: 'events.id',
          through: {
            // persons_movies is the join table.
            from: 'eventChooseSubcategory.eventId',
            to: 'eventChooseSubcategory.subCategoryId'
          },
          to: 'subCategory.id'
        }
      },
      eventVenue: {
        relation: Model.HasManyRelation,
        modelClass: venue,
        join: {
          from: 'events.venueId',
          to: 'venue.id'
        }
      },
      coupan: {
        relation: Model.HasOneRelation,
        modelClass: Coupan,
        join: {
          from: 'events.id',
          to: 'coupan.eventId'
        }
      },
      coupanApplied: {
        relation: Model.HasManyRelation,
        modelClass: CoupanApplied,
        join: {
          from: 'events.id',
          to: 'coupanApplied.eventId'
        }
      },
    }
  }
}

module.exports = Event;