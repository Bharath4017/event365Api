exports.seed = function (knex, Promise) {
  // Deletes ALL existing entries
  return knex('attribute').del()
    .then(function () {
      // Inserts seed entries
      return knex('attribute').insert([{
          id: 1,
          name: 'Size',
          slug: 'size',
          display_name: 'Size'
        },
        {
          id: 2,
          name: 'Color',
          slug: 'color',
          display_name: 'Color'
        }
      ]);
    })
    .then(function () {
      return knex('attribute_choice').del()
        .then(function () {
          // Inserts seed entries
          return knex('attribute_choice').insert([{
              id: 1,
              name: 'XS',
              slug: 'xs',
              sort_order: 0,
              attributeId: 1
            },
            {
              id: 2,
              name: 'S',
              slug: 's',
              sort_order: 1,
              attributeId: 1
            },
            {
              id: 3,
              name: 'M',
              slug: 'm',
              sort_order: 2,
              attributeId: 1
            },
            {
              id: 4,
              name: 'L',
              slug: 'l',
              sort_order: 3,
              attributeId: 1
            },
            {
              id: 5,
              name: 'XL',
              slug: 'xl',
              sort_order: 4,
              attributeId: 1
            },
            {
              id: 6,
              name: 'XXL',
              slug: 'xxl',
              sort_order: 5,
              attributeId: 1
            },
            {
              id: 7,
              name: 'Red',
              slug: 'red',
              sort_order: 0,
              attributeId: 2
            },
            {
              id: 8,
              name: 'Green',
              slug: 'red',
              sort_order: 1,
              attributeId: 2
            },
            {
              id: 9,
              name: 'Blue',
              slug: 'red',
              sort_order: 2,
              attributeId: 2
            }
          ]);
        });
    })
    .then(function () {
      return knex.raw("SELECT setval('attribute_id_seq', COALESCE((SELECT MAX(id)+1 FROM attribute), 1), false);")
    })
    .then(function () {
      return knex.raw("SELECT setval('attribute_choice_id_seq', COALESCE((SELECT MAX(id)+1 FROM attribute_choice), 1), false);")
    });
};