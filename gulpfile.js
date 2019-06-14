var gulp = require('gulp'),
    include = require('gulp-file-include'),
    scss = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    useref = require('gulp-useref'),
    uglify = require('gulp-uglify'),
    gulpIf = require('gulp-if'),
    cssnano = require('gulp-cssnano'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    cheerio = require('gulp-cheerio'),
    replace = require('gulp-replace'),
    del = require('del'),
    runSequence = require('run-sequence');


// paths
const paths = {
  html: 'app/**/*.html',
  icons: 'app/icons/**/*.svg',
  scss: 'app/scss/**/*.scss'
};

// scss to app/css with autoprefixer
gulp.task('scss', function() {
  return gulp.src(paths.scss)
    .pipe(scss().on('error', scss.logError))
    .pipe(autoprefixer('last 2 versions'))
    .pipe(gulp.dest('app/css'))
})

// takes all js & css files from within build:css and build:js in template and concats into single optimised files, and inserts @@includes
gulp.task('useref', function() {
  return gulp.src(paths.html)
    .pipe(include({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist'));
});

// Optimise and bundle SVG icons
gulp.task('icons', function () {
  return gulp.src(paths.icons)
    .pipe(replace('stroke="#', 'fill="#'))
    .pipe(replace(/id="svg-([^"]*)"/g, function(match, p1) {
      return 'class="svg-' +  p1 + '" style="fill: var(--svg-' +  p1 + ')"'
    }))
    .pipe(svgmin({
      plugins: [{
        removeDimensions: true
      }, {
        removeViewBox: false
      },
      {
        removeStyleElement: false
      },
      {
        convertStyleToAttrs: false
      }]
    }))
    .pipe(svgstore({
      fileName: 'icons.svg',
      inlineSvg: true
    }))
    .pipe(cheerio({
      run: function ($, file) {
        $('svg').addClass('d-none')
      },
      parserOptions: {
        xmlMode: true
      }
    }))
    .pipe(gulp.dest('app/inc/'))
});

gulp.task('clean:dist', function() {
  return del.sync('dist/**/*');
});


// Build Sequences
// ---------------
gulp.task('default', function(callback) {
  runSequence(
    'clean:dist',
    'scss',
    'icons',
    'useref',
    callback
  )
})