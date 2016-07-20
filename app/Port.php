<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class Port extends Model
{
  protected $fillable = ['name', 'class', 'last_ship', 'last_time', 'firepower', 'credits', 'fuel', 'organics', 'equipment', 'fuel_prod', 'organics_prod', 'equipment_prod', 'fuel_mcic', 'organics_mcic', 'equipment_mcic'];
  public $timestamps = false;

  public function sector()
  {
    return $this->belongsTo('Tradewars\Sector');
  }
}
