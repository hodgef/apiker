const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/** Variables every project needs; each is generated once and kept in .env. */
const REQUIRED_ENV_KEYS = ["APIKER_SECRET_KEY", "ADMP_SETUP_SECRET", "ADMP_LOCAL_ADMIN_EMAIL", "ADMP_LOCAL_ADMIN_PASSWORD"];

module.exports = class PostBuild {
    constructor(curDir, TOML, dotenv){
        this.TOML = TOML;
        this.curDir = curDir;
        this.dotenv = dotenv;
    }
    apply(compiler) {
      const objects = require(path.join(this.curDir, "src/objects.json"));
      compiler.hooks["afterEmit"].tap("PostBuild", () => {
        const { parsed } = this.dotenv.config();
        const env = parsed ? this.ensureEnv(parsed) : this.createEnv();

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
            const newAppTomlParams = this.registerMissingObjects(missingObjects, deletedObjects, {...tomlParsed });
            const newWranglerTomlParams = { ...newAppTomlParams, vars: this.wranglerVars(env, newAppTomlParams.name) };

            /**
             * Build wrangler toml
             */
             const prependedContents =
             "# ----------------------------------------------------------------------------------\n" +
             "# Wrangler.toml\n" +
             "# Auto-generated file. Do not commit this file! Edit .env and app.toml files instead.\n"+
             "# ----------------------------------------------------------------------------------\n\n";
            const tomlOutputString = this.createTomlContents(newWranglerTomlParams, prependedContents);
            this.writeIfChanged(path.join(this.curDir, "wrangler.toml"), tomlOutputString);

            /**
             * Build app.toml
             */
             const prependedAppContents =
             "# ----------------------------------------------------------------------------------\n" +
             "# App.toml\n" +
             "# NOTE: Can be committed. Do not add secrets to this file. Use .env for this purpose.\n"+
             "# ----------------------------------------------------------------------------------\n\n";
             const tomlAppOutputString = this.createTomlContents(newAppTomlParams, prependedAppContents);
             this.writeIfChanged(path.join(this.curDir, "app.toml"), tomlAppOutputString);
            
            /**
             * Build shim.mjs
             */
            const shimOutputString = this.createShimContents(objects);
            this.writeIfChanged(path.join(this.curDir, "scripts/shim.mjs"), shimOutputString);
            this.writeIfChanged(path.join(this.curDir, "dist/shim.mjs"), shimOutputString);

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

    createTomlContents(newTomlParams, prependedContents) {
        const newTomlContents = this.TOML.stringify(newTomlParams);
        return prependedContents + newTomlContents;
    }

    /**
     * Cloudflare indexes Durable Object namespaces by worker script name, which is
     * app.toml's `name` rather than whatever a project passes to `apiker.init`. An
     * explicit .env value still wins.
     */
    wranglerVars(env = {}, appName) {
        return appName ? { CLOUDFLARE_SCRIPT_NAME: appName, ...env } : { ...env };
    }

    /** Rewriting identical contents restarts watchers such as `wrangler dev`. */
    writeIfChanged(filePath, contents) {
        if(fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === contents){
            return false;
        }

        fs.writeFileSync(filePath, contents);
        return true;
    }

    createEnv() {
        const env = {};
        REQUIRED_ENV_KEYS.forEach((key) => { env[key] = this.getValueForKey(key); });

        const contents =
            "# ----------------------------------------------------------------------\n" +
            "# Define environment variables here\n" +
            "# Do not commit this file!\n"+
            "# ----------------------------------------------------------------------\n\n"+
            this.serializeEnv(env) + "\n";

        fs.writeFileSync(path.join(this.curDir, ".env"), contents);
        return env;
    }

    /**
     * Adds variables introduced after a project was created. Without this an
     * existing .env never gains them, and the worker deploys without the vars.
     */
    ensureEnv(env) {
        const generated = REQUIRED_ENV_KEYS
            .filter((key) => !env[key])
            .map((key) => [key, this.getValueForKey(key)]);

        if(!generated.length){
            return env;
        }

        const additions = {};
        generated.forEach(([key, value]) => {
            additions[key] = value;
            env[key] = value;
        });

        fs.appendFileSync(path.join(this.curDir, ".env"), `\n${this.serializeEnv(additions)}\n`);
        return env;
    }

    serializeEnv(env) {
        return Object.entries(env).map(([key, value]) => `${key} = "${value}"`).join("\n");
    }

    getSecret(){
        return crypto.randomBytes(30).toString("hex");
    }

    getRandId(){
        return crypto.randomBytes(3).toString("hex");
    }

    /**
     * Most required vars are opaque secrets, but the local admin login needs an
     * email-shaped value to pass `registerUserAction`'s validation, and its
     * password must fit that same action's 20-character length cap (unlike the
     * other secrets here, which are never run through it).
     */
    getValueForKey(key){
        if(key === "ADMP_LOCAL_ADMIN_EMAIL"){
            return `local-admin-${this.getRandId()}@apiker.local`;
        }

        if(key === "ADMP_LOCAL_ADMIN_PASSWORD"){
            return crypto.randomBytes(8).toString("hex");
        }

        return this.getSecret();
    }
};