#!/usr/bin/env node
import fs from 'fs';
import process from 'process';
import { parse } from 'csv-parse/sync';
import xmldom from '@xmldom/xmldom';

const { DOMParser, XMLSerializer } = xmldom;

class SVGDataMaker {
    constructor(svgpath) {
        let svg = fs.readFileSync(svgpath).toString();
        this.doc = new DOMParser().parseFromString(svg);
        this.serial = 1;

        this.template = this.doc.getElementById('template');
        this.targetNode = this.template.parentNode;
        this.targetNode.removeChild(this.template);
        this.spacing = {};
        this.position = {};
        this.setupSpacings();
    }
    
    setupSpacings() {
        let nodes = this.template.childNodes;
        for (let i=0; i<nodes.length; i++) {
            let node = nodes.item(i);
            if (node.nodeType === 1) { // ELEMENT_NODE
                let offset = node.getAttribute("spacing").split(",");
                this.spacing[i] = { x: parseInt(offset[0].trim()), y: parseInt(offset[1].trim()) };
                node.removeAttribute("spacing");
                this.position[i] = { x: 0, y: 0 };
            } else {
                this.position[i] = null;
            }
        }
    }

    applyData(csvpath) {
        let csv = fs.readFileSync(csvpath).toString();
        let dataset = parse(csv, {columns: true});
        this.offset = { x: 0, y: 0 };

        for (let data of dataset) {
            this.populateTemplate(data);
        }
    }

    populateTemplate(data) {
        let nodes = this.template.childNodes;
        for (let i=0; i<nodes.length; i++) {
            let clone = nodes.item(i).cloneNode(true);
            if (clone.nodeType === 1) { // ELEMENT_NODE
                let id = clone.getAttribute("id");
                clone.setAttribute("id", id+this.serial);
                clone.setAttribute("transform", `translate(${this.position[i].x}, ${this.position[i].y})`);
                this.position[i].x += this.spacing[i].x;
                this.position[i].y += this.spacing[i].y;
            }
            this.targetNode.appendChild(clone);
        }

        let elements = new Set();
        for (let label in data) {
            let [id, attr] = label.split(':');
            let element = this.doc.getElementById(id);
            elements.add(element);
            if (attr==='text') {
                if (element.firstChild.nodeType === 3) {
                    element.replaceChild(this.doc.createTextNode(data[label]), element.firstChild);
                }
            } else {
                element.setAttribute(attr, data[label]);
            }
        }

        for (let element of elements) {
            let id = element.getAttribute("id");
            element.setAttribute("id", id+this.serial);
        }

        this.serial++;
    }

    outputSVG(element) {
        const serializer = new XMLSerializer();
        console.log(serializer.serializeToString(element));
    }

    saveSVG(outputPath) {
        const serializer = new XMLSerializer();
        fs.writeFileSync(outputPath, serializer.serializeToString(this.doc));
    }
}

if (process.argv.length !== 5) {
    console.error("usage: datamaker.mjs <svg-template> <csv-data> <svg-output>");
    process.exit(1);
}

let datamaker = new SVGDataMaker(process.argv[2]);
datamaker.applyData(process.argv[3]);
datamaker.saveSVG(process.argv[4]);
