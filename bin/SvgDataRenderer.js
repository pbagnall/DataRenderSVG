import fs from "fs";
import path from "path";
import process from "process";
import SvgJob from "./SvgJob.js";

export default class SvgDataRenderer {
   constructor(scriptPath) {
      let scriptString = fs.readFileSync(scriptPath).toString();
      this.script = JSON.parse(scriptString);
      this.scriptDir = path.dirname(scriptPath);
   }

   run() {
      process.chdir(this.scriptDir);
      // noinspection JSUnresolvedVariable
      let jobs = this.script.jobs;

      for (let job of jobs) {
         let svgJob = new SvgJob(job);
         svgJob.run();
      }
   }
}
