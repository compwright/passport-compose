# passport-compose

[![Dependency Status](https://img.shields.io/david/compwright/passport-compose.svg?style=flat-square)](https://david-dm.org/compwright/passport-compose)
[![Download Status](https://img.shields.io/npm/dm/passport-compose.svg?style=flat-square)](https://www.npmjs.com/package/passport-compose)
[![Sponsor on GitHub](https://img.shields.io/static/v1?label=Sponsor&message=❤&logo=GitHub&link=https://github.com/sponsors/compwright)](https://github.com/sponsors/compwright)

Utilities for chaining multiple Passport authentication middlewares

## Use case

You have multiple Passport authentication strategies, and you need _all_ of them to run before considering the user to be authenticated.

For instance, you may wish to authenticate with username and password (via passport-local), then also pass an OTP or CAPTCHA check in a separate strategy.

## Requirements

* Node.js 8+
* Passport strategies of your choice

## Installation

```bash
$ npm install --save passport-compose
```

## Usage

```javascript
const passportCompose = require("passport-compose");
const { compose, loginRedirect, isAuthenticated } = passportCompose({
  // optional configuration
  sessionStageField: "passport.stage",
  sessionLoginRedirectField: "redirectTo",
  successRedirect: "/",
  successReturnToOrRedirect: "/",
  failureRedirect: "/login"
});

// This example assumes you have set up an express application called "app",
// and have required and configured "local" and "otp" strategies for passport

// Do not set "successRedirect" or "successReturnToOrRedirect" here, or a
// passing strategy will redirect before the next one runs
const localSettings = { failureRedirect: "/login" };
const otpSettings = { failureRedirect: "/login" };

// Require successful username+password and OTP authentication, then redirect
const strategies = [
  passport.authenticate("local", localSettings)),
  passport.authenticate("otp", otpSettings))
];
app.post("/login", compose(strategies), loginRedirect());

// To require all strategies to pass before accessing a resource:
app.get("/protected", isAuthenticated(), (req, res) => {
  res.sendStatus(204);
});
```

## License

MIT license
