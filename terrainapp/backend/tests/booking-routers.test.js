const request = require("supertest");
const express = require("express");
const bookingRouter = require("../routers/booking-router");

// Mock the controller functions
jest.mock("../controllers/booking-controller", () => ({
    createBooking: jest.fn((req, res) => res.status(201).json({ message: "Booking created" })),
    getAllBookings: jest.fn((req, res) => res.status(200).json({ bookings: [] })),
    getBookingById: jest.fn((req, res) => res.status(200).json({ id: req.params.id })),
    getBookingByStartTimestamp: jest.fn((req, res) => res.status(200).json({ timestamp: "start" })),
    getBookingByEndTimestamp: jest.fn((req, res) => res.status(200).json({ timestamp: "end" })),
    getBookingsByName: jest.fn((req, res) => res.status(200).json({ name: req.params.name })),
    updateBooking: jest.fn((req, res) => res.status(200).json({ message: "Booking updated" })),
    cancelBooking: jest.fn((req, res) => res.status(200).json({ message: "Booking cancelled" })),
    deleteBooking: jest.fn((req, res) => res.status(200).json({ message: "Booking deleted" })),
    generateICSFileforBooking: jest.fn((req, res) => res.status(200).json({ userId: req.params.userId }))
}));

const {
    createBooking,
    getAllBookings,
    getBookingById,
    getBookingByStartTimestamp,
    getBookingByEndTimestamp,
    getBookingsByName,
    updateBooking,
    cancelBooking,
    deleteBooking,
    generateICSFileforBooking
} = require("../controllers/booking-controller");

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/bookings", bookingRouter);

describe("Booking Router Integration Tests", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /bookings", () => {
        it("should create a new booking", async () => {
            const response = await request(app)
                .post("/bookings")
                .send({ name: "Test Booking" });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Booking created");
            expect(createBooking).toHaveBeenCalledTimes(1);
        });
    });

    describe("GET /bookings", () => {
        it("should get all bookings", async () => {
            const response = await request(app)
                .get("/bookings");

            expect(response.status).toBe(200);
            expect(response.body.bookings).toBeDefined();
            expect(getAllBookings).toHaveBeenCalledTimes(1);
        });
    });

    describe("GET /bookings/by-start-time", () => {
        it("should get bookings by start timestamp", async () => {
            const response = await request(app)
                .get("/bookings/by-start-time");

            expect(response.status).toBe(200);
            expect(response.body.timestamp).toBe("start");
            expect(getBookingByStartTimestamp).toHaveBeenCalledTimes(1);
        });

        it("should not be caught by /:id route", async () => {
            await request(app).get("/bookings/by-start-time");

            expect(getBookingByStartTimestamp).toHaveBeenCalled();
            expect(getBookingById).not.toHaveBeenCalled();
        });
    });

    describe("GET /bookings/by-end-time", () => {
        it("should get bookings by end timestamp", async () => {
            const response = await request(app)
                .get("/bookings/by-end-time");

            expect(response.status).toBe(200);
            expect(response.body.timestamp).toBe("end");
            expect(getBookingByEndTimestamp).toHaveBeenCalledTimes(1);
        });

        it("should not be caught by /:id route", async () => {
            await request(app).get("/bookings/by-end-time");

            expect(getBookingByEndTimestamp).toHaveBeenCalled();
            expect(getBookingById).not.toHaveBeenCalled();
        });
    });

    describe("GET /bookings/name/:name", () => {
        it("should get bookings by name", async () => {
            const testName = "John Doe";
            const response = await request(app)
                .get(`/bookings/name/${testName}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(testName);
            expect(getBookingsByName).toHaveBeenCalledTimes(1);
        });

        it("should not be caught by /:id route", async () => {
            await request(app).get("/bookings/name/TestName");

            expect(getBookingsByName).toHaveBeenCalled();
            expect(getBookingById).not.toHaveBeenCalled();
        });
    });

    describe("GET /bookings/ics/:userId", () => {
        it("should generate ICS file for user", async () => {
            const userId = "user123";
            const response = await request(app)
                .get(`/bookings/ics/${userId}`);

            expect(response.status).toBe(200);
            expect(response.body.userId).toBe(userId);
            expect(generateICSFileforBooking).toHaveBeenCalledTimes(1);
        });

        it("should not be caught by /:id route", async () => {
            await request(app).get("/bookings/ics/user123");

            expect(generateICSFileforBooking).toHaveBeenCalled();
            expect(getBookingById).not.toHaveBeenCalled();
        });
    });

    describe("GET /bookings/:id", () => {
        it("should get booking by ID", async () => {
            const bookingId = "12345";
            const response = await request(app)
                .get(`/bookings/${bookingId}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(bookingId);
            expect(getBookingById).toHaveBeenCalledTimes(1);
        });

        it("should handle numeric IDs", async () => {
            const response = await request(app)
                .get("/bookings/999");

            expect(response.status).toBe(200);
            expect(getBookingById).toHaveBeenCalled();
        });
    });

    describe("PATCH /bookings/:id", () => {
        it("should update booking by ID", async () => {
            const bookingId = "12345";
            const response = await request(app)
                .patch(`/bookings/${bookingId}`)
                .send({ name: "Updated Booking" });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Booking updated");
            expect(updateBooking).toHaveBeenCalledTimes(1);
        });
    });

    describe("PATCH /bookings/cancel/:id", () => {
        it("should cancel booking by ID", async () => {
            const bookingId = "12345";
            const response = await request(app)
                .patch(`/bookings/cancel/${bookingId}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Booking cancelled");
            expect(cancelBooking).toHaveBeenCalledTimes(1);
        });

        it("should not be caught by /:id route", async () => {
            await request(app).patch("/bookings/cancel/12345");

            expect(cancelBooking).toHaveBeenCalled();
            expect(updateBooking).not.toHaveBeenCalled();
        });
    });

    describe("DELETE /bookings/:id", () => {
        it("should delete booking by ID", async () => {
            const bookingId = "12345";
            const response = await request(app)
                .delete(`/bookings/${bookingId}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Booking deleted");
            expect(deleteBooking).toHaveBeenCalledTimes(1);
        });
    });

    describe("Route precedence tests", () => {
        it("should prioritize specific routes over generic param routes", async () => {
            // Test that specific routes are matched before /:id
            await request(app).get("/bookings/by-start-time");
            expect(getBookingByStartTimestamp).toHaveBeenCalled();
            
            await request(app).get("/bookings/by-end-time");
            expect(getBookingByEndTimestamp).toHaveBeenCalled();
            
            await request(app).get("/bookings/name/test");
            expect(getBookingsByName).toHaveBeenCalled();
            
            await request(app).get("/bookings/ics/user123");
            expect(generateICSFileforBooking).toHaveBeenCalled();

            // Verify /:id was not called for any of these
            expect(getBookingById).not.toHaveBeenCalled();
        });

        it("should match /:id route only for non-specific paths", async () => {
            await request(app).get("/bookings/some-random-id");
            
            expect(getBookingById).toHaveBeenCalled();
        });
    });

    describe("HTTP method routing", () => {
        it("should only accept GET for retrieval endpoints", async () => {
            const response = await request(app)
                .post("/bookings/by-start-time");

            expect(response.status).toBe(404);
            expect(getBookingByStartTimestamp).not.toHaveBeenCalled();
        });

        it("should only accept POST for creation endpoint", async () => {
            const response = await request(app)
                .get("/bookings")
                .send({ name: "Test" });

            // This will call getAllBookings instead
            expect(response.status).toBe(200);
            expect(createBooking).not.toHaveBeenCalled();
        });

        it("should only accept PATCH for update endpoints", async () => {
            const response = await request(app)
                .put("/bookings/12345");

            expect(response.status).toBe(404);
            expect(updateBooking).not.toHaveBeenCalled();
        });

        it("should only accept DELETE for deletion endpoint", async () => {
            const response = await request(app)
                .get("/bookings/12345")
                .set("X-HTTP-Method-Override", "DELETE");

            expect(deleteBooking).not.toHaveBeenCalled();
        });
    });
});