var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');
var base64 = require('gulp-base64');
var htmlbase64 = require('gulp-html-img-base64');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var gulpSequence = require('gulp-sequence');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var clean = require('gulp-clean');
var plumber = require('gulp-plumber');
var spritesmith = require('gulp.spritesmith');
var buffer = require('vinyl-buffer');
var merge = require('merge-stream');
var size = require('gulp-filesize');

var sourcePath ={
    'styles':'./src/css/**/*.scss',
    'image':'./src/image/**/*',
    'scripts':'./src/js/**/*.js',
    'fonts':'./src/font/**/*',
    'lib':'./src/lia/**/*',
    'html':'./src/**/*.html'
}

//清理dist中css
gulp.task('clean:css',function(){
    return gulp.src('./dist/css').pipe(clean())
})
//清理dist中image
gulp.task('clean:image',function(){
    return gulp.src('./dist/images').pipe(clean())
})
//清理dist中的sprite
gulp.task('clean:sprite',function(){
    var imagestream = gulp.src('./dist/images/sprite').pipe(clean());
    var cssstream = gulp.src('./dist/css/sprite').pipe(clean());
    return merge(imagestream,cssstream)
})
//清理dist中的js
gulp.task('clean:js',function(){
    return gulp.src('./dist/js',{read: false}).pipe(clean())
})
//处理css
gulp.task('build:scss',['clean:css'],function(){
    return gulp.src(sourcePath.styles).pipe(plumber()).pipe(sourcemaps.init()).pipe(sass().on('error', sass.logError))
    .pipe(base64()).pipe(autoprefixer({
        browsers: ['>5%','Android >= 4.0'],
        cascade: false
    })).pipe(sourcemaps.write()).pipe(gulp.dest('./dist/css')).pipe(size()).pipe(browserSync.reload({stream:true}))
})

//处理图片
gulp.task('build:image',['clean:image'],function(){
    return gulp.src(sourcePath.image).pipe(plumber()).pipe(imagemin({
        optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
        progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
        interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
        multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
    })).pipe(gulp.dest('./dist/images')).pipe(size()).pipe(browserSync.reload({stream:true}))
})
//雪碧图处理
gulp.task('sprite',['clean:sprite'],function(){
    var spriteData = gulp.src('./src/image/**/*-sprite.png').pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.css'
    }))
    var imgStream = spriteData.img
                    .pipe(buffer()).pipe(imagemin())
                    .pipe(gulp.dest('./dist/images/sprite')).pipe(browserSync.reload({stream:true}));
    var cssStream = spriteData.css
                    .pipe(buffer()).pipe(gulp.dest('./dist/css/sprite')).pipe(browserSync.reload({stream:true}));
    return merge(imgStream,cssStream)

})

//处理js
gulp.task('build:script',['clean:js'],function(){
    return gulp.src(sourcePath.scripts).pipe(plumber()).pipe(gulp.dest('./dist/js')).pipe(size()).pipe(browserSync.reload({stream:true}))
})

//处理字体
gulp.task('build:font',function(){
    return gulp.src(sourcePath.fonts).pipe(plumber()).pipe(gulp.dest('./dist/font')).pipe(size()).pipe(browserSync.reload({stream:true}))
})

//处理js插件
gulp.task('build:lib',function(){
    return gulp.src(sourcePath.lib).pipe(plumber()).pipe(gulp.dest('./dist/lib')).pipe(browserSync.reload({stream:true}))
})

//处理html
gulp.task('build:html',function(){
    return gulp.src('./src/**/*.html').pipe(plumber()).pipe(gulp.dest('./dist/')).pipe(browserSync.reload({stream:true}))
})
//clean
gulp.task('clean:dist',function(){
     return gulp.src('./dist/',{read:false}).pipe(clean());
})
//构建任务
gulp.task('build:dist',gulpSequence('clean:dist',['build:scss','build:image','sprite','build:script','build:font','build:lib','build:html']))
//watch
gulp.task('auto',function(){
    watch(sourcePath.styles,batch(function(events,done){
        gulp.start('build:scss',done)
    }));
    watch(sourcePath.scripts,batch(function(events,done){
        gulp.start('build:script',done)
    }))
    watch(sourcePath.image,batch(function(events,done){
        gulp.start('build:image','sprite',done)
    })) 
    watch(sourcePath.fonts,batch(function(events,done){
        gulp.start('build:font',done)
    })) 
    watch(sourcePath.lib,batch(function(events,done){
        gulp.start('build:lib',done)
    }))
    watch(sourcePath.html,batch(function(events,done){
        gulp.start('build:html',done)
    }))                  
})

//设置服务器
gulp.task('browser-sync',function(){
    browserSync.init({
        files:['**'],
        server:{
            baseDir:'./dist',  // 设置服务器的根目录
            index:'index.html' // 指定默认打开的文件
        },
        port:8050  // 指定访问服务器的端口号
    });
})
//启动项目
gulp.task('default',gulpSequence('build:dist','browser-sync','auto'))


