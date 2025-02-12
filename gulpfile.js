const gulp = require('gulp');
const gutil = require('gulp-util');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const insertLines = require('gulp-insert-lines');
const sass = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');

const browserSync = require('browser-sync').create();

gulp.task('install', function (done) {
    gulp.src('node_modules/bootstrap/scss/_variables.scss')
        .pipe(rename('_variables-reference.scss'))
        .pipe(gulp.dest('scss'));

    gulp.src(['node_modules/bootstrap/scss/bootstrap.scss'])
        .pipe(replace('@import "', '@import "../node_modules/bootstrap/scss/'))
        .pipe(insertLines({
            'before': '@import "../node_modules/bootstrap/scss/variables";',
            'lineBefore': '@import "custom";'
        }))
        .pipe(rename('_bootstrap.scss'))
        .pipe(gulp.dest('scss'));

    done();
});

// Compile Sass task
gulp.task('sass', function () {
    return gulp.src('scss/style.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))

        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./assets/css'))
        .pipe(browserSync.stream());
});


// Minify and concatenate JavaScript files
gulp.task('js', function () {
    return gulp.src([
        'js/*.js',
        '!js/gutenberg.js',
    ])
        .pipe(sourcemaps.init())
        .pipe(uglify({ compress: { unused: false } }))
        .on('error', gutil.log)
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('assets/js'))
        .pipe(browserSync.stream());
});

// Reload PHP files on change
gulp.task('php', function () {
    return gulp.src('**/*.php')
        .pipe(browserSync.stream());
});

// BrowserSync task
gulp.task('browser-sync', function (done) {
    browserSync.init({
        proxy: "https://localhost:63342/websiteAron/"
    });
    done();
});

// Watch task to watch for changes
gulp.task('watch', function () {
    gulp.watch('*.html').on('change', browserSync.reload);
    gulp.watch('scss/**/*.scss', gulp.series('sass'));

});

// Default task
gulp.task('default', gulp.parallel('js', 'sass', 'browser-sync', 'watch'));
