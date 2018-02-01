var w = console.log;
var DateTime = luxon.DateTime;
var Interval = luxon.Interval;

//window.onerror = function(msg, url, line, col, error) {};

var newestDateTime = DateTime.fromObject({
  year: 2018,
  month: 01,
  day: 01,
});

// var getPow = function(pair) {
//   switch (pair) {
//     case "USDEUR":
//       return 4;
//     case "USDGBP":
//       return 4;
//     case "USDAUD":
//       return 4;
//     case "USDNZD":
//       return 4;
//     case "CADUSD":
//       return 4;
//     case "CHFUSD":
//       return 4;
//     case "JPYUSD":
//       return 6;
//     case "EURJPY":
//       return 2;
//   }

//   return 0;
// };

// var drawSecondChart = function(upDown) {
//   upDown = upDown.filter(v => v.pair.indexOf("USD") != -1);

//   var pairs = upDown.map(v => v.pair);

//   var chart2 = bb.generate({
//     data: {
//       json: {
//         up: upDown.map(v => +v.up),
//         down: upDown.map(v => -v.down),
//       },
//       colors: {
//         up: "dimgray",
//         down: "red",
//       },
//       labels: true,
//       type: "bar",
//       groups: [["up", "down"]],
//     },
//     grid: {
//       y: {
//         lines: [
//           {
//             value: 0,
//           },
//         ],
//       },
//     },
//     axis: {
//       x: {
//         type: "category",
//         categories: pairs,
//       },
//       y: {
//         padding: {
//           top: 100,
//           bottom: 100,
//         },
//       },
//     },
//     //   y: {
//     //     label: {
//     //       text: "change in %",
//     //       position: "outer-middle",
//     //     },
//     //   },
//     // },
//     // tooltip: {
//     //   format: {
//     //     value: function(value, ratio, id) {
//     //       return value + "%";
//     //     },
//     //   },
//     // },
//     legend: {
//       show: false,
//     },
//     bindto: "#CombinationChart",
//   });
// };

var readFilter = function() {
  var parts = document.cookie.split(",");

  var ret =
    parts.length < 2
      ? ["USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "NZD"]
      : parts;

  ret.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.checked = true;
    }
  });

  window.chart = ret[0];

  return ret;
};

var writeFilter = function() {
  var filterArray = [];
  Object.values(document.getElementsByClassName("show")).forEach(function(el) {
    if (el.checked) {
      filterArray.push(el.id);
    }
  });
  document.cookie = filterArray.join(",");
};

var digits = function(number) {
  return Math.floor(Math.log10(+number)) + 1;
};

var precalcMatrix = function(data) {
  var lookup = new Map(),
    tmpCurrencies = {};

  data.forEach(function(entry) {
    var base = entry.symbol.substring(0, 3);
    var quote = entry.symbol.substring(3, 6);

    var t = DateTime.fromISO(entry.time);
    if (t.toISO() != null) {
      var local = DateTime.local();

      if (newestDateTime < t) {
        newestDateTime = t;
      }
    }

    tmpCurrencies[base] = {};
    tmpCurrencies[quote] = {};

    // var match = entry.prev_day_close.toString().match(/(\d+\.){0,1}(\d+)/);
    // var pow1 =
    //   match != null && match.length == 3 ? Math.pow(10, digits(match[2])) : 0;

    // var match = entry.open.toString().match(/(\d+\.){0,1}(\d+)/);
    // var pow2 =
    //   match != null && match.length == 3 ? Math.pow(10, digits(match[2])) : 0;

    // var match = entry.high.toString().match(/(\d+\.){0,1}(\d+)/);
    // var pow3 =
    //   match != null && match.length == 3 ? Math.pow(10, digits(match[2])) : 0;

    // var match = entry.low.toString().match(/(\d+\.){0,1}(\d+)/);
    // var pow4 =
    //   match != null && match.length == 3 ? Math.pow(10, digits(match[2])) : 0;

    // var match = entry.last.toString().match(/(\d+\.){0,1}(\d+)/);
    // var pow5 =
    //   match != null && match.length == 3 ? Math.pow(10, digits(match[2])) : 0;

    lookup.set(entry.symbol, {
      prev: +entry.prev_day_close,
      high: entry.high,
      low: entry.low,
      last: +entry.last,
      // pow: Math.max(pow1, pow2, pow3, pow4, pow5),
    });
  }, this);

  var currencies = Object.keys(tmpCurrencies);
  var getPercentages = function(base, quote) {
    var pair = base + quote,
      rev = quote + base,
      baseEuropeanTerms = base + "USD",
      quoteEuropeanTerms = quote + "USD",
      baseAmericanTerms = "USD" + base,
      quoteAmericanTerms = "USD" + quote,
      o = {
        prev: 0,
        high: 0,
        low: 0,
        last: 0,
        // pow: Math.pow(10, getPow(pair)),
      };

    if (lookup.has(pair)) {
      o = lookup.get(pair);
    } else if (lookup.has(rev)) {
      var value = lookup.get(rev);
      o.prev = 1 / value.prev;
      o.high = 1 / value.high;
      o.low = 1 / value.low;
      o.last = 1 / value.last;
    } else if (
      lookup.has(baseEuropeanTerms) &&
      lookup.has(quoteEuropeanTerms)
    ) {
      var valueA = lookup.get(baseEuropeanTerms);
      var valueB = lookup.get(quoteEuropeanTerms);

      o.prev = valueA.prev / valueB.prev;
      o.high = valueA.high / valueB.high;
      o.low = valueA.low / valueB.low;
      o.last = valueA.last / valueB.last;
    } else if (
      lookup.has(baseAmericanTerms) &&
      lookup.has(quoteAmericanTerms)
    ) {
      var valueA = lookup.get(baseAmericanTerms);
      var valueB = lookup.get(quoteAmericanTerms);

      o.prev = 1 / (valueA.prev / valueB.prev);
      o.high = 1 / (valueA.high / valueB.high);
      o.low = 1 / (valueA.low / valueB.low);
      o.last = 1 / (valueA.last / valueB.last);
    } else if (
      lookup.has(baseEuropeanTerms) &&
      lookup.has(quoteAmericanTerms)
    ) {
      var valueA = lookup.get(baseEuropeanTerms);
      var valueB = lookup.get(quoteAmericanTerms);

      o.prev = valueA.prev * valueB.prev;
      o.high = valueA.high * valueB.high;
      o.low = valueA.low * valueB.low;
      o.last = valueA.last * valueB.last;
    } else if (
      lookup.has(baseAmericanTerms) &&
      lookup.has(quoteEuropeanTerms)
    ) {
      var valueA = lookup.get(baseAmericanTerms);
      var valueB = lookup.get(quoteEuropeanTerms);

      o.prev = 1 / (valueA.prev * valueB.prev);
      o.high = 1 / (valueA.high * valueB.low);
      o.low = 1 / (valueA.low * valueB.low);
      o.last = 1 / (valueA.last * valueB.last);
    }

    // var up = Math.max(o.high, o.prev) - Math.min(o.high, o.prev);
    // var down = Math.max(o.low, o.prev) - Math.min(o.low, o.prev);

    // if (
    //   up == Number.POSITIVE_INFINITY ||
    //   up == Number.NEGATIVE_INFINITY ||
    //   up == Number.NaN
    // ) {
    //   up = 0;
    // }
    // if (
    //   down == Number.POSITIVE_INFINITY ||
    //   down == Number.NEGATIVE_INFINITY ||
    //   down == Number.NaN
    // ) {
    //   down = 0;
    // }

    // var upO = up;
    // var downO = down;

    // up = Math.round(up * o.pow);
    // down = Math.round(down * o.pow);

    // var pair = base + quote;
    // if (pair == "USDJPY" || pair == "JPYUSD") {
    //   w(
    //     pair,
    //     "prev",
    //     o.prev,
    //     "high",
    //     o.high,
    //     "low",
    //     o.low,
    //     "up",
    //     up,
    //     "down",
    //     down,
    //     "upO",
    //     upO,
    //     "downO",
    //     downO,
    //     "pow",
    //     o.pow
    //   );
    //   // EUR/USD 1.242 1.2429 1.24 1 2 0.0008999999999999009 0.0020000000000000018
    // }

    return {
      pct: (o.last - o.prev) / o.last * 100,
      // up: up,
      // down: down,
    };
  };

  var percentages = {};
  currencies.forEach(function(base) {
    currencies.forEach(function(quote) {
      if (base != quote) {
        if (!percentages.hasOwnProperty(base)) {
          percentages[base] = {};
        }
        percentages[base][quote] = getPercentages(base, quote);
      }
    });
  });

  return percentages;
};

var filterAndSort = function(enabled, percentages) {
  if (
    typeof percentages == "undefined" ||
    Object.keys(percentages).length < 2
  ) {
    return [];
  }

  // as soon as data is filtered
  var filtered = {},
    upDown = [];

  enabled.forEach(function(base) {
    enabled.forEach(function(quote) {
      if (base != quote) {
        if (!filtered.hasOwnProperty(base)) {
          filtered[base] = {};
        }
        if (
          percentages.hasOwnProperty(base) &&
          percentages[base].hasOwnProperty(quote)
        ) {
          filtered[base][quote] = percentages[base][quote].pct;

          upDown.push({
            pair: base + quote,
            up: percentages[base][quote].up,
            down: percentages[base][quote].down,
          });
        } else {
          filtered[base][quote] = 0;
        }
      }
    });
  });

  if (filtered.length < 2) {
    return [];
  }

  // we can sum up the percentages
  var sums = [];
  enabled.forEach(function(base) {
    sums.push({
      base: base,
      sum: Object.values(filtered[base]).reduce((a, b) => a + b, 0),
      pcts: filtered[base],
    });
  });

  // and sort by percentage values
  var sorted = Object.values(sums).sort(function(a, b) {
    if (b.sum == a.sum) {
      return a.base.localeCompare(b.base);
    } else {
      return b.sum - a.sum;
    }
  });

  return sorted;
};

var genChart = function(d) {
  var base = window.chart;

  var chartData = window.sessions.asia.filtered.filter(p => p.base == base);
  var data0 = chartData.length > 0 ? chartData[0].pcts : [];

  var chartData = window.sessions.europe.filtered.filter(p => p.base == base);
  var data1 = chartData.length > 0 ? chartData[0].pcts : [];

  var chartData = window.sessions.america.filtered.filter(p => p.base == base);
  var data2 = chartData.length > 0 ? chartData[0].pcts : [];

  bb.generate({
    data: {
      json: {
        asia: Object.values(data0).map(v => v.toFixed(2)),
        europe: Object.values(data1).map(v => v.toFixed(2)),
        america: Object.values(data2).map(v => v.toFixed(2)),
      },
      colors: {
        asia: "lightgray",
        europe: "gray",
        america: "dimgray",
      },
      type: "bar",
    },
    // bar: {
    //   width: {
    //     ratio: 0.5,
    //   },
    // },
    grid: {
      y: {
        lines: [
          {
            value: 0,
          },
        ],
      },
    },
    axis: {
      x: {
        type: "category",
        categories: Object.keys(d.pcts),
      },
      y: {
        label: {
          text: "change in %",
          position: "outer-middle",
        },
      },
    },
    tooltip: {
      format: {
        value: function(value, ratio, id) {
          return value + "%";
        },
      },
    },
    legend: {
      show: false,
    },
    bindto: "#chart",
  });

  d3.select("#chartCaption").html("all currencies vs " + d.base);
};

var redraw = function(prefix, percentages) {
  var color = d3
    .scaleLinear()
    .domain([10, 2, 0, -2, -10])
    .range(["green", "lightgreen", "gray", "lightcoral", "red"]);

  d3
    .select("#" + prefix)
    .selectAll("div")
    .remove();

  var parent = d3
    .select("#" + prefix)
    .selectAll("div")
    // .data(percentages.filter(p => p.sum > 0))
    .data(percentages);

  parent
    .enter()
    .append("div")
    .classed("tile", true)
    .style("background-color", function(d) {
      return color(Math.max(-10, Math.min(10, d.sum)));
    })
    .attr("ccy", function(d) {
      return d.base;
    })
    .html(function(d) {
      return (
        "<span class='ccy'>" +
        d.base +
        "</span><span class='sum'>" +
        d.sum.toFixed(2) +
        "</span>"
      );
    })
    .on("click", function(d) {
      if (window.chart != d.base) {
        window.chart = d.base;
        genChart(d);
      }
    })
    .on("mousemove", function(d) {
      d3.selectAll(".tile").style("text-shadow", "0px 0px");
      // d3.selectAll(".tile").style("font-width", "normal");

      d3
        .selectAll(".tile[ccy='" + d.base + "']")
        // .style("font-width", "bolder");
        .style("text-shadow", "1px 1px 2px black, 0 0 25px green, 0 0 5px red");

      if (window.chart != d.base) {
        window.chart = d.base;
        genChart(d);
      }
    });

  var chartData = percentages.filter(p => p.base == window.chart);
  if (chartData.length > 0) {
    genChart(chartData[0]);
  }
};

var nextTick = function() {
    return 60000 - new Date() % 60000;
  },
  autoUpdate = function() {
    update(DateTime.local().toISO());
    setTimeout(autoUpdate, nextTick());
  };

var loadData = function(enabled) {
  var today = DateTime.fromISO(
      DateTime.utc()
        .plus({ hours: 2 })
        .toISODate()
    ),
    dt = today;

  try {
    dt = DateTime.fromISO(
      document.location.href.match(/day=(\d{4}-\d{2}-\d{2})/)[1]
    );
  } catch (e) {}

  if (dt.toISODate() == today.toISODate()) {
    window.runCheckTime = true;
    setTimeout(autoUpdate, nextTick());
  } else {
    document.getElementById("jumpToCurrentDay").href =
      document.location.origin + document.location.pathname;
    // "?day=" + dt.toISODate();
    document.getElementById("subNavi").style.display = "block";
  }

  if (dt > DateTime.fromISO("2018-01-30")) {
    document.getElementById("prev").style.display = "block";
    document.getElementById("prev").href =
      "?day=" + dt.plus({ days: -1 }).toISODate();
  }

  document.getElementById("date").innerText = dt.toISODate();

  if (dt < today) {
    document.getElementById("next").style.display = "block";
    document.getElementById("next").href =
      "?day=" + dt.plus({ days: +1 }).toISODate();
  }

  var disqus_config = function() {
    this.page.url =
      document.location.origin +
      document.location.pathname +
      "?day=" +
      dt.toISODate();
    this.page.identifier = dt.toISODate(); // Replace PAGE_IDENTIFIER with your page's unique identifier variable
  };

  var uri =
    "https://raw.githubusercontent.com/fxtools/quote_percentages/master/" +
    dt.year +
    "/" +
    dt.toISODate() +
    "/";

  var uriA = uri + "asian%20session.tsv?" + Date.now();
  var uriB = uri + "european%20session.tsv?" + Date.now();
  var uriC = uri + "north%20american%20session.tsv?" + Date.now();

  window.sessions = {
    asia: { raw: {}, filtered: [] },
    europe: { raw: {}, filtered: [] },
    america: { raw: {}, filtered: [] },
  };

  d3.tsv(uriA, function(error, data) {
    if (error) {
      return;
    }
    window.sessions.asia.raw = precalcMatrix(data);

    window.sessions.asia.filtered = filterAndSort(
      enabled,
      window.sessions.asia.raw
    );

    redraw("asia", window.sessions.asia.filtered);
    document.getElementById("container-asia").style.display = "block";
  });

  d3.tsv(uriB, function(error, data) {
    if (error) {
      return;
    }
    window.sessions.europe.raw = precalcMatrix(data);

    window.sessions.europe.filtered = filterAndSort(
      enabled,
      window.sessions.europe.raw
    );

    redraw("europe", window.sessions.europe.filtered);
    document.getElementById("heading-asia").style.display = "block";
    document.getElementById("container-europe").style.display = "block";
  });

  d3.tsv(uriC, function(error, data) {
    setInterval(checkTime, 1000 * 30);

    if (error) {
      return;
    }
    window.sessions.america.raw = precalcMatrix(data);

    window.sessions.america.filtered = filterAndSort(
      enabled,
      window.sessions.america.raw
    );

    redraw("america", window.sessions.america.filtered);
    document.getElementById("heading-asia").style.display = "block";
    document.getElementById("container-america").style.display = "block";

    checkTime();
  });
};

var onFilterUpdate = function() {
  writeFilter();
  var enabled = readFilter();

  window.sessions.asia.filtered = filterAndSort(
    enabled,
    window.sessions.asia.raw
  );
  redraw("asia", window.sessions.asia.filtered);

  window.sessions.europe.filtered = filterAndSort(
    enabled,
    window.sessions.europe.raw
  );
  redraw("europe", window.sessions.europe.filtered);

  window.sessions.america.filtered = filterAndSort(
    enabled,
    window.sessions.america.raw
  );
  redraw("america", window.sessions.america.filtered);
};

d3.selectAll("input.show").on("click", onFilterUpdate);

var update = function() {
  var enabled = readFilter();

  loadData(enabled);
};

d3.selectAll("#filter th").on("click", function(d, a, b) {
  var name = this.innerText.toLowerCase() + "[]";
  var els = document.getElementsByName(name);
  if (els[0].checked) {
    els.forEach(c => (c.checked = false));
  } else {
    els.forEach(c => (c.checked = true));
  }
  onFilterUpdate();
});

var checkTime = function() {
  if (window.runCheckTime) {
    var i = Interval.fromDateTimes(newestDateTime, DateTime.local())
      .toDuration(["minutes"])
      .toObject();
    old.innerText = "Data is " + Math.ceil(i.minutes) + " minutes old";
  }
};

update();
