<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Laravel</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ Crypt::encrypt(csrf_token()) }}" />
    <link href='https://fonts.googleapis.com/css?family=Source+Code+Pro:400,700' rel='stylesheet' type='text/css'>
    <link href="/css/app.css" rel="stylesheet">
    <link href="/css/extra.css" rel="stylesheet">
  </head>
  <body>
    <!--<div class="container" id="tradewars" style="width: 50.5em; height: 34em; overflow: auto"></div>-->
    <div class="container" id="tradewars"></div>
    <script src="/js/app.js"></script>
  </body>
</html>
