// Construstor
var Visuals = function(selector) {
  this.init(selector)
}

/**
 * Init visuals. One time call
 * @param  {String} selector
 */
Visuals.prototype.init = function(selector) {

}

Visuals.prototype.showLoading = function() {
  console.log('Visual Loading')
}

Visuals.prototype.showError = function(message) {
  console.log('Visual Error', message)
}

/**
 * Transforms a date of type YYYY-MM-DD into timestamp
 * @param  {String} str
 * @return {Integer}     timestamp
 */
function dateToTimestamp(str) {
  if (str == null) {
    // Today
    return Date.now() - (Date.now() % 86400000)
  } else {
    var d = str.match(/\d+/g)
    return Date.UTC(d[0], d[1] - 1, d[2])
  }
}

Visuals.prototype.showData = function(data) {
  // console.log('Visual Data is', data)

  var datesMilisecondsRange = {}
    , start = dateToTimestamp(data.created_at)
    , today = dateToTimestamp(null)

  // Fill dates range
  while (start < today) {
    datesMilisecondsRange[start] = 0
    start += 86400 * 1000
  }

  var processedData = {}

  var label
  for (var i in data.labels) {
    label = data.labels[i]

    processedData[label.name] = {key: label.name, values: [], time: Object.create(datesMilisecondsRange)}
  }
  // Add no label
  processedData['no label'] = {key: 'no label', values: [], time: Object.create(datesMilisecondsRange)}

  var issue, l, label, o, open, d, from, to
  for (var j in data.issues) {
    issue = data.issues[j]

    if (issue.labels.length === 0) {
      issue.labels.push({
        color: '#ccc'
      , name: 'no label'
      , url: null
      })
    }

    for (l in issue.labels) {
      label = issue.labels[l]

      for (o in issue.open) {
        open = issue.open[o]

        from = dateToTimestamp(open.from)
        to = dateToTimestamp(open.to)

        while(from < to) {
          processedData[label.name].time[from] += 1
          from += 86400 * 1000 // 3600 * 24 * 1000
        }
      }
    }
  }

  var _data, t
  for (var p in processedData) {
    _data = processedData[p]

    for (t in _data.time) {
      _data.values.push([+t, _data.time[t]])
    }

    _data.values.sort(function(a, b){
      return a[0] - b[0]
    })
  }

  // Object to Array
  var processedDataArray = []
  for (var p in processedData) {
    delete processedData[p].time
    processedDataArray.push(processedData[p])
  }

  // console.log(processedDataArray)

  nv.addGraph(function() {
    var chart = nv.models.stackedAreaChart()
      .margin({right: 100})
      .x(function(d) { return d[0] })
      .y(function(d) { return d[1] })
      .useInteractiveGuideline(true)    // Tooltips which show all data points
      .rightAlignYAxis(true)            // Let's move the y-axis to the right side.
      .transitionDuration(500)
      .showControls(false)               //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
      .clipEdge(true);

    //Format x-axis labels with custom function.
    chart.xAxis.tickFormat(function(d) {
      return d3.time.format('%x')(new Date(d))
    });

    chart.yAxis.tickFormat(d3.format(',.2f'));

    d3.select('#chart svg')
      .datum(processedDataArray)
      .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
}
