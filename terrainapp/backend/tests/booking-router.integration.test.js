const request = require("supertest");
const express = require("express");
const bookingRouter = require("../routers/booking-router");
const {
  createBooking,
  getBookingsByName,
  getBookingById,
  getBookingByStartTimestamp,
  getBookingByEndTimestamp,
  getAllBookings,
  updateBooking,
  cancelBooking,
  deleteBooking,
  generateICSFileforBooking
} = require("../controllers/booking-controller");

// Mock all controller functions
jest.mock("../controllers/booking-controller");

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/bookings", bookingRouter);

describe("Booking Router Integration Tests", () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/bookings", () => {
    it("should create a new booking", async () => {
      const mockBooking = {
        id: "1",
        name: "John Doe",
        startTime: "2025-10-23T10:00:00Z",
        endTime: "2025-10-23T11:00:00Z"
      };

      createBooking.mockImplementation((req, res) => {
        res.status(201).json(mockBooking);
      });

      const response = await request(app)
        .post("/api/bookings")
        .send({
          name: "John Doe",
          startTime: "2025-10-23T10:00:00Z",
          endTime: "2025-10-23T11:00:00Z"
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockBooking);
      expect(createBooking).toHaveBeenCalledTimes(1);
    });

    it("should handle validation errors", async () => {
      createBooking.mockImplementation((req, res) => {
        res.status(400).json({ error: "Invalid booking data" });
      });

      const response = await request(app)
        .post("/api/bookings")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/bookings", () => {
    it("should get all bookings", async () => {
      const mockBookings = [
        { id: "1", name: "John Doe" },
        { id: "2", name: "Jane Smith" }
      ];

      getAllBookings.mockImplementation((req, res) => {
        res.status(200).json(mockBookings);
      });

      const response = await request(app).get("/api/bookings");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBookings);
      expect(getAllBookings).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/bookings/by-start-time", () => {
    it("should get bookings by start timestamp", async () => {
      const mockBookings = [
        { id: "1", startTime: "2025-10-23T10:00:00Z" }
      ];

      getBookingByStartTimestamp.mockImplementation((req, res) => {
        res.status(200).json(mockBookings);
      });

      const response = await request(app)
        .get("/api/bookings/by-start-time")
        .query({ timestamp: "2025-10-23T10:00:00Z" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBookings);
      expect(getBookingByStartTimestamp).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/bookings/by-end-time", () => {
    it("should get bookings by end timestamp", async () => {
      const mockBookings = [
        { id: "1", endTime: "2025-10-23T11:00:00Z" }
      ];

      getBookingByEndTimestamp.mockImplementation((req, res) => {
        res.status(200).json(mockBookings);
      });

      const response = await request(app)
        .get("/api/bookings/by-end-time")
        .query({ timestamp: "2025-10-23T11:00:00Z" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBookings);
      expect(getBookingByEndTimestamp).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/bookings/name/:name", () => {
    it("should get bookings by name", async () => {
      const mockBookings = [
        { id: "1", name: "John Doe" }
      ];

      getBookingsByName.mockImplementation((req, res) => {
        res.status(200).json(mockBookings);
      });

      const response = await request(app)
        .get("/api/bookings/name/John%20Doe");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBookings);
      expect(getBookingsByName).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/bookings/ics/:userId", () => {
    it("should generate ICS file for booking", async () => {
      const mockICS = "BEGIN:VCALENDAR\nEND:VCALENDAR";

      generateICSFileforBooking.mockImplementation((req, res) => {
        res.status(200)
          .set("Content-Type", "text/calendar")
          .send(mockICS);
      });

      const response = await request(app)
        .get("/api/bookings/ics/user123");

      expect(response.status).toBe(200);
      expect(response.text).toBe(mockICS);
      expect(generateICSFileforBooking).toHaveBeenCalledTimes(1);
    });
  });

  describe("PATCH /api/bookings/cancel/:id", () => {
    it("should cancel a booking", async () => {
      const mockCancelledBooking = {
        id: "1",
        status: "cancelled"
      };

      cancelBooking.mockImplementation((req, res) => {
        res.status(200).json(mockCancelledBooking);
      });

      const response = await request(app)
        .patch("/api/bookings/cancel/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCancelledBooking);
      expect(cancelBooking).toHaveBeenCalledTimes(1);
    });

    it("should handle booking not found", async () => {
      cancelBooking.mockImplementation((req, res) => {
        res.status(404).json({ error: "Booking not found" });
      });

      const response = await request(app)
        .patch("/api/bookings/cancel/999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PATCH /api/bookings/:id", () => {
    it("should update a booking", async () => {
      const mockUpdatedBooking = {
        id: "1",
        name: "John Doe Updated",
        startTime: "2025-10-23T12:00:00Z"
      };

      updateBooking.mockImplementation((req, res) => {
        res.status(200).json(mockUpdatedBooking);
      });

      const response = await request(app)
        .patch("/api/bookings/1")
        .send({ name: "John Doe Updated" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedBooking);
      expect(updateBooking).toHaveBeenCalledTimes(1);
    });
  });

  describe("DELETE /api/bookings/:id", () => {
    it("should delete a booking", async () => {
      deleteBooking.mockImplementation((req, res) => {
        res.status(200).json({ message: "Booking deleted successfully" });
      });

      const response = await request(app)
        .delete("/api/bookings/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
      expect(deleteBooking).toHaveBeenCalledTimes(1);
    });

    it("should handle unauthorized deletion", async () => {
      deleteBooking.mockImplementation((req, res) => {
        res.status(403).json({ error: "Admin access required" });
      });

      const response = await request(app)
        .delete("/api/bookings/1");

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/bookings/:id", () => {
    it("should get booking by ID", async () => {
      const mockBooking = {
        id: "1",
        name: "John Doe",
        startTime: "2025-10-23T10:00:00Z"
      };

      getBookingById.mockImplementation((req, res) => {
        res.status(200).json(mockBooking);
      });

      const response = await request(app)
        .get("/api/bookings/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBooking);
      expect(getBookingById).toHaveBeenCalledTimes(1);
    });

    it("should handle booking not found", async () => {
      getBookingById.mockImplementation((req, res) => {
        res.status(404).json({ error: "Booking not found" });
      });

      const response = await request(app)
        .get("/api/bookings/999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Route Priority Tests", () => {
    it("should prioritize /by-start-time over /:id", async () => {
      getBookingByStartTimestamp.mockImplementation((req, res) => {
        res.status(200).json({ route: "by-start-time" });
      });

      const response = await request(app)
        .get("/api/bookings/by-start-time");

      expect(response.status).toBe(200);
      expect(getBookingByStartTimestamp).toHaveBeenCalledTimes(1);
      expect(getBookingById).not.toHaveBeenCalled();
    });

    it("should prioritize /name/:name over /:id", async () => {
      getBookingsByName.mockImplementation((req, res) => {
        res.status(200).json({ route: "name" });
      });

      const response = await request(app)
        .get("/api/bookings/name/test");

      expect(response.status).toBe(200);
      expect(getBookingsByName).toHaveBeenCalledTimes(1);
      expect(getBookingById).not.toHaveBeenCalled();
    });

    it("should prioritize /ics/:userId over /:id", async () => {
      generateICSFileforBooking.mockImplementation((req, res) => {
        res.status(200).json({ route: "ics" });
      });

      const response = await request(app)
        .get("/api/bookings/ics/user123");

      expect(response.status).toBe(200);
      expect(generateICSFileforBooking).toHaveBeenCalledTimes(1);
      expect(getBookingById).not.toHaveBeenCalled();
    });
  });
});