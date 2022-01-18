
exports.up = function(knex, Promise) {
    return knex.schema.raw(`
    ALTER TABLE "admin"
    DROP CONSTRAINT "admin_user_type_check",
    ADD CONSTRAINT "admin_user_type_check" 
    CHECK ((user_type = ANY (ARRAY['super_admin'::text, 'customer'::text, 'sub_admin'::text])))
  `);
};

exports.down = function(knex, Promise) {
  
};
