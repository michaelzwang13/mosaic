import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "../../../cloudinary.mjs";

const router = express.Router();
const Widget = mongoose.model("Widget");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

router.get("/api/widgets", requireAuth, async (req, res) => {
  try {
    const widgets = await Widget.find({ userId: req.session.user._id });
    res.json(widgets);
  } catch (err) {
    console.error("Error fetching widgets:", err);
    res.status(500).json({ error: "Failed to fetch widgets" });
  }
});

router.post("/api/widgets", requireAuth, async (req, res) => {
  try {
    const { _id, type, x, y, w, h, title, description, data } = req.body;

    if (_id) {
      const widget = await Widget.findOneAndUpdate(
        { _id, userId: req.session.user._id },
        { type, x, y, w, h, title, description, data, updatedAt: new Date() },
        { new: true }
      );

      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      res.json(widget);
    } else {
      const newWidget = new Widget({
        userId: req.session.user._id,
        type,
        x,
        y,
        w,
        h,
        title,
        description,
        data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await newWidget.save();
      res.json(newWidget);
    }
  } catch (err) {
    console.error("Error saving widget:", err);
    res.status(500).json({ error: "Failed to save widget" });
  }
});

router.put("/api/widgets/bulk", requireAuth, async (req, res) => {
  try {
    const { widgets } = req.body;

    if (!Array.isArray(widgets)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const updatePromises = widgets.map((widget) => {
      return Widget.findOneAndUpdate(
        { _id: widget._id, userId: req.session.user._id },
        {
          x: widget.x,
          y: widget.y,
          w: widget.w,
          h: widget.h,
          updatedAt: new Date(),
        },
        { new: true }
      );
    });

    const updatedWidgets = await Promise.all(updatePromises);
    res.json(updatedWidgets);
  } catch (err) {
    console.error("Error bulk updating widgets:", err);
    res.status(500).json({ error: "Failed to update widgets" });
  }
});

router.post("/api/widgets/add", requireAuth, async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Widget type is required" });
    }

    const widgets = await Widget.find({ userId: req.session.user._id });

    const ROWS = 6;
    const COLUMNS = 8;
    const occupiedMap = {};

    for (let i = 0; i < COLUMNS; i++) {
      occupiedMap[i] = new Set();
    }

    for (const widget of widgets) {
      for (let i = widget.x; i < widget.x + widget.w && i < COLUMNS; i++) {
        for (let j = widget.y; j < widget.y + widget.h && j < ROWS; j++) {
          if (occupiedMap[i]) {
            occupiedMap[i].add(j);
          }
        }
      }
    }

    let foundX = -1;
    let foundY = -1;

    for (let i = 0; i < COLUMNS - 1; i++) {
      for (let j = 0; j < ROWS - 1; j++) {
        if (
          !occupiedMap[i]?.has(j) &&
          !occupiedMap[i]?.has(j + 1) &&
          !occupiedMap[i + 1]?.has(j) &&
          !occupiedMap[i + 1]?.has(j + 1)
        ) {
          foundX = i;
          foundY = j;
          break;
        }
      }
      if (foundX !== -1) break;
    }

    if (foundX === -1) {
      return res
        .status(400)
        .json({ error: "No space available for new widget" });
    }

    let title, description;
    switch (type) {
      case "text":
        title = "Text Block";
        description = "Edit Text";
        break;
      case "image":
        title = "Image Block";
        description = "Upload an Image";
        break;
      case "video":
        title = "Video Embed";
        description = "Add a Video URL";
        break;
      case "recipe":
        title = "Recipe";
        description = "Add your favorite recipe";
        break;
      case "quote":
        title = "Quote";
        description = "Add an inspiring quote";
        break;
      case "link":
        title = "Link";
        description = "Add a link";
        break;
      default:
        title = "Widget";
        description = "New widget";
    }

    const newWidget = new Widget({
      userId: req.session.user._id,
      type,
      x: foundX,
      y: foundY,
      w: 2,
      h: 2,
      title,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newWidget.save();
    res.json(newWidget);
  } catch (err) {
    console.error("Error adding widget:", err);
    res.status(500).json({ error: "Failed to add widget" });
  }
});

router.put("/api/widgets/:id", requireAuth, async (req, res) => {
  try {
    const { data } = req.body;

    if (data && data.videoId) {
      const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
      if (!videoIdPattern.test(data.videoId)) {
        return res.status(400).json({ error: "Invalid video ID format" });
      }
    }

    const widget = await Widget.findOne({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!widget) {
      return res.status(404).json({ error: "Widget not found" });
    }

    if (data) {
      widget.data = new Map(Object.entries(data));
    }
    widget.updatedAt = new Date();

    await widget.save();

    res.json(widget);
  } catch (err) {
    console.error("Error updating widget:", err);
    res.status(500).json({ error: "Failed to update widget" });
  }
});

router.post(
  "/api/widgets/:id/upload",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "mosaic-widgets",
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const widget = await Widget.findOne({
        _id: req.params.id,
        userId: req.session.user._id,
      });

      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      widget.data = new Map(Object.entries({ imageUrl: result.secure_url }));
      widget.updatedAt = new Date();
      await widget.save();

      res.json({ imageUrl: result.secure_url });
    } catch (err) {
      console.error("Error uploading image:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

router.delete("/api/widgets/:id", requireAuth, async (req, res) => {
  try {
    const widget = await Widget.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!widget) {
      return res.status(404).json({ error: "Widget not found" });
    }

    res.json({ message: "Widget deleted successfully" });
  } catch (err) {
    console.error("Error deleting widget:", err);
    res.status(500).json({ error: "Failed to delete widget" });
  }
});

export default router;
