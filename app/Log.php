<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class Log extends Model
{
  protected $guarded = ['id'];
  public $timestamps = true;

  public function universe()
  {
    return $this->belongsTo('Tradewars\Universe');
  }
}
