import parser from "../grammar/parser.js";

parser.yy.variable = function(varName) {
   return parser.yy.row[varName];
};

parser.yy.execute = function(fn, args) {
   return parser.yy.functions[fn](...args);
};

parser.yy.column = function(colName) {
   let data = [];
   for (let row of parser.yy.data) {
      data.push(row[colName.substring(1)]);
   }
   return data;
};

function choice(selector, options, fallback) {
   for (let i = 0; i < selector.length; i++) {
      if (selector[i] === true) return options[i];
   }
   return fallback;
}

function mean(data) {
   let sum = 0;
   for (let datum of data) {
      sum += parseFloat(datum);
   }
   return sum / data.length;
}

/**
 * returns a string representation of a float to x decimal places.
 */
function dp(num, places) {
   return num.toFixed(places);
}

parser.yy.functions = {
   choice: choice,
   mean: mean,
   dp: dp
};

export default class Formula {
   constructor(expression) {
      this.formula = parser.parse(expression);
   }

   evaluate(row, data) {
      parser.yy.data = data;
      parser.yy.row = row;
      return this.formula();
   }
}

