"use strict";

var gulp = require("gulp");
var ghPages = require("gh-pages");
var plumber = require("gulp-plumber");
var sourcemap = require("gulp-sourcemaps");
var sass = require("gulp-sass");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var csso = require("gulp-csso");
var rename = require("gulp-rename");
var svgstore = require("gulp-svgstore")
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var del = require("del");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");

gulp.task("deploy", function (cb) {
  return ghPages.publish("build", cb);
});

gulp.task("css", function () {
  return gulp.src("source/sass/style.scss")
      .pipe(plumber())
      .pipe(sourcemap.init())
      .pipe(sass())
      .pipe(postcss([
        autoprefixer()
      ]))
      .pipe(rename("style.css"))
      .pipe(gulp.dest("build/css"));
});

gulp.task("minify-css", function () {
  return gulp.src("source/sass/style.scss")
      .pipe(plumber())
      .pipe(sourcemap.init())
      .pipe(sass())
      .pipe(postcss([
        autoprefixer()
      ]))
      .pipe(csso())
      .pipe(rename("style.min.css"))
      .pipe(sourcemap.write("."))
      .pipe(gulp.dest("build/css"))
      .pipe(server.stream());
});

gulp.task("mainjs", function () {
  return gulp.src("source/js/*.js")
      .pipe(concat("main.js"))
      .pipe(uglify())
      .pipe(rename("main.min.js"))
      .pipe(gulp.dest("build/js"));
});

gulp.task("server", function () {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("css", "minify-css"));
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
});

gulp.task("refresh", function (done) {
  server.reload();
  done();
});

gulp.task("sprite", function () {
  return gulp.src("source/img/{icon-*,logo*}.svg")
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(gulp.dest("build"));
});

gulp.task("copy", function () {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/img/**",
    "source//*.ico"
    ], {
      base: "source"
    })
  .pipe(gulp.dest("build"));
});

gulp.task("clean", function () {
  return del("build");
});

gulp.task("build", gulp.series("clean", "copy", "css", "minify-css", "sprite", "mainjs", "html"));
gulp.task("start", gulp.series("build", "server"));
