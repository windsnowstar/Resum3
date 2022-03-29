'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.resume.index);
  router.get('/index', controller.resume.index);
  router.get('/github/login', controller.resume.githubLogin);
  router.get('/github/callback', controller.resume.githubCallback);
  router.get('/userProfiles', controller.resume.userProfiles);
  router.get('/generateChallenge', controller.resume.generateChallenge);
  router.get('/authenticate', controller.resume.authenticate);
  router.get('/refreshAccessToken', controller.resume.refreshAccessToken);
  router.get('/createProfile', controller.resume.createProfile);
  router.post('/updateProfile', controller.resume.updateProfile);
  router.post('/followProfile', controller.resume.followProfile);
  router.get('/allProfiles', controller.resume.allProfiles);

};
