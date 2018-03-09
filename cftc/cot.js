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

// ******************************************* //
// ******************************************* //
// ******************************************* //

var calcMinMaxAndColors = function(report) {
  var report = window.currentReport;

  // { cot: {}, tff: {}, both: {} }

  // initialize result data structure
  var colors = {},
    minMaxMatrix = {},
    visibilities = ["cot", "tff", "both"],
    spreadings = ["with-spreading", "without-spreading"];

  // maybe i should use an multi-dim-array to build a matrix? naaaa...

  var add = function(spreading, values, target) {
    if (spreading == "with-spreading") {
      target.max = Math.max(target.max, values.long, values.short, values.spreading);
      target.min = Math.min(target.min, values.long, values.short, values.spreading);
    } else if (spreading == "without-spreading") {
      target.max = Math.max(target.max, values.grossLong, values.grossShort);
      target.min = Math.min(target.min, values.grossLong, values.grossShort);
    }
  };

  // calc min / max
  visibilities.forEach(function(visibility) {
    minMaxMatrix[visibility] = {};

    spreadings.forEach(function(spreading) {
      minMaxMatrix[visibility][spreading] = {};

      report.reportTypes.forEach(function(reportType) {
        minMaxMatrix[visibility][spreading][reportType] = {};

        report.rows.forEach(function(row) {
          minMaxMatrix[visibility][spreading][reportType][row] = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };

          report.opponents.forEach(function(opponent) {
            var values = report[row][opponent][reportType];

            var target = reportType == "options" ? minMaxMatrix[visibility][spreading]["futures"][row] : minMaxMatrix[visibility][spreading][reportType][row];

            if (reportType == "options" && row == "traders") {
              // there is no traders-row in options-only-report
            } else {
              if (visibility == "cot") {
                // only add noncom and com
                if (opponent == "noncom" || opponent == "com") {
                  add(spreading, values, target);
                }
              } else if (visibility == "tff") {
                if (opponent != "noncom" && opponent != "com") {
                  add(spreading, values, target);
                }
              } else {
                // if both
                add(spreading, values, target);
              }
            }
          });
        });
      });
    });
  });

  visibilities.forEach(function(visibility) {
    colors[visibility] = {};

    spreadings.forEach(function(spreading) {
      colors[visibility][spreading] = {};

      report.reportTypes.forEach(function(reportType) {
        colors[visibility][spreading][reportType] = {};

        report.rows.forEach(function(row) {
          var mm = minMaxMatrix[visibility][spreading][reportType][row];

          // colors[visibility][spreading][reportType][row] = d3
          //   .scaleLinear()
          //   // .domain([mm.max, mm.min])
          //   // .range(["green", "red"]);
          //   .domain([mm.max, 0, mm.min])
          //   .range(["green", "white", "red"]);
          // // .domain([mm.max, mm.max / 10, 0, mm.min / 10, mm.min])
          // // .range(["green", "lightgreen", "white", "lightcoral", "red"]);

          var color = d3
            .scaleLinear()
            .domain([Math.max(0, Math.max(mm.max, -1 * mm.min)), 0, Math.min(0, Math.min(-1 * mm.max, mm.min))])
            .range(["green", "white", "red"]);

          colors[visibility][spreading][reportType][row] = color;
        });
      });
    });
  });

  window.currentColors = colors;
};

var formatAllCells = function() {
  $("td[id][value]").each(function(i, d) {
    var withoutSpreading = $(".spreading:visible").length == 0;

    var value = +(withoutSpreading && d.hasAttribute("gross") ? d.getAttribute("gross") : d.getAttribute("value"));

    if (d.id.indexOf("percentages") != -1) {
      d.innerText = value.toFixed(1) + "%";
    } else {
      d.innerText = value.toLocaleString();
    }
  });
};

var colorize = function(visibility, spreading, reportType, row) {
  var color = reportType == "options" ? window.currentColors[visibility][spreading]["futures"][row] : window.currentColors[visibility][spreading][reportType][row];
  var withoutSpreading = spreading == "without-spreading";
  var cells = $("#" + reportType + "_" + row + " td");

  cells.each(function(i, d) {
    var value = +(withoutSpreading && d.hasAttribute("gross") ? d.getAttribute("gross") : d.getAttribute("value"));
    $(this)
      .css("background", color(value))
      .addClass(",d");
  });
};

// ******************************************* //
// ******************************************* //
// ******************************************* //

var showHideVisibility = function(visibility) {
  if (visibility == "cot") {
    $(".cot").show();
    $(".tff").hide();
    $(".report_type_caption").attr("colspan", 10);
  } else if (visibility == "tff") {
    $(".cot").hide();
    $(".tff").show();
    $(".report_type_caption").attr("colspan", 18);
  } else if (visibility == "both") {
    $(".report_type_caption").attr("colspan", 25);
    $(".cot").show();
    $(".tff").show();
  }
};

$("#no-spreading").on("click", function() {
  var cot = $("#futures_positions_noncom_long:visible").length > 0;
  var tff = $("#futures_positions_dealer_long:visible").length > 0;
  var visibility = cot && tff ? "both" : cot ? "cot" : "tff";

  var cells = $("td[id$='_spreading'],.spreading");
  var ths = $("th.shrink");

  if (ths.attr("colspan") == 3) {
    cells.hide();
    ths.attr("colspan", 2);
    $("td[gross]").each((i, d) => $(d).text(d.getAttribute("gross")));
    $("#combined_report").hide();
    $("#options_only_report").show();
    if (visibility == "tff") {
      $("td.cot[id$='_spreading'],.cot.spreading").hide();
    } else if (visibility == "cot") {
      $("td.tff[id$='_spreading'],.tff.spreading").hide();
    }
  } else {
    cells.show();
    ths.attr("colspan", 3);
    $("td[gross]").each((i, d) => $(d).text(d.getAttribute("value")));
    $("#combined_report").show();
    $("#options_only_report").hide();
    if (visibility == "tff") {
      $("td.cot[id$='_spreading'],.cot.spreading").hide();
    } else if (visibility == "cot") {
      $("td.tff[id$='_spreading'],.tff.spreading").hide();
    }
  }

  formatAllCells();
});

$("#switch-report-types").on("click", function() {
  var cot = $("#futures_positions_noncom_long:visible").length > 0;
  var tff = $("#futures_positions_dealer_long:visible").length > 0;

  var visibility = cot && tff ? "both" : cot ? "cot" : "tff";

  if (visibility == "both") {
    visibility = "tff";
  } else if (visibility == "tff") {
    visibility = "cot";
  } else if (visibility == "cot") {
    visibility = "both";
  }

  showHideVisibility(visibility);
});

// ******************************************* //
// ******************************************* //
// ******************************************* //

var calculateReport = function(rawReport) {
  var rows = ["positions", "changes", "percentages", "traders"],
    reportTypes = ["futures", "combined", "options"],
    opponents = ["com", "noncom", "nonrep", "dealer", "manager", "funds", "other"],
    valueNames = ["long", "short", "spreading"];

  // ************************************************************************
  // data
  // ************************************************************************

  var report = {
    opponents: opponents,
    rows: rows,
    reportTypes: reportTypes,
    name: rawReport.cotFutures.name,
    date: rawReport.cotFutures.date,
    oi: {
      total: {
        futures: +rawReport.cotFutures.oi_total,
        combined: +rawReport.cotCombined.oi_total,
        options: rawReport.cotCombined.oi_total - rawReport.cotFutures.oi_total,
      },
      changes: {
        futures: +rawReport.cotFutures.oi_changes,
        combined: +rawReport.cotCombined.oi_changes,
        options: rawReport.cotCombined.oi_changes - rawReport.cotFutures.oi_changes,
      },
    },
  };

  var opponentToRawReports = function(opponent) {
    return opponent == "noncom" || opponent == "com" ? [{ key: "futures", value: rawReport.cotFutures }, { key: "combined", value: rawReport.cotCombined }] : [{ key: "futures", value: rawReport.tffFutures }, { key: "combined", value: rawReport.tffCombined }];
  };

  rows.forEach(function(row) {
    report[row] = {};

    opponents.forEach(function(opponent) {
      report[row][opponent] = {};

      opponentToRawReports(opponent).forEach(function(rawReport) {
        report[row][opponent][rawReport.key] = {};

        valueNames.forEach(function(valueName) {
          var key = row + "_" + opponent + "_" + valueName;
          var value = +rawReport.value[key];
          report[row][opponent][rawReport.key][valueName] = isNaN(value) ? 0 : value;
        });

        if (row == "positions" || row == "changes") {
          report[row][opponent][rawReport.key].grossLong = report[row][opponent][rawReport.key].long + report[row][opponent][rawReport.key].spreading;
          report[row][opponent][rawReport.key].grossShort = report[row][opponent][rawReport.key].short + report[row][opponent][rawReport.key].spreading;
        } else if (row == "percentages") {
          var total = report.oi.total[rawReport.key];
          var positions = report["positions"][opponent][rawReport.key];
          if (total == 0) {
            report[row][opponent][rawReport.key].grossLong = 0;
            report[row][opponent][rawReport.key].grossShort = 0;
          } else {
            report[row][opponent][rawReport.key].grossLong = +(positions.grossLong / total * 100).toFixed(1);
            report[row][opponent][rawReport.key].grossShort = +(positions.grossShort / total * 100).toFixed(1);
          }
        } else if (row == "traders") {
          report[row][opponent][rawReport.key].grossLong = Math.max(report[row][opponent][rawReport.key].long, report[row][opponent][rawReport.key].spreading);
          report[row][opponent][rawReport.key].grossShort = Math.max(report[row][opponent][rawReport.key].short, report[row][opponent][rawReport.key].spreading);
        }
      });

      // add options
      if (row == "positions" || row == "changes") {
        report[row][opponent]["options"] = {
          long: report[row][opponent]["combined"].long - report[row][opponent]["futures"].long,
          short: report[row][opponent]["combined"].short - report[row][opponent]["futures"].short,
          spreading: report[row][opponent]["combined"].spreading - report[row][opponent]["futures"].spreading,
          grossLong: report[row][opponent]["combined"].grossLong - report[row][opponent]["futures"].grossLong,
          grossShort: report[row][opponent]["combined"].grossShort - report[row][opponent]["futures"].grossShort,
        };
      } else if (row == "percentages") {
        var total = report.oi.total.options;
        var positions = report["positions"][opponent]["options"];
        report[row][opponent]["options"] = {};

        if (total == 0) {
          report[row][opponent]["options"].long = 0;
          report[row][opponent]["options"].short = 0;
          report[row][opponent]["options"].spreading = 0;
          report[row][opponent]["options"].grossShort = 0;
          report[row][opponent]["options"].grossLong = 0;
        } else {
          report[row][opponent]["options"].long = +(positions.long / total * 100).toFixed(1);
          report[row][opponent]["options"].short = +(positions.short / total * 100).toFixed(1);
          report[row][opponent]["options"].spreading = +(positions.spreading / total * 100).toFixed(1);
          report[row][opponent]["options"].grossShort = +(positions.grossShort / total * 100).toFixed(1);
          report[row][opponent]["options"].grossLong = +(positions.grossLong / total * 100).toFixed(1);
        }
      } else if (row == "traders") {
        // there are no traders for OptOnly
      }
    });
  });

  return report;
};

var drawReport = function() {
  var report = window.currentReport;

  $("#name").text(report.name);
  $("#date").text(DateTime.fromISO(report.date).toLocaleString(DateTime.DATE_HUGE));

  // set report headers
  Object.keys(report.oi).forEach(function(key) {
    Object.keys(report.oi[key]).forEach(function(reportType) {
      $("#" + reportType + "_oi_" + key).text(report.oi[key][reportType].toLocaleString());
    });
  });

  // set report values
  report.rows.forEach(function(row) {
    report.opponents.forEach(function(opponent) {
      Object.keys(report[row][opponent]).forEach(function(reportType) {
        Object.keys(report[row][opponent][reportType]).forEach(function(valueName) {
          var id = "#" + reportType + "_" + row + "_" + opponent + "_" + valueName;
          var value = report[row][opponent][reportType][valueName];
          if (valueName.indexOf("gross") != -1) {
            $(id.replace("gross", "").toLowerCase()).attr("gross", value);
          } else {
            $(id).attr("value", value);
            $(id).text(value.toLocaleString());
          }
        });
      });
    });
  });

  formatAllCells();
  calcMinMaxAndColors();
};

var loadReport = function(date) {
  var uri = "https://raw.githubusercontent.com/fxtools/cftc-cot/master/" + date.year + "/" + date.toISODate() + "/";
  $.when($.get(uri + "cot-futures.csv"), $.get(uri + "cot-combined.csv"), $.get(uri + "tff-futures.csv"), $.get(uri + "tff-combined.csv"), this).done(function(cotFutures, cotCombined, tffFutures, tffCombined, self) {
    var reports = {},
      cotHeader =
        'name,date1,date,CFTC_Code,exchanges,"CFTC_Code_1","CFTC_Code_2",oi_total,positions_noncom_long,positions_noncom_short,positions_noncom_spreading,positions_com_long,positions_com_short,positions_total_long,positions_total_short,positions_nonrep_long,positions_nonrep_short,oi_old_total,positions_old_noncom_long,positions_old_noncom_short,positions_old_noncom_spreading,positions_old_com_long,positions_old_com_short,positions_old_total_long,positions_old_total_short,positions_old_nonrep_long,positions_old_nonrep_short,oi_other_total,positions_other_noncom_long,positions_other_noncom_short,positions_other_noncom_spreading,positions_other_com_long,positions_other_com_short,positions_other_total_long,positions_other_total_short,positions_other_nonrep_long,positions_other_nonrep_short,oi_changes,changes_noncom_long,changes_noncom_short,changes_noncom_spreading,changes_com_long,changes_com_short,changes_total_long,changes_total_short,changes_nonrep_long,changes_nonrep_short,oi_percentages,percentages_noncom_long,percentages_noncom_short,percentages_noncom_spreading,percentages_com_long,percentages_com_short,percentages_percentages_long,percentages_percentages_short,percentages_nonrep_long,percentages_nonrep_short,oi_old_percentages,percentages_old_noncom_long,percentages_old_noncom_short,percentages_old_noncom_spreading,percentages_old_com_long,percentages_old_com_short,percentages_old_percentages_long,percentages_old_percentages_short,percentages_old_nonrep_long,percentages_old_nonrep_short,oi_other_percentages,percentages_other_noncom_long,percentages_other_noncom_short,percentages_other_noncom_spreading,percentages_other_com_long,percentages_other_com_short,percentages_other_percentages_long,percentages_other_percentages_short,percentages_other_nonrep_long,percentages_other_nonrep_short,oi_traders,traders_noncom_long,traders_noncom_short,traders_noncom_spreading,traders_com_long,traders_com_short,traders_traders_long,traders_traders_short,oi_old_traders,traders_old_noncom_long,traders_old_noncom_short,traders_old_noncom_spreading,traders_old_com_long,traders_old_com_short,traders_old_traders_long,traders_old_traders_short,oi_other_traders,traders_other_noncom_long,traders_other_noncom_short,traders_other_noncom_spreading,traders_other_com_long,traders_other_com_short,traders_other_traders_long,traders_other_traders_short,"Concentration-Gross LT =4 TDR-Long (All)","Concentration-Gross LT =4 TDR-Short (All)","Concentration-Gross LT =8 TDR-Long (All)","Concentration-Gross LT =8 TDR-Short (All)","Concentration-Net LT =4 TDR-Long (All)","Concentration-Net LT =4 TDR-Short (All)","Concentration-Net LT =8 TDR-Long (All)","Concentration-Net LT =8 TDR-Short (All)","Concentration-Gross LT =4 TDR-Long (Old)","Concentration-Gross LT =4 TDR-Short (Old)","Concentration-Gross LT =8 TDR-Long (Old)","Concentration-Gross LT =8 TDR-Short (Old)","Concentration-Net LT =4 TDR-Long (Old)","Concentration-Net LT =4 TDR-Short (Old)","Concentration-Net LT =8 TDR-Long (Old)","Concentration-Net LT =8 TDR-Short (Old)","Concentration-Gross LT =4 TDR-Long (Other)","Concentration-Gross LT =4 TDR-Short(Other)","Concentration-Gross LT =8 TDR-Long (Other)","Concentration-Gross LT =8 TDR-Short(Other)","Concentration-Net LT =4 TDR-Long (Other)","Concentration-Net LT =4 TDR-Short (Other)","Concentration-Net LT =8 TDR-Long (Other)","Concentration-Net LT =8 TDR-Short (Other)","Contract Units","CFTC Contract Market Code (Quotes)","CFTC Market Code in Initials (Quotes)","CFTC Commodity Code (Quotes)",END',
      tffHeader =
        'name,date1,date,CFTC_Code,exchanges,"CFTC_Code_1","CFTC_Code_2",oi_total,positions_dealer_long,positions_dealer_short,positions_dealer_spreading,positions_manager_long,positions_manager_short,positions_manager_spreading,positions_funds_long,positions_funds_short,positions_funds_spreading,positions_other_long,positions_other_short,positions_other_spreading,positions_total_long,positions_total_short,positions_nonrep_long,positions_nonrep_short,oi_changes,changes_dealer_long,changes_dealer_short,changes_dealer_spreading,changes_manager_long,changes_manager_short,changes_manager_spreading,changes_funds_long,changes_funds_short,changes_funds_spreading,changes_other_long,changes_other_short,changes_other_spreading,changes_total_long,changes_total_short,changes_nonrep_long,changes_nonrep_short,oi_total_percentages,percentages_dealer_long,percentages_dealer_short,percentages_dealer_spreading,percentages_manager_long,percentages_manager_short,percentages_manager_spreading,percentages_funds_long,percentages_funds_short,percentages_funds_spreading,percentages_other_long,percentages_other_short,percentages_other_spreading,percentages_total_long,percentages_total_short,percentages_nonrep_long,percentages_nonrep_short,total_traders,traders_dealer_long,traders_dealer_short,traders_dealer_spreading,traders_manager_long,traders_manager_short,traders_manager_spreading,traders_funds_long,traders_funds_short,traders_funds_spreading,traders_other_long,traders_other_short,traders_other_spreading,traders_total_long,traders_total_short,percentages_gross_held_by_4_or_less_long,percentages_gross_held_by_4_or_less_short,percentages_gross_held_by_8_or_less_long,percentages_gross_held_by_8_or_less_short,percentages_net_held_by_4_or_less_long,percentages_net_held_by_4_or_less_short,percentages_net_held_by_8_or_less_long,percentages_net_held_by_8_or_less_short,Contract_Units,"CFTC_Contract_Market_Code_Quotes","CFTC_Market_Code_Quotes","CFTC_Commodity_Code_Quotes","CFTC_SubGroup_Code","FutOnly_or_Combined",END';

    var addRow = function(type, row) {
      var name = $.trim(row.name),
        parts = name.split(" - "),
        exchange = parts[parts.length - 1];

      name = name.replace(" - " + exchange, "");

      if (name.length > 0) {
        if (!reports.hasOwnProperty(name)) {
          reports[name] = {};
        }
        reports[name][type] = row;
      }
    };

    d3.csvParse(cotHeader + "\r\n" + cotFutures, function(row) {
      addRow("cotFutures", row);
    });
    d3.csvParse(cotHeader + "\r\n" + cotCombined, function(row) {
      addRow("cotCombined", row);
    });
    d3.csvParse(tffHeader + "\r\n" + tffFutures, function(row) {
      addRow("tffFutures", row);
    });
    d3.csvParse(tffHeader + "\r\n" + tffCombined, function(row) {
      addRow("tffCombined", row);
    });

    window.reports = Enumerable.from(reports).where(r => r.value.cotCombined && r.value.cotFutures && r.value.tffCombined && r.value.tffFutures);

    self.next();
  });

  this.drawSelectedSymbol = function(symbol) {
    //var symbol = $("#symbol").val();
    try {
      var rawReport = window.reports.where(r => r.key.indexOf(symbol) != -1).first().value;
    } catch (e) {
      var rawReport = window.reports.where(r => r.key.indexOf("EURO FX") != -1).first().value;
    }

    window.currentReport = calculateReport(rawReport);
    drawReport();
    window.currentReport.reportTypes.forEach(function(reportType) {
      // window.currentReport.rows.forEach(function(row) {
      ["positions", "changes"].forEach(function(row) {
        colorize("tff", "without-spreading", reportType, row);
      });
    });
  };

  this.next = function(forex) {
    var symbol = localStorage.getItem("default-symbol");
    if (symbol == null) {
      symbol = "EURO FX";
      // defaultSymbol = "BITCOIN-USD";
      localStorage.setItem("default-symbol", symbol);
    }

    var names = window.reports.select(r => r.key).forEach(function(name, i) {
      $("#symbol").append(
        $("<option>", {
          value: name,
          text: name,
          selected: name == symbol,
        })
      );
    });

    $("#switch-report-types").click();
    $("#no-spreading").click();

    $("#switch-report-types").hide();
    $("#no-spreading").hide();

    drawSelectedSymbol(symbol);

    $("#symbol").on("input", function() {
      var symbol = $("#symbol").val();
      localStorage.setItem("default-symbol", symbol);
      drawSelectedSymbol(symbol);
      try {
        gtag("event", "changed symbol", {
          event_category: window.user,
          event_label: symbol,
        });
      } catch (e) {}
    });

    $(".symbol").on("click", function() {
      var name = "EURO FX",
        symbol = $(this).text();

      switch (symbol) {
        case "EUR":
          name = "EURO FX";
          break;
        case "JPY":
          name = "JAPANESE YEN";
          break;
        case "GBP":
          name = "BRITISH POUND STERLING";
          break;
        case "AUD":
          name = "AUSTRALIAN DOLLAR";
          break;
        case "CHF":
          name = "SWISS FRANC";
          break;
        case "CAD":
          name = "CANADIAN DOLLAR";
          break;
        case "NZD":
          name = "NEW ZEALAND DOLLAR";
          break;
        case "DX":
          name = "U.S. DOLLAR INDEX";
          break;
      }

      $("#symbol")
        .val(name)
        .trigger("input");

      try {
        gtag("event", "clicked symbol", {
          event_category: window.user,
          event_label: symbol,
        });
      } catch (e) {}
    });
  };
};

var today = DateTime.utc().plus({ hours: 2 }),
  day = today,
  knownDays = [];

try {
  day = DateTime.fromISO(document.location.href.match(/day=(\d{4}-\d{2}-\d{2})/)[1]);
} catch (e) {}

$.get("https://raw.githubusercontent.com/fxtools/cftc-cot/master/known-days.txt", function(data) {
  var knownDays = Enumerable.from(data.split("\n"))
    .where(d => d.length > 0)
    .select(d => DateTime.fromISO(d))
    .orderBy(d => d);

  var prev = knownDays.where(d => d < day).lastOrDefault();
  var next = knownDays.where(d => d > day).firstOrDefault();

  if (prev) {
    $("#prev")
      .attr("href", "?day=" + prev.toISODate())
      .show();
  }
  if (next) {
    $("#next")
      .attr("href", "?day=" + next.toISODate())
      .show();

    var weeksOld = Math.floor(today.diff(day, "weeks").toObject().weeks) - 1;
    var oldReportText = weeksOld == 1 ? "This report is from last week." : "This report is " + weeksOld + " weeks old.";

    $("#jumpToCurrentDay")
      .attr("href", "?day=" + knownDays.last().toISODate())
      .text(oldReportText + " Click here for the latest report.")
      .show();
    $("#subNavi").show();
  }

  disqus_config = function() {
    this.page.url = document.location.origin + document.location.pathname + "?day=" + dt.toISODate();
    this.page.identifier = "cot-" + dt.toISODate();
  };

  var d = document,
    s1 = d.createElement("script");
  s1.src = "//fx-tools.disqus.com/count.js";
  s1.setAttribute("data-timestamp", +new Date());
  s1.setAttribute("async", "async");
  d.body.appendChild(s1);

  $("#commentLink").on("click", function() {
    var s2 = d.createElement("script");
    s2.src = "//fx-tools.disqus.com/embed.js";
    s2.setAttribute("data-timestamp", +new Date());
    d.body.appendChild(s2);
    $(this).unbind("click");
  });

  loadReport(day);
});
