'use strict';

const Model = require('objection').Model;
const validator = require('validator');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');



class Notes extends Model {

  static get tableName() {
    return 'notes';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],

      properties: {
        id: { type: 'integer' }
      }
    };
  }

  static get relationMappings() {
        
        return {
            adminUser: {
                relation: Model.BelongsToOneRelation,
                modelClass: __dirname + '/admin',
                join: {
                    from: 'admin.id',
                    to: 'notes.userId'
                }
            },
            shareNotes: {
                relation: Model.HasManyRelation,
                modelClass: __dirname + '/sharedNotes',
                join: {
                    from: 'notes.id',
                    to: 'sharedNotes.notesId'
                }
            },
            notesManyRelation: {
                relation: Model.ManyToManyRelation,
                modelClass: __dirname + '/admin',
                join: {
                from: 'notes.id',
                through: {
                    // persons_movies is the join table.
                    from: 'sharedNotes.notesId',
                    to: 'sharedNotes.userId'
                    },
                    to: 'admin.id'
                }
            }
        }
    }
}

module.exports = Notes;
