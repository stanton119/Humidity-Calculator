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
df.index.name='date'
df = df.rename(
    columns={"temperatureC": "outside_temp", "humidity": "outside_humidity"}
)
df["inside_humidity"] = inside_humidity(df)

# %%
df.reset_index().to_json('weather_data.json', orient='columns')
df.to_csv('weather_data.csv')

df.to_json('weather_data.json', orient='')
{'split', 'records', 'index', 'columns', 'values', 'table'}.

# %%
fig, ax = plt.subplots(figsize=(10,6))
if 0:
    axs = df.head(72).plot(ax=ax, secondary_y='outside_temp')
    ax.set_ylabel('ºC', color='r')
else:
    df.head(72).loc[:,['outside_humidity','inside_humidity']].plot(ax=ax)
if 0:
    df.head(72).loc[:,['outside_humidity','inside_humidity']].plot(ax=ax)
    ax2 = ax.twinx()
    df.head(72).loc[:,['outside_temp']].plot(ax=ax2, color='r')
    ax2.set_ylabel('ºC', color='r')
    ax2.tick_params('y', colors='r')



# import matplotlib.ticker as plticker
# loc = plticker.MultipleLocator(base=24)
# ax.xaxis.set_major_locator(loc)
# loc = plticker.MultipleLocator(base=12)
# ax.xaxis.set_minor_locator(loc)
# ax.grid(which='major', axis='both', linestyle='-')
