import { Shape } from '../shapes.js'
import { fakeColumnStructure, fakeTableStructure } from '../testing/index.js'
import { GenerateTransformModule, getTransform } from './generateTransform.js'
import { generateTypedefInclusion } from '~/config/snapletConfig/v2/generateTypes/generateTypes.js'
import { TableShapePredictions } from '../db/structure.js'

let generateColumnTransformCode: GenerateTransformModule['generateColumnTransformCode']
let generateTransform: GenerateTransformModule['generateTransform']

beforeAll(async () => {
  const transform = await getTransform()
  generateColumnTransformCode = transform.generateColumnTransformCode
  generateTransform = (tables, options, subsetConfig, selectConfig) =>
    transform.generateTransform(
      tables,
      {
        copycatSecretKey: null,
        ...options,
      },
      subsetConfig,
      selectConfig
    )
})

describe('generateTransform', () => {
  test('uses table structure correctly', async () => {
    const tables = [
      fakeTableStructure({
        id: '0',
        schema: 's1',
        name: 't1',
        columns: [
          fakeColumnStructure({
            name: 'firstName1',
            type: 'text',
          }),
        ],
      }),
      fakeTableStructure({
        id: '0',
        schema: 's2',
        name: 't2',
        columns: [
          fakeColumnStructure({
            name: 'firstName2',
            type: 'text',
          }),
        ],
      }),
    ]

    // expect(await generateTransform(tables)).toMatchInlineSnapshot(`
    //   "// This transform config was generated by Snaplet.
    //   // Snaplet found fields that may contain personally identifiable information (PII)
    //   // and used that to populate this file.
    //   import { copycat, faker } from \\"@snaplet/copycat\\";
    //   import type { Transform } from \\"./structure\\";
    //   export const config: Transform = () => ({
    //     s1: {
    //       t1({ row }) {
    //         return {
    //           firstName1: copycat.firstName(row.firstName1),
    //         };
    //       },
    //     },
    //     s2: {
    //       t2({ row }) {
    //         return {
    //           firstName2: copycat.firstName(row.firstName2),
    //         };
    //       },
    //     },
    //   });

    //   export const subset = {
    //     enabled: false,
    //     version: \\"3\\",
    //     targets: [{ table: \\"any\\", percent: 100 }],
    //   };
    //   "
    // `)
    expect(await generateTransform(tables))
      .toEqual(`${generateTypedefInclusion()}
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
export default defineConfig({
  transform: {
    s1: {
      t1({ row }) {
        return {
          firstName1: copycat.firstName(row.firstName1),
        };
      },
    },
    s2: {
      t2({ row }) {
        return {
          firstName2: copycat.firstName(row.firstName2),
        };
      },
    },
  },
});
`)
  })

  test('excludes generated columns', async () => {
    const tables = [
      fakeTableStructure({
        id: '0',
        schema: 's1',
        name: 't1',
        columns: [
          fakeColumnStructure({
            name: 'firstName1',
            type: 'text',
            generated: 'NEVER',
          }),
          fakeColumnStructure({
            name: 'firstName2',
            type: 'text',
            generated: 'ALWAYS',
          }),
        ],
      }),
    ]

    expect(await generateTransform(tables)).not.toContain('firstName2')
  })

  test('corretly generates transform for known PII columns', async () => {
    const tables = [
      fakeTableStructure({
        id: 'pulic.users',
        schema: 'public',
        name: 'users',
        columns: [
          fakeColumnStructure({
            name: 'firstName',
            type: 'text',
          }),
          fakeColumnStructure({
            name: 'last_name',
            type: 'varchar',
          }),
          fakeColumnStructure({
            name: 'email',
            type: 'character varying',
          }),
          fakeColumnStructure({
            name: 'phone',
            type: 'character',
          }),
          fakeColumnStructure({
            name: 'address',
            type: 'character',
          }),
          fakeColumnStructure({
            name: 'age',
            type: 'integer',
          }),
          fakeColumnStructure({
            name: 'credit_card_number',
            type: 'text',
          }),
          fakeColumnStructure({
            name: 'credit_card_cvv',
            type: 'varchar',
          }),
          fakeColumnStructure({
            name: 'credit_card_expiry_date',
            type: 'character varying',
          }),
          fakeColumnStructure({
            name: 'credit_card_pin',
            type: 'character',
          }),
          fakeColumnStructure({
            name: 'ssn',
            type: 'character',
          }),
        ],
      }),
      fakeTableStructure({
        id: 'stores.orders',
        schema: 'stores',
        name: 'orders',
        columns: [
          // Currently prediction of the shape LOCATION has a confidence below 0.6
          // We could add more examples during training or reduce the threshold
          fakeColumnStructure({
            name: 'location',
            type: 'geography',
          }),
          fakeColumnStructure({
            name: 'order_date',
            type: 'varchar',
          }),
          fakeColumnStructure({
            name: 'order_history',
            type: 'text',
          }),
          fakeColumnStructure({
            name: 'order_status',
            type: 'character varying',
          }),
          fakeColumnStructure({
            name: 'order_tax_code',
            type: 'character',
          }),
        ],
      }),
    ]
    const tableShapePredictions: TableShapePredictions[] = [
      {
        schemaName: 'public',
        tableName: 'users',
        predictions: [
          {
            input: 'public users firstName text',
            column: 'firstName',
            shape: 'FIRST_NAME',
            confidence: 0.9359741806983948,
          },
          {
            input: 'public users last_name text',
            column: 'last_name',
            shape: 'LAST_NAME',
            confidence: 0.9356096982955933,
          },
          {
            input: 'public users email text',
            column: 'email',
            shape: 'EMAIL',
            confidence: 0.9416961073875427,
          },
          {
            input: 'public users phone text',
            column: 'phone',
            shape: 'PHONE',
            confidence: 0.9427656531333923,
          },
          {
            input: 'public users address text',
            column: 'address',
            shape: 'FULL_ADDRESS',
            confidence: 0.939682126045227,
          },
          {
            input: 'public users age text',
            column: 'age',
            shape: 'AGE',
            confidence: 0.9475480914115906,
          },
          {
            input: 'public users credit_card_number text',
            column: 'credit_card_number',
            shape: 'CREDIT_DEBIT_NUMBER',
            confidence: 0.9060453176498413,
          },
          {
            input: 'public users credit_card_cvv text',
            column: 'credit_card_cvv',
            shape: 'CREDIT_DEBIT_CVV',
            confidence: 0.9458237290382385,
          },
          {
            input: 'public users credit_card_expiry_date date',
            column: 'credit_card_expiry_date',
            shape: 'CREDIT_DEBIT_EXPIRY',
            confidence: 0.9289980530738831,
          },
          {
            input: 'public users credit_card_pin text',
            column: 'credit_card_pin',
            shape: 'PIN',
            confidence: 0.8902574777603149,
          },
          {
            input: 'public users ssn text',
            column: 'ssn',
            shape: 'SSN_FULL',
            confidence: 0.9547920227050781,
          },
        ],
      },
      {
        schemaName: 'stores',
        tableName: 'orders',
        predictions: [
          {
            input: 'stores orders location geography',
            column: 'location',
            shape: 'LOCATION',
            confidence: 0.827575147151947,
          },
          {
            input: 'stores orders order_date varchar',
            column: 'order_date',
            shape: 'DATE',
            confidence: 0.9379045367240906,
          },
          {
            input: 'stores orders order_history text',
            column: 'order_history',
            shape: 'LOGS',
            confidence: 0.9403144121170044,
          },
          {
            input: 'stores orders order_status varchar',
            column: 'order_status',
            shape: 'STATUS',
            confidence: 0.9726867079734802,
          },
          {
            input: 'stores orders order_tax_code character',
            column: 'order_tax_code',
            shape: 'TAX_CODE',
            confidence: 0.9300639629364014,
          },
        ],
      },
    ]
    // const transform = await generateTransform(tables, { tableShapePredictions })

    expect(await generateTransform(tables, { tableShapePredictions }))
      .toEqual(`${generateTypedefInclusion()}
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
export default defineConfig({
  transform: {
    public: {
      users({ row }) {
        return {
          firstName: copycat.firstName(row.firstName),
          last_name: copycat.lastName(row.last_name),
          email: copycat.email(row.email),
          phone: copycat.phoneNumber(row.phone),
          address: copycat.postalAddress(row.address),
          age: copycat.int(row.age, {
            min: 0,
            max: 65535,
          }),
          credit_card_number: copycat.scramble(row.credit_card_number),
          credit_card_cvv: copycat.scramble(row.credit_card_cvv),
          credit_card_expiry_date: copycat.scramble(
            row.credit_card_expiry_date,
          ),
          credit_card_pin: copycat.scramble(row.credit_card_pin),
          ssn: copycat.scramble(row.ssn),
        };
      },
    },
    stores: {
      orders({ row }) {
        return {
          order_tax_code: copycat.scramble(row.order_tax_code),
        };
      },
    },
  },
});
`)
  })

  test('table names starting with numbers', async () => {
    const tables = [
      fakeTableStructure({
        id: '0',
        name: '62r',
      }),
    ]

    expect(await generateTransform(tables))
      .toEqual(`${generateTypedefInclusion()}
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
export default defineConfig({
  transform: {
    public: {
      "62r"({ row }) {
        return {
          name: copycat.fullName(row.name),
          email: copycat.email(row.email),
        };
      },
    },
  },
});
`)
  })

  test('using shape for replacements', async () => {
    const tables = [
      fakeTableStructure({
        id: '0',
        schema: 's1',
        name: 't1',
        columns: [
          fakeColumnStructure({
            name: 'firstName1',
            type: 'text',
          }),
        ],
      }),
    ]

    expect(await generateTransform(tables))
      .toEqual(`${generateTypedefInclusion()}
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
export default defineConfig({
  transform: {
    s1: {
      t1({ row }) {
        return {
          firstName1: copycat.firstName(row.firstName1),
        };
      },
    },
  },
});
`)
  })

  test('using shapes for replacements when there is no matching shape', async () => {
    const tables = [
      fakeTableStructure({
        name: 't1',
        schema: 's1',
        columns: [
          fakeColumnStructure({
            name: 'lsdkfjsdfsdf',
          }),
        ],
      }),
    ]

    expect(await generateTransform(tables))
      .toEqual(`${generateTypedefInclusion()}
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
export default defineConfig({
  transform: {},
});
`)
  })

  test('omit empty sections', async () => {
    const tables = [
      fakeTableStructure({
        name: 't1',
        schema: 's1',
        columns: [fakeColumnStructure({ name: 'c1' })],
      }),
    ]

    expect(
      await generateTransform(tables, {
        includeEmpty: false,
      })
    ).toEqual(`${generateTypedefInclusion()}
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
export default defineConfig({
  transform: {},
});
`)
  })

  test('sets a copycat secret key', async () => {
    expect(await generateTransform([], { copycatSecretKey: '9:21' }))
      .toEqual(`${generateTypedefInclusion()}
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
copycat.setHashKey("9:21");
export default defineConfig({
  transform: {},
});
`)
  })

  test("select config to exclude all schemas except, 'public' and 'auth'", async () => {
    const result = await generateTransform([], {}, undefined, {
      $default: false,
      public: true,
      auth: true,
    })

    expect(result)
      .toEqual(`// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path=".snaplet/snaplet.d.ts" />
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
export default defineConfig({
  select: {
    $default: false,
    public: true,
    auth: true,
  },
  transform: {},
});
`)
  })

  test('select config to only dump the structure', async () => {
    const result = await generateTransform([], {}, undefined, {
      private: 'structure',
      public: {
        EventLogs: 'structure',
      },
    })

    expect(result)
      .toEqual(`// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path=".snaplet/snaplet.d.ts" />
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
export default defineConfig({
  select: {
    private: "structure",
    public: {
      EventLogs: "structure",
    },
  },
  transform: {},
});
`)
  })

  test('select config with default in the schema', async () => {
    const result = await generateTransform([], {}, undefined, {
      $default: 'structure',
      private: false,
      public: {
        $default: true,
        EventLogs: 'structure',
        Logs: false,
      },
    })

    expect(result)
      .toEqual(`// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path=".snaplet/snaplet.d.ts" />
// This config was generated by Snaplet make sure to check it over before using it.
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
export default defineConfig({
  select: {
    $default: "structure",
    private: false,
    public: {
      $default: true,
      EventLogs: "structure",
      Logs: false,
    },
  },
  transform: {},
});
`)
  })
})

describe('generateColumnTransformCode', () => {
  const run = (...args: Parameters<typeof generateColumnTransformCode>) =>
    generateColumnTransformCode(...args)

  test('uses shape and column type', () => {
    const column = fakeColumnStructure({
      name: 'c1',
      type: 'text',
    })

    expect(
      run('foo', column, 'EMAIL', {
        text: {
          EMAIL: ({ input }) => `winrar(${input})`,
        },
      })
    ).toEqual('winrar(foo)')
  })

  test('uses fallback template if one exists', () => {
    const column = fakeColumnStructure({
      name: 'c1',
      type: 'varchar',
    })

    expect(
      run('foo', column, 'UNK' as Shape, {
        varchar: {
          __DEFAULT: ({ input }) => `winrar(${input})`,
        },
      })
    ).toEqual('winrar(foo)')
  })

  test('returns null if no matching or fallback template exists', () => {
    const column = fakeColumnStructure({
      name: 'c1',
      type: 'koos',
    })

    expect(
      run('foo', column, 'UNK' as Shape, {
        varchar: {
          EMAIL: ({ input }) => `no(${input})`,
        },
      })
    ).toEqual(null)
  })

  test('returns null if no templates are defined for the type', () => {
    const column = fakeColumnStructure({
      name: 'c1',
      type: 'int4',
    })

    expect(
      run('foo', column, 'UNK' as Shape, {
        int4: {
          EMAIL: ({ input }) => `no(${input})`,
        },
      })
    ).toEqual(null)
  })

  test('allows shape templates to be a function', () => {
    const column = fakeColumnStructure({
      name: 'c1',
      type: 'text',
    })

    expect(
      run('foo', column, 'EMAIL', {
        text: (api) =>
          ({
            EMAIL: ({ input }: { input: any }) => `winrar(${input})`,
          })['EMAIL'](api),
      })
    ).toEqual('winrar(foo)')
  })
})
