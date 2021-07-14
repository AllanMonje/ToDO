var session = require("express-session");
var express = require("express");
var router = express.Router();

router.use(session({
    secret: "TOP SECRET",
    resave: true,
    saveUninitialized: true
}))

router.get("/", (req, res)=> {
    req.session.cuenta = req.session.cuenta ? req.session.cuenta + 1 : 1;
    res.send(`hola: ${req.session.cuenta} `);
})
module.exports = router;