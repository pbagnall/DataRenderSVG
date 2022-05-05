import fs from "fs";
import { parse } from "csv-parse/sync";
import xmldom from "@xmldom/xmldom";

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
      this.elements = job.elements;
   }

   run() {
      for (let element of this.elements) {
         this.buildElement(element);
      }
      this.saveSVG();
   }

   buildElement(element) {
      this.template = this.templateSVG.getElementById(element.id);
      this.target = this.outputSVG.documentElement;
      let spacing = { x: element.spacing.x, y: element.spacing.y };
      let serial = 1;
      let position = { x:0, y: 0 };

      for (let data of this.dataset) {
         let copy = this.templateSVG.importNode(this.template, true);
         let id = copy.getAttribute("id");
         copy.setAttribute("id", id+serial);
         copy.setAttribute("transform", `translate(${position.x}, ${position.y})`);
         this.applyData(data, copy);
         this.target.appendChild(copy);
         serial++;

         position.x += spacing.x;
         position.y += spacing.y;
      }
   }

   applyData(data, group, serial) {

   }

   populateTemplate(data) {
      let elements = new Set();
      for (let label in data) {
         let [id, attr] = label.split(':');
         let element = this.template.getElementById(id);
         elements.add(element);
         if (attr==='text') {
            if (element.firstChild.nodeType === 3) {
               element.replaceChild(this.template.createTextNode(data[label]), element.firstChild);
            }
         } else {
            element.setAttribute(attr, data[label]);
         }
      }
   }

   saveSVG() {
      const serializer = new XMLSerializer();
      fs.writeFileSync(this.outputPath, serializer.serializeToString(this.outputSVG));
   }
}