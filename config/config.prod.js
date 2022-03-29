/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {
    security: {
      csrf: {
        enable: false,
      }, // 必须加 否则： 403 Forbidden message: "missing csrf token"
      // domainWhiteList: [ '*' ]
　　},
    cors: {
      origin:'*',
      allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS'
    }

  };


  // config.static = {
  //   // 静态化访问前缀,如：`http://127.0.0.1:7001/static/images/logo.png`
  //   prefix: '/static', 
  //   dir: path.join(appInfo.baseDir, 'app/public'), // `String` or `Array:[dir1, dir2, ...]` 静态化目录,可以设置多个静态化目录
  //   dynamic: true, // 如果当前访问的静态资源没有缓存，则缓存静态文件，和`preload`配合使用；
  //   preload: false,
  //   maxAge: 31536000, // in prod env, 0 in other envs
  //   buffer: true, // in prod env, false in other envs
  // };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1641277469743_4392';

  // add your middleware config here
  config.middleware = [];

  config.view = {
  defaultViewEngine: 'nunjucks',
  mapping: {
    '.html': 'nunjucks',
    },
  };


  // add your user config here
  const userConfig = {
    configPath: '/root/resume/resumeConfig.json',
  };

  return {
    ...config,
    ...userConfig,
  };
};



