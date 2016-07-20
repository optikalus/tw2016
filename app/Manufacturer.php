<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class Manufacturer extends Model
{
  protected $guarded = ['id'];
  public $timestamps = false;

  public function ship()
  {
    return $this->belongsTo('Tradewars\Ship', 'ship_id');
  }
}
