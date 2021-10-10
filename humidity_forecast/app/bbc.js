function getBBCForecast(postcode, plottingFcn) {
    var url = "https://weather-broker-cdn.api.bbci.co.uk/en/forecast/aggregated/" + postcode;
  
    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => processForcast(data, standardiseBBCWeather, plottingFcn))
      .catch(err => { throw err });
  }
  
  function standardiseBBCWeather(data) {
    return processBBCForcasts(data['forecasts'])
  }
  
  function processBBCForcasts(forecasts) {
    var list = []
    for (var key in forecasts) {
      result = processBBCReports(forecasts[key]["detailed"]["reports"])
      list = list.concat(result)
    }
    return list
  }
  
  function processBBCReports(reports) {
    var reportOutput = []
    reports.forEach(function (report) {
      var date = new Date(report['localDate'])
      date.setHours(Number(report['timeslot'].substring(0, 2)))
  
      reportOutput.push({ date: date, outside_humidity: report['humidity'], outside_temp: report['temperatureC'] })
    })
    return reportOutput
  }