'use strict'

const Model = require('objection').Model
const Users = require('./users');
const app_content = require('./app_content');

class ContactUs extends Model {

    static get tableName() {
        return 'contactUs'
    }

    static get jsonSchema() {
        return {
            type: 'object',

            properties: {
                id: { type: 'integer' },
                message: { type: 'string' },
            }

        }
    }
    static get relationMappings() {
        
        return {
          users: {
            relation: Model.BelongsToOneRelation,
            modelClass: Users,
            join: {
              from: 'users.id',
              to: 'contactUs.userId'
            }
          },
          issues: {
            relation: Model.BelongsToOneRelation,
            modelClass: app_content,
            join: {
              from: 'app_content.id',
              to: 'contactUs.issueId'
            }
          },
        }
      }
}

module.exports = ContactUs;
