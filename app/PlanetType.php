<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class PlanetType extends Model
{
  protected $guarded = ['id'];
  public $timestamps = false;

  public function planet() {
    return $this->hasMany('Tradewars\Planet', 'class_id', 'id');
  }
}
