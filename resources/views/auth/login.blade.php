<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Laravel</title>
    <link href='https://fonts.googleapis.com/css?family=Source+Code+Pro' rel='stylesheet' type='text/css'>
    <link href="/css/app.css" rel="stylesheet">
  </head>
  <body>
    <div class="container">
      <form method="post" action="/auth/login">
      {!! csrf_field() !!}
        <h3 class="form-title">Log in to your account</h3>
@if (count($errors) > 0)
        <div class="alert alert-danger">
          <ul>
@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach
          </ul>
        </div>
@endif
        <div class="form-group">
          <label for="username" class="control-label">Username</label>
          <input class="form-control" autocomplete="off" placeholder="Username" name="username" type="text" id="username" value="{{ old('username') }}">
        </div>
        <div class="form-group">
          <label for="password" class="control-label">Password</label>
          <input class="form-control" autocomplete="off" placeholder="Password" name="password" type="password" id="password" value="">
        </div>
        <div class="form-actions">
          <label for="remember"><input type="checkbox" name="remember" value="on"> Remember Me</label>
          <button type="submit" class="btn pull-right">Login</button>
        </div>
      </form>
      <div class="row"><div class="col-md-12"><a href="/auth/register" class="btn btn-default">Create Account</a></div></div>
    </div>
  </body>
</html>
