// https://www.oanda.com/forex-trading/analysis/currency-heatmap

var w = console.log,
  DateTime = luxon.DateTime,
  Interval = luxon.Interval,
  disqus_config = function() {};

window.onerror = function(msg, url, line, col, error) {
  gtag("event", "exception", {
    description: "[" + error + "] " + msg + " in " + url + "[" + line + ":" + col + "]",
    fatal: false,
  });
};

var newestDateTime = DateTime.fromObject({
  year: 2018,
  month: 01,
  day: 01,
});

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

if (!localStorage.getItem("user")) {
  localStorage.setItem("user", uuidv4());
}
window.user = localStorage.getItem("user");

function getFailSafe(uri) {
  return new Promise(function(resolve, reject) {
    $.get(uri).then(
      function(data) {
        resolve(data);
      },
      function(err) {
        resolve(null);
      }
    );
  });
}

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
  var filter = localStorage.getItem("filter");
  var parts = filter ? filter.split(",") : [];

  var ret = parts.length < 2 ? ["USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "NZD"] : parts;

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
  filter = filterArray.join(",");

  localStorage.setItem("filter", filter);

  gtag("event", "filter", {
    event_category: window.user,
    event_label: filter,
  });
};

var digits = function(number) {
  return Math.floor(Math.log10(+number)) + 1;
};

var precalcMatrix = function(data) {
  data = d3.tsvParse(data);

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

  $("#time").text(newestDateTime.toLocal().toLocaleString(DateTime.TIME_SIMPLE));

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
    } else if (lookup.has(baseEuropeanTerms) && lookup.has(quoteEuropeanTerms)) {
      var valueA = lookup.get(baseEuropeanTerms);
      var valueB = lookup.get(quoteEuropeanTerms);

      o.prev = valueA.prev / valueB.prev;
      o.high = valueA.high / valueB.high;
      o.low = valueA.low / valueB.low;
      o.last = valueA.last / valueB.last;
    } else if (lookup.has(baseAmericanTerms) && lookup.has(quoteAmericanTerms)) {
      var valueA = lookup.get(baseAmericanTerms);
      var valueB = lookup.get(quoteAmericanTerms);

      o.prev = 1 / (valueA.prev / valueB.prev);
      o.high = 1 / (valueA.high / valueB.high);
      o.low = 1 / (valueA.low / valueB.low);
      o.last = 1 / (valueA.last / valueB.last);
    } else if (lookup.has(baseEuropeanTerms) && lookup.has(quoteAmericanTerms)) {
      var valueA = lookup.get(baseEuropeanTerms);
      var valueB = lookup.get(quoteAmericanTerms);

      o.prev = valueA.prev * valueB.prev;
      o.high = valueA.high * valueB.high;
      o.low = valueA.low * valueB.low;
      o.last = valueA.last * valueB.last;
    } else if (lookup.has(baseAmericanTerms) && lookup.has(quoteEuropeanTerms)) {
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
  if (typeof percentages == "undefined" || Object.keys(percentages).length < 2) {
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
        if (percentages.hasOwnProperty(base) && percentages[base].hasOwnProperty(quote)) {
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

var genChart = function() {
  var base = window.chart;

  var a = window.sessions.asia.filtered.map(p => Enumerable.from(Object.values(p.pcts).map(v => Math.abs(v))));
  var b = window.sessions.europe.filtered.map(p => Enumerable.from(Object.values(p.pcts).map(v => Math.abs(v))));
  var c = window.sessions.america.filtered.map(p => Enumerable.from(Object.values(p.pcts).map(v => Math.abs(v))));
  a.push(...b);
  a.push(...c);
  var range = Enumerable.from(a)
    .select(v => v.max())
    .max();

  var asia =
    Enumerable.from(window.sessions.asia.filtered)
      .where(p => p.base == base)
      .select(p => Enumerable.from(p.pcts).toArray())
      .singleOrDefault() || [];

  var europe =
    Enumerable.from(window.sessions.europe.filtered)
      .where(p => p.base == base)
      .select(p => Enumerable.from(p.pcts).toArray())
      .singleOrDefault() || [];

  var america =
    Enumerable.from(window.sessions.america.filtered)
      .where(p => p.base == base)
      .select(p => Enumerable.from(p.pcts).toArray())
      .singleOrDefault() || [];

  var sortByArr = (america.length > 0 ? america : europe.length > 0 ? europe : asia).sort((a, b) => a - b);
  var sortByMap = sortByArr.reduce(function(obj, b, idx) {
    obj[b.key] = b.value;
    return obj;
  }, {});

  var sortFunc = function(a, b) {
    return sortByMap[a.key] - sortByMap[b.key];
  };

  var sortedAsia = asia.sort(sortFunc);
  var sortedEurope = europe.sort(sortFunc);
  var sortedAmerica = america.sort(sortFunc);

  d3.select("#chartCaption").html(base + " | " + names[base]);

  var categories = sortByArr.map(r => r.key);

  var chart = bb.generate({
    size: {
      width: 400,
      height: 200,
    },
    data: {
      json: {
        asia: sortedAsia.map(kv => kv.value.toFixed(2)),
        europe: sortedEurope.map(kv => kv.value.toFixed(2)),
        america: sortedAmerica.map(kv => kv.value.toFixed(2)),
      },
      colors: {
        asia: "lightgray",
        europe: "gray",
        america: "dimgray",
      },
      type: "bar",
    },
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
      // rotated: true,
      x: {
        type: "category",
        categories: categories,
      },
      y: {
        min: -range,
        max: +range,
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
    tooltip: {
      format: {
        title: function(idx) {
          return categories[idx] + " | " + names[categories[idx]];
        },
      },
      // show: true,
      // grouped: false,
      // format: {
      //     title: function(x) { return "Data " + x; },
      //     name: function(name, ratio, id, index) { return name; },
      //     value: function(value, ratio, id, index) { return ratio; }
      // },
      // position: function(data, width, height, element) {
      //     return {top: 0, left: 0}
      // },
      // contents: function(d, defaultTitleFormat, defaultValueFormat, color) {
      //     return ... // formatted html as you want
      // },
      // // sort tooltip data value display in ascending order
      // order: "asc",
      // // specifying sort function
      // order: function(a, b) {
      //    // param data passed format
      //    {x: 5, value: 250, id: "data1", index: 5, name: "data1"}
      //      ...
      //}
    },
  });
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
    .data(percentages)
    .enter()
    .append("div")
    .classed("tile", true)
    .attr("title", d => names[d.base])
    .style("background-color", function(d) {
      return color(Math.max(-10, Math.min(10, d.sum)));
    })
    .attr("ccy", function(d) {
      return d.base;
    })
    .html(function(d) {
      return "<span class='ccy'>" + d.base + "</span><span class='sum'>" + d.sum.toFixed(2) + "</span>";
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
};

var loadData = function(enabled) {
  var today = DateTime.fromISO(
      DateTime.utc()
        .plus({ hours: 2, minutes: 6 })
        .toISODate()
    ),
    dt = today;

  try {
    dt = DateTime.fromISO(document.location.href.match(/day=(\d{4}-\d{2}-\d{2})/)[1]);
  } catch (e) {
    document.location.href = "?day=" + today.toISODate();
    return;
  }

  if (dt.toISODate() == today.toISODate()) {
    window.runCheckTime = true;
  } else {
    document.getElementById("jumpToCurrentDay").href = "?day=" + today.toISODate();
    $("#subNavi").show();
  }

  if (dt > DateTime.fromISO("2018-01-30")) {
    document.getElementById("prev").href = "?day=" + dt.plus({ days: -1 }).toISODate();
  }

  document.getElementById("date").innerText = dt.toISODate();

  if (dt < today) {
    document.getElementById("next").href = "?day=" + dt.plus({ days: +1 }).toISODate();
  }

  var day = dt;
  $("title").text("FX Change " + day.toISODate());
/*
  disqus_config = function() {
    this.page.shortname = "fx-tools";
    this.page.identifier = "change-" + day.toISODate();
    //this.page.url = "https://fxtools.github.io/change/cumulative.html?day=" + day.toISODate();
    this.page.title = $("title").text();
    this.page.category_id = "change";
  };
  //$("head").append($("<script src='https://fx-tools.disqus.com/embed.js' data-timestamp=" + new Date() + "></script>"));
*/
        var disqus_identifier = "change-" + day.toISODate();
        var disqus_title = $("title").text();
        //var disqus_url = "https://fxtools.github.io/change/cumulative.html?day=" + day.toISODate();

        var dsq = document.createElement('script');
          dsq.type = 'text/javascript';
          dsq.async = true;
          dsq.src = 'https://fx-tools.disqus.com/embed.js';
        document.getElementsByTagName('head')[0].appendChild(dsq);

  var uri = "https://raw.githubusercontent.com/fxtools/quote_percentages/master/" + dt.year + "/" + dt.toISODate() + "/";

  var uriA = uri + "asian%20session.tsv?" + Date.now();
  var uriB = uri + "european%20session.tsv?" + Date.now();
  var uriC = uri + "north%20american%20session.tsv?" + Date.now();

  window.sessions = {
    asia: { raw: {}, filtered: [] },
    europe: { raw: {}, filtered: [] },
    america: { raw: {}, filtered: [] },
  };

  // $.getJSON("names.json", function(json) {
  //   w(json);
  // });

  $.when($.getJSON("names.json"), getFailSafe(uriA), getFailSafe(uriB), getFailSafe(uriC)).done(function(namesObj, asia, europe, america) {
    window.names = namesObj[0];

    $(".show").each(function(idx, obj, c) {
      $(this)
        .parent()
        .attr("title", names[obj.id]);
    });

    if (asia == null && europe == null && america == null) {
      $("#container-nodata").show();
    } else {
      $("#container-nodata").hide();

      window.sessions.hasAsia = asia != null;
      window.sessions.hasEurope = europe != null;
      window.sessions.hasAmerica = america != null;

      if (asia != null) {
        window.sessions.asia.raw = precalcMatrix(asia);
        window.sessions.asia.filtered = filterAndSort(enabled, window.sessions.asia.raw);

        redraw("asia", window.sessions.asia.filtered);

        $("#container-asia").show();
      }

      if (europe != null) {
        window.sessions.europe.raw = precalcMatrix(europe);
        window.sessions.europe.filtered = filterAndSort(enabled, window.sessions.europe.raw);
        redraw("europe", window.sessions.europe.filtered);

        $("#heading-asia").show();
        $("#container-europe").show();
      }

      if (america != null) {
        window.sessions.america.raw = precalcMatrix(america);
        window.sessions.america.filtered = filterAndSort(enabled, window.sessions.america.raw);
        redraw("america", window.sessions.america.filtered);

        $("#heading-asia").show();
        $("#container-america").show();
      }

      genChart();
    }
  });
};

var onFilterUpdate = function() {
  writeFilter();
  var enabled = readFilter();

  window.sessions.asia.filtered = filterAndSort(enabled, window.sessions.asia.raw);
  redraw("asia", window.sessions.asia.filtered);

  window.sessions.europe.filtered = filterAndSort(enabled, window.sessions.europe.raw);
  redraw("europe", window.sessions.europe.filtered);

  window.sessions.america.filtered = filterAndSort(enabled, window.sessions.america.raw);
  redraw("america", window.sessions.america.filtered);
};

d3.selectAll("input.show").on("click", onFilterUpdate);

var update = function() {
  var enabled = readFilter();

  loadData(enabled);
};

$("#filter a").on("click", function(d, a, b) {
  var region = this.id.substring(7);

  var pairs = [];
  if (region == "all") {
    $(".show").prop("checked", true);
    onFilterUpdate();
    return;
  } else if (region == "none") {
    pairs = ["EUR", "USD"];
  } else if (region == "asia") {
    pairs = ["JPY", "AUD", "NZD", "CNY", "CNH", "HKD", "SGD", "KRW", "PHP", "TWD", "INR", "THB", "MYR", "IDR", "RUB"];
  } else if (region == "amer") {
    pairs = ["USD", "CAD", "MXN", "BRL", "CLP", "COP", "PEN", "ARS", "BHD"];
  } else if (region == "emea") {
    pairs = ["EUR", "GBP", "CHF", "SEK", "NOK", "TRY", "ZAR", "DKK", "PLN", "HUF", "SAR", "CZK", "ILS", "RON", "BGN", "BHD"];
  }

  $(".show").prop("checked", false);
  $(pairs.map(n => "#" + n).join(",")).prop("checked", true);
  onFilterUpdate();
});

$("#filter th").on("click", function(d, a, b) {
  if (d.target.tagName.toUpperCase() == "A") {
    return;
  }
  var name = this.id + "[]";
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
    var minutes = Math.ceil(i.minutes);

    if (minutes >= 10) {
      old.innerText = "Data is " + Math.ceil(i.minutes) + " minutes old";
    }

    if (Math.ceil(i.minutes) >= 7) {
      update();
      old.innerText = "";
    }
  }
};

var nextTick = function() {
    return 60000 - new Date() % 60000;
  },
  checkTimeLoop = function() {
    checkTime(DateTime.local().toISO());
    setTimeout(checkTimeLoop, nextTick());
  };

// $("section").on("click", function() {
//   if ($(this)[0].id != "filter") {
//     $("#filter").hide();
//   }
// });

$("#settings").on("click", function() {
  if ($("#filter:visible").length > 0) {
    $("#filter").hide();
  } else {
    $("#filter").show();
  }
  //onclick="var el = document.getElementById('filter'); el.classList.contains('hide') ? el.classList.remove('hide') : el.classList.add('hide');"
});

update();
setTimeout(checkTimeLoop, nextTick());
