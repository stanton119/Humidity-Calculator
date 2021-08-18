import datetime

import numpy as np
import pandas as pd
import requests
import matplotlib.pyplot as plt
plt.style.use('seaborn-whitegrid')

def process_reports(reports):
    summary = {}
    for report in reports:
        date = datetime.datetime.strptime(report["localDate"], "%Y-%m-%d")
        hour = datetime.timedelta(seconds=int(report["timeslot"][:2]) * 3600)

        summary[date + hour] = {
            "humidity": report["humidity"],
            "temperatureC": report["temperatureC"],
        }
    return summary


def process_forecasts(forecasts):
    all_forecasts = {}
    for day_forecast in forecasts:
        all_forecasts.update(
            process_reports(day_forecast["detailed"]["reports"])
        )
    return all_forecasts


def saturate_pressure(temp):
    return 6.122 * np.exp(17.62 * temp / (243.12 + temp))

def inside_humidity(df, inside_temp=21):

    saturate_pressure(inside_temp)
    saturate_pressure(df["outside_temp"])
    return (
        (inside_temp + 273)
        * df["outside_humidity"]
        * saturate_pressure(df["outside_temp"])
        / ((df["outside_temp"] + 273) * saturate_pressure(inside_temp))
    )

weather_url = (
    "https://weather-broker-cdn.api.bbci.co.uk/en/forecast/aggregated/SW19"
)
weather_json = requests.get(weather_url).json()
weather_dict = process_forecasts(weather_json["forecasts"])
df = pd.DataFrame.from_dict(weather_dict, orient="index")
df = df.rename(
    columns={"temperatureC": "outside_temp", "humidity": "outside_humidity"}
)
df["inside_humidity"] = inside_humidity(df)

fig, ax = plt.subplots(figsize=(10,6))
df.plot(ax=ax)
