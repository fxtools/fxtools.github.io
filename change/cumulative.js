var w = console.log;
var DateTime = luxon.DateTime;

//window.onerror = function(msg, url, line, col, error) {};

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

var precalcMatrix = function(data) {
  var lookup = new Map(),
    tmpCurrencies = {};

  data.forEach(function(entry) {
    var base = entry.symbol.substring(0, 3);
    var quote = entry.symbol.substring(3, 6);
    tmpCurrencies[base] = {};
    tmpCurrencies[quote] = {};

    lookup.set(entry.symbol, {
      prev: entry.prev_day_close,
      last: entry.last,
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
      o = { prev: 0, last: 0 };

    if (lookup.has(pair)) {
      o = lookup.get(pair);
    } else if (lookup.has(rev)) {
      var value = lookup.get(rev);
      o.prev = 1 / value.prev;
      o.last = 1 / value.last;
    } else if (
      lookup.has(baseEuropeanTerms) &&
      lookup.has(quoteEuropeanTerms)
    ) {
      var valueA = lookup.get(baseEuropeanTerms);
      var valueB = lookup.get(quoteEuropeanTerms);

      o.prev = valueA.prev / valueB.prev;
      o.last = valueA.last / valueB.last;
    } else if (
      lookup.has(baseAmericanTerms) &&
      lookup.has(quoteAmericanTerms)
    ) {
      var valueA = lookup.get(baseAmericanTerms);
      var valueB = lookup.get(quoteAmericanTerms);

      o.prev = 1 / (valueA.prev / valueB.prev);
      o.last = 1 / (valueA.last / valueB.last);
    } else if (
      lookup.has(baseEuropeanTerms) &&
      lookup.has(quoteAmericanTerms)
    ) {
      var valueA = lookup.get(baseEuropeanTerms);
      var valueB = lookup.get(quoteAmericanTerms);

      o.prev = valueA.prev * valueB.prev;
      o.last = valueA.last * valueB.last;
    } else if (
      lookup.has(baseAmericanTerms) &&
      lookup.has(quoteEuropeanTerms)
    ) {
      var valueA = lookup.get(baseAmericanTerms);
      var valueB = lookup.get(quoteEuropeanTerms);

      o.prev = 1 / (valueA.prev * valueB.prev);
      o.last = 1 / (valueA.last * valueB.last);
    }

    return (o.last - o.prev) / o.last * 100;
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
  var filtered = {};
  enabled.forEach(function(base) {
    enabled.forEach(function(quote) {
      if (base != quote) {
        if (!filtered.hasOwnProperty(base)) {
          filtered[base] = {};
        }
        filtered[base][quote] = percentages[base][quote];
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

var GenChart = function(d) {
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
        // title: function(d) {
        //   w(d);
        //   return d.base;
        // },
        value: function(value, ratio, id) {
          return value + "%";
        },
      },
    },

    legend: {
      show: false,
    },
    size: {
      height: 240,
      width: 480,
    },
    bindto: "#chart",
  });

  d3.select("#chartCaption").text(d.base);
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
        GenChart(d);
      }
    })
    .on("mousemove", function(d) {
      d3.selectAll(".tile").style("text-shadow", "0px 0px");

      d3
        .selectAll(".tile[ccy='" + d.base + "']")
        .style("text-shadow", "1px 1px 2px black, 0 0 25px green, 0 0 5px red");

      if (window.chart != d.base) {
        window.chart = d.base;
        GenChart(d);
      }
    });

  var chartData = percentages.filter(p => p.base == window.chart);
  if (chartData.length > 0) {
    GenChart(chartData[0]);
  }
};

var loadData = function(enabled) {
  var dt = DateTime.utc().plus({ hours: 2 });

  document.getElementById("today").href =
    document.location.origin + document.location.pathname;
  // "?day=" + dt.toISODate();

  try {
    var day = document.location.href.match(/day=(\d{4}-\d{2}-\d{2})/)[1];
    dt = DateTime.fromISO(day);
  } catch (e) {}

  document.getElementById("prev").href =
    "?day=" + dt.plus({ days: -1 }).toISODate();
  document.getElementById("date").innerText = dt.toISODate();
  document.getElementById("next").href =
    "?day=" + dt.plus({ days: +1 }).toISODate();

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

  var uriA = uri + "asian%20session.tsv";
  var uriB = uri + "european%20session.tsv";
  var uriC = uri + "north%20american%20session.tsv";

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
  });

  d3.tsv(uriC, function(error, data) {
    if (error) {
      return;
    }
    window.sessions.america.raw = precalcMatrix(data);

    window.sessions.america.filtered = filterAndSort(
      enabled,
      window.sessions.america.raw
    );

    redraw("america", window.sessions.america.filtered);
  });
};

d3.selectAll("input.show").on("click", function() {
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
});

var update = function() {
  var enabled = readFilter();

  loadData(enabled);
};

setInterval(update, 1000 * 60 * 5);
update();
