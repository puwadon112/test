const express = require("express");
const cookieParser = require("cookie-parser");
const { JsonDB, Config } = require("node-json-db");
const qrcode = require("qrcode");
const { authenticator } = require("otplib");
const bcrypt = require("bcrypt");

const userDb = new JsonDB(new Config("users", true, true, "/"));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public")); 


app.post("/register", async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).send({ error: "User ID and password are required" });
    }

    try {
      await userDb.getData("/" + id);
      return res.status(400).send({ error: "User ID already exists" });
    } catch (err) {
    }
    const newUser = {
      password: password, 
      "2FA": { enabled: false }, 
    };

    await userDb.push("/" + id, newUser); 

    return res.send({ success: true });
  } catch (err) {
    console.error(err); 
    return res.status(500).send({ error: "An error occurred during registration" }); 
  }
});

app.get("/login", async (req, res) => {
  try {
    const { id, password, code } = req.query;
    const user = await userDb.getData("/" + id);
    if (user && user.password === password) {
      if (user["2FA"].enabled) {
        if (!code)
          return res.send({
            codeRequested: true,
          });
        const verified = authenticator.check(code, user["2FA"].secret); //2fa
        if (!verified) throw false;
      }

      return res.cookie("id", id).send({
        success: true,
      });
    }
    throw false;
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Invalid credentials",
    });
  }
});
app.get("/qrImage", async (req, res) => {
  try {
    const { id } = req.cookies;
    const user = await userDb.getData("/" + id);
    const secret = authenticator.generateSecret();
    const uri = authenticator.keyuri(id, "2FA", secret);
    const image = await qrcode.toDataURL(uri);
    user["2FA"].tempSecret = secret;
    await userDb.save();
    return res.send({
      success: true,
      image,
    });
  } catch {
    return res.status(500).send({
      success: false,
    });
  }
});

app.get("/set2FA", async (req, res) => {
  try {
    const { id } = req.cookies;
    const { code } = req.query;
    const user = await userDb.getData("/" + id);
    const { tempSecret } = user["2FA"];

    const verified = authenticator.check(code, tempSecret); //cheak
    if (!verified) throw false;

    user["2FA"] = {
      enabled: true,
      secret: tempSecret,
    };
    await userDb.save();
    return res.send({
      success: true,
    });
  } catch {
    return res.status(500).send({
      success: false,
    });
  }
});

app.get("/check", (req, res) => {
  const { id } = req.cookies;
  if (id)
    return res.send({
      success: true,
      id,
    });
  return res.status(500).send({
    success: false,
  });
});

app.get("/logout", async (req, res) => {
  res.clearCookie("id");
  res.send({
    success: true,
  });
});

app.listen(3000, () => {
  console.log("App is listening on port: 3000");
});
