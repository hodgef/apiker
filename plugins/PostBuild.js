const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

module.exports = class PostBuild {
    constructor(curDir, TOML, dotenv){
        this.TOML = TOML;
        this.curDir = curDir;
        this.dotenv = dotenv;
    }
    apply(compiler) {
      const objects = require(path.join(this.curDir, "src/objects.json"));
      compiler.hooks["afterEmit"].tap("PostBuild", () => {
        const { parsed: env = this.createEnv() } = this.dotenv.config();

        try {
            const missingObjects = [];
            const deletedObjects = [];

            // Fetch app.toml
            const tomlFileContents = fs.readFileSync(path.join(this.curDir, "app.toml"), "utf8");
            const tomlParsed = this.TOML.parse(tomlFileContents);

            if(!(tomlParsed && tomlParsed.durable_objects && tomlParsed.durable_objects.bindings)){
                tomlParsed.durable_objects = {
                    bindings: []
                };
            }

            if(!tomlParsed.migrations){
                tomlParsed.migrations = [];
            }

            const registeredObjects = tomlParsed.durable_objects.bindings.map(({ class_name }) => class_name);

            objects.forEach((objectName) => {
                if(!registeredObjects.includes(objectName)){
                    missingObjects.push(objectName);
                }
            });

            registeredObjects.forEach((objectName) => {
                if(!objects.includes(objectName)){
                    deletedObjects.push(objectName);
                }
            });

            // Get list of objects to register
            const newTomlParams = this.registerMissingObjects(missingObjects, deletedObjects, {...tomlParsed, vars: env });

            /**
             * Build wrangler toml
             */
            const tomlOutputString = this.createTomlContents(newTomlParams);
            fs.writeFileSync(path.join(this.curDir, "wrangler.toml"), tomlOutputString);

            /**
             * Build shim.mjs
             */
            const shimOutputString = this.createShimContents(objects);
            fs.writeFileSync(path.join(this.curDir, "scripts/shim.mjs"), shimOutputString);
            fs.writeFileSync(path.join(this.curDir, "dist/shim.mjs"), shimOutputString);

        } catch (err) {
            console.error(err);
            console.error("Error: \".env\" and \"app.toml\" files are required");
        }
      });
    }

    registerMissingObjects(missingObjects, deletedObjects, newTomlParams) {
        const newBindings = missingObjects.map(missingObjectName =>
            ({name: missingObjectName, class_name: missingObjectName}));

        const tag = this.getRandId();
        const missingObj = missingObjects.length ? { new_classes: missingObjects } : null;
        const deletedObj = deletedObjects.length ? { deleted_classes: deletedObjects } : null;


        let newMigration;
        if(missingObj || deletedObj){
            newMigration = [{
                tag,
                ...(missingObj ? missingObj : {}),
                ...(deletedObj ? deletedObj : {})
            }];
        }

        // Apply bindings
        newTomlParams.durable_objects.bindings = [
            ...newTomlParams.durable_objects.bindings,
            ...newBindings
        ];

        if(deletedObjects.length){
            newTomlParams.durable_objects.bindings = 
            newTomlParams.durable_objects.bindings.filter(({ name }) => !deletedObjects.includes(name));
        }

        // Apply migrations
        if(newMigration){
            newTomlParams.migrations = [
                ...newTomlParams.migrations,
                ...newMigration
            ];
        }

        return newTomlParams;
    }

    createShimContents(declaredObjects = []){
        const declaredObjectStr = declaredObjects.length ? ", " + declaredObjects.join(", ") : "";
        const prependedContents =
            "// ----------------------------------------------------------------------\n" +
            "// Shim.mjs\n" +
            "// Auto-generated file. Do not edit directly.\n"+
            "// ----------------------------------------------------------------------\n\n";

        const newSimContents = "import bundle from \"./index.js\";\n"+
                     `const { handlers${declaredObjectStr} } = bundle;\n`+
                     `export { handlers as default${declaredObjectStr} };\n`;
        
        return prependedContents + newSimContents;
    }

    createTomlContents(newTomlParams) {
        const prependedContents =
            "# ----------------------------------------------------------------------\n" +
            "# Wrangler.toml\n" +
            "# Auto-generated file. Do not commit this file! Edit .env and app.toml files instead.\n"+
            "# ----------------------------------------------------------------------\n\n";

        const newTomlContents = this.TOML.stringify(newTomlParams);
        return prependedContents + newTomlContents;
    }

    createEnv() {
        const key = crypto.randomBytes(30).toString("hex");
        const contents =
            "# ----------------------------------------------------------------------\n" +
            "# Define environment variables here\n" +
            "# Do not commit this file!\n"+
            "# ----------------------------------------------------------------------\n\n"+
            `APIKER_SECRET_KEY = "${key}"`;

        fs.writeFileSync(path.join(this.curDir, ".env"), contents);
        return { APIKER_SECRET_KEY: key };
    }

    getRandId(){
        return crypto.randomBytes(3).toString("hex");
    }
};