var gulp = require('gulp'),
    less = require('gulp-less'),
    cssmin = require('gulp-minify-css'),//CSS压缩
    notify = require('gulp-notify'),//提示信息
    plumber = require('gulp-plumber'),//异常处理
    concat = require('gulp-concat'),//文件合并
    rename = require('gulp-rename'),//文件更名
    jshint = require('gulp-jshint'),//js检测
    uglify = require('gulp-uglify'),//js压缩
    rev = require('gulp-rev'),//- 对文件名加MD5后缀
    revCollector = require('gulp-rev-collector'),//- 路径替换
    clean = require('gulp-clean'),//清空里面曾经的资源，防止有冗余
    gulpSequence = require('gulp-sequence'),
    aliasCombo = require('gulp-alias-combo'),//依赖js合拼
    webserver  = require('gulp-webserver'),//本地Web 服务器功能（gulp-webserver + tiny-lr）
    opn        = require('opn'),//浏览器自动打开项目
    config = require('./config.json');

// 编译、合并、压缩、重命名css，
gulp.task('css',['clean_css'],function(cb){
    var stream = gulp.src(config.less)
        //.pipe(exec()) //exec()中有某些异步操作
        .pipe(less())
        .pipe(concat('main.css'))
        .pipe(rename({suffix:'.min'}))
        .pipe(cssmin())
        .pipe(gulp.dest('src/css'))
    return stream;
})
//加版本号css
gulp.task('rev_css',['css'],function(){
    var stream = gulp.src('src/css/*.min.css')
        .pipe(rev())//- 文件名加MD5后缀
        .pipe(gulp.dest(config.destCss))
        .pipe(rev.manifest())  //- 生成一个rev-manifest.json
        .pipe(gulp.dest('src/rev/css'))//- 将 rev-manifest.json 保存到 rev 目录内
    return stream;
})
//改变css路径引用
gulp.task('replace_css',['rev_css'],function(){
    gulp.src(['src/rev/css/*.json', 'src/views/tpl/heard.html'])   //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe(revCollector({replaceReved:true}))   //- 执行文件内css名的替换
        .pipe(gulp.dest('build/views/tpl'));       //- 替换后的文件输出的目录
})
//清除css
gulp.task('clean_css',function(){
    var stream = gulp.src([config.destCss+'/*.css'])
        .pipe(clean({force: true}))
    return stream;
})
//检查js
gulp.task('jshint',['clean_js'],function(){
    var stream = gulp.src(config.srcjs+"/*.min.js")
        .pipe(jshint())//检查JS
        .pipe(jshint.reporter('default'))
    return stream;
})
// 合并、压缩js文件
gulp.task('js',['jshint'],function(){
    var stream_index = gulp.src(config.js.index)
        .pipe(concat('index.js'))
        .pipe(rename({suffix:'.min'}))
        .pipe(uglify())
        .pipe(gulp.dest(config.srcjs))
    var stream_user = gulp.src(config.js.user)
        .pipe(concat('user.js'))
        .pipe(rename({suffix:'.min'}))
        .pipe(uglify())
        .pipe(gulp.dest(config.srcjs))
    return stream_index,stream_user;
})
//加版本号js
gulp.task('rev_js',['js'],function(){
    var stream = gulp.src(config.srcjs+'/*.min.js')
        .pipe(rev())//- 文件名加MD5后缀
        .pipe(gulp.dest(config.destjs))
        .pipe(rev.manifest())  //- 生成一个rev-manifest.json
        .pipe(gulp.dest('src/rev/js'))//- 将 rev-manifest.json 保存到 rev 目录内
    return stream;
})
//改变js路径引用
gulp.task('replace_js',['rev_js'],function(){
    gulp.src(['src/rev/js/*.json', 'src/views/tpl/footer.html'])   //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe(revCollector({replaceReved:true}))   //- 执行文件内js名的替换
        .pipe(gulp.dest('build/views/tpl'));       //- 替换后的文件输出的目录
})
//清除js
gulp.task('clean_js',function(){
    var stream = gulp.src([config.destjs+'/*.js'])
        .pipe(clean({force: true}))
    return stream;
})
//复制JS
gulp.task('copyjs',function(){
    var stream =  gulp.src('src/js/libs/*.js')
        .pipe(gulp.dest(config.destjs+'/libs'))
})
gulp.task('combo', function(){
    var stream =  gulp.src('src/js/index.js')
        .pipe(aliasCombo({
            baseUrl: __dirname + '/src/js/',
            //支持相对路径合并, 默认为false
            supportRelative: true,
            //supportRelative为true时，才会起作用
            paths: {
                'module': 'views'
            },
            /**
             * 如果想忽略某些模块，需要配置exclude
             * 如果supportRelative为false时，没有配置alias的模块会自动忽略
             * 常用于supportRelative为true的情况
             */
            exclude: ['jquery'],
            alias: {
                'comm': "libs/comm.js"
            }
        }))
        .pipe(rename({suffix:'.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('src/minjs'))
    return stream;
})
//加版本号js
gulp.task('combo_rev',['combo'],function(){
    var stream = gulp.src('src/minjs/*.min.js')
        .pipe(rev())//- 文件名加MD5后缀
        .pipe(gulp.dest(config.destjs))
        .pipe(rev.manifest())  //- 生成一个rev-manifest.json
        .pipe(gulp.dest('src/rev/js'))//- 将 rev-manifest.json 保存到 rev 目录内
    return stream;
})
//改变js路径引用
gulp.task('combo_replace',['combo_rev'],function(){
    var stream = gulp.src(['src/rev/js/*.json', 'src/views/tpl/footer.html'])   //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe(revCollector({replaceReved:true}))   //- 执行文件内js名的替换
        .pipe(gulp.dest('build/views/tpl'));       //- 替换后的文件输出的目录
    return stream;
})
//开启本地 Web 服务器功能
gulp.task('webserver',['combo_replace'], function() {
    var stream = gulp.src( './' )
        .pipe(webserver({
            host:             config.localserver.host,
            port:             config.localserver.port,
            livereload:       true,//自动刷新（livereload）功能而添加
            directoryListing: false//目录列表
        }));
    return stream;
});
//通过浏览器打开本地 Web服务器 路径
gulp.task('openbrowser',['webserver'],function() {
    opn( 'http://' + config.localserver.host + ':' + config.localserver.port );
});
//开发模式
gulp.task('dev',function(){
    gulp.watch(config.less,['replace_css'])
    gulp.watch(config.srcjs+"/*.js",['replace_js'])
})
//项目完成提交任务
gulp.task('build',['replace_css','replace_js'])

gulp.task('default',['openbrowser']);
