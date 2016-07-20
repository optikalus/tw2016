process.env.DISABLE_NOTIFIER = true;
var elixir = require('laravel-elixir');

/*
 |--------------------------------------------------------------------------
 | Elixir Asset Management
 |--------------------------------------------------------------------------
 |
 | Elixir provides a clean, fluent API for defining some basic Gulp tasks
 | for your Laravel application. By default, we are compiling the Sass
 | file for our application, as well as publishing vendor resources.
 |
 */

elixir(function(mix) {
    mix.sass('app.scss', 'public/css/app.css')
       .styles(
          [
            '../bower_components/EasyAutocomplete/dist/easy-autocomplete.min.css',
          ], 'public/css/extra.css'
        )
       .scripts(
          [
            '../bower_components/jquery/dist/jquery.min.js',
            '../bower_components/bootstrap/dist/js/bootstrap.min.js',
            '../bower_components/jquery-dateFormat/dist/jquery-dateFormat.min.js',
            '../bower_components/jquery-validation/dist/jquery.validate.min.js',
            '../bower_components/EasyAutocomplete/dist/jquery.easy-autocomplete.min.js',
            '../bower_components/moment/min/moment.min.js',
            '../bower_components/moment-timezone/builds/moment-timezone-with-data.min.js',
            'jquery.progressTimer.js',
            '../bower_components/ansi_up/ansi_up.js',
            'ansilove.js/ansilove.js',
            'app.js'
          ],
          'public/js/app.js'
        );
});
