let imagemin;
const imgPath = 'img/**/*.+(png|jpg|gif|svg)';
const destPath = '_site/img';

try {
  imagemin = require('gulp-imagemin');
} catch (e) {
  imagemin = () => {
    console.log('gulp-imagemin is not installed. Skipping images task.');
  };
}

module.exports = (gulp) => {
  gulp.task('images', () => {
    return gulp.src(imgPath).pipe(imagemin()).pipe(gulp.dest(destPath));
  });
};
