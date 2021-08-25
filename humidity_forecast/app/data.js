function submitPostcode(form) {
  var postCode = document.getElementById("postcodeInput").value;
  getForecast(postCode)
  // console.log(form)
  // d3.json("https://raw.githubusercontent.com/stanton119/Humidity-Calculator/humidity_forecast/humidity_forecast/weather_data2.json", function (data) {
  //   console.log(data)
  //   traces = processData(data)
  //   adjustPlot(traces)
  // });
}

function getForecast(postcode) {
  // format postcode
  url = "https://weather-broker-cdn.api.bbci.co.uk/en/forecast/aggregated/" + postcode
  d3.json(url, function (data) {
    console.log(data)
    processedData = processBBCWeather(data)
    console.log(processedData)
    processedData = addInsideHumidity(processedData)
    console.log(processedData)

    traces = createTraces(processedData)
    adjustPlot(traces)
  });
}

function processBBCWeather(data) {
  return processForcasts(data['forecasts'])
}

function processForcasts(forecasts) {
  var list = []
  for (var key in forecasts) {
    result = processReports(forecasts[key]["detailed"]["reports"])
    list = list.concat(result)
  }
  return list
}

function processReports(reports) {
  reportOutput = []
  reports.forEach(function (report) {
    var date = new Date(report['localDate'])
    date.setHours(Number(report['timeslot'].substring(0, 2)))

    reportOutput.push({ date: date, outside_humidity: report['humidity'], outside_temp: report['temperatureC'] })
  })
  return reportOutput
}

function convertToTraces() {

}

function saturatePressure(temp) {
  var pressure = 6.122 * Math.exp(17.62 * temp / (243.12 + temp))
  return pressure
}

function getInsideHumidity(outside_temp, outside_humidity, inside_temp) {
  inside_temp = 21
  return (
    (inside_temp + 273)
    * outside_humidity
    * saturatePressure(outside_temp)
    / ((outside_temp + 273) * saturatePressure(inside_temp))
  )
}

function addInsideHumidity(data) {
  data.forEach(function (element) {
    element['inside_humidity'] = getInsideHumidity(element['outside_temp'], element['outside_humidity'], element['inside_temp'])
  })
  return data
}

function createTraces(data) {
  dateList = listFromDicts(data, 'date')

  traceInHum = createTrace(dateList, listFromDicts(data, 'inside_humidity'), 'Inside humidity')
  traceOutHum = createTrace(dateList, listFromDicts(data, 'outside_humidity'), 'Outside humidity')
  traceOutTemp = createTrace(dateList, listFromDicts(data, 'outside_temp'), 'Outside temperature')

  traces = [traceInHum, traceOutHum, traceOutTemp]
  return traces
}

function listFromDicts(data, key) {
  var list = []
  data.forEach(function (element) {
    list.push(element[key])
  })
  return list
}

function processData(data) {
  dateInts = dictToList(data['date'])
  dateObjs = convertToDate(dateInts)

  traceInHum = createTrace(dateObjs, dictToList(data['inside_humidity']), 'Inside humidity')
  traceOutHum = createTrace(dateObjs, dictToList(data['outside_humidity']), 'Outside humidity')
  traceOutTemp = createTrace(dateObjs, dictToList(data['outside_temp']), 'Outside temperature')

  traces = [traceInHum, traceOutHum, traceOutTemp]
  return traces
}

function dictToList(dict) {
  list = []
  for (var key in dict) {
    list.push(dict[key]);
  }
  return list
}

function convertToDate(dateInts) {
  dateObjs = []
  dateInts.forEach(function (dateInt) {
    date = new Date(dateInt)
    dateObjs.push(date)
  })
  return dateObjs
}

function createTrace(x, y, name) {
  var trace = {
    type: "scatter",
    mode: "lines",
    name: name,
    x: x,
    y: y,
  }
  return trace
}

function createPlot(traces) {
  var layout = {
    title: plotTitle,
  };

  Plotly.newPlot(plotDiv, plotData, layout);
}

function updatePlotData(traces) {
  plotData.length = 0
  traces.forEach(element => {
    plotData.push(element)
  });
}

function adjustPlot(traces) {
  updatePlotData(traces)
  Plotly.redraw(plotDiv);
}

const plotDiv = 'plotDiv'
const plotTitle = 'Humidity Forecast'
var plotData = []

d3.json("https://raw.githubusercontent.com/stanton119/Humidity-Calculator/humidity_forecast/humidity_forecast/weather_data.json", function (data) {
  traces = processData(data)
  updatePlotData(traces)
  createPlot(traces)
});
