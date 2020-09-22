import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Config } from 'protractor';
import { WeatherData } from '../WeatherData.interface';
import { formatDate } from '@angular/common';
import * as _ from 'lodash';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-weather-widget',
  templateUrl: './weather-widget.component.html',
  styleUrls: ['./weather-widget.component.scss']
})
export class WeatherWidgetComponent {

  public weatherData: WeatherData[] = [];
  public weatherDataGrouped;
  public now: Date;
  public todaysDataTime;
  public currentDay: string;
  public currentDayDate;
  public searchText: string;
  public errorMessage: string;
  public todayTemp = []; 
  public averagePressure: number;

  constructor(private http: HttpClient) { }

  getConfig() {
    return this.http.get(`https://api.openweathermap.org/data/2.5/forecast?q=${this.searchText}&units=metric&appid=3868be3bea67b8d741f8602186bfaac0`);
  }

  showConfig() {
    this.getConfig()
      .subscribe(
        (data: Config) => {
          this.setWeatherData(data);
          this.createTempChart();
          this.errorMessage = "";
        },
        (error) => this.errorMessage = "INVALID CITY NAME!"
      );
  }

  setWeatherData(data) {
    this.weatherData = [];
    for (let i = 0; i < 40; i++) {
      let date = new Date();
      date.setDate(date.getDate() + 5);
      let lastDay = formatDate(date, 'yyyy-MM-dd', 'en-US');
      if (data.list[i].dt_txt.replace(/ .*/, '') < lastDay) {
        this.weatherData.push({
          dt_text: data.list[i].dt_txt,
          data: data.list[i].dt_txt.replace(/ .*/, ''),
          hour: data.list[i].dt_txt.slice(11, 16),
          temp: Math.round(data.list[i].main.temp),
          files_temp: Math.round(data.list[i].main.feels_like),
          pressure: data.list[i].main.pressure,
          wind_speed: Math.round(data.list[i].wind.speed),
          desc: data.list[i].weather[0].description
        });
      }
    }

    this.calcAveragePrresure();
    this.weatherDataGrouped = _.groupBy(this.weatherData, day => day.data);
    this.currentDayDate = this.weatherData.filter(x => x.data === this.currentDay);
  }

  calcAveragePrresure() {
    let allPressures = this.weatherData.map(item => item.pressure);
    let pressureSum = allPressures.reduce((prev, next) => prev + next);
    this.averagePressure = Math.round(pressureSum / allPressures.length);
  }

  createTempChart() {
    this.currentDayDate = this.weatherData.filter(x => x.data === this.currentDay);
    this.todayTemp = [];
    this.currentDayDate.forEach(element => {
      this.todayTemp.push(element.temp);
    });
    let emptyEl = 8 - this.currentDayDate.length;
    if (emptyEl !== 0) {
      for(let i = 0; i < emptyEl; i++) {
        this.todayTemp.unshift(null);
      }
    }
    if(this.chart.ref !== undefined) this.chart.ref.series[0].remove(true);
    this.chart.addSeries({
      type: 'line',
      name: 'Temperature',
      data: this.todayTemp
    }, true, true);
  }

  checkDay(e) {
    this.currentDay = e.target.outerText;
    this.createTempChart();
  }

  searchCity() {
    var tomorrow = new Date();
    tomorrow.setDate(new Date().getDate()+1);
    this.now = new Date();
    this.todaysDataTime = formatDate(tomorrow, 'yyyy-MM-dd', 'en-US');
    this.currentDay = this.todaysDataTime;
    this.showConfig();
  }

  chart = new Chart({
    chart: {
      type: 'line'
    },
    title: {
      text: 'Temperature'
    },
    xAxis: {
      categories: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
    },
    yAxis: {
      title: {
        text: 'temperature (°C)'
      }
    },
  });
}
