import './config.mjs';
import './db.mjs';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.mjs';
import widgetRoutes from './routes/widgets.mjs';
import mongoose from 'mongoose';
import hbs from 'hbs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', 1);

app.set('view engine', 'hbs');

hbs.registerHelper('eq', function(a, b) {
  return a === b;
});
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DSN
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 12,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use('/', authRoutes);
app.use('/', widgetRoutes);

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}

app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/editor");
  } else {
    res.redirect("/login");
  }
});

app.get("/editor", requireAuth, async (req, res) => {
  try {
    const Widget = mongoose.model('Widget');
    const widgets = await Widget.find({ userId: req.session.user._id });
    const widgetsData = widgets.map(w => {
      const obj = w.toObject();
      if (obj.data instanceof Map) {
        obj.data = Object.fromEntries(obj.data);
      }
      return obj;
    });
    res.render("editor", { widgets: widgetsData });
  } catch (err) {
    console.error('Error loading widgets:', err);
    res.render("editor", { widgets: [] });
  }
});

app.listen(process.env.PORT || 3000);
