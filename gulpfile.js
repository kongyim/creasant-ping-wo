let path = require("path");
let gulp = require("gulp");
let browserify = require("browserify");
let runSequence = require("run-sequence");
let livereload = require("gulp-livereload");
let del = require("del");
let scss = require("gulp-sass");
let cleanCSS = require("gulp-clean-css");
let rename = require("gulp-rename");
let source = require("vinyl-source-stream");
let express = require("express");
let injectReload = require("connect-livereload");
let log4js = require("log4js");
let _ = require("lodash");
let shell = require("gulp-shell");
let watchify = require("watchify");
let pkg = require("./package.json");

logger = log4js.getLogger();
logger.level = "debug"
bundler = null;

displayError = function(error) {
  var errorString;
  errorString = "[" + error.plugin + "]";
  errorString += " " + error.message.replace("\n", "");
  if (error.fileName) {
    errorString += " in " + error.fileName;
  }
  if (error.lineNumber) {
    errorString += " on line " + error.lineNumber;
  }
  console.error(errorString);
  return this.emit("end");
};

gulp.task("clean", ()=>{
  return function(done) {
    return del(["app/styles/**", "app/scripts/**"], done);
  };
});

gulp.task("server", (done)=>{
  let app = express();
  app.use(injectReload({
    port: pkg.config.port + 30000
  }));
  app.use(express.static(path.join(__dirname, "app")))
  let server = app.listen(pkg.config.port, ()=> {
    logger.info("########### server started #################");
    logger.info("%s started at http://localhost:%s", pkg.name, server.address().port);
    done();
  });
});

gulp.task("styles", ()=>{
  return gulp.src("./app/_scss/main.scss").pipe(scss()).on("error", scss.logError).pipe(gulp.dest("./app/styles/")).pipe(cleanCSS()).pipe(rename({
    extname: ".min.css"
  })).pipe(gulp.dest("./app/styles/"));
});

gulpBundle = function() {
  return bundler.bundle().on("error", displayError).pipe(source("bundle.js")).pipe(gulp.dest("./app/scripts")).pipe(livereload());
};

gulp.task("browserify", ()=>{
  var options;
  options = {
    debug: false,
    cache: {},
    packageCache: {},
    ignoreMissing: true,
    detectGlobals: true,
    bare: true
  };
  bundler = browserify(options).add("app/_js/main.js").transform("babelify", {
    plugins: ["transform-class-properties"],
    "presets": ["es2015"]
  }).on("update", gulpBundle);
  return gulpBundle();
});

gulp.task("watch", ()=>{
  livereload.listen({
    port: pkg.config.port + 30000
  });
  gulp.watch(["./app/_scss/**/*.scss"], ["styles"]);
  gulp.watch(["./app/**/*.html"], ["reloadHtml"]);
  gulp.watch(["./app/styles/main.css"], ["reloadcss"]);
  bundler.plugin(watchify).on("error", displayError);
  return gulpBundle();

});

gulp.task("reloadcss", ()=>{
  return gulp.src("./app/styles/main.css").pipe(livereload()).on("error", displayError);
});

gulp.task("reloadHtml", ()=>{
  return gulp.src("./app/**/*.html").pipe(livereload()).on("error", displayError);
});

gulp.task("release", ()=>{
  return runSequence("clean", ["browserify", "styles"]);
});

gulp.task("start", () =>{
  return runSequence("clean", ["browserify", "styles"], "watch", "server");
})
