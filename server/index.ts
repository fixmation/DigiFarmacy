import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import path from 'path'; // Add this line
import { createServer, type Server } from "http";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

const __dirname = dirname(fileURLToPath(import.meta.url));
import { scheduleExpiryAutomation } from './cronJobs';
import { storage } from './storage';
import { log } from "console";
import { setupVite } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "a-secret-key-that-is-at-least-32-chars-long",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // In a real application, you should verify the password.
      // For this demo, we'll just look up the user.
      const user = await storage.getProfileByEmail(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getProfile(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

app.use(express.static(path.join(__dirname, "../client/dist")));

async function main() {
  // Passport configuration
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // In a real application, you should verify the password.
      // For this demo, we'll just look up the user.
      try {
        const user = await storage.getProfileByEmail(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getProfile(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Session configuration
  app.use(
    session({
      secret: "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // JSON and URL-encoded body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  function serveStatic(app: express.Express) {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const clientDistPath = path.join(__dirname, "../client/dist");
    log(`Serving static files from ${clientDistPath}`);
    app.use(express.static(clientDistPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  const server = createServer(app);
  
  // Set up routes
  await registerRoutes(app);
  
  // Set up Vite for development or serve static files for production
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Schedule cron jobs
  scheduleExpiryAutomation();

  return { server, app };
}

main()
  .then(({ server }) => {
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      log(`serving on port ${port}`);
    });
  })
  .catch((err) => {
    log(err);
    process.exit(1);
  });
