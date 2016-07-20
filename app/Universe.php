<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class Universe extends Model
{
  protected $guarded = ['id'];

  public function sectors()
  {
    return $this->hasMany('Tradewars\Sector');
  }

  public function traders()
  {
    return $this->hasMany('Tradewars\Trader');
  }

  public function ships()
  {
    return $this->hasMany('Tradewars\Ship');
  }

  public function planets()
  {
    return $this->hasMany('Tradewars\Planet');
  }

  public function ports()
  {
    return $this->hasMany('Tradewars\Port');
  }

  public function fighters()
  {
    return $this->hasMany('Tradewars\Fighter');
  }

  public function mines()
  {
    return $this->hasMany('Tradewars\Mine');
  }

  public function logs()
  {
    return $this->hasMany('Tradewars\Log');
  }
}
