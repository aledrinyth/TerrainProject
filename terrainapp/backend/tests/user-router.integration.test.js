// tests/user-router.integration.test.js
const request = require("supertest");

// --- Express stub ---
jest.mock(
  "express",
  function () {
    function matchPath(pattern, path, req) {
      var pParts = pattern.split("/").filter(Boolean);
      var sParts = path.split("/").filter(Boolean);
      if (pParts.length !== sParts.length) return false;
      req.params = {};
      for (var i = 0; i < pParts.length; i++) {
        var p = pParts[i];
        var s = sParts[i];
        if (p.charAt(0) === ":") {
          req.params[p.slice(1)] = decodeURIComponent(s);
        } else if (p !== s) {
          return false;
        }
      }
      return true;
    }

    function makeResponse(res) {
      if (res._patched) return res;
      res._patched = true;
      res.status = function (code) {
        this.statusCode = code;
        return this;
      };
      res.json = function (obj) {
        if (this.setHeader) this.setHeader("Content-Type", "application/json");
        this.end(JSON.stringify(obj || {}));
        return this;
      };
      res.send = function (data) {
        if (typeof data === "object") {
          if (this.setHeader) this.setHeader("Content-Type", "application/json");
          this.end(JSON.stringify(data));
        } else {
          this.end(String(data || ""));
        }
        return this;
      };
      return res;
    }

    function Router() {
      var routes = [];
      var router = function (req, res) {
        makeResponse(res);
        var method = (req.method || "get").toLowerCase();
        var pathOnly = (req.url || "/").split("?")[0];
        var layer = null;
        for (var i = 0; i < routes.length; i++) {
          var r = routes[i];
          if (r.method === method && matchPath(r.path, pathOnly, req)) {
            layer = r;
            break;
          }
        }
        if (!layer) {
          res.statusCode = 404;
          return res.end("{}");
        }
        return layer.handler(req, res);
      };
      ["get", "post", "patch", "delete"].forEach(function (m) {
        router[m] = function (path, handler) {
          routes.push({ method: m, path: path, handler: handler });
        };
      });
      return router;
    }

    function express() {
      var mounts = [];

      function runMounts(req, res, startIndex) {
        var idx = typeof startIndex === "number" ? startIndex : 0;
        function next() {
          runMounts(req, res, idx + 1);
        }
        for (var i = idx; i < mounts.length; i++) {
          idx = i;
          var m = mounts[i];
          var pathOnly = (req.url || "/").split("?")[0];

          // path match
          if (m.path === "/" || pathOnly === m.path || pathOnly.indexOf(m.path + "/") === 0) {
            // If it is mounted at a sub-path, adjust req.url for routers
            var isRouter = m.fn.length < 3; // routers are (req,res); middleware are (req,res,next)
            var originalUrl = req.url;

            if (m.path !== "/" && isRouter) {
              var sliced = pathOnly.slice(m.path.length) || "/";
              if (sliced.charAt(0) !== "/") sliced = "/" + sliced;
              req.url = sliced + (originalUrl.indexOf("?") >= 0 ? originalUrl.slice(originalUrl.indexOf("?")) : "");
            }

            // Call middleware with next(), or router without
            if (m.fn.length >= 3) {
              return m.fn(req, res, next);
            } else {
              var ret = m.fn(req, res);
              req.url = originalUrl;
              return ret;
            }
          }
        }
        // No mount handled it
        res.statusCode = 404;
        res.end("{}");
      }

      var app = function (req, res) {
        makeResponse(res);
        runMounts(req, res, 0);
      };

      app.use = function (path, fn) {
        if (typeof path === "function") {
          mounts.push({ path: "/", fn: path });
        } else {
          mounts.push({ path: path || "/", fn: fn });
        }
      };

      app.listen = function () {};
      return app;
    }

    express.Router = Router;

    // JSON body parser middleware
    express.json = function () {
      return function (req, res, next) {
        // Only parse JSON when method can have a body
        var m = (req.method || "GET").toUpperCase();
        if (m !== "POST" && m !== "PUT" && m !== "PATCH" && m !== "DELETE") {
          req.body = {};
          return typeof next === "function" ? next() : undefined;
        }

        var chunks = [];
        req.on("data", function (c) {
          chunks.push(c);
        });
        req.on("end", function () {
          var raw = Buffer.concat(chunks).toString("utf8");
          if (!raw) {
            req.body = {};
          } else {
            try {
              req.body = JSON.parse(raw);
            } catch (e) {
              req.body = {};
            }
          }
          if (typeof next === "function") next();
        });
      };
    };

    return express;
  },
  { virtual: true }
);
// --- end express stub ---

const express = require("express");
const userRouter = require("../routers/user-router");

// Mock the controller functions EXACTLY as the router imports them
jest.mock("../controllers/user-controller", function () {
  return {
    createUser: jest.fn(function (req, res) {
      return res.status(201).json({ message: "User created" });
    }),
    getUserByEmail: jest.fn(function (req, res) {
      return res.status(200).json({ email: req.params.email });
    }),
    getUserById: jest.fn(function (req, res) {
      return res.status(200).json({ id: req.params.id });
    }),
    getUserByPhoneNumber: jest.fn(function (req, res) {
      return res.status(200).json({ phoneNumber: req.params.phoneNumber });
    }),
    getAllUsers: jest.fn(function (req, res) {
      return res.status(200).json({ users: [] });
    }),
    updateUser: jest.fn(function (req, res) {
      return res.status(200).json({ message: "User updated" });
    }),
    deleteUser: jest.fn(function (req, res) {
      return res.status(200).json({ message: "User deleted" });
    }),
    setAdmin: jest.fn(function (req, res) {
      return res.status(200).json({ message: "Admin role set" });
    }),
  };
});

const {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByPhoneNumber,
  getAllUsers,
  updateUser,
  deleteUser,
  setAdmin,
} = require("../controllers/user-controller");

// Build app using the stubbed express
const app = express();
app.use(express.json()); // <- now actually parses and chains
app.use("/users", userRouter);

describe("User Router Integration Tests (with express stub)", function () {
  beforeEach(function () {
    jest.clearAllMocks();
  });

  describe("GET /users/get-all-users", function () {
    test("gets all users", async function () {
      const res = await request(app).get("/users/get-all-users");
      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(getAllUsers).toHaveBeenCalledTimes(1);
    });

    test("not caught by /get-user/:id", async function () {
      await request(app).get("/users/get-all-users");
      expect(getAllUsers).toHaveBeenCalled();
      expect(getUserById).not.toHaveBeenCalled();
    });
  });

  describe("GET /users/get-user-by-email/:email", function () {
    test("gets user by email", async function () {
      const email = "test@example.com";
      const res = await request(app).get("/users/get-user-by-email/" + email);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(email);
      expect(getUserByEmail).toHaveBeenCalledTimes(1);
    });

    test("handles plus sign", async function () {
      const email = "user+test@example.com";
      const res = await request(app).get(
        "/users/get-user-by-email/" + encodeURIComponent(email)
      );
      expect(res.status).toBe(200);
      expect(getUserByEmail).toHaveBeenCalled();
    });

    test("not caught by /get-user/:id", async function () {
      await request(app).get("/users/get-user-by-email/test@example.com");
      expect(getUserByEmail).toHaveBeenCalled();
      expect(getUserById).not.toHaveBeenCalled();
    });
  });

  describe("GET /users/get-user-by-phone/:phoneNumber", function () {
    test("gets user by phone", async function () {
      const phone = "1234567890";
      const res = await request(app).get("/users/get-user-by-phone/" + phone);
      expect(res.status).toBe(200);
      expect(res.body.phoneNumber).toBe(phone);
      expect(getUserByPhoneNumber).toHaveBeenCalledTimes(1);
    });

    test("handles country code", async function () {
      const phone = "+61412345678";
      const res = await request(app).get(
        "/users/get-user-by-phone/" + encodeURIComponent(phone)
      );
      expect(res.status).toBe(200);
      expect(getUserByPhoneNumber).toHaveBeenCalled();
    });

    test("not caught by /get-user/:id", async function () {
      await request(app).get("/users/get-user-by-phone/1234567890");
      expect(getUserByPhoneNumber).toHaveBeenCalled();
      expect(getUserById).not.toHaveBeenCalled();
    });
  });

  describe("GET /users/get-user/:id", function () {
    test("gets user by id", async function () {
      const id = "abc123";
      const res = await request(app).get("/users/get-user/" + id);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(getUserById).toHaveBeenCalledTimes(1);
    });

    test("handles UUID", async function () {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const res = await request(app).get("/users/get-user/" + uuid);
      expect(res.status).toBe(200);
      expect(getUserById).toHaveBeenCalled();
    });
  });

  describe("POST /users/create-user", function () {
    test("creates user", async function () {
      const payload = { name: "John", email: "john@example.com", phoneNumber: "123" };
      const res = await request(app).post("/users/create-user").send(payload);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User created");
      expect(createUser).toHaveBeenCalledTimes(1);
    });

    test("passes body to controller", async function () {
      const payload = { email: "x@y.z" };
      await request(app).post("/users/create-user").send(payload);
      const reqObj = createUser.mock.calls[0][0];
      expect(reqObj.body).toEqual(payload); // <-- now defined
    });
  });

  describe("POST /users/set-admin-role/:email", function () {
    test("sets admin", async function () {
      const email = "admin@example.com";
      const res = await request(app).post("/users/set-admin-role/" + email);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Admin role set");
      expect(setAdmin).toHaveBeenCalledTimes(1);
    });

    test("handles encoded emails", async function () {
      const email = "user+admin@example.com";
      const res = await request(app).post(
        "/users/set-admin-role/" + encodeURIComponent(email)
      );
      expect(res.status).toBe(200);
      expect(setAdmin).toHaveBeenCalled();
    });
  });

  describe("PATCH /users/update-user/:emailQuery", function () {
    test("updates user", async function () {
      const res = await request(app)
        .patch("/users/update-user/u@example.com")
        .send({ name: "New" });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("User updated");
      expect(updateUser).toHaveBeenCalledTimes(1);
    });

    test("passes params + body", async function () {
      const email = "q@example.com";
      const body = { phoneNumber: "999" };
      await request(app).patch("/users/update-user/" + email).send(body);
      const reqObj = updateUser.mock.calls[0][0];
      expect(reqObj.params.emailQuery).toBe(email);
      expect(reqObj.body).toEqual(body); // <-- now defined
    });
  });

  describe("DELETE /users/delete-user/:email", function () {
    test("deletes user", async function () {
      const res = await request(app).delete("/users/delete-user/del@example.com");
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("User deleted");
      expect(deleteUser).toHaveBeenCalledTimes(1);
    });

    test("handles encoded email", async function () {
      const res = await request(app).delete(
        "/users/delete-user/" + encodeURIComponent("user+delete@example.com")
      );
      expect(res.status).toBe(200);
      expect(deleteUser).toHaveBeenCalled();
    });
  });

  describe("Route precedence", function () {
    test("specific GET routes not hijacked by /get-user/:id", async function () {
      await request(app).get("/users/get-all-users");
      await request(app).get("/users/get-user-by-email/a@b.c");
      await request(app).get("/users/get-user-by-phone/123");
      expect(getAllUsers).toHaveBeenCalled();
      expect(getUserByEmail).toHaveBeenCalled();
      expect(getUserByPhoneNumber).toHaveBeenCalled();
      expect(getUserById).not.toHaveBeenCalled();
    });

    test("matches /get-user/:id for non-specific path", async function () {
      await request(app).get("/users/get-user/xyz");
      expect(getUserById).toHaveBeenCalled();
    });
  });

  describe("HTTP method routing", function () {
    test("only POST for /create-user", async function () {
      const res = await request(app).get("/users/create-user");
      expect(res.status).toBe(404);
      expect(createUser).not.toHaveBeenCalled();
    });

    test("only POST for /set-admin-role/:email", async function () {
      const res = await request(app).get("/users/set-admin-role/a@b.c");
      expect(res.status).toBe(404);
      expect(setAdmin).not.toHaveBeenCalled();
    });

    test("only PATCH for /update-user/:emailQuery", async function () {
      const res = await request(app).put("/users/update-user/a@b.c").send({});
      expect(res.status).toBe(404);
      expect(updateUser).not.toHaveBeenCalled();
    });

    test("only DELETE for /delete-user/:email", async function () {
      const res = await request(app).post("/users/delete-user/a@b.c");
      expect(res.status).toBe(404);
      expect(deleteUser).not.toHaveBeenCalled();
    });
  });

  describe("Param extraction", function () {
    test("extracts :email", async function () {
      const email = "param-test@example.com";
      await request(app).get("/users/get-user-by-email/" + email);
      const reqObj = getUserByEmail.mock.calls[0][0];
      expect(reqObj.params.email).toBe(email);
    });

    test("extracts :phoneNumber", async function () {
      const phone = "0412345678";
      await request(app).get("/users/get-user-by-phone/" + phone);
      const reqObj = getUserByPhoneNumber.mock.calls[0][0];
      expect(reqObj.params.phoneNumber).toBe(phone);
    });

    test("extracts :emailQuery", async function () {
      const email = "query@example.com";
      await request(app).patch("/users/update-user/" + email).send({});
      const reqObj = updateUser.mock.calls[0][0];
      expect(reqObj.params.emailQuery).toBe(email);
    });
  });
});