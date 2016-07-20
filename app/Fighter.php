<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class Fighter extends Model
{
  protected $guarded = ['id', 'sector_id'];
  public $timestamps = true;

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
