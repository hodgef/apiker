import { apiker } from "..";

it("Runs without crashing", () => {
    const handler = () => new Response();
    const routes = { "/users/:id/counter": handler };
    const objects = ["Common", "Users", "EmailToUUID", "RateLimit", "Logs", "Bans"];
    
    apiker.init({
        routes,
        objects,
        exports
    });

    // Ensure routes are defined
    expect(apiker.routes).toBe(routes);

    // Ensure objects are defined
    expect(apiker.objects).toBe(objects);

    // Ensure objects are exported
    objects.forEach(objectName => {
        expect(typeof exports[objectName]).toBe("function");
    })

    // Ensure fetch handler is exported
    expect(typeof exports.handlers.fetch).toBe("function");
});