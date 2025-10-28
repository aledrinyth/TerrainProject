// tests/booking-router.integration.test.js

const request = require("supertest");

// ---  express stub  ---
jest.mock(
  "express",
  () => {
    // Decorate res with helpers
    const decorateRes = (res) => {
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.set = (k, v) => {
        res.setHeader(k, v);
        return res;
      };
      res.json = (obj) => {
        if (!res.getHeader("Content-Type")) {
          res.setHeader("Content-Type", "application/json");
        }
        res.end(JSON.stringify(obj));
        return res;
      };
      res.send = (data) => {
        if (typeof data === "object" && data !== null && !Buffer.isBuffer(data)) {
          return res.json(data);
        }
        res.end(data);
        return res;
      };
      return res;
    };

    // Compile an Express-like path (with :params) to regex + param names
    const compilePath = (path) => {
      const names = [];
      // escape regex specials except "/" and ":"
      const escaped = path
        .replace(/([.+*?=^${}()[\]|\\])/g, "\\$1")
        .replace(/\/:([^/]+)/g, (_, name) => {
          names.push(name);
          return "/([^/]+)";
        });
      // allow optional trailing slash
      const pattern = `^${escaped.replace(/\/+$/, "")}/?$`;
      return { regex: new RegExp(pattern), names };
    };

    // Normalize join: "/api" + "/bookings" -> "/api/bookings"
    const joinPath = (a, b) => (`${a}/${b}`).replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";

    const makeApp = () => {
      const routes = [];
      const app = (req, res) => {
        decorateRes(res);

        // Parse URL & query
        const rawUrl = req.url || "/";
        const [pathname, queryStr] = rawUrl.split("?");
        req.path = pathname || "/";
        req.query = {};
        if (queryStr) {
          const usp = new URLSearchParams(queryStr);
          for (const [k, v] of usp.entries()) req.query[k] = v;
        }

        // Match method + regex
        for (const r of routes) {
          if (r.method !== req.method) continue;
          const m = r.regex.exec(req.path);
          if (!m) continue;
          req.params = {};
          r.names.forEach((name, idx) => {
            req.params[name] = m[idx + 1];
          });
          return r.handler(req, res);
        }

        res.statusCode = 404;
        res.end("Not Found");
      };

      app.use = (prefixOrMw, maybeRouter) => {
        // Ignore json middleware
        if (typeof prefixOrMw === "function" && prefixOrMw.__isJsonMw) return;

        if (maybeRouter && Array.isArray(maybeRouter.__routes)) {
          const prefix = prefixOrMw || "";
          maybeRouter.__routes.forEach((r) => {
            const fullPath = joinPath(prefix, r.path);
            const { regex, names } = compilePath(fullPath);
            routes.push({ method: r.method, regex, names, handler: r.handler });
          });
        }
      };

      ["get", "post", "patch", "delete"].forEach((m) => {
        app[m] = (path, handler) => {
          const { regex, names } = compilePath(path);
          routes.push({ method: m.toUpperCase(), regex, names, handler });
        };
      });

      return app;
    };

    const Router = () => {
      const __routes = [];
      const router = { __routes };
      ["get", "post", "patch", "delete"].forEach((m) => {
        router[m] = (path, handler) => {
          __routes.push({ method: m.toUpperCase(), path, handler });
        };
      });
      return router;
    };

    const json = () => {
      const mw = () => {};
      mw.__isJsonMw = true;
      return mw;
    };

    return Object.assign(makeApp, { Router, json });
  },
  { virtual: true }
);

// --- Now require express (our stub), router, and mock controllers ---
const express = require("express");
const bookingRouter = require("../routers/booking-router");

// Mock all controller functions exactly as router imports them
jest.mock("../controllers/booking-controller", () => ({
  createBooking: jest.fn(),
  getBookingsByName: jest.fn(),
  getBookingById: jest.fn(),
  getBookingsByDate: jest.fn(),
  getAllBookings: jest.fn(),
  updateBooking: jest.fn(),
  cancelBooking: jest.fn(),
  deleteBooking: jest.fn(),
  generateICSFileforBooking: jest.fn(),
}));

const {
  createBooking,
  getBookingsByName,
  getBookingById,
  getBookingsByDate,
  getAllBookings,
  updateBooking,
  cancelBooking,
  deleteBooking,
  generateICSFileforBooking,
} = require("../controllers/booking-controller");

// Build app with stub express
const app = express();
app.use(express.json());
app.use("/api/bookings", bookingRouter);

describe("Booking Router Integration Tests (with express stub)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/bookings", () => {
    it("creates a new booking", async () => {
      const payload = {
        name: "John Doe",
        userId: "u1",
        deskId: 3,
        dateTimestamp: "2025-10-23T00:00:00Z",
      };
      const mockBooking = { id: "1", ...payload };

      createBooking.mockImplementation((req, res) => {
        res.status(201).json(mockBooking);
      });

      const res = await request(app).post("/api/bookings").send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockBooking);
      expect(createBooking).toHaveBeenCalledTimes(1);
    });

    it("handles validation errors", async () => {
      createBooking.mockImplementation((req, res) => {
        res.status(400).json({ error: "Invalid booking data" });
      });

      const res = await request(app).post("/api/bookings").send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/bookings", () => {
    it("gets all bookings", async () => {
      const mockBookings = [{ id: "1" }, { id: "2" }];

      getAllBookings.mockImplementation((req, res) => {
        res.status(200).json(mockBookings);
      });

      const res = await request(app).get("/api/bookings");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockBookings);
      expect(getAllBookings).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/bookings/by-date", () => {
    it("gets bookings by dateTimestamp", async () => {
      const mock = [{ id: "1", dateTimestamp: "2025-10-23T00:00:00Z" }];

      getBookingsByDate.mockImplementation((req, res) => {
        res.status(200).json(mock);
      });

      const res = await request(app)
        .get("/api/bookings/by-date")
        .query({ dateTimestamp: "2025-10-23T00:00:00Z" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mock);
      expect(getBookingsByDate).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/bookings/name/:name", () => {
    it("gets bookings by name", async () => {
      const mock = [{ id: "1", name: "John Doe" }];

      getBookingsByName.mockImplementation((req, res) => {
        res.status(200).json(mock);
      });

      const res = await request(app).get("/api/bookings/name/John%20Doe");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mock);
      expect(getBookingsByName).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/bookings/ics/:userId", () => {
    it("generates ICS file for latest booking", async () => {
      const mockICS = "BEGIN:VCALENDAR\nEND:VCALENDAR";

      generateICSFileforBooking.mockImplementation((req, res) => {
        res.status(200).set("Content-Type", "text/calendar").send(mockICS);
      });

      const res = await request(app).get("/api/bookings/ics/user123");

      expect(res.status).toBe(200);
      expect(res.text).toBe(mockICS);
      expect(res.headers["content-type"]).toMatch(/text\/calendar/i);
      expect(generateICSFileforBooking).toHaveBeenCalledTimes(1);
    });
  });

  describe("PATCH /api/bookings/cancel/:id", () => {
    it("cancels a booking", async () => {
      const mockCancelled = { id: "1", status: "cancelled" };

      cancelBooking.mockImplementation((req, res) => {
        res.status(200).json(mockCancelled);
      });

      const res = await request(app).patch("/api/bookings/cancel/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockCancelled);
      expect(cancelBooking).toHaveBeenCalledTimes(1);
    });

    it("handles booking not found", async () => {
      cancelBooking.mockImplementation((req, res) => {
        res.status(404).json({ error: "Booking not found" });
      });

      const res = await request(app).patch("/api/bookings/cancel/999");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("PATCH /api/bookings/:id", () => {
    it("updates a booking", async () => {
      const mockUpdated = { id: "1", name: "John Doe Updated" };

      updateBooking.mockImplementation((req, res) => {
        res.status(200).json(mockUpdated);
      });

      const res = await request(app)
        .patch("/api/bookings/1")
        .send({ name: "John Doe Updated" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdated);
      expect(updateBooking).toHaveBeenCalledTimes(1);
    });
  });

  describe("DELETE /api/bookings/:id", () => {
    it("deletes a booking", async () => {
      deleteBooking.mockImplementation((req, res) => {
        res.status(200).json({ message: "Booking deleted successfully" });
      });

      const res = await request(app).delete("/api/bookings/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(deleteBooking).toHaveBeenCalledTimes(1);
    });

    it("handles unauthorized deletion", async () => {
      deleteBooking.mockImplementation((req, res) => {
        res.status(403).json({ error: "Admin access required" });
      });

      const res = await request(app).delete("/api/bookings/1");

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/bookings/:id", () => {
    it("gets booking by ID", async () => {
      const mock = { id: "1", name: "John Doe" };

      getBookingById.mockImplementation((req, res) => {
        res.status(200).json(mock);
      });

      const res = await request(app).get("/api/bookings/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mock);
      expect(getBookingById).toHaveBeenCalledTimes(1);
    });

    it("handles booking not found", async () => {
      getBookingById.mockImplementation((req, res) => {
        res.status(404).json({ error: "Booking not found" });
      });

      const res = await request(app).get("/api/bookings/999");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("Route Priority", () => {
    it("prioritizes /by-date over /:id", async () => {
      getBookingsByDate.mockImplementation((req, res) => {
        res.status(200).json({ route: "by-date" });
      });

      const res = await request(app).get("/api/bookings/by-date");

      expect(res.status).toBe(200);
      expect(getBookingsByDate).toHaveBeenCalledTimes(1);
      expect(getBookingById).not.toHaveBeenCalled();
    });

    it("prioritizes /name/:name over /:id", async () => {
      getBookingsByName.mockImplementation((req, res) => {
        res.status(200).json({ route: "name" });
      });

      const res = await request(app).get("/api/bookings/name/test");

      expect(res.status).toBe(200);
      expect(getBookingsByName).toHaveBeenCalledTimes(1);
      expect(getBookingById).not.toHaveBeenCalled();
    });

    it("prioritizes /ics/:userId over /:id", async () => {
      generateICSFileforBooking.mockImplementation((req, res) => {
        res.status(200).json({ route: "ics" });
      });

      const res = await request(app).get("/api/bookings/ics/user123");

      expect(res.status).toBe(200);
      expect(generateICSFileforBooking).toHaveBeenCalledTimes(1);
      expect(getBookingById).not.toHaveBeenCalled();
    });
  });
});