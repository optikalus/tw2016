<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class Trader extends Model
{
  protected $guarded = ['id', 'user_id', 'universe_id', 'ship_id', 'sector_id', 'planet_id'];
  public $timestamps = true;

  public function user()
  {
    return $this->belongsTo('Tradewars\User');
  }

  public function universe()
  {
    return $this->belongsTo('Tradewars\Universe');
  }

  public function ship()
  {
    return $this->hasMany('Tradewars\Ship');
  }

  public function sector()
  {
    return $this->hasOne('Tradewars\Sector');
  }

  public function planet()
  {
    return $this->hasMany('Tradewars\Planet');
  }

  public function fighter()
  {
    return $this->hasMany('Tradewars\Fighter');
  }

  public function mine()
  {
    return $this->hasMany('Tradewars\Mine');
  }
}
