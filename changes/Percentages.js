var w = console.log;

var readFilter = function() {
  var ret =
    document.cookie.length == 0
      ? ["USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "NZD"]
      : document.cookie.split(",");

  ret.forEach(function(id) {
    document.getElementById(id).checked = true;
  });

  return ret;
};

var writeFilter = function() {
  var filter = [];
  Object.values(document.getElementsByClassName("show")).forEach(function(el) {
    if (el.checked) {
      filter.push(el.id);
    }
  });
  document.cookie = filter.join(",");
};

var drawSession = function(session) {
  var data = window.session[session];
  w(data);
  var currencies = [],
    quotes = {},
    changes = [],
    sums = {};

  data.forEach(function(e) {
    var base = e.currency.substring(0, 3);
    var quote = e.currency.substring(3, 6);

    if (currencies.indexOf(base) == -1) {
      currencies.push(base);
    }

    if (currencies.indexOf(quote) == -1) {
      currencies.push(quote);
    }

    quotes[base + quote] = { last: e.last, prev: e.prev_day_close };
  }, this);

  var GetPct = function(prev, last) {
    return (last - prev) / last * 100;
  };

  var GetPctInv = function(prev, last) {
    prev = 1 / prev;
    last = 1 / last;
    return (last - prev) / last * 100;
  };

  var getPercentages = function(base, quote) {
    if (typeof quotes[base + quote] !== "undefined") {
      return GetPct(quotes[base + quote].prev, quotes[base + quote].last);
    } else if (typeof quotes[quote + base] !== "undefined") {
      return GetPctInv(quotes[quote + base].prev, quotes[quote + base].last);
    } else if (
      typeof quotes[base + "USD"] !== "undefined" &&
      typeof quotes[quote + "USD"] !== "undefined"
    ) {
      // If two currencies are quoted in the same terms, divide the base currency of the cross currency pair into the terms currency of the pair.
      var prevA = quotes[base + "USD"].prev;
      var lastA = quotes[base + "USD"].last;

      var prevB = quotes[quote + "USD"].prev;
      var lastB = quotes[quote + "USD"].last;

      var prev = prevA / prevB;
      var last = lastA / lastB;

      return GetPct(prev, last);
    } else if (
      typeof quotes["USD" + base] !== "undefined" &&
      typeof quotes["USD" + quote] !== "undefined"
    ) {
      // If two currencies are quoted in the same terms, divide the base currency of the cross currency pair into the terms currency of the pair.
      var prevA = quotes["USD" + base].prev;
      var lastA = quotes["USD" + base].last;

      var prevB = quotes["USD" + quote].prev;
      var lastB = quotes["USD" + quote].last;

      var prev = prevA / prevB;
      var last = lastA / lastB;

      return GetPct(1 / prev, 1 / last);
    } else if (
      typeof quotes[base + "USD"] !== "undefined" &&
      typeof quotes["USD" + quote] !== "undefined"
    ) {
      // If two currencies are quoted in different terms, multipy one rate by the othe
      var prevA = quotes[base + "USD"].prev;
      var lastA = quotes[base + "USD"].last;

      var prevB = quotes["USD" + quote].prev;
      var lastB = quotes["USD" + quote].last;

      var prev = prevA * prevB;
      var last = lastA * lastB;

      return GetPct(prev, last);
    } else if (
      typeof quotes["USD" + base] !== "undefined" &&
      typeof quotes[quote + "USD"] !== "undefined"
    ) {
      // If two currencies are quoted in different terms, multipy one rate by the othe
      var prevA = quotes["USD" + base].prev;
      var lastA = quotes["USD" + base].last;

      var prevB = quotes[quote + "USD"].prev;
      var lastB = quotes[quote + "USD"].last;

      var prev = prevA * prevB;
      var last = lastA * lastB;

      return GetPct(1 / prev, 1 / last);
    }

    return 0;
  };

  currencies.forEach(function(base) {
    if (document.getElementById(base).checked) {
      currencies.forEach(function(quote) {
        if (document.getElementById(quote).checked) {
          if (base != quote) {
            changes.push({
              base: base,
              quote: quote,
              pct: getPercentages(base, quote),
            });
          }
        }
      }, this);
    }
  }, this);

  changes.forEach(function(el) {
    if (typeof sums[el.base] === "undefined") {
      sums[el.base] = { base: el.base, pct: 0 };
    }

    sums[el.base].pct += el.pct;
  });

  var sorted = Object.values(sums).sort(function(a, b) {
    if (b.pct == a.pct) {
      return a.base.localeCompare(b.base);
    } else {
      return b.pct - a.pct;
    }
  });

  w(sorted);

  d3
    .select("#" + session)
    .selectAll("span")
    .remove();

  d3
    .select("#" + session)
    .selectAll("span")
    .data(sorted)
    .enter()
    .append("span")
    .html(function(d) {
      return d.base + "<br/>" + d.pct.toFixed(2) + " %";
    });

  // Object.keys(changes).forEach(function(base) {
  //   bb.generate({
  //     data: {
  //       rows: [Object.keys(changes[base]), Object.values(changes[base])],
  //       type: "bar",
  //     },
  //     bar: {
  //       width: {
  //         ratio: 0.5,
  //       },
  //     },
  //     bindto: "#barChart-" + session + "-" + base,
  //   });
  // });
};

readFilter();
window.session = {};

var uriA = "https://raw.githubusercontent.com/fxtools/quote_percentages/master/2018/2018-01-23/asian%20session.tsv";

d3.tsv(uriA, function(error, data, c) {
  if (error) {
    return;
  }
  window.session["asession"] = data;
  drawSession("asession");
});
/*
d3.tsv("european session.tsv", function(error, data, c) {
  if (error) {
    return;
  }
  window.session["bsession"] = data;
  drawSession("bsession");
});
*/
// d3.tsv("north american session.tsv", function(error, data, c) {
//   if (error) {
//     return;
//   }
//   window.session["csession"] = data;
//   drawSession("csession");
// });

d3.selectAll("input.show").on("click", function() {
  writeFilter();
  readFilter();

  drawSession("asession");
  drawSession("bsession");
  // drawSession("csession");
});

// var d = new Date();
// var date = d.toISOString().split("T")[0];
// var year = d.getFullYear();
// w(date, year);
