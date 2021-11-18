const process = require("process");
const { execSync } = require("child_process");
const fs = require("fs");

const execOptions = {stdio : "pipe" };

if(process.argv[2]){
  const dirName = process.argv[2];
  console.log("\n> Clone Apiker demo project\n");
  execSync(`git clone https://github.com/hodgef/apiker-demo.git ${dirName}`, execOptions);

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
      console.error("\n> Could not find package.json \n");
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
    console.log("\n> Install project\n");
    execSync("npm install", execOptions);
    

    console.log(`\n> Project ${dirName} created. Consult documentation at https://github.com/hodgef/apiker for next steps\n`);

  } else {
    console.log(`\n> Could not create directory ${dirName}\n`);
  }

} else {
  console.log("\n> Directory name must be provided\n");
}

