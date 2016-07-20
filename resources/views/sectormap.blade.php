<pre>
Sector  : {{ $sector->number }} in @if ($sector->cluster != ''){{ $sector->cluster }}@else uncharted space @endif 
@if ($sector->beacon != '')Beacon  : {{ $sector->beacon }} @endif 
@if ($port)Ports   : {{ $port->name }}, Class {{ $port->class }} ({{ Helpers::resolvePortClass($port->class) }})@if ($port->class == 9) (StarDock)@endif @endif 
@if ($planets)@foreach ($planets as $planet)Planets : ({{ Helpers::resolvePlanetClass($planet->class) }}) {{ $planet->name }} @endforeach @endif 
@if ($fighters)Fighters: {{ $fighters->quantity }} ({{ Helpers::resolveOwner($fighters->user_id) }}) [{{ Helpers::fighterMode($fighters->mode) }}] @endif 
@if ($sector->navhaz)NavHaz  : {{ $sector->navhaz }}% (Space Debris/Asteroids)@endif 
@if ($mines)@foreach ($mines as $mine)Mines   : {{ $mine->quantity }} (Type {{ $mine->type }} {{ Helpers::mineType($mine->name) }}) ({{ Helpers::resolveOwner($mine->user_id) }}) @endforeach @endif 
Warps to Sector(s) : @foreach ($warps as $warp) <a href="/sectormap/{{ $warp->number }}">{{ $warp->number }}</a> @endforeach
</pre>
