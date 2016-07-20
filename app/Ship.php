<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class Ship extends Model
{
  protected $guarded = ['id', 'ship_id', 'universe_id', 'sector_id', 'user_id', 'planet_id'];
  public $timestamps = true;

  public function type()
  {
    //return $this->belongsTo('Tradewars\ShipType', 'ship_id');
    return $this->hasOne('Tradewars\ShipType', 'id', 'ship_id');
  }

  public function manufacturer()
  {
    return $this->hasOne('Tradewars\Manufacturer', 'id', 'manufacturer_id');
  }

  public function trader()
  {
    return $this->belongsTo('Tradewars\Trader');
  }

  public function universe()
  {
    return $this->belongsTo('Tradewars\Universe');
  }

  public function sector()
  {
    return $this->belongsTo('Tradewars\Sector');
  }

  public function planet()
  {
    return $this->belongsTo('Tradewars\Planet');
  }
}
