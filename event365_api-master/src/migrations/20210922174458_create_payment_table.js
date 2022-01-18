exports.up = function(knex) {
    return knex.schema.raw(`
    ALTER TABLE "payment"
    DROP CONSTRAINT "payment_paymentType_check",
    ADD CONSTRAINT "payment_paymentType_check" 
    CHECK (("paymentType" = ANY (ARRAY['stripe'::text, 'paypal'::text, 'applepay'::text])))
  `);
};

exports.down = function(knex) {
  
};