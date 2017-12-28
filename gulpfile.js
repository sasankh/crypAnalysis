'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const jshint = require('gulp-jshint');
const nodemon = require('gulp-nodemon');
const env = require('gulp-env');

const serverDir = './server';

const path = {
  SERVER: [
    'server.js',
    'gulpfile.js',
    `${serverDir}/**/*.js`,
    `${serverDir}/**/**/*.js`,
    `${serverDir}/**/**/**/*.js`
  ]
};

// linting server files
gulp.task('lint-server', () => {
  return (
    gulp.src(path.SERVER)
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'))
  );
});

// Watch task for server
// Watch files for changes
gulp.task('watch', () => {
  gulp.watch([path.SERVER], ['lint']);
});


// environment vars for dev
gulp.task('dev-env', () => {
  env({
    vars: require('./credentials').dev_env
  });
});

// Nodemon Tasks
gulp.task('nodemon', () => {
  nodemon({
    script: 'server.js',
    tasks: ['lint-server']
  })
  .on('restart', () => {
    gutil.log('Nodemon restarted!');
  });
});

gulp.task('lint', ['lint-server']);
gulp.task('build', ['lint', 'dev-env']);
gulp.task('start', ['build', 'watch', 'nodemon']);

gulp.task('default', ['start']);
