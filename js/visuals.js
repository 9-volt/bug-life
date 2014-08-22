$(function(){
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
    console.log(data)
    this.showStackedArea(data)
    this.showSemiCrircles(data)
  }

  Visuals.prototype.showStackedArea = function(data) {
    // Bootstrap stacked area object
    var processedData = bootstrapStackedAreaObject(data)

    // Add time-values to each issue
    fillTimeValues(processedData, data)

    // Object to Array
    var processedDataArray = []
    for (var p in processedData) {
      processedDataArray.push(processedData[p])
    }

    drawStackedArea(processedDataArray)
  }

  function bootstrapStackedAreaObject(data) {
    var datesMilisecondsRange = {}
      , start = dateToTimestamp(data.created_at)
      , today = dateToTimestamp(null)

    // Fill dates range
    while (start < today) {
      datesMilisecondsRange[start] = 0
      start += 86400 * 1000
    }

    var processedData = {}
      , label
      , i

    // Add all labels
    for (i in data.labels) {
      label = data.labels[i]

      processedData[label.name] = {key: label.name, values: [], time: Object.create(datesMilisecondsRange), color: '#' + label.color}
    }

    // Add no label
    processedData['no label'] = {key: 'no label', values: [], time: Object.create(datesMilisecondsRange), color: '#ccc'}

    return processedData
  }

  function fillTimeValues(processedData, data) {
    var i
      , issue
      , l
      , label
      , o
      , open
      , d
      , from
      , to

    // Go throuch all issues
    for (i in data.issues) {
      issue = data.issues[i]

      // If issue has no labels than assign 'no label' label
      if (issue.labels.length === 0) {
        issue.labels.push({
          color: '#ccc'
        , name: 'no label'
        , url: null
        })
      }

      // For each label
      for (l in issue.labels) {
        label = issue.labels[l]

        // For each open range
        for (o in issue.open) {
          open = issue.open[o]

          from = dateToTimestamp(open.from)
          to = dateToTimestamp(open.to)

          // Fill label time-value object
          while(from < to) {
            processedData[label.name].time[from] += 1
            from += 86400 * 1000 // 3600 * 24 * 1000
          }
        }
      }
    }

    var p
      , _data
      , t

    for (p in processedData) {
      _data = processedData[p]

      // Add tuples of timeKey-value to values array
      for (t in _data.time) {
        _data.values.push([+t, _data.time[t]])
      }

      // Sort values by timeKey
      _data.values.sort(function(a, b){
        return a[0] - b[0]
      })

      // Get rid of time array
      delete _data.time
    }
  }

  function drawStackedArea(processedDataArray) {
    nv.addGraph(function() {
      var chart = nv.models.stackedAreaChart()
        .margin({right: 100})
        .x(function(d) { return d[0] })
        .y(function(d) { return d[1] })
        .useInteractiveGuideline(true)    // Tooltips which show all data points
        .rightAlignYAxis(true)            // Let's move the y-axis to the right side.
        .transitionDuration(500)
        .showControls(false)              // Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
        .clipEdge(true)
        // .showLegend(false)
        // .showXAxis(false)                 // Show X Axis (dates)

      //Format x-axis labels with custom function.
      chart.xAxis.tickFormat(function(d) {
        return d3.time.format('%x')(new Date(d))
      });

      chart.yAxis.tickFormat(d3.format(',.2f'));

      d3.select('#stackedArea svg')
        .datum(processedDataArray)
        .call(chart);

      nv.utils.windowResize(chart.update);

      return chart;
    });
  }

  function dateToDays(str) {
    return dateToTimestamp(str) / 86400000
  }

  Visuals.prototype.showSemiCrircles = function(data) {
    var svg = d3.select('#semiCircles svg')
      , width = svg[0][0].offsetWidth
      , start = dateToDays(data.created_at)
      , today = dateToDays(null)
      , scale = d3.scale.linear().domain([start, today]).range([0, width])
      , scaleRadius = d3.scale.linear().domain([0, today - start]).range([0, width])

    console.log(start, today)

    // return

    svg
      .selectAll("circle")
      .data(data.issues)
      .enter()
      .append('circle')
      .attr("cy", function (d) {return 0})
      .attr("cx", function (d) {
        var from = dateToDays(d.open[0].from)
          , closed_at = d.open[d.open.length - 1].to
          , to = dateToDays(closed_at)

        console.log((to + from)/2, scale((to + from)/2))
        if (closed_at !== null) {
          return scale((to + from)/2)
        } else {
          // Make it quater of the circle with today as center
          return scale(to)
        }
        // return parseInt(Math.random() * 100)
      })
      .attr("r", function (d) {
        var from = dateToDays(d.open[0].from)
          , closed_at = d.open[d.open.length - 1].to
          , to = dateToDays(closed_at)

        // console.log(from, to, to - from, scaleRadius(to - from)/2)
        if (closed_at !== null) {
          return scaleRadius(to - from) / 2
        } else {
          // Make it quater of the circle if it is still open
          return scaleRadius(to - from)
        }
      })
      .style("fill", function(d) {return 'none'})
      .style('stroke', function(d) {
        colors = ['red', 'green', 'blue', 'yellow']
        return colors[Math.ceil(Math.random() * colors.length)]
      })
      .style('stroke-width', function(d) {
        return 1
        colors = ['red', 'green', 'blue', 'yellow']
        return colors[Math.ceil(Math.random() * colors.length)]
      })
  }

  window.Visuals = Visuals
})
