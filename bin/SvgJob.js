import fs from "fs";
import { parse } from "csv-parse/sync";
import xmldom from "@xmldom/xmldom";
import xpath from 'xpath';
import Formula from "./Formula.js";

const { DOMParser, XMLSerializer } = xmldom;

export default class SvgJob {
   constructor(job) {
      let parser = new DOMParser();
      let templateString = fs.readFileSync(job.template).toString();
      this.templateSVG = parser.parseFromString(templateString);

      this.outputSVG = parser.parseFromString(`
<?xml version="1.0" encoding="UTF-8"?>
<svg width="1176px" height="1200px" viewBox="0 0 1176 1200" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
</svg>`.trim());

      let csv = fs.readFileSync(job.data).toString();
      this.dataset = parse(csv, {columns: true});

      this.outputPath = job.output;
      this.data = job.data;
      this.sort = job.sort;
      this.groups = job.groups;

      this.setup
   }

   run() {
      for (let group of this.groups) {
         this.buildElement(group);
      }
      this.saveSVG();
   }

   buildElement(group) {
      this.template = this.templateSVG.getElementById(group.id);
      this.target = this.outputSVG.documentElement;
      let spacing = { x: group.spacing.x, y: group.spacing.y };
      let serial = 1;
      let position = { x:0, y: 0 };

      let functions = this.compileExpressions(group.rules);

      for (let row of this.dataset) {
         let templateCopy = this.outputSVG.importNode(this.template, true);
         let id = templateCopy.getAttribute("id");
         templateCopy.setAttribute("id", id+""+serial);
         templateCopy.setAttribute("transform", `translate(${position.x}, ${position.y})`);

         this.target.appendChild(templateCopy);
         this.target.appendChild(this.outputSVG.createTextNode("\n"));
         this.applyData(functions, templateCopy, this.dataset, row, serial);

         serial++;
         position.x += spacing.x;
         position.y += spacing.y;
      }
   }

   compileExpressions(rules) {
      let functions = {};
      for (let element in rules) {
         functions[element] = {};
         for (let attr in rules[element]) {
            functions[element][attr] = new Formula(rules[element][attr]);
         }

         // elements should be included, unless the include attribute is overridden
         if (typeof functions[element].include === 'undefined') {
            functions[element].include = new Formula('true');
         }
      }

      return functions;
   }

   applyData(rules, copyElement, data, row, serial) {
      let ruleEntries = Object.entries(rules);

      for (let idRuleMap of ruleEntries) {
         let [id, rule] = idRuleMap;
         let xPathRule = `//*[@id='${id}']`;

         let xpathResult = xpath.evaluate(xPathRule, copyElement, null, xpath.XPathResult.FIRST_ORDERED_NODE_TYPE, null);
         let element = xpathResult.singleNodeValue;
         if (element) {
            element.setAttribute('id', element.getAttribute('id') + "" + serial);

            for (let [attr, formula] of Object.entries(rule)) {
               let value = formula.evaluate(row, data);
               console.log(id, attr, value);

               if (attr === 'include' && value === false) {
                  element.parentElement.removeChild(element);
                  break;
               } else {
                  switch (attr) {
                     case 'text':
                        if (element.firstChild.nodeType === 3) {
                           element.replaceChild(this.outputSVG.createTextNode(value), element.firstChild);
                        }
                        break;
                     case 'include':
                        break;
                     default:
                        element.setAttribute(attr, value);
                        break;
                  }
               }
            }
         }
      }
   }

   saveSVG() {
      const serializer = new XMLSerializer();
      fs.writeFileSync(this.outputPath, serializer.serializeToString(this.outputSVG));
   }
}