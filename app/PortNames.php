<?php

namespace Tradewars;

use Illuminate\Database\Eloquent\Model;

class PortNames extends Model
{
  protected $table = 'portnames';
  protected $fillable = ['name'];
  public $timestamps = false;
}
