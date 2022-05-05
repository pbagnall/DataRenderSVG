#!/usr/bin/env node
import process from 'process';
import SvgDataRenderer from './SvgDataRenderer.js';

if (process.argv.length !== 3) {
    console.error("usage: renderdata <script-file>");
    process.exit(1);
}

let dataRender = new SvgDataRenderer(process.argv[2]);
dataRender.run();