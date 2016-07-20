<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Laravel</title>
    <link href='https://fonts.googleapis.com/css?family=Source+Code+Pro' rel='stylesheet' type='text/css'>
    <link href="/css/app.css" rel="stylesheet">
  </head>
  <body>
    <div class="container">
      <form method="post" action="/auth/register">
      {!! csrf_field() !!}
        <h3 class="form-title">Register Account</h3>
@if (count($errors) > 0)
        <div class="alert alert-danger">
          <ul>
@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach
          </ul>
        </div>
@endif
        <div class="form-group">
          <label for="username" class="control-label">Username</label>
          <input class="form-control" type="text" name="username" id="username" value="{{ old('username') }}" placeholder="username">
        </div>
        <div class="form-group">
          <label for="email" class="control-label">Email</label>
          <input class="form-control" type="email" name="email" id="email" value="{{ old('email') }}" placeholder="email address">
        </div>
        <div class="form-group">
          <label for="password" class="control-laebl">Password</label>
          <input class="form-control" type="password" name="password" id="password" value="" placeholder="password">
          <input class="form-control" type="password" name="password_confirmation" id="password_confirmation" placeholder="confirm password">
        </div>
        <div class="form-actions">
          <button type="submit" class="btn">Register</button>
        </div>
      </form>
    </div>
  </body>
</html>
