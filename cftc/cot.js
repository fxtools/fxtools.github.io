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

var formatNumber = function(value) {
  var format = "k",
    abbr = "";

  switch (format) {
    case "b":
      value = Math.round(value / 1000 / 1000 / 1000);
      abbr = "b";
      break;
    case "m":
      value = Math.round(value / 1000 / 1000);
      abbr = "m";
      break;
    case "k":
      value = Math.round(value / 1000);
      abbr = "k";
      break;
  }

  // return value == 0 ? "" : value.toLocaleString() + abbr;
  return value.toLocaleString() + abbr;
};

var matchSymbol = function(symbol) {
  symbol = symbol.toUpperCase();
  switch (symbol) {
    default:
      return symbol;
    case "EUR":
      return "EURO FX";
    case "JPY":
      return "JAPANESE YEN";
    case "GBP":
      return "BRITISH POUND STERLING";
    case "AUD":
      return "AUSTRALIAN DOLLAR";
    case "CHF":
      return "SWISS FRANC";
    case "CAD":
      return "CANADIAN DOLLAR";
    case "NZD":
      return "NEW ZEALAND DOLLAR";
    case "DX":
      return "U.S. DOLLAR INDEX";
  }
};

// ******************************************* //
// ******************************************* //
// ******************************************* //

var calcMinMaxAndColors = function(report) {
  var report = window.currentReport;

  // { cot: {}, tff: {}, merged: {} }

  // initialize result data structure
  var colors = {},
    widths = {},
    minMaxMatrix = {},
    visibilities = ["cot", "tff", "merged"],
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
                // if merged
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
    widths[visibility] = {};
    spreadings.forEach(function(spreading) {
      colors[visibility][spreading] = {};
      widths[visibility][spreading] = {};

      report.reportTypes.forEach(function(reportType) {
        colors[visibility][spreading][reportType] = {};
        widths[visibility][spreading][reportType] = {};

        report.rows.forEach(function(row) {
          var mm = minMaxMatrix[visibility][spreading][reportType][row];

          var color = d3
            .scaleLinear()
            .domain([Math.max(0, Math.max(mm.max, -1 * mm.min)), 0, Math.min(0, Math.min(-1 * mm.max, mm.min))])
            // .range(["green", "white", "red"]);
            .range(["green", "rgb(150, 150, 150)", "red"]);

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
      d.innerText = formatNumber(value);
    }
  });
};

var colorize = function(visibility, spreading, reportType, row) {
  var color = reportType == "options" ? window.currentColors[visibility][spreading]["futures"][row] : window.currentColors[visibility][spreading][reportType][row];
  var withoutSpreading = spreading == "without-spreading";
  var cells = $("#" + reportType + "_" + row + " td");

  cells.each(function(i, d) {
    var value = +(withoutSpreading && d.hasAttribute("gross") ? d.getAttribute("gross") : d.getAttribute("value"));

    // $(this).css("background", "radial-gradient(ellipse, " + color(value) + " 5%, transparent 100%");
    $(this).css("color", color(value));
    // .css("color", "white");
    // .css("color", color(value));
    //.css("text-shadow", "0 0 3px " + color(value) + ", 0 0 3px " + color(value))
    // .addClass(",d");
  });
};

var calculateReport = function(rawReport) {
  var rows = ["positions", "changes", "percentages", "traders"],
    reportTypes = ["futures", "combined", "options"],
    opponents = ["com", "noncom", "nonrep", "dealer", "manager", "funds", "other"],
    valueNames = ["net", "long", "short", "spreading"];

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
          report[row][opponent][rawReport.key].net = report[row][opponent][rawReport.key].long - report[row][opponent][rawReport.key].short;
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
        var long = report[row][opponent]["combined"].long - report[row][opponent]["futures"].long;
        var short = report[row][opponent]["combined"].short - report[row][opponent]["futures"].short;

        report[row][opponent]["options"] = {
          net: long - short,
          long: long,
          short: short,
          // spreading: report[row][opponent]["combined"].spreading - report[row][opponent]["futures"].spreading,
          grossLong: report[row][opponent]["combined"].grossLong - report[row][opponent]["futures"].grossLong,
          grossShort: report[row][opponent]["combined"].grossShort - report[row][opponent]["futures"].grossShort,
        };
      } else if (row == "percentages") {
        var total = report.oi.total.options;
        var positions = report["positions"][opponent]["options"];
        report[row][opponent]["options"] = {};

        report[row][opponent]["options"].net = 0;

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

  try {
    gtag("event", "cot: " + report.name, {
      event_category: day.toISODate(),
      event_label: window.user,
    });
  } catch (e) {}

  $("#name").text(report.name);
  $("#date").text(DateTime.fromISO(report.date).toLocaleString(DateTime.DATE_HUGE));

  // set report headers
  Object.keys(report.oi).forEach(function(key) {
    Object.keys(report.oi[key]).forEach(function(reportType) {
      $("#" + reportType + "_oi_" + key).text(formatNumber(report.oi[key][reportType]));
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
            $(id)
              .attr("value", value)
              .text(formatNumber(value));
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
        row.name = name;
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
    var symbol = $("#symbol").val();
    try {
      var rawReport = window.reports.where(r => r.key.indexOf(symbol) != -1).first().value;
    } catch (e) {
      var rawReport = window.reports.where(r => r.key.indexOf("EURO FX") != -1).first().value;
    }

    window.currentReport = calculateReport(rawReport);
    drawReport();
    showHide();
    window.currentReport.reportTypes.forEach(function(reportType) {
      // window.currentReport.rows.forEach(function(row) {
      //["positions", "changes"].forEach(function(row) {
      ["changes"].forEach(function(row) {
        colorize("tff", "without-spreading", reportType, row);
      });
    });
  };

  // ############################
  // ############################
  // ############################
  this.showHide = function() {
    $("#selected-report-type").text($("#report").val());
    $("#selected-columns").text($("#columns").val());

    var showCot = $("#report").val() != "financial";
    var showTff = $("#report").val() != "legacy";
    var showNet = $("#columns").val() == "net";

    var showSpreading = $("#columns").val() == "long & short & spreading";

    var opponents = 0;
    var columns = 0;
    var columnsSpreadingMalus = 0;

    // // hide all
    $("table > tbody > tr > *").hide();

    // show first column
    $("table > tbody > tr > th:first-child").show();

    // hide rows
    // $("tr[id$=_percentages]").hide();
    // $("tr[id$=_traders]").hide();

    // $("th.total").show();
    // $("#futures_oi_total").show();
    // $("#futures_oi_changes").show();
    // $("#options_oi_total").show();
    // $("#options_oi_changes").show();
    // $("#combined_oi_total").show();
    // $("#combined_oi_changes").show();

    // show opponents
    if (showCot) {
      $("th.cot").show();
      opponents += 2;
    }
    if (showTff) {
      $("th.tff").show();
      opponents += 4;
    }
    $("th.merged").show();

    opponents += 1;

    if (showNet) {
      $("#column_headers").hide();
      if (showCot) {
        $("th.cot:contains('net')").show();
        $("td.cot[id$=net]").show();
      }
      if (showTff) {
        $("th.tff:contains('net')").show();
        $("td.tff[id$=net]").show();
      }
      $("th.merged:contains('net')").show();
      $("td.merged[id$=net]").show();

      columns++;
    } else {
      $("#column_headers").show();
      $("th:contains('net')").hide();
      if (showCot) {
        $("th.cot:contains('long')").show();
        $("td.cot[id$=long]").show();
        $("th.cot:contains('short')").show();
        $("td.cot[id$=short]").show();
      }
      if (showTff) {
        $("th.tff:contains('long')").show();
        $("td.tff[id$=long]").show();
        $("th.tff:contains('short')").show();
        $("td.tff[id$=short]").show();
      }
      $("th.merged:contains('long')").show();
      $("td.merged[id$=long]").show();
      $("th.merged:contains('short')").show();
      $("td.merged[id$=short]").show();

      columns++;
      columns++;

      if (showSpreading) {
        if (showCot) {
          $("th.cot:contains('sprd')").show();
          $("td.cot[id$=spreading]").show();
          columnsSpreadingMalus++;
        }
        if (showTff) {
          $("th.tff:contains('sprd')").show();
          $("td.tff[id$=spreading]").show();
        }
        $("th.merged:contains('sprd')").show();
        $("td.merged[id$=spreading]").show();

        columns++;
        columnsSpreadingMalus++;
      } else {
        $("th:contains('sprd')").hide();
        $("td[id$=spreading]").hide();
      }
    }

    var allColumns = opponents * columns - columnsSpreadingMalus;

    $(".shrink").attr("colspan", columns);
    $(".shrink.no-spreading").attr("colspan", columns - (showSpreading ? 1 : 0));
    //$(".report_type_caption").attr("colspan", 1 + allColumns);

    $("#opponents_names *").css("min-width", 0);
    $("#column_headers *").css("min-width", 0);
    if (showNet) {
      $("#opponents_names *").css("white-space", "nowrap");
    }
    var colHeaders = showNet ? $("#opponents_names *") : $("#column_headers *");
    var maxWidth = Math.max.apply(
      Math,
      colHeaders
        .map(function() {
          return $(this).width();
        })
        .get()
    );
    colHeaders.css("min-width", maxWidth);
  };

  this.next = function() {
    var names = window.reports.select(r => r.key).forEach(function(name, i) {
      $("#symbol").append(
        $("<option>", {
          value: name,
          text: name,
        })
      );
    });

    $("#columns, #report, #symbol").on("input", function() {
      localStorage.setItem("settings_report", $("#report").val());
      localStorage.setItem("settings_columns", $("#columns").val());
      localStorage.setItem("settings_symbol", $("#symbol").val());

      showHide();
    });

    // settings: report type
    var matchRep = document.location.href.match(/rep(?:ort){0,1}=(financial|legacy|merged)/);
    if (matchRep) {
      localStorage.setItem("settings_report", matchRep[1]);
    }
    if (localStorage.getItem("settings_report")) {
      $("#report").val(localStorage.getItem("settings_report"));
    } else {
      $("#report").val("financial");
    }

    // settings: columns
    var matchCol = document.location.href.match(/col(?:umn){0,1}=(n|ls+)/);
    if (matchCol) {
      var col = "net";
      switch (matchCol[1]) {
        case "ls":
          col = "long & short";
          break;
        case "lss":
          col = "long & short & spreading";
          break;
      }
      localStorage.setItem("settings_columns", col);
    }
    if (localStorage.getItem("settings_columns")) {
      $("#columns").val(localStorage.getItem("settings_columns"));
    } else {
      $("#columns").val("net");
    }

    // settings: symbol
    var matchSym = document.location.href.match(/sym(?:bol){0,1}=(\w{2,3})/);
    if (matchSym) {
      localStorage.setItem("settings_symbol", matchSymbol(matchSym[1]));
    }
    if (localStorage.getItem("settings_symbol")) {
      $("#symbol").val(localStorage.getItem("settings_symbol"));
    } else {
      $("#symbol").val("EURO FX");
    }

    drawSelectedSymbol();

    // ############################
    // ############################
    // ############################

    $("#symbol").on("input", function() {
      drawSelectedSymbol();
    });

    $(".symbol").on("click", function() {
      $("#symbol")
        .val(matchSymbol($(this).text()))
        .trigger("input");
    });

    $(".report").on("click", function() {
      $("#report")
        .val($(this).text())
        .trigger("input");
    });

    $(".columns").on("click", function() {
      $("#columns")
        .val($(this).text())
        .trigger("input");
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

  if (!knownDays.singleOrDefault(d => d.equals(day))) {
    day = knownDays.last();
  }

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

    var weeksOld = Math.floor(today.diff(day, "weeks").toObject().weeks);
    var oldReportText = weeksOld == 1 ? "This report is from last week." : "This report is " + weeksOld + " weeks old.";

    $("#jumpToCurrentDay")
      .attr("href", "?day=" + knownDays.last().toISODate())
      .text(oldReportText + " Click here for latest report.")
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

$("#cogs").on("click", function() {
  if ($("#settings:visible").length > 0) {
    $("#settings").hide();
  } else {
    $("#settings").show();
  }
});

$("td[id*=_positions_]").attr("title", "position");
$("td[id*=_changes_]").attr("title", "change");
$(".spreading").attr("title", "spreading");
