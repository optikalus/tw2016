<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class ShipType extends Model
{
  protected $guarded = [ 'id' ];
  public $timestamps = false;

  public function ship()
  {
    //return $this->hasMany('Tradewars\Ship', 'ship_id', 'id');
    return $this->belongsTo('Tradewars\Ship', 'ship_id');
  }
}
