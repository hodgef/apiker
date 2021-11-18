#!/usr/bin/env node

const process = require("process");
const { execSync } = require("child_process");
const fs = require("fs");

if(process.argv[2]){
  const dirName = process.argv[2];
  execSync(`git clone https://github.com/hodgef/apiker-demo.git ${dirName}`);

  if(fs.existsSync(`./${dirName}/`)){
    process.chdir(`./${dirName}`);

    /**
     * Delete git dir
     */
    if (fs.existsSync("./.git")) {
      fs.rmdirSync("./.git", { recursive: true });
    }

    /**
     * Amend package.json
     */
    const packageJson = JSON.parse(fs.readFileSync("./package.json"));
    
    if(!packageJson){
      console.error("Could not find package.json");
      return;
    }

    packageJson.name = dirName;
    packageJson.version = "1.0.0";
    delete packageJson.description;
    delete packageJson.author;

    fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2));

    /**
     * Install package
     */
    execSync("npm install");
    

    console.log(`Project ${dirName} created. Consult documentation at https://hge.to/apiker for next steps`);
  } else {
    console.log(`Could not create directory ${dirName}`);
  }

} else {
  console.log("Directory name must be provided");
}

