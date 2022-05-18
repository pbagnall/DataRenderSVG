import 'jest';
import '@jest/globals';
import parser from "../grammar/parser.js";

function runTest(description, expression, expected, /** string|null */ exception) {
   if (exception !== null) {
      let lines = exception.split('\n');
      let trimmed = [];
      lines.forEach((l) => trimmed.push(l.trim()));
      exception = trimmed.join('\n');
      expect(() => parser.parse(expression)).toThrowError(exception);
   } else {
      let expr = parser.parse(expression);
      let result = expr();
      if (expected !== 'exception') {
         expect(result).toStrictEqual(expected);
      }
   }
}

beforeAll(() => {
   parser.yy.variable = function(varName) {
      return parser.yy.row[varName];
   }
   parser.yy.execute = function(fn, args) {
      return parser.yy.functions[fn](...args);
   }

   parser.yy.column = function(colName) {
      let data = [];
      for (let row of parser.yy.data) {
         data.push(row[colName.substring(1)]);
      }
      return data;
   }

   // noinspection JSUnusedGlobalSymbols
   parser.yy.functions = {
      choice: function(selector, options, fallback) {
         for (let i = 0; i < selector.length; i++) {
            if (selector[i] === true) return options[i];
         }
         return fallback;
      },
      mean: function(data) {
         let sum = 0;
         for (let datum of data) {
            sum += datum;
         }
         return sum / data.length;
      }
   };

   parser.yy.data = [
      { hello: 12345 },
      { hello: 123 }
   ];

   parser.yy.row = parser.yy.data[0];
});

describe.each([
   ['literal values']
])('%s', () => {
   test.each([
      ["integer", "129", 129, null],
      ["negative integer", "-129", -129, null],
      ["float", "129.7", 129.7, null],
      ["negative float", "-129.7", -129.7, null],
      ["boolean true", "true", true, null],
      ["boolean false", "false", false, null],
      ["array", "[1,2,3]", [1,2,3], null],
      ["array, with spaces", "[ 1 , 2 , 3 ]", [1,2,3], null],
      ["string", '"string"', "string", null],
      ["string, with spaces", '"string with spaces"', "string with spaces", null],
      ["string, with symbols", '"string with! @symbols"', "string with! @symbols", null],
      ["string, double quotes", '"string with! @symbols"', "string with! @symbols", null],
      ["string, single quotes", "'string with! @symbols'", "string with! @symbols", null],
      ["string, escaped quotes", "'string \\\'with! @symbols'", "string 'with! @symbols", null]
   ])('%s', runTest);
});

describe.each([
   ['arithmetic operators']
])('%s', () => {
   test.each([
      ["addition", "12 + 23", 35, null],
      ["subtraction", "23 - 12", 11, null],
      ["multiplication", "12 * 4", 48, null],
      ["division", "12 / 6", 2, null],
      ["power", "2 ^ 3", 8, null],
   ])('%s', runTest);
});

describe.each([
   ['boolean operators']
])('%s', () => {
   test.each([
      ["true AND true", "true and true", true, null],
      ["true AND false", "true and false", false, null],
      ["false AND false", "false and false", false, null],
      ["true OR true", "true or true", true, null],
      ["true OR false", "true or false", true, null],
      ["false OR false", "false or false", false, null],
      ["NOT true", "not true", false, null],
      ["NOT false", "not false", true, null]
   ])('%s', runTest);
});

describe.each([
   ['variables']
])('%s', () => {
   test.each([
      ["variable", "hello", 12345, null],
      ["column", "@hello", [12345, 123], null],
   ])('%s', runTest);
});


describe.each([
   ['functions']
])('%s', () => {
   test.each([
      [
         "choice, match found",
         "choice([1, true, false],[111,222,333], 444)",
         222, null
      ],
      [
         "choice, default value",
         'choice([1, undef, false],[111,222,333], "someth\\\"ing")',
         'someth"ing', null
      ],
      ["mean of array", "mean([1,2,4])", 2.3333333333333335, null],
      ["mean of column", "mean(@hello)", 6234, null],
   ])('%s, %s', runTest);
});


describe.each([
   ['errors']
])('%s', () => {
   test.each([
      ["invalid OR expression", "12 or 1=2", 'exception',
         `Parse error on line 1:
          12 or 1=2
          ---^
          Expecting 'EOF', '+', '-', '*', '/', '^', ',', '=', '!=', got 'OR'`
      ],
   ])('%s, %s', runTest);
});

describe.each([
   ['functions']
])('%s', () => {
   test.each([
      ["numeric comparisons with AND", "1=1 and 1=2", false, null],
      ["numeric comparisons with OR", "1=1 or 1=2", true, null],
      ["array", "[1+2,5+6,7+8]", [3, 11, 15], null],
   ])('%s, %s', runTest);
});
