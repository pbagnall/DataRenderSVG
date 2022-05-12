import fs from "fs";
import { parse } from "csv-parse/sync";
import xmldom from "@xmldom/xmldom";
import xpath from 'xpath';
import parser from "../grammar/parser.js";

const { DOMParser, XMLSerializer } = xmldom;

export default class SvgJob {
   constructor(job) {
      let parser = new DOMParser();
      console.log(job.template);

      let templateString = fs.readFileSync(job.template).toString();
      this.templateSVG = parser.parseFromString(templateString);

      this.outputSVG = parser.parseFromString(`
<?xml version="1.0" encoding="UTF-8"?>
<svg width="1176px" height="1200px" viewBox="0 0 1176 1200" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
</svg>`.trim());

      console.log(job.data);
      let csv = fs.readFileSync(job.data).toString();
      this.dataset = parse(csv, {columns: true});

      this.outputPath = job.output;
      this.data = job.data;
      this.sort = job.sort;
      this.groups = job.groups;
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

      this.compileExpressions(group.rules);

      for (let row of this.dataset) {
         let templateCopy = this.outputSVG.importNode(this.template, true);
         let id = templateCopy.getAttribute("id");
         templateCopy.setAttribute("id", id+""+serial);
         templateCopy.setAttribute("transform", `translate(${position.x}, ${position.y})`);

         this.target.appendChild(templateCopy);
         this.target.appendChild(this.outputSVG.createTextNode("\n"));
         this.applyData(group.rules, templateCopy, this.dataset, row, serial);

         serial++;
         position.x += spacing.x;
         position.y += spacing.y;
      }
   }

   compileExpressions(rules) {

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

            for (let [attr, expr] of Object.entries(rule)) {
               if (attr==='text') {
                  if (element.firstChild.nodeType === 3) {
                     element.replaceChild(this.outputSVG.createTextNode(expr), element.firstChild);
                  }
               } else {
                  element.setAttribute(attr, expr);
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