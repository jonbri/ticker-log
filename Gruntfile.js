module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      options: {
        banner: '/*! ticker <%= grunt.template.today("mmm-dd-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/ticker.min.js': ['src/**/*.js']
        }
      }
    },

    copy: {
      main: {
        src: 'src/ticker.js',
        dest: 'dist/ticker.js'
      }
    },

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js'],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },

    qunit: {
        files: ['index.html']
    },

    // start server for dev
    connect: {
      server: {
        options: {
          port: 9001
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-serve');
  grunt.registerTask('test', ['jshint', 'qunit']);
  grunt.registerTask('default', ['jshint', 'uglify', 'copy']);
};
