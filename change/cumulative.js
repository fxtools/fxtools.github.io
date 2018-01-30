<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<title>FX Tools</title>

	<style>
		* {
			margin: 0px;
			padding: 0px;

			margin-right: 18px;
			font: 14px "Gotham A", "Gotham B", sans-serif;
			font-weight: 500;
			color: #8a8a8a;
			text-transform: uppercase;
		}

		.cumulative {
			background: linear-gradient(to right, green 0%, gray 33%, gray 66%, red 100%);
			white-space: nowrap;
			margin: 0 auto;
			w-idth: 100vw;
			text-align: center;
			margin: 0.3vw;
			padding: 0.3vw;
		}

		.cumulative>div {
			display: inline-block;
		}

		.cumulative span {
			color: black;
		}

		.ccy {
			display: block;
		}

		.sum {
			display: block;
		}

		.sum:after {
			content: "%";
		}

		.show {
			display: inline;
		}

		.hide {
			display: none;
		}

		#chart {}
	</style>
	<link rel="stylesheet" type="text/css" href="/js/billboard.js/billboard.min.css" />
</head>

<body>

	Asian Session:
	<div id="asia" class="cumulative"></div>
	European Session:
	<div id="europe" class="cumulative"></div>
	North American Session:
	<div id="america" class="cumulative"></div>

	<center>
		<h1 id="chartCaption"></h1>
		<div id="chart"></div>
	</center>

	<br/>
	<button name="showFilter" onclick="var el = document.getElementById('filter'); el.classList.contains('hide') ? el.classList.remove('hide') : el.classList.add('hide');">show/hide Filter</button>
	<br/>
	<button style="display: none;" name="toggleAll" onclick="var els = document.getElementsByClassName('show'); w(Object.values(els).forEach(i => i.checked = true));">check all</button>
	<button style="display: none;" name="toggleAll" onclick="var els = document.getElementsByClassName('show'); w(Object.values(els).forEach(i => i.checked = false));">uncheck all</button>
	<ul id="filter" class="hide">

		<li>
			<input id="USD" class="show" name="show[]" type="checkbox" value="USD" />
			<label for="USD">USD</label>
		</li>
		<li>
			<input id="EUR" class="show" name="show[]" type="checkbox" value="EUR" />
			<label for="EUR">EUR</label>
		</li>
		<li>
			<input id="JPY" class="show" name="show[]" type="checkbox" value="JPY" />
			<label for="JPY">JPY</label>
		</li>
		<li>
			<input id="GBP" class="show" name="show[]" type="checkbox" value="GBP" />
			<label for="GBP">GBP</label>
		</li>
		<li>
			<input id="AUD" class="show" name="show[]" type="checkbox" value="AUD" />
			<label for="AUD">AUD</label>
		</li>
		<li>
			<input id="CAD" class="show" name="show[]" type="checkbox" value="CAD" />
			<label for="CAD">CAD</label>
		</li>
		<li>
			<input id="CHF" class="show" name="show[]" type="checkbox" value="CHF" />
			<label for="CHF">CHF</label>
		</li>
		<li>
			<input id="NZD" class="show" name="show[]" type="checkbox" value="NZD" />
			<label for="NZD">NZD</label>
		</li>
		<li>
			<input id="CNY" class="show" name="show[]" type="checkbox" value="CNY">
			<label for="CNY">CNY</label>
		</li>
		<li>
			<input id="SEK" class="show" name="show[]" type="checkbox" value="SEK">
			<label for="SEK">SEK</label>
		</li>
		<li>
			<input id="MXN" class="show" name="show[]" type="checkbox" value="MXN">
			<label for="MXN">MXN</label>
		</li>
		<li>
			<input id="SGD" class="show" name="show[]" type="checkbox" value="SGD">
			<label for="SGD">SGD</label>
		</li>
		<li>
			<input id="HKD" class="show" name="show[]" type="checkbox" value="HKD">
			<label for="HKD">HKD</label>
		</li>
		<li>
			<input id="NOK" class="show" name="show[]" type="checkbox" value="NOK">
			<label for="NOK">NOK</label>
		</li>
		<li>
			<input id="KRW" class="show" name="show[]" type="checkbox" value="KRW">
			<label for="KRW">KRW</label>
		</li>
		<li>
			<input id="TRY" class="show" name="show[]" type="checkbox" value="TRY">
			<label for="TRY">TRY</label>
		</li>
		<li>
			<input id="RUB" class="show" name="show[]" type="checkbox" value="RUB">
			<label for="RUB">RUB</label>
		</li>
		<li>
			<input id="INR" class="show" name="show[]" type="checkbox" value="INR">
			<label for="INR">INR</label>
		</li>
		<li>
			<input id="BRL" class="show" name="show[]" type="checkbox" value="BRL">
			<label for="BRL">BRL</label>
		</li>
		<li>
			<input id="ZAR" class="show" name="show[]" type="checkbox" value="ZAR">
			<label for="ZAR">ZAR</label>
		</li>
		<li>
			<input id="DKK" class="show" name="show[]" type="checkbox" value="DKK">
			<label for="DKK">DKK</label>
		</li>
		<li>
			<input id="PLN" class="show" name="show[]" type="checkbox" value="PLN">
			<label for="PLN">PLN</label>
		</li>
		<li>
			<input id="TWD" class="show" name="show[]" type="checkbox" value="TWD">
			<label for="TWD">TWD</label>
		</li>
		<li>
			<input id="THB" class="show" name="show[]" type="checkbox" value="THB">
			<label for="THB">THB</label>
		</li>
		<li>
			<input id="MYR" class="show" name="show[]" type="checkbox" value="MYR">
			<label for="MYR">MYR</label>
		</li>
		<li>
			<input id="HUF" class="show" name="show[]" type="checkbox" value="HUF">
			<label for="HUF">HUF</label>
		</li>
		<li>
			<input id="SAR" class="show" name="show[]" type="checkbox" value="SAR">
			<label for="SAR">SAR</label>
		</li>
		<li>
			<input id="CZK" class="show" name="show[]" type="checkbox" value="CZK">
			<label for="CZK">CZK</label>
		</li>
		<li>
			<input id="ILS" class="show" name="show[]" type="checkbox" value="ILS">
			<label for="ILS">ILS</label>
		</li>
		<li>
			<input id="BTC" class="show" name="show[]" type="checkbox" value="BTC">
			<label for="BTC">BTC</label>
		</li>
		<li>
			<input id="XAU" class="show" name="show[]" type="checkbox" value="XAU">
			<label for="XAU">XAU</label>
		</li>
		<li>
			<input id="XAG" class="show" name="show[]" type="checkbox" value="XAG">
			<label for="XAG">XAG</label>
		</li>
		<li>
			<input id="XPD" class="show" name="show[]" type="checkbox" value="XPD">
			<label for="XPD">XPD</label>
		</li>
		<li>
			<input id="XPT" class="show" name="show[]" type="checkbox" value="XPT">
			<label for="XPT">XPT</label>
		</li>


	</ul>

	<script src="/js/d3/d3.v4.min.js"></script>
	<script src="/js/luxon/luxon.min.js"></script>
	<script src="/js/billboard.js/billboard.pkgd.min.js"></script>
	<script src="cumulative.js"></script>

</body>

</html>
