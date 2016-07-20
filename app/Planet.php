<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class Planet extends Model
{
  protected $guarded = ['id', 'universe_id', 'sector_id', 'user_id', 'trader_id'];
  public $timestamps = false;

  public function type()
  {
    return $this->belongsTo('Tradewars\PlanetType', 'class_id');
  }

  public function universe()
  {
    return $this->belongsTo('Tradewars\Universe');
  }

  public function sector()
  {
    return $this->belongsTo('Tradewars\Sector');
  }

  public function trader()
  {
    return $this->belongsTo('Tradewars\Trader');
  }
}
