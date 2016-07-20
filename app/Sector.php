<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class Sector extends Model
{
  protected $fillable = ['number', 'cluster'];
  public $timestamps = false;

  public function universe()
  {
    return $this->belongsTo('Tradewars\Universe');
  }

  public function warps()
  {
    return $this->belongsToMany('Tradewars\Sector', 'sector_sector', 'sector_id', 'sector_id_warp');
  }

  public function port()
  {
    return $this->hasOne('Tradewars\Port');
  }

  public function fighters()
  {
    return $this->hasOne('Tradewars\Fighter');
  }

  public function mines()
  {
    return $this->hasMany('Tradewars\Mine');
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

}
