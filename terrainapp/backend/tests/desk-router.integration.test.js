const request = require("supertest");
const express = require("express");
const deskRouter = require("../routers/desk-router");

// Mock the controller functions
jest.mock("../controllers/desk-controller", () => ({
    createDesk: jest.fn((req, res) => res.status(201).json({ message: "Desk created" })),
    getAllDesks: jest.fn((req, res) => res.status(200).json({ desks: [] })),
    getDeskById: jest.fn((req, res) => res.status(200).json({ id: req.params.id })),
    getDesksByName: jest.fn((req, res) => res.status(200).json({ name: req.params.name })),
    updateDesk: jest.fn((req, res) => res.status(200).json({ message: "Desk updated" })),
    deleteDesk: jest.fn((req, res) => res.status(200).json({ message: "Desk deleted" }))
}));

const {
    createDesk,
    getAllDesks,
    getDeskById,
    getDesksByName,
    updateDesk,
    deleteDesk
} = require("../controllers/desk-controller");

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/desks", deskRouter);

describe("Desk Router Integration Tests", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /desks", () => {
        it("should create a new desk", async () => {
            const response = await request(app)
                .post("/desks")
                .send({ name: "Test Desk", location: "Room 101" });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Desk created");
            expect(createDesk).toHaveBeenCalledTimes(1);
        });

        it("should pass request body to createDesk controller", async () => {
            const deskData = { name: "Standing Desk", location: "Floor 2" };
            await request(app)
                .post("/desks")
                .send(deskData);

            expect(createDesk).toHaveBeenCalled();
            const req = createDesk.mock.calls[0][0];
            expect(req.body).toEqual(deskData);
        });
    });

    describe("GET /desks", () => {
        it("should get all desks", async () => {
            const response = await request(app)
                .get("/desks");

            expect(response.status).toBe(200);
            expect(response.body.desks).toBeDefined();
            expect(getAllDesks).toHaveBeenCalledTimes(1);
        });

        it("should not be caught by /:id route", async () => {
            await request(app).get("/desks");

            expect(getAllDesks).toHaveBeenCalled();
            expect(getDeskById).not.toHaveBeenCalled();
        });
    });

    describe("GET /desks/name/:name", () => {
        it("should get desks by name", async () => {
            const deskName = "Executive Desk";
            const response = await request(app)
                .get(`/desks/name/${deskName}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(deskName);
            expect(getDesksByName).toHaveBeenCalledTimes(1);
        });

        it("should handle URL-encoded names", async () => {
            const deskName = "Standing Desk A1";
            const response = await request(app)
                .get(`/desks/name/${encodeURIComponent(deskName)}`);

            expect(response.status).toBe(200);
            expect(getDesksByName).toHaveBeenCalled();
        });

        it("should not be caught by /:id route", async () => {
            await request(app).get("/desks/name/TestDesk");

            expect(getDesksByName).toHaveBeenCalled();
            expect(getDeskById).not.toHaveBeenCalled();
        });
    });

    describe("GET /desks/:id", () => {
        it("should get desk by ID", async () => {
            const deskId = "12345";
            const response = await request(app)
                .get(`/desks/${deskId}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(deskId);
            expect(getDeskById).toHaveBeenCalledTimes(1);
        });

        it("should handle numeric IDs", async () => {
            const response = await request(app)
                .get("/desks/999");

            expect(response.status).toBe(200);
            expect(getDeskById).toHaveBeenCalled();
        });

        it("should handle UUID format IDs", async () => {
            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            const response = await request(app)
                .get(`/desks/${uuid}`);

            expect(response.status).toBe(200);
            expect(getDeskById).toHaveBeenCalled();
        });

        it("should pass correct ID parameter to controller", async () => {
            const deskId = "abc123";
            await request(app).get(`/desks/${deskId}`);

            const req = getDeskById.mock.calls[0][0];
            expect(req.params.id).toBe(deskId);
        });
    });

    describe("PATCH /desks/:id", () => {
        it("should update desk by ID", async () => {
            const deskId = "12345";
            const response = await request(app)
                .patch(`/desks/${deskId}`)
                .send({ name: "Updated Desk", location: "New Location" });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Desk updated");
            expect(updateDesk).toHaveBeenCalledTimes(1);
        });

        it("should pass both ID and body to controller", async () => {
            const deskId = "67890";
            const updateData = { name: "Modified Desk" };
            
            await request(app)
                .patch(`/desks/${deskId}`)
                .send(updateData);

            const req = updateDesk.mock.calls[0][0];
            expect(req.params.id).toBe(deskId);
            expect(req.body).toEqual(updateData);
        });

        it("should allow partial updates", async () => {
            const response = await request(app)
                .patch("/desks/12345")
                .send({ location: "Room 202" });

            expect(response.status).toBe(200);
            expect(updateDesk).toHaveBeenCalled();
        });
    });

    describe("DELETE /desks/:id", () => {
        it("should delete desk by ID", async () => {
            const deskId = "12345";
            const response = await request(app)
                .delete(`/desks/${deskId}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Desk deleted");
            expect(deleteDesk).toHaveBeenCalledTimes(1);
        });

        it("should pass correct ID to controller", async () => {
            const deskId = "delete-test-123";
            await request(app).delete(`/desks/${deskId}`);

            const req = deleteDesk.mock.calls[0][0];
            expect(req.params.id).toBe(deskId);
        });
    });

    describe("Route precedence tests", () => {
        it("should prioritize /name/:name over /:id", async () => {
            await request(app).get("/desks/name/conference-desk");

            expect(getDesksByName).toHaveBeenCalled();
            expect(getDeskById).not.toHaveBeenCalled();
        });

        it("should match /:id for non-specific paths", async () => {
            await request(app).get("/desks/random-desk-id");

            expect(getDeskById).toHaveBeenCalled();
            expect(getDesksByName).not.toHaveBeenCalled();
        });

        it("should handle all specific routes before generic /:id", async () => {
            // Test GET /
            await request(app).get("/desks");
            expect(getAllDesks).toHaveBeenCalled();

            // Test GET /name/:name
            await request(app).get("/desks/name/test");
            expect(getDesksByName).toHaveBeenCalled();

            // Verify /:id was never called
            expect(getDeskById).not.toHaveBeenCalled();
        });
    });

    describe("HTTP method routing", () => {
        it("should only accept POST for creation endpoint", async () => {
            const response = await request(app)
                .put("/desks")
                .send({ name: "Test" });

            expect(response.status).toBe(404);
            expect(createDesk).not.toHaveBeenCalled();
        });

        it("should only accept GET for retrieval endpoints", async () => {
            const response = await request(app)
                .post("/desks/12345");

            expect(response.status).toBe(404);
            expect(getDeskById).not.toHaveBeenCalled();
        });

        it("should only accept PATCH for update endpoint", async () => {
            const response = await request(app)
                .put("/desks/12345")
                .send({ name: "Test" });

            expect(response.status).toBe(404);
            expect(updateDesk).not.toHaveBeenCalled();
        });

        it("should only accept DELETE for deletion endpoint", async () => {
            const response = await request(app)
                .post("/desks/12345");

            expect(response.status).toBe(404);
            expect(deleteDesk).not.toHaveBeenCalled();
        });
    });

    describe("Edge cases", () => {
        it("should handle empty request body for POST", async () => {
            const response = await request(app)
                .post("/desks")
                .send({});

            expect(response.status).toBe(201);
            expect(createDesk).toHaveBeenCalled();
        });

        it("should handle empty request body for PATCH", async () => {
            const response = await request(app)
                .patch("/desks/12345")
                .send({});

            expect(response.status).toBe(200);
            expect(updateDesk).toHaveBeenCalled();
        });

        it("should handle special characters in ID", async () => {
            const specialId = "desk-123_abc";
            const response = await request(app)
                .get(`/desks/${specialId}`);

            expect(response.status).toBe(200);
            expect(getDeskById).toHaveBeenCalled();
        });

        it("should handle spaces in name parameter", async () => {
            const nameWithSpaces = "Executive Desk 2024";
            const response = await request(app)
                .get(`/desks/name/${encodeURIComponent(nameWithSpaces)}`);

            expect(response.status).toBe(200);
            expect(getDesksByName).toHaveBeenCalled();
        });
    });
});