const request = require("supertest");
const express = require("express");
const userRouter = require("../routers/user-router");

// Mock the controller functions
jest.mock("../controllers/user-controller", () => ({
    createUser: jest.fn((req, res) => res.status(201).json({ message: "User created" })),
    getUserByEmail: jest.fn((req, res) => res.status(200).json({ email: req.params.email })),
    getUserById: jest.fn((req, res) => res.status(200).json({ id: req.params.id })),
    getUserByPhoneNumber: jest.fn((req, res) => res.status(200).json({ phoneNumber: req.params.phoneNumber })),
    getAllUsers: jest.fn((req, res) => res.status(200).json({ users: [] })),
    updateUser: jest.fn((req, res) => res.status(200).json({ message: "User updated" })),
    deleteUser: jest.fn((req, res) => res.status(200).json({ message: "User deleted" })),
    setAdmin: jest.fn((req, res) => res.status(200).json({ message: "Admin role set" }))
}));

const {
    createUser,
    getUserByEmail,
    getUserById,
    getUserByPhoneNumber,
    getAllUsers,
    updateUser,
    deleteUser,
    setAdmin
} = require("../controllers/user-controller");

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/users", userRouter);

describe("User Router Integration Tests", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /users/get-all-users", () => {
        it("should get all users", async () => {
            const response = await request(app)
                .get("/users/get-all-users");

            expect(response.status).toBe(200);
            expect(response.body.users).toBeDefined();
            expect(getAllUsers).toHaveBeenCalledTimes(1);
        });

        it("should not be caught by /get-user/:id route", async () => {
            await request(app).get("/users/get-all-users");

            expect(getAllUsers).toHaveBeenCalled();
            expect(getUserById).not.toHaveBeenCalled();
        });
    });

    describe("GET /users/get-user-by-email/:email", () => {
        it("should get user by email", async () => {
            const email = "test@example.com";
            const response = await request(app)
                .get(`/users/get-user-by-email/${email}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe(email);
            expect(getUserByEmail).toHaveBeenCalledTimes(1);
        });

        it("should handle email with plus sign", async () => {
            const email = "user+test@example.com";
            const response = await request(app)
                .get(`/users/get-user-by-email/${encodeURIComponent(email)}`);

            expect(response.status).toBe(200);
            expect(getUserByEmail).toHaveBeenCalled();
        });

        it("should not be caught by /get-user/:id route", async () => {
            await request(app).get("/users/get-user-by-email/test@example.com");

            expect(getUserByEmail).toHaveBeenCalled();
            expect(getUserById).not.toHaveBeenCalled();
        });
    });

    describe("GET /users/get-user-by-phone/:phoneNumber", () => {
        it("should get user by phone number", async () => {
            const phoneNumber = "1234567890";
            const response = await request(app)
                .get(`/users/get-user-by-phone/${phoneNumber}`);

            expect(response.status).toBe(200);
            expect(response.body.phoneNumber).toBe(phoneNumber);
            expect(getUserByPhoneNumber).toHaveBeenCalledTimes(1);
        });

        it("should handle phone number with country code", async () => {
            const phoneNumber = "+61412345678";
            const response = await request(app)
                .get(`/users/get-user-by-phone/${encodeURIComponent(phoneNumber)}`);

            expect(response.status).toBe(200);
            expect(getUserByPhoneNumber).toHaveBeenCalled();
        });

        it("should not be caught by /get-user/:id route", async () => {
            await request(app).get("/users/get-user-by-phone/1234567890");

            expect(getUserByPhoneNumber).toHaveBeenCalled();
            expect(getUserById).not.toHaveBeenCalled();
        });
    });

    describe("GET /users/get-user/:id", () => {
        it("should get user by ID", async () => {
            const userId = "12345";
            const response = await request(app)
                .get(`/users/get-user/${userId}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(userId);
            expect(getUserById).toHaveBeenCalledTimes(1);
        });

        it("should handle UUID format IDs", async () => {
            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            const response = await request(app)
                .get(`/users/get-user/${uuid}`);

            expect(response.status).toBe(200);
            expect(getUserById).toHaveBeenCalled();
        });

        it("should pass correct ID parameter to controller", async () => {
            const userId = "abc123";
            await request(app).get(`/users/get-user/${userId}`);

            const req = getUserById.mock.calls[0][0];
            expect(req.params.id).toBe(userId);
        });
    });

    describe("POST /users/create-user", () => {
        it("should create a new user", async () => {
            const userData = {
                name: "John Doe",
                email: "john@example.com",
                phoneNumber: "1234567890"
            };

            const response = await request(app)
                .post("/users/create-user")
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("User created");
            expect(createUser).toHaveBeenCalledTimes(1);
        });

        it("should pass request body to createUser controller", async () => {
            const userData = { email: "test@example.com" };
            await request(app)
                .post("/users/create-user")
                .send(userData);

            const req = createUser.mock.calls[0][0];
            expect(req.body).toEqual(userData);
        });
    });

    describe("POST /users/set-admin-role/:email", () => {
        it("should set admin role for user", async () => {
            const email = "admin@example.com";
            const response = await request(app)
                .post(`/users/set-admin-role/${email}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Admin role set");
            expect(setAdmin).toHaveBeenCalledTimes(1);
        });

        it("should handle URL-encoded emails", async () => {
            const email = "user+admin@example.com";
            const response = await request(app)
                .post(`/users/set-admin-role/${encodeURIComponent(email)}`);

            expect(response.status).toBe(200);
            expect(setAdmin).toHaveBeenCalled();
        });

        it("should pass email parameter to controller", async () => {
            const email = "test@example.com";
            await request(app).post(`/users/set-admin-role/${email}`);

            const req = setAdmin.mock.calls[0][0];
            expect(req.params.email).toBe(email);
        });
    });

    describe("PATCH /users/update-user/:emailQuery", () => {
        it("should update user by email", async () => {
            const email = "user@example.com";
            const updateData = { name: "Updated Name" };

            const response = await request(app)
                .patch(`/users/update-user/${email}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("User updated");
            expect(updateUser).toHaveBeenCalledTimes(1);
        });

        it("should pass both email and body to controller", async () => {
            const email = "test@example.com";
            const updateData = { phoneNumber: "9876543210" };

            await request(app)
                .patch(`/users/update-user/${email}`)
                .send(updateData);

            const req = updateUser.mock.calls[0][0];
            expect(req.params.emailQuery).toBe(email);
            expect(req.body).toEqual(updateData);
        });

        it("should handle partial updates", async () => {
            const response = await request(app)
                .patch("/users/update-user/user@example.com")
                .send({ name: "New Name" });

            expect(response.status).toBe(200);
            expect(updateUser).toHaveBeenCalled();
        });
    });

    describe("DELETE /users/delete-user/:email", () => {
        it("should delete user by email", async () => {
            const email = "delete@example.com";
            const response = await request(app)
                .delete(`/users/delete-user/${email}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("User deleted");
            expect(deleteUser).toHaveBeenCalledTimes(1);
        });

        it("should handle URL-encoded emails", async () => {
            const email = "user+delete@example.com";
            const response = await request(app)
                .delete(`/users/delete-user/${encodeURIComponent(email)}`);

            expect(response.status).toBe(200);
            expect(deleteUser).toHaveBeenCalled();
        });

        it("should pass email parameter to controller", async () => {
            const email = "test@example.com";
            await request(app).delete(`/users/delete-user/${email}`);

            const req = deleteUser.mock.calls[0][0];
            expect(req.params.email).toBe(email);
        });
    });

    describe("Route precedence tests", () => {
        it("should prioritize specific routes over generic param routes", async () => {
            // Test all specific GET routes
            await request(app).get("/users/get-all-users");
            expect(getAllUsers).toHaveBeenCalled();

            await request(app).get("/users/get-user-by-email/test@example.com");
            expect(getUserByEmail).toHaveBeenCalled();

            await request(app).get("/users/get-user-by-phone/1234567890");
            expect(getUserByPhoneNumber).toHaveBeenCalled();

            // Verify /get-user/:id was not called for specific routes
            expect(getUserById).not.toHaveBeenCalled();
        });

        it("should match /get-user/:id only for non-specific paths", async () => {
            await request(app).get("/users/get-user/random-id-123");

            expect(getUserById).toHaveBeenCalled();
            expect(getAllUsers).not.toHaveBeenCalled();
            expect(getUserByEmail).not.toHaveBeenCalled();
        });
    });

    describe("HTTP method routing", () => {
        it("should only accept POST for /create-user", async () => {
            const response = await request(app)
                .get("/users/create-user");

            expect(response.status).toBe(404);
            expect(createUser).not.toHaveBeenCalled();
        });

        it("should only accept POST for /set-admin-role/:email", async () => {
            const response = await request(app)
                .get("/users/set-admin-role/test@example.com");

            expect(response.status).toBe(404);
            expect(setAdmin).not.toHaveBeenCalled();
        });

        it("should only accept GET for retrieval endpoints", async () => {
            const response = await request(app)
                .post("/users/get-user/12345");

            expect(response.status).toBe(404);
            expect(getUserById).not.toHaveBeenCalled();
        });

        it("should only accept PATCH for /update-user/:emailQuery", async () => {
            const response = await request(app)
                .put("/users/update-user/test@example.com")
                .send({ name: "Test" });

            expect(response.status).toBe(404);
            expect(updateUser).not.toHaveBeenCalled();
        });

        it("should only accept DELETE for /delete-user/:email", async () => {
            const response = await request(app)
                .post("/users/delete-user/test@example.com");

            expect(response.status).toBe(404);
            expect(deleteUser).not.toHaveBeenCalled();
        });
    });

    describe("Edge cases", () => {
        it("should handle emails with special characters", async () => {
            const email = "user.name+tag@sub.example.com";
            const response = await request(app)
                .get(`/users/get-user-by-email/${encodeURIComponent(email)}`);

            expect(response.status).toBe(200);
            expect(getUserByEmail).toHaveBeenCalled();
        });

        it("should handle international phone numbers", async () => {
            const phone = "+61-412-345-678";
            const response = await request(app)
                .get(`/users/get-user-by-phone/${encodeURIComponent(phone)}`);

            expect(response.status).toBe(200);
            expect(getUserByPhoneNumber).toHaveBeenCalled();
        });

        it("should handle empty request body for POST", async () => {
            const response = await request(app)
                .post("/users/create-user")
                .send({});

            expect(response.status).toBe(201);
            expect(createUser).toHaveBeenCalled();
        });

        it("should handle empty request body for PATCH", async () => {
            const response = await request(app)
                .patch("/users/update-user/test@example.com")
                .send({});

            expect(response.status).toBe(200);
            expect(updateUser).toHaveBeenCalled();
        });

        it("should handle numeric IDs", async () => {
            const response = await request(app)
                .get("/users/get-user/999");

            expect(response.status).toBe(200);
            expect(getUserById).toHaveBeenCalled();
        });
    });

    describe("Parameter extraction", () => {
        it("should correctly extract email parameter", async () => {
            const email = "param-test@example.com";
            await request(app).get(`/users/get-user-by-email/${email}`);

            const req = getUserByEmail.mock.calls[0][0];
            expect(req.params.email).toBe(email);
        });

        it("should correctly extract phoneNumber parameter", async () => {
            const phone = "0412345678";
            await request(app).get(`/users/get-user-by-phone/${phone}`);

            const req = getUserByPhoneNumber.mock.calls[0][0];
            expect(req.params.phoneNumber).toBe(phone);
        });

        it("should correctly extract emailQuery parameter", async () => {
            const email = "query@example.com";
            await request(app).patch(`/users/update-user/${email}`).send({});

            const req = updateUser.mock.calls[0][0];
            expect(req.params.emailQuery).toBe(email);
        });
    });
});