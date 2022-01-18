
exports.up = function(knex, Promise) {
    return knex.schema.raw(`
    ALTER TABLE "admin"
    DROP CONSTRAINT "admin_user_status_check",
    ADD CONSTRAINT "admin_user_status_check" 
    CHECK ((user_status = ANY (ARRAY['active'::text, 'pending'::text, 'block'::text, 'flagged'::text, 'inactive'::text])))
  `)
};

exports.down = function(knex, Promise) {
  
};
