const has = require("lodash/has");
const get = require("lodash/get");
const set = require("lodash/set");
const defaultsDeep = require("lodash/defaultsDeep");
const debug = require("debug")("passport-compose");

const defaults = {
  sessionStageField: "passport.stage",
  sessionLoginRedirectField: "redirectTo",
  successRedirect: "/",
  successReturnToOrRedirect: undefined,
  failureRedirect: "/login",
};

module.exports = (options = {}) => {
  const config = defaultsDeep({}, options, defaults);

  function setAuthenticationStage(req, stage) {
    set(req.session, config.sessionStageField, stage);
  }

  function getAuthenticationStage(req) {
    return get(req.session, config.sessionStageField, 0);
  }

  function isAuthenticatedStage(req, stage) {
    return req.isAuthenticated() && getAuthenticationStage(req) >= stage;
  }

  function strategyMiddleware(strategy, stage) {
    return (req, res, next) => {
      const currentStage = getAuthenticationStage(req) || 0;

      if (currentStage > stage) {
        debug("skipping stage", stage);
        next();
      } else {
        debug("authentication stage", stage);
        setAuthenticationStage(req, stage);
        if (strategy) {
          strategy(req, res, next);
        } else {
          next(); // final strategy ran
        }
      }
    };
  }

  function compose(...strategies) {
    if (strategies.length === 0) {
      throw new Error(
        "At least one Passport authentication middleware is required"
      );
    }
    config.strategies = strategies;
    return [...strategies, undefined].map(strategyMiddleware);
  }

  function isAuthenticated(req, res, next) {
    const stage = config.strategies.length;

    if (isAuthenticatedStage(req, stage)) {
      debug("authenticated, stage", stage);
      return next();
    } else {
      debug("not authenticated, stage", stage);
      if (!has(req.session, config.sessionLoginRedirectField)) {
        set(req.session, config.sessionLoginRedirectField, req.originalUrl);
      }
      res.redirect(config.failureRedirect);
    }
  }

  function loginRedirect(req, res, next) {
    const stage = config.strategies.length;

    if (isAuthenticatedStage(req, stage)) {
      const url = config.successReturnToOrRedirect
        ? get(
            req.session,
            config.sessionLoginRedirectField,
            config.successReturnToOrRedirect
          )
        : config.successRedirect;
      delete req.session[config.sessionLoginRedirectField];
      res.redirect(url);
    } else {
      next();
    }
  }

  return {
    compose,
    getAuthenticationStage,
    isAuthenticated: () => isAuthenticated,
    loginRedirect: () => loginRedirect,
  };
};
