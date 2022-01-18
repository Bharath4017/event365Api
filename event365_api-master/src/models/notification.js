'use strict'

const Model = require('objection').Model
const Event  = require('./events');
const notification  = require('./notification');
class Notification extends Model{

    static get tableName(){
        return 'notification'
    }

    static get jsonSchema(){
        return {
            type: 'object',
             properties: {
             // id: { type: 'integer' },

            }

        }
    }
    static get relationMappings() {
        const Event = require('./events');
        const users = require('./users');
        return {
            users: {
                relation: Model.HasManyRelation,
                modelClass: users,
                join: {
                  from: 'notification.userId',
                  to: 'users.id'
                }
              },
              receiver: {
                relation: Model.HasManyRelation,
                modelClass: users,
                join: {
                  from: 'notification.receiverId',
                  to: 'users.id'
                }
              },
            hostUser : {
                relation: Model.HasManyRelation,
                modelClass: users,
                join: {
                    from: 'notification.userId',
                    to: 'users.id'
                }
            }
        }
      }


}

module.exports = Notification;