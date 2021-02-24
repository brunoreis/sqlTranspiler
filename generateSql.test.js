import { generateSql } from './generateSql'

const fields = { 1: 'id', 2: 'name', 3: 'date_joined', 4: 'age' }
const tests = [
  [
    ['postgres', fields, { where: ['=', ['field', 3], null] }],
    'SELECT * FROM data WHERE date_joined IS NULL;',
  ],
  [
    ['postgres', fields, { where: ['=', ['field', 2], 'joe'] }],
    "SELECT * FROM data WHERE name = 'joe';",
  ],
  [
    ['postgres', fields, { where: ['>', ['field', 4], 35] }],
    'SELECT * FROM data WHERE age > 35;',
  ],
  [
    ['postgres', fields, { where: ['and', ['<', ['field', 1], 5]] }],
    'SELECT * FROM data WHERE id < 5;',
  ],
  [
    [
      'postgres',
      fields,
      { where: ['and', ['<', ['field', 1], 5], ['=', ['field', 2], 'joe']] },
    ],
    "SELECT * FROM data WHERE id < 5 AND name = 'joe';",
  ],
  [
    [
      'postgres',
      fields,
      {
        where: [
          'or',
          ['!=', ['field', 3], '2015-11-01'],
          ['=', ['field', 1], 456],
        ],
      },
    ],
    "SELECT * FROM data WHERE date_joined <> '2015-11-01' OR id = 456;",
  ],
  [
    [
      'postgres',
      fields,
      {
        where: [
          'and',
          ['!=', ['field', 3], null],
          ['or', ['>', ['field', 4], 25], ['=', ['field', 2], 'Jerry']],
        ],
      },
    ],
    "SELECT * FROM data WHERE date_joined IS NOT NULL AND (age > 25 OR name = 'Jerry');",
  ],
  [
    ['postgres', fields, { where: ['=', ['field', 4], 25, 26, 27] }],
    'SELECT * FROM data WHERE age IN (25, 26, 27);', // DOCUMENTATION'S TEST CASE WAS WRONG, field 4 is age, not date_joined
  ],
  [
    ['postgres', fields, { where: ['=', ['field', 2], 'cam'] }],
    "SELECT * FROM data WHERE name = 'cam';",
  ],
  [
    [
      "mysql",
      fields,
      {
        where: [
          "=",
          ["field", 2],
          "cam"
        ],
        "limit": 10
      }
    ],
    "SELECT * FROM data WHERE name = 'cam' LIMIT 10;"
  ],
  [
    ['sqlserver', fields, { limit: 20 }],
    'SELECT TOP 20 * FROM data;'
  ],
  [
    ['postgres', fields, { limit: 20 }],
    'SELECT * FROM data LIMIT 20;'
  ],
]


tests.forEach((t, index) => {
  const args = t[0]
  const expected = t[1]
  console.log(`\nTEST ${index + 1} - ${expected}`)
  const result = generateSql(args[0], args[1], args[2])
  if (result === expected) {
    console.log('OK')
  } else {
    console.log(`Expected: ${expected} \n got: ${result}`)
  }
})
