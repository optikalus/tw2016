<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

Route::get('auth/login', 'Auth\AuthController@getLogin');
Route::post('auth/login', 'Auth\AuthController@postLogin');
Route::get('auth/logout', 'Auth\AuthController@getLogout');

Route::get('auth/register', 'Auth\AuthController@getRegister');
Route::post('auth/register', 'Auth\AuthController@postRegister');

Route::group(['middleware' => 'auth'], function() {

  Route::get('/', function() {
    return view('welcome');
  });

  Route::resource('universes', 'Universes');
  Route::resource('sector', 'Sector', ['names' => ['edit' => 'sector.planet']]);
  Route::resource('planet', 'Planet');
  Route::resource('ship', 'Ship');
  Route::resource('trader', 'Trader');
  Route::resource('port', 'Port');
  Route::resource('log', 'Log');
  Route::resource('score', 'Score');

  Route::post('create/checkname', 'Create@checkName');

  Route::resource('create', 'Create');

  Route::get('help', function() {
    return view('help');
  });

  Route::get('intro/select', function() {
    return view('intro-select');
  });

  Route::get('intro', function() {
    return view('intro' . rand(0,2));
  });

});

Route::get('greuler/cluster/{cluster?}', 'Greuler@getClusterPoints');
Route::get('greuler', 'Greuler@getIndex');;

Route::resource('sectormap', 'SectorMap');
Route::get('sectorgraph/{fromSector?}/{toSector?}', 'SectorGraph@index');
