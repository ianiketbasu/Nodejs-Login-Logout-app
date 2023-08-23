import express, { response } from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "newDB123",
  })
  .then(() => console.log("Db connected"))
  .catch((err) => console.log(err));

//Creating the db schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);
const app = express();

// Just set the ejs view engine
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "jhsdvhjvfjkkvbfdh");
    // console.log(decoded);
    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};
// Reorder middleware: First handle static files, then other middleware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.redirect("/");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });

  if (!user) {
    return res.redirect("/register");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render("login", { email, message: "Incorrect password" });
  }

  const token = jwt.sign({ _id: user._id }, "jhsdvhjvfjkkvbfdh");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  // console.log(req.body);\
  const { name, email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ _id: userId._id }, "jhsdvhjvfjkkvbfdh");
  // console.log(token);
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

// app.get("/success", (req, res) => {
//   res.render("success");
// });

// app.post("/contact", async (req, res) => {
//   await msg.create({ name: req.body.name, email: req.body.email });
//   res.redirect("/success");
// });

app.listen(5000, () => {
  console.log("Server is running");
});
