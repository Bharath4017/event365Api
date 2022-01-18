'use strict';

const Model = require('objection').Model;
const validator = require('validator');
const ValidationError = require('objection').ValidationError;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');



class SharedNotes extends Model {

  static get tableName() {
    return 'sharedNotes';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],

      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        notesId: { type: 'integer' }
      }
    };
  }

  static get relationMappings() {
        
        return {
            sharedNoteRelation: {
                relation: Model.BelongsToOneRelation,
                modelClass: __dirname + '/notes',
                join: {
                    from: 'sharedNotes.notesId',
                    to: 'notes.id'
                }
            },
        }
    }
}

module.exports = SharedNotes;
